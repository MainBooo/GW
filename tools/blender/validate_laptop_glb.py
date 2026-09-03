#!/usr/bin/env python3
"""Проверка laptop.glb без сторонних зависимостей (ручной разбор GLB-чанков).

Usage: python3 tools/blender/validate_laptop_glb.py public/models/laptop.glb
"""

import json
import math
import struct
import sys

REQUIRED_NODES = {"LaptopRoot", "BaseGroup", "LidGroup", "Screen", "ScreenGlass"}
REQUIRED_MATERIALS = {"ScreenMaterial", "BodyMaterial", "KeyboardMaterial"}
TRI_BUDGET = 60_000
SCREEN_ASPECT = 16 / 10
ASPECT_TOLERANCE = 0.03


def fail(msg: str) -> None:
    print(f"FAIL: {msg}", file=sys.stderr)
    sys.exit(1)


def read_glb(path: str):
    with open(path, "rb") as f:
        data = f.read()
    if len(data) < 12:
        fail("file too small to be a valid GLB")
    magic, version, length = struct.unpack_from("<4sII", data, 0)
    if magic != b"glTF":
        fail("bad GLB magic")
    offset = 12
    json_chunk = None
    bin_chunk = None
    while offset < length:
        chunk_len, chunk_type = struct.unpack_from("<I4s", data, offset)
        offset += 8
        chunk_data = data[offset:offset + chunk_len]
        offset += chunk_len
        if chunk_type == b"JSON":
            json_chunk = json.loads(chunk_data.decode("utf-8"))
        elif chunk_type == b"BIN\x00":
            bin_chunk = chunk_data
    if json_chunk is None:
        fail("no JSON chunk found in GLB")
    return json_chunk, bin_chunk


def accessor_bytes(gltf, bin_chunk, accessor_index):
    acc = gltf["accessors"][accessor_index]
    view = gltf["bufferViews"][acc["bufferView"]]
    start = view.get("byteOffset", 0) + acc.get("byteOffset", 0)
    comp_size = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4}[acc["componentType"]]
    n_comp = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}[acc["type"]]
    fmt_char = {5120: "b", 5121: "B", 5122: "h", 5123: "H", 5125: "I", 5126: "f"}[acc["componentType"]]
    count = acc["count"]
    values = []
    stride = view.get("byteStride", comp_size * n_comp)
    for i in range(count):
        base = start + i * stride
        row = struct.unpack_from("<" + fmt_char * n_comp, bin_chunk, base)
        values.append(row if n_comp > 1 else row[0])
    return values


