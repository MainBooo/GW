#!/usr/bin/env python3
"""Build a production-friendly 14-inch laptop and export it as laptop.glb.

Run with Blender 4.x:
    blender --background --python blender_laptop.py

Optional output override:
    blender --background --python blender_laptop.py -- --output /path/to/laptop.glb
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


# Dimensions are metres. Blender is authored Z-up; the glTF exporter converts
# the file to +Y-up. The world origin is the centre of the base's lower plane.
BASE_WIDTH = 0.310
BASE_DEPTH = 0.220
BASE_HEIGHT = 0.015
LID_WIDTH = BASE_WIDTH
LID_HEIGHT = 0.205
LID_THICKNESS = 0.008
LID_BACK_TILT_DEGREES = 12.0  # Gives a 102-degree opening from base-front.
HINGE_Y = BASE_DEPTH * 0.5 - 0.008
HINGE_Z = BASE_HEIGHT + 0.003
SCREEN_WIDTH = 0.286
# Соотношение сторон экрана. По умолчанию 16:9 — под реальные скриншоты
# интерфейсов (1672×941). При 16:10 контент пришлось бы либо растягивать,
# либо класть в рамку с полями.
SCREEN_ASPECT_W = 16.0
SCREEN_ASPECT_H = 9.0
SCREEN_HEIGHT = SCREEN_WIDTH * SCREEN_ASPECT_H / SCREEN_ASPECT_W
SCREEN_BOTTOM_MARGIN = 0.013
SCREEN_SURFACE_OFFSET = 0.00035
MAX_TRIANGLES = 40_000


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).resolve().with_name("laptop.glb"),
        help="Destination .glb path (default: beside this script)",
    )
    parser.add_argument(
        "--aspect",
        default="16:9",
        help="Screen aspect ratio as W:H (default: 16:9, matches real UI screenshots)",
    )
    args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(args)


def reset_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    # Remove unused data so rerunning the script never produces .001 names.
    for collection in (
        bpy.data.meshes,
        bpy.data.curves,
        bpy.data.materials,
        bpy.data.cameras,
        bpy.data.lights,
    ):
        for block in list(collection):
            collection.remove(block)

    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    scene.unit_settings.length_unit = "METERS"


def set_principled_input(node: bpy.types.ShaderNodeBsdfPrincipled, names, value) -> None:
    for name in names:
        socket = node.inputs.get(name)
        if socket is not None:
            socket.default_value = value
            return


def create_material(
    name: str,
    base_color: tuple[float, float, float, float],
    metallic: float,
    roughness: float,
) -> bpy.types.Material:
    material = bpy.data.materials.new(name=name)
    material.use_nodes = True
    material.diffuse_color = base_color

    principled = material.node_tree.nodes.get("Principled BSDF")
    if principled is None:
        raise RuntimeError(f"Principled BSDF node missing for {name}")

    set_principled_input(principled, ("Base Color",), base_color)
    set_principled_input(principled, ("Metallic",), metallic)
    set_principled_input(principled, ("Roughness",), roughness)
    set_principled_input(principled, ("Alpha",), 1.0)
    set_principled_input(principled, ("Emission Color", "Emission"), (0.0, 0.0, 0.0, 1.0))
    set_principled_input(principled, ("Emission Strength",), 0.0)
    return material


def activate_only(obj: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def apply_modifier(obj: bpy.types.Object, modifier_name: str) -> None:
    activate_only(obj)
    bpy.ops.object.modifier_apply(modifier=modifier_name)


def smooth_with_weighted_normals(obj: bpy.types.Object) -> None:
    for polygon in obj.data.polygons:
        polygon.use_smooth = True

    try:
        weighted = obj.modifiers.new(name="WeightedNormals", type="WEIGHTED_NORMAL")
        weighted.keep_sharp = True
        apply_modifier(obj, weighted.name)
    except (RuntimeError, AttributeError):
        # Bevel geometry remains valid if a Blender build omits this modifier.
        if "WeightedNormals" in obj.modifiers:
            obj.modifiers.remove(obj.modifiers["WeightedNormals"])


def add_rounded_box(
    name: str,
    dimensions: tuple[float, float, float],
    location: tuple[float, float, float],
    material: bpy.types.Material,
    bevel_width: float,
    bevel_segments: int = 3,
    rotation: tuple[float, float, float] = (0.0, 0.0, 0.0),
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    bevel = obj.modifiers.new(name="AppliedBevel", type="BEVEL")
    bevel.width = bevel_width
    bevel.segments = bevel_segments
    bevel.limit_method = "ANGLE"
    apply_modifier(obj, bevel.name)

    obj.data.materials.append(material)
    smooth_with_weighted_normals(obj)
    return obj


def add_keyboard_recess(body: bpy.types.Object) -> None:
    cutter = add_rounded_box(
        name="KeyboardRecessCutter",
        dimensions=(0.245, 0.105, 0.004),
        location=(0.0, 0.020, BASE_HEIGHT + 0.0005),
        material=bpy.data.materials["BodyMaterial"],
        bevel_width=0.0008,
        bevel_segments=2,
    )

    boolean = body.modifiers.new(name="AppliedKeyboardRecess", type="BOOLEAN")
    boolean.operation = "DIFFERENCE"
    boolean.solver = "EXACT"
    boolean.object = cutter
    apply_modifier(body, boolean.name)

    bpy.data.objects.remove(cutter, do_unlink=True)


def add_hinge(material: bpy.types.Material) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=48,
        radius=0.006,
        depth=0.270,
        location=(0.0, HINGE_Y, HINGE_Z),
        rotation=(0.0, math.radians(90.0), 0.0),
    )
    hinge = bpy.context.active_object
    hinge.name = "HingePart"
    hinge.data.materials.append(material)

    bevel = hinge.modifiers.new(name="AppliedHingeBevel", type="BEVEL")
    bevel.width = 0.0005
    bevel.segments = 2
    bevel.limit_method = "ANGLE"
    apply_modifier(hinge, bevel.name)
    smooth_with_weighted_normals(hinge)
    return hinge


def join_into(active: bpy.types.Object, others: list[bpy.types.Object], final_name: str) -> bpy.types.Object:
    bpy.ops.object.select_all(action="DESELECT")
    active.select_set(True)
    for obj in others:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = active
    bpy.ops.object.join()
    active.name = final_name
    return active


def set_origin_at(obj: bpy.types.Object, world_location: tuple[float, float, float]) -> None:
    old_cursor = bpy.context.scene.cursor.location.copy()
    bpy.context.scene.cursor.location = world_location
    activate_only(obj)
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR", center="MEDIAN")
    bpy.context.scene.cursor.location = old_cursor


def create_screen(material: bpy.types.Material, lid_rotation_x: float) -> bpy.types.Object:
    y = -(LID_THICKNESS * 0.5 + SCREEN_SURFACE_OFFSET)
    z0 = SCREEN_BOTTOM_MARGIN
    z1 = z0 + SCREEN_HEIGHT
    x0 = -SCREEN_WIDTH * 0.5
    x1 = SCREEN_WIDTH * 0.5

    vertices = [
        (x0, y, z0),
        (x1, y, z0),
        (x1, y, z1),
        (x0, y, z1),
    ]
    faces = [(0, 1, 2, 3)]

    mesh = bpy.data.meshes.new("ScreenMesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()

    screen = bpy.data.objects.new("Screen", mesh)
    bpy.context.collection.objects.link(screen)
    screen.location = (0.0, HINGE_Y, HINGE_Z)
    screen.rotation_euler = (lid_rotation_x, 0.0, 0.0)
    screen.data.materials.append(material)

    uv_layer = mesh.uv_layers.new(name="UVMap")
    expected_uv_by_vertex = {
        0: (0.0, 0.0),
        1: (1.0, 0.0),
        2: (1.0, 1.0),
        3: (0.0, 1.0),
    }
    for polygon in mesh.polygons:
        for loop_index in polygon.loop_indices:
            vertex_index = mesh.loops[loop_index].vertex_index
            uv_layer.data[loop_index].uv = expected_uv_by_vertex[vertex_index]

    verify_screen_uv(screen)
    return screen


def verify_screen_uv(screen: bpy.types.Object) -> None:
    uv_layer = screen.data.uv_layers.active
    if uv_layer is None:
        raise RuntimeError("Screen has no active UV layer")

    actual = {}
    for polygon in screen.data.polygons:
        for loop_index in polygon.loop_indices:
            vertex_index = screen.data.loops[loop_index].vertex_index
            uv = uv_layer.data[loop_index].uv
            actual[vertex_index] = (round(float(uv.x), 6), round(float(uv.y), 6))

    expected = {
        0: (0.0, 0.0),
        1: (1.0, 0.0),
        2: (1.0, 1.0),
        3: (0.0, 1.0),
    }
    if actual != expected:
        raise RuntimeError(f"Screen UV verification failed: {actual!r}")

    width = (screen.data.vertices[1].co - screen.data.vertices[0].co).length
    height = (screen.data.vertices[3].co - screen.data.vertices[0].co).length
    expected_ratio = SCREEN_ASPECT_W / SCREEN_ASPECT_H
    if not math.isclose(width / height, expected_ratio, rel_tol=0.0, abs_tol=1e-6):
        raise RuntimeError(
            f"Screen geometry is not exactly {SCREEN_ASPECT_W:.0f}:{SCREEN_ASPECT_H:.0f}: {width / height}"
        )


def count_triangles(objects: list[bpy.types.Object]) -> int:
    total = 0
    for obj in objects:
        if obj.type != "MESH":
            continue
        obj.data.calc_loop_triangles()
        total += len(obj.data.loop_triangles)
    return total


def assert_clean_export(objects: list[bpy.types.Object]) -> dict:
    names = {obj.name for obj in objects}
    required = {"Body", "Lid", "Screen"}
    if not required.issubset(names):
        raise RuntimeError(f"Missing required objects: {required - names}")

    materials = {material.name for material in bpy.data.materials}
    required_materials = {"BodyMaterial", "ScreenMaterial"}
    if not required_materials.issubset(materials):
        raise RuntimeError(f"Missing required materials: {required_materials - materials}")

    unapplied = {obj.name: [modifier.name for modifier in obj.modifiers] for obj in objects if obj.modifiers}
    if unapplied:
        raise RuntimeError(f"Unapplied modifiers: {unapplied}")

    triangles = count_triangles(objects)
    if triangles > MAX_TRIANGLES:
        raise RuntimeError(f"Triangle budget exceeded: {triangles} > {MAX_TRIANGLES}")

    world_corners = []
    for obj in objects:
        if obj.type == "MESH":
            world_corners.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
    min_z = min(point.z for point in world_corners)
    if abs(min_z) > 0.0005:
        raise RuntimeError(f"Model does not sit on Blender floor Z=0 (min Z={min_z:.6f})")

    return {
        "objects": sorted(required),
        "materials": sorted(required_materials),
        "triangles": triangles,
        "screen_aspect": "16:10",
        "screen_uv": "(0,0)-(1,1), unrotated, unmirrored",
        "floor_min_z_before_y_up_export": round(min_z, 8),
    }


def supported_gltf_export_kwargs(filepath: Path) -> dict:
    requested = {
        "filepath": str(filepath),
        "export_format": "GLB",
        "use_selection": False,
        "export_apply": True,
        "export_yup": True,
        "export_cameras": False,
        "export_lights": False,
        "export_texcoords": True,
        "export_normals": True,
        "export_materials": "EXPORT",
    }
    supported = set(bpy.ops.export_scene.gltf.get_rna_type().properties.keys())
    return {key: value for key, value in requested.items() if key in supported}


def apply_aspect(spec: str) -> None:
    global SCREEN_ASPECT_W, SCREEN_ASPECT_H, SCREEN_HEIGHT
    try:
        w, h = (float(part) for part in spec.split(":", 1))
    except ValueError as exc:
        raise SystemExit(f"--aspect expects W:H, got {spec!r}") from exc
    if w <= 0 or h <= 0:
        raise SystemExit(f"--aspect must be positive, got {spec!r}")
    SCREEN_ASPECT_W, SCREEN_ASPECT_H = w, h
    SCREEN_HEIGHT = SCREEN_WIDTH * h / w


def main() -> None:
    args = parse_args()
    apply_aspect(args.aspect)
    output_path = args.output.expanduser().resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    reset_scene()

    body_material = create_material(
        "BodyMaterial",
        base_color=(0.05, 0.05, 0.05, 1.0),
        metallic=0.9,
        roughness=0.35,
    )
    screen_material = create_material(
        "ScreenMaterial",
        base_color=(0.0, 0.0, 0.0, 1.0),
        metallic=0.0,
        roughness=0.1,
    )

    body = add_rounded_box(
        name="Body",
        dimensions=(BASE_WIDTH, BASE_DEPTH, BASE_HEIGHT),
        location=(0.0, 0.0, BASE_HEIGHT * 0.5),
        material=body_material,
        bevel_width=0.0015,
        bevel_segments=3,
    )
    add_keyboard_recess(body)
    hinge = add_hinge(body_material)
    body = join_into(body, [hinge], "Body")
    set_origin_at(body, (0.0, 0.0, 0.0))

    lid_rotation_x = math.radians(-LID_BACK_TILT_DEGREES)
    local_up = Vector((0.0, math.sin(math.radians(LID_BACK_TILT_DEGREES)), math.cos(math.radians(LID_BACK_TILT_DEGREES))))
    hinge_location = Vector((0.0, HINGE_Y, HINGE_Z))
    lid_center = hinge_location + local_up * (LID_HEIGHT * 0.5)

    lid = add_rounded_box(
        name="Lid",
        dimensions=(LID_WIDTH, LID_THICKNESS, LID_HEIGHT),
        location=tuple(lid_center),
        material=body_material,
        bevel_width=0.0015,
        bevel_segments=3,
        rotation=(lid_rotation_x, 0.0, 0.0),
    )
    set_origin_at(lid, tuple(hinge_location))

    screen = create_screen(screen_material, lid_rotation_x)
    screen_world = screen.matrix_world.copy()
    screen.parent = lid
    screen.matrix_world = screen_world

    root = bpy.data.objects.new("LaptopRoot", None)
    bpy.context.collection.objects.link(root)
    root.location = (0.0, 0.0, 0.0)
    body.parent = root
    lid.parent = root

    mesh_objects = [body, lid, screen]
    summary = assert_clean_export(mesh_objects)

    bpy.ops.object.select_all(action="DESELECT")
    result = bpy.ops.export_scene.gltf(**supported_gltf_export_kwargs(output_path))
    if "FINISHED" not in result:
        raise RuntimeError(f"glTF export failed: {result}")

    summary.update(
        {
            "output": str(output_path),
            "bytes": output_path.stat().st_size,
            "blender_version": bpy.app.version_string,
        }
    )
    print("GENERATIONWEB_LAPTOP_EXPORT=" + json.dumps(summary, ensure_ascii=False, sort_keys=True))


if __name__ == "__main__":
    main()
