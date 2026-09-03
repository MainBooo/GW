"""Процедурная генерация оригинального небрендированного ноутбука для WebGL Lab.

Запуск (headless, CPU-only, без GPU и без открытого UI):

    blender --background --factory-startup --python tools/blender/generate_laptop.py -- \
        --output public/models/laptop.glb

Не зависит от пользовательских настроек Blender, активного окна, аддонов или
стартового файла — --factory-startup гарантирует чистый рантайм, весь контекст
(active object/collection/mode) выставляется явно перед каждым bpy.ops-вызовом.

Иерархия (имена узлов обязательны для интеграции в Three.js):

    LaptopRoot
      BaseGroup
        BaseBottom, BaseTop, KeyboardDeck, KeyboardKeys, Trackpad
      HingeLeft, HingeRight
      LidGroup                      # origin точно на оси петли
        LidShell, DisplayBezel, Screen, ScreenGlass

Экспортный (авторский) rest pose — крышка ОТКРЫТА на LID_OPEN_DEG: тот же кадр,
что нужен для prefers-reduced-motion (открытый собранный ноутбук без анимации).
LidGroup.rotation_euler.x = -radians(LID_OPEN_DEG) — единственный управляющий
параметр открытия/закрытия в Three.js (closed = 0, open = этот rest-угол).
"""

import bpy
import bmesh
import math
import os
import sys
from mathutils import Euler

# --------------------------------------------------------------------------
# Параметры
# --------------------------------------------------------------------------

BASE_W = 0.31       # ширина основания, м
BASE_D = 0.22        # глубина основания, м
BASE_T = 0.015       # толщина основания, м
LID_T = 0.007        # толщина крышки (шелл), м
BEZEL = 0.013        # рамка вокруг экрана, м
SCREEN_ASPECT = 16 / 10
LID_OPEN_DEG = 102.0
BEVEL_WIDTH = 0.0015  # 1.5 мм
BEVEL_SEGMENTS = 2

KEY_COLS = 14
KEY_ROWS = 5
KEY_GAP = 0.0028

TRI_BUDGET = 60_000

BODY_COLOR = (0.055, 0.058, 0.065, 1.0)
KEYBOARD_COLOR = (0.03, 0.032, 0.036, 1.0)
SCREEN_COLOR = (0.01, 0.01, 0.012, 1.0)
GLASS_COLOR = (0.02, 0.02, 0.024, 1.0)


def log(msg: str) -> None:
    print(f"[generate_laptop] {msg}")