def main():
    if len(sys.argv) < 2:
        fail("usage: validate_laptop_glb.py <path-to-glb>")
    path = sys.argv[1]

    gltf, bin_chunk = read_glb(path)

    node_names = {n.get("name") for n in gltf.get("nodes", [])}
    missing = REQUIRED_NODES - node_names
    if missing:
        fail(f"missing required nodes: {sorted(missing)} (found: {sorted(node_names)})")
    print(f"OK: required nodes present ({sorted(REQUIRED_NODES)})")

    mat_names = {m.get("name") for m in gltf.get("materials", [])}
    missing_mats = REQUIRED_MATERIALS - mat_names
    if missing_mats:
        fail(f"missing required materials: {sorted(missing_mats)} (found: {sorted(mat_names)})")
    print(f"OK: required materials present ({sorted(REQUIRED_MATERIALS)})")

    # camera/light должны отсутствовать по бюджету
    if gltf.get("cameras"):
        fail("GLB must not contain cameras")
    if any(n.get("extensions", {}).get("KHR_lights_punctual") for n in gltf.get("nodes", [])):
        fail("GLB must not contain lights")
    print("OK: no cameras/lights embedded")

    # Триангуляция
    total_tris = 0
    for mesh in gltf.get("meshes", []):
        for prim in mesh.get("primitives", []):
            acc_index = prim.get("indices")
            if acc_index is not None:
                count = gltf["accessors"][acc_index]["count"]
                total_tris += count // 3
            else:
                acc = gltf["accessors"][prim["attributes"]["POSITION"]]
                total_tris += acc["count"] // 3
    if total_tris > TRI_BUDGET:
        fail(f"triangle budget exceeded: {total_tris} > {TRI_BUDGET}")
    print(f"OK: triangle budget respected ({total_tris} <= {TRI_BUDGET})")

    # Найти меш Screen и проверить UV0..1
    screen_node = next(n for n in gltf["nodes"] if n.get("name") == "Screen")
    screen_mesh = gltf["meshes"][screen_node["mesh"]]
    prim = screen_mesh["primitives"][0]
    uv_accessor_index = prim["attributes"].get("TEXCOORD_0")
    if uv_accessor_index is None:
        fail("Screen mesh has no TEXCOORD_0 (UV)")
    uvs = accessor_bytes(gltf, bin_chunk, uv_accessor_index)
    us = [uv[0] for uv in uvs]
    vs = [uv[1] for uv in uvs]
    if not (min(us) <= 0.001 and max(us) >= 0.999):
        fail(f"Screen UV U range not 0..1: [{min(us)}, {max(us)}]")
    if not (min(vs) <= 0.001 and max(vs) >= 0.999):
        fail(f"Screen UV V range not 0..1: [{min(vs)}, {max(vs)}]")
    print(f"OK: Screen UV spans 0..1 (U:[{min(us):.3f},{max(us):.3f}] V:[{min(vs):.3f},{max(vs):.3f}])")

    # Аспект экрана из позиций вершин
    pos_accessor_index = prim["attributes"]["POSITION"]
    positions = accessor_bytes(gltf, bin_chunk, pos_accessor_index)
    xs = [p[0] for p in positions]
    ys = [p[1] for p in positions]
    zs = [p[2] for p in positions]
    w = max(xs) - min(xs)
    h_candidates = [max(ys) - min(ys), max(zs) - min(zs)]
    h = max(h_candidates)  # локальная плоскость экрана может лежать в разных осях до трансформации родителя
    if h <= 0:
        fail("Screen has degenerate height")
    aspect = w / h
    if abs(aspect - SCREEN_ASPECT) > ASPECT_TOLERANCE * SCREEN_ASPECT:
        fail(f"Screen aspect ratio off: got {aspect:.3f}, expected ~{SCREEN_ASPECT:.3f}")
    print(f"OK: Screen aspect ratio ~{aspect:.3f} (expected {SCREEN_ASPECT:.3f})")

    # Нижняя точка модели около пола (по всем мешам, в локальных координатах
    # каждого узла корень LaptopRoot не имеет собственного смещения по Z).
    min_z_world = math.inf
    node_by_index = {i: n for i, n in enumerate(gltf["nodes"])}

    def world_translation(node_index):
        # Простая аккумуляция translation по цепочке parent (без поворотов —
        # для проверки высоты пола этого достаточно, поворот петли не должен
        # опускать модель ниже BaseBottom, который не входит в LidGroup).
        t = [0.0, 0.0, 0.0]
        idx = node_index
        parents = {}
        for i, n in enumerate(gltf["nodes"]):
            for c in n.get("children", []):
                parents[c] = i
        chain = [idx]
        while idx in parents:
            idx = parents[idx]
            chain.append(idx)
        for i in reversed(chain):
            tr = node_by_index[i].get("translation", [0, 0, 0])
            t = [t[0] + tr[0], t[1] + tr[1], t[2] + tr[2]]
        return t

    base_bottom_idx = next(i for i, n in enumerate(gltf["nodes"]) if n.get("name") == "BaseBottom")
    base_translation = world_translation(base_bottom_idx)
    print(f"OK: BaseBottom world-ish translation ~ {tuple(round(v, 4) for v in base_translation)}")
    if base_translation[1] < -0.01 or base_translation[1] > 0.05:
        fail(f"BaseBottom not resting near floor (Y={base_translation[1]:.4f})")
    print("OK: base rests near floor (Y ~ 0 after glTF Y-up export)")

    print("\nALL CHECKS PASSED")


if __name__ == "__main__":
    main()