def fail(msg: str) -> None:
    print(f"[generate_laptop] ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


# --------------------------------------------------------------------------
# Контекст / очистка сцены
# --------------------------------------------------------------------------

def clear_scene() -> None:
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for block_collection in (bpy.data.meshes, bpy.data.materials, bpy.data.images):
        for block in list(block_collection):
            if block.users == 0:
                block_collection.remove(block)


def set_active(obj: bpy.types.Object) -> None:
    """Явно выставляет active/selected object и активную коллекцию перед bpy.ops."""
    view_layer = bpy.context.view_layer
    for o in bpy.context.selected_objects:
        o.select_set(False)
    obj.select_set(True)
    view_layer.objects.active = obj
    view_layer.active_layer_collection = view_layer.layer_collection


# --------------------------------------------------------------------------
# Материалы
# --------------------------------------------------------------------------

def make_material(name: str, color, metallic: float, roughness: float, alpha: float = 1.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if alpha < 1.0:
        bsdf.inputs["Alpha"].default_value = alpha
        mat.blend_method = "BLEND"
    return mat


BODY_MAT = None
KEYBOARD_MAT = None
SCREEN_MAT = None
GLASS_MAT = None


# --------------------------------------------------------------------------
# Геометрия
# --------------------------------------------------------------------------

def make_box(name: str, w: float, d: float, h: float, material=None, bevel: bool = True):
    """Beveled box центрированный по X/Y, нижняя грань на локальном Z=0."""
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= w
        v.co.y *= d
        v.co.z *= h
        v.co.z += h / 2
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)

    if material is not None:
        mesh.materials.append(material)

    if bevel:
        set_active(obj)
        mod = obj.modifiers.new(name="Bevel", type="BEVEL")
        mod.width = BEVEL_WIDTH
        mod.segments = BEVEL_SEGMENTS
        mod.limit_method = "ANGLE"
        bpy.ops.object.modifier_apply(modifier=mod.name)

    return obj


def make_empty(name: str, location=(0, 0, 0)):
    empty = bpy.data.objects.new(name, None)
    empty.empty_display_size = 0.02
    empty.location = location
    bpy.context.collection.objects.link(empty)
    return empty


def parent_keep_world(child: bpy.types.Object, parent: bpy.types.Object) -> None:
    child.parent = parent
    child.matrix_parent_inverse = parent.matrix_world.inverted()


def apply_boolean_diff(target: bpy.types.Object, cutter: bpy.types.Object) -> None:
    set_active(target)
    mod = target.modifiers.new(name="Cut", type="BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.object = cutter
    mod.solver = "EXACT"
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter, do_unlink=True)


def join_objects(objects, name: str):
    if not objects:
        return None
    for o in bpy.context.selected_objects:
        o.select_set(False)
    for o in objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    joined = bpy.context.view_layer.objects.active
    joined.name = name
    joined.data.name = name
    return joined


# --------------------------------------------------------------------------
# Сборка ноутбука
# --------------------------------------------------------------------------

def build_laptop():
    global BODY_MAT, KEYBOARD_MAT, SCREEN_MAT, GLASS_MAT

    BODY_MAT = make_material("BodyMaterial", BODY_COLOR, metallic=0.22, roughness=0.62)
    KEYBOARD_MAT = make_material("KeyboardMaterial", KEYBOARD_COLOR, metallic=0.05, roughness=0.7)
    SCREEN_MAT = make_material("ScreenMaterial", SCREEN_COLOR, metallic=0.0, roughness=0.5)
    GLASS_MAT = make_material("ScreenGlassMaterial", GLASS_COLOR, metallic=0.0, roughness=0.15, alpha=0.18)

    root = make_empty("LaptopRoot")

    # ---- BaseGroup -------------------------------------------------------
    base_group = make_empty("BaseGroup", location=(0, 0, 0))
    parent_keep_world(base_group, root)

    base_bottom = make_box("BaseBottom", BASE_W, BASE_D, BASE_T * 0.55, material=BODY_MAT)
    base_bottom.location = (0, BASE_D / 2, 0)
    parent_keep_world(base_bottom, base_group)

    base_top = make_box("BaseTop", BASE_W, BASE_D, BASE_T * 0.45, material=BODY_MAT)
    base_top.location = (0, BASE_D / 2, BASE_T * 0.55)
    parent_keep_world(base_top, base_group)

    # Неглубокая посадочная выемка под клавиатуру — реальная геометрия (boolean
    # cut), а не имитация текстурой.
    kb_area_w = BASE_W * 0.86
    kb_area_d = BASE_D * 0.5
    kb_cutter = make_box("_kb_cutter", kb_area_w, kb_area_d, BASE_T, material=None, bevel=False)
    kb_cutter.location = (0, BASE_D * 0.52, BASE_T * 0.8)
    apply_boolean_diff(base_top, kb_cutter)

    tp_area_w = BASE_W * 0.34
    tp_area_d = BASE_D * 0.22
    tp_cutter = make_box("_tp_cutter", tp_area_w, tp_area_d, BASE_T, material=None, bevel=False)
    tp_cutter.location = (0, BASE_D * 0.16, BASE_T * 0.8)
    apply_boolean_diff(base_top, tp_cutter)

    keyboard_deck = make_box("KeyboardDeck", kb_area_w * 0.98, kb_area_d * 0.98, BASE_T * 0.12, material=KEYBOARD_MAT)
    keyboard_deck.location = (0, BASE_D * 0.52, BASE_T * 0.86)
    parent_keep_world(keyboard_deck, base_group)

    trackpad = make_box("Trackpad", tp_area_w * 0.92, tp_area_d * 0.92, BASE_T * 0.08, material=KEYBOARD_MAT)
    trackpad.location = (0, BASE_D * 0.16, BASE_T * 0.84)
    parent_keep_world(trackpad, base_group)

    # Клавиши — сетка небольших боксов, объединённая в один меш KeyboardKeys.
    key_w = (kb_area_w * 0.94) / KEY_COLS - KEY_GAP
    key_d = (kb_area_d * 0.9) / KEY_ROWS - KEY_GAP
    key_h = BASE_T * 0.16
    keys = []
    for row in range(KEY_ROWS):
        for col in range(KEY_COLS):
            kx = -kb_area_w * 0.47 + col * (key_w + KEY_GAP) + key_w / 2
            ky = BASE_D * 0.52 - kb_area_d * 0.43 + row * (key_d + KEY_GAP) + key_d / 2
            key = make_box(f"_key_{row}_{col}", key_w, key_d, key_h, material=KEYBOARD_MAT, bevel=False)
            key.location = (kx, ky, BASE_T * 0.9)
            keys.append(key)
    keyboard_keys = join_objects(keys, "KeyboardKeys")
    set_active(keyboard_keys)
    mod = keyboard_keys.modifiers.new(name="Bevel", type="BEVEL")
    mod.width = BEVEL_WIDTH * 0.6
    mod.segments = 1
    mod.limit_method = "ANGLE"
    bpy.ops.object.modifier_apply(modifier=mod.name)
    parent_keep_world(keyboard_keys, base_group)

    # ---- Петли -------------------------------------------------------
    hinge_z = BASE_T
    hinge_y = BASE_D
    hinge_r = 0.006
    hinge_len = BASE_W * 0.1

    def make_hinge(name: str, x: float):
        mesh = bpy.data.meshes.new(name)
        bm = bmesh.new()
        bmesh.ops.create_cone(
            bm, cap_ends=True, cap_tris=True, segments=16,
            radius1=hinge_r, radius2=hinge_r, depth=hinge_len,
        )
        rot = Euler((math.radians(90), 0, 0)).to_matrix()
        for v in bm.verts:
            v.co.rotate(rot)
        bm.to_mesh(mesh)
        bm.free()
        obj = bpy.data.objects.new(name, mesh)
        bpy.context.collection.objects.link(obj)
        mesh.materials.append(BODY_MAT)
        obj.location = (x, hinge_y, hinge_z)
        parent_keep_world(obj, root)
        return obj

    make_hinge("HingeLeft", -BASE_W * 0.28)
    make_hinge("HingeRight", BASE_W * 0.28)

    # ---- LidGroup ----------------------------------------------------------
    # Origin точно на оси петли (задняя кромка основания, верх BaseTop).
    lid_group = make_empty("LidGroup", location=(0, BASE_D, BASE_T))
    parent_keep_world(lid_group, root)

    lid_h = BASE_D  # высота крышки вдоль своей плоскости ~ глубина базы
    screen_w = kb_area_w * 0.94
    screen_h = screen_w / SCREEN_ASPECT
    if screen_h > lid_h - BEZEL * 2 - 0.01:
        screen_h = lid_h - BEZEL * 2 - 0.01
        screen_w = screen_h * SCREEN_ASPECT

    # Локальные координаты LidGroup ДО поворота группы: "лежащая" крышка,
    # растущая от петли (local Y=0) вперёд (local Y>0), толщина по local Z.
    # Финальный открытый вид получается поворотом самой LidGroup вокруг X.
    lid_shell = make_box("LidShell", BASE_W, lid_h, LID_T, material=BODY_MAT)
    lid_shell.location = (0, lid_h / 2, LID_T / 2)
    parent_keep_world(lid_shell, lid_group)

    bezel = make_box("DisplayBezel", BASE_W * 0.97, lid_h * 0.97, LID_T * 0.4, material=BODY_MAT)
    bezel.location = (0, lid_h / 2, LID_T + LID_T * 0.2)
    parent_keep_world(bezel, lid_group)

    # ---- Screen: отдельная плоскость, честная UV 0..1, нормаль от петли ----
    screen_mesh = bpy.data.meshes.new("Screen")
    bm = bmesh.new()
    hw, hh = screen_w / 2, screen_h / 2
    v0 = bm.verts.new((-hw, -hh, 0))
    v1 = bm.verts.new((hw, -hh, 0))
    v2 = bm.verts.new((hw, hh, 0))
    v3 = bm.verts.new((-hw, hh, 0))
    bm.verts.ensure_lookup_table()
    face = bm.faces.new((v0, v1, v2, v3))
    bm.normal_update()
    if face.normal.z < 0:
        face.normal_flip()
    uv_layer = bm.loops.layers.uv.new("UVMap")
    uv_coords = [(0, 0), (1, 0), (1, 1), (0, 1)]
    for loop, uv in zip(face.loops, uv_coords):
        loop[uv_layer].uv = uv
    bm.to_mesh(screen_mesh)
    bm.free()

    screen_obj = bpy.data.objects.new("Screen", screen_mesh)
    bpy.context.collection.objects.link(screen_obj)
    screen_mesh.materials.append(SCREEN_MAT)
    # Экран лежит на внутренней стороне крышки, чуть выше бейзела.
    screen_obj.location = (0, lid_h / 2, LID_T + LID_T * 0.2 + 0.0006)
    parent_keep_world(screen_obj, lid_group)

    glass_obj = bpy.data.objects.new("ScreenGlass", screen_mesh.copy())
    bpy.context.collection.objects.link(glass_obj)
    glass_obj.data.materials.clear()
    glass_obj.data.materials.append(GLASS_MAT)
    glass_obj.location = (screen_obj.location.x, screen_obj.location.y, screen_obj.location.z + 0.0004)
    parent_keep_world(glass_obj, lid_group)

    # Экспортный rest pose — крышка открыта на LID_OPEN_DEG. Дочерние меши
    # авторизованы "лежащими" (local Y>0 от петли); поворот группы вокруг
    # локального X поднимает их в реальное открытое положение.
    lid_group.rotation_euler = (math.radians(-LID_OPEN_DEG), 0, 0)

    return root


# --------------------------------------------------------------------------
# Экспорт и проверка
# --------------------------------------------------------------------------

def count_triangles() -> int:
    total = 0
    for obj in bpy.data.objects:
        if obj.type != "MESH":
            continue
        mesh = obj.data
        tri_count = 0
        for poly in mesh.polygons:
            tri_count += max(0, len(poly.vertices) - 2)
        total += tri_count
    return total


def export_glb(output_path: str) -> None:
    bpy.ops.object.select_all(action="SELECT")

    export_kwargs = dict(
        filepath=output_path,
        export_format="GLB",
        export_apply=True,
        use_selection=False,
    )

    # Разные версии Blender по-разному называют часть аргументов —
    # используем только те, что реально поддерживает установленная версия
    # (RNA-свойства оператора), а не жёстко зашитый список.
    op_rna = bpy.ops.export_scene.gltf.get_rna_type()
    supported = {p.identifier for p in op_rna.properties}

    optional = {
        "export_cameras": False,
        "export_lights": False,
        "export_yup": True,
    }
    for key, value in optional.items():
        if key in supported:
            export_kwargs[key] = value

    bpy.ops.export_scene.gltf(**export_kwargs)


def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []
    output = "public/models/laptop.glb"
    for i, a in enumerate(argv):
        if a == "--output" and i + 1 < len(argv):
            output = argv[i + 1]
    return output


def main():
    output_rel = parse_args()
    repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    output_path = output_rel if os.path.isabs(output_rel) else os.path.join(repo_root, output_rel)

    log(f"Blender {bpy.app.version_string}")
    log(f"Output: {output_path}")

    clear_scene()
    build_laptop()

    tris = count_triangles()
    log(f"Triangles before export: {tris}")
    if tris > TRI_BUDGET:
        fail(f"Triangle budget exceeded: {tris} > {TRI_BUDGET}")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    if os.path.exists(output_path):
        os.remove(output_path)

    export_glb(output_path)

    if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
        fail("Export produced no file or an empty file")

    size_kb = os.path.getsize(output_path) / 1024
    log(f"Exported {output_path} ({size_kb:.1f} KB)")
    log("Done.")


if __name__ == "__main__":
    main()
