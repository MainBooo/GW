#!/usr/bin/env python3
"""Validate laptop.glb without Blender or third-party Python packages."""

from __future__ import annotations

import json
import math
import struct
import sys
from pathlib import Path


JSON_CHUNK = 0x4E4F534A
BIN_CHUNK = 0x004E4942
COMPONENT_FORMAT = {
    5120: "b",
    5121: "B",
    5122: "h",
    5123: "H",
    5125: "I",
    5126: "f",
}
EXPECTED_SCREEN_RATIO = 16.0 / 9.0

TYPE_SIZE = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}


def load_glb(path: Path) -> tuple[dict, bytes]:
    raw = path.read_bytes()
    if len(raw) < 20:
        raise ValueError("File is too small to be a GLB")
    magic, version, declared_length = struct.unpack_from("<4sII", raw, 0)
    if magic != b"glTF" or version != 2 or declared_length != len(raw):
        raise ValueError("Invalid GLB 2.0 header")

    chunks = {}
    offset = 12
    while offset < len(raw):
        chunk_length, chunk_type = struct.unpack_from("<II", raw, offset)
        offset += 8
        chunks[chunk_type] = raw[offset : offset + chunk_length]
        offset += chunk_length

    if JSON_CHUNK not in chunks or BIN_CHUNK not in chunks:
        raise ValueError("GLB must contain JSON and BIN chunks")
    document = json.loads(chunks[JSON_CHUNK].decode("utf-8").rstrip(" \t\r\n\x00"))
    return document, chunks[BIN_CHUNK]


def read_accessor(document: dict, binary: bytes, accessor_index: int) -> list[tuple[float, ...]]:
    accessor = document["accessors"][accessor_index]
    view = document["bufferViews"][accessor["bufferView"]]
    component_type = accessor["componentType"]
    fmt = COMPONENT_FORMAT[component_type]
    component_count = TYPE_SIZE[accessor["type"]]
    component_bytes = struct.calcsize("<" + fmt)
    packed_bytes = component_bytes * component_count
    stride = view.get("byteStride", packed_bytes)
    start = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)

    values = []
    for index in range(accessor["count"]):
        values.append(struct.unpack_from("<" + fmt * component_count, binary, start + index * stride))
    return values


def identity() -> list[list[float]]:
    return [[1.0 if row == col else 0.0 for col in range(4)] for row in range(4)]


def multiply(a: list[list[float]], b: list[list[float]]) -> list[list[float]]:
    return [[sum(a[r][k] * b[k][c] for k in range(4)) for c in range(4)] for r in range(4)]


def node_matrix(node: dict) -> list[list[float]]:
    if "matrix" in node:
        source = node["matrix"]
        return [[source[col * 4 + row] for col in range(4)] for row in range(4)]

    tx, ty, tz = node.get("translation", (0.0, 0.0, 0.0))
    x, y, z, w = node.get("rotation", (0.0, 0.0, 0.0, 1.0))
    sx, sy, sz = node.get("scale", (1.0, 1.0, 1.0))

    rotation = [
        [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w), 0.0],
        [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w), 0.0],
        [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y), 0.0],
        [0.0, 0.0, 0.0, 1.0],
    ]
    scale = [[sx, 0, 0, 0], [0, sy, 0, 0], [0, 0, sz, 0], [0, 0, 0, 1]]
    translation = identity()
    translation[0][3], translation[1][3], translation[2][3] = tx, ty, tz
    return multiply(translation, multiply(rotation, scale))


def transform_point(matrix: list[list[float]], point: tuple[float, ...]) -> tuple[float, float, float]:
    x, y, z = point[:3]
    return tuple(sum(matrix[row][col] * (x, y, z, 1.0)[col] for col in range(4)) for row in range(3))


def scene_world_matrices(document: dict) -> dict[int, list[list[float]]]:
    nodes = document.get("nodes", [])
    scene_index = document.get("scene", 0)
    roots = document.get("scenes", [{}])[scene_index].get("nodes", [])
    matrices = {}

    def walk(node_index: int, parent_matrix: list[list[float]]) -> None:
        world = multiply(parent_matrix, node_matrix(nodes[node_index]))
        matrices[node_index] = world
        for child in nodes[node_index].get("children", []):
            walk(child, world)

    for root in roots:
        walk(root, identity())
    return matrices


def distance(a, b) -> float:
    return math.sqrt(sum((a[i] - b[i]) ** 2 for i in range(len(a))))


def validate(path: Path) -> dict:
    document, binary = load_glb(path)
    errors = []

    nodes = document.get("nodes", [])
    node_by_name = {node.get("name"): (index, node) for index, node in enumerate(nodes)}
    for required in ("Body", "Lid", "Screen"):
        if required not in node_by_name:
            errors.append(f"missing node {required!r}")

    materials = {material.get("name"): material for material in document.get("materials", [])}
    for required in ("BodyMaterial", "ScreenMaterial"):
        if required not in materials:
            errors.append(f"missing material {required!r}")

    triangles = 0
    for mesh in document.get("meshes", []):
        for primitive in mesh.get("primitives", []):
            mode = primitive.get("mode", 4)
            if mode != 4:
                continue
            if "indices" in primitive:
                triangles += document["accessors"][primitive["indices"]]["count"] // 3
            else:
                triangles += document["accessors"][primitive["attributes"]["POSITION"]]["count"] // 3
    if triangles > 40_000:
        errors.append(f"triangle budget exceeded: {triangles}")

    screen_report = {}
    if "Screen" in node_by_name:
        _, screen_node = node_by_name["Screen"]
        if "mesh" not in screen_node:
            errors.append("Screen node has no mesh")
        else:
            primitives = document["meshes"][screen_node["mesh"]].get("primitives", [])
            if len(primitives) != 1:
                errors.append(f"Screen must have one primitive, found {len(primitives)}")
            elif primitives:
                attributes = primitives[0].get("attributes", {})
                if "POSITION" not in attributes or "TEXCOORD_0" not in attributes:
                    errors.append("Screen is missing POSITION or TEXCOORD_0")
                else:
                    positions = read_accessor(document, binary, attributes["POSITION"])
                    uvs = read_accessor(document, binary, attributes["TEXCOORD_0"])
                    uv_to_position = {(round(uv[0], 5), round(uv[1], 5)): pos for pos, uv in zip(positions, uvs)}
                    expected_corners = {(0.0, 0.0), (1.0, 0.0), (1.0, 1.0), (0.0, 1.0)}
                    if set(uv_to_position) != expected_corners:
                        errors.append(f"Screen UV corners are not full 0..1: {sorted(uv_to_position)}")
                    else:
                        p00 = uv_to_position[(0.0, 0.0)]
                        p10 = uv_to_position[(1.0, 0.0)]
                        p01 = uv_to_position[(0.0, 1.0)]
                        width = distance(p00, p10)
                        height = distance(p00, p01)
                        ratio = width / height
                        if not math.isclose(ratio, EXPECTED_SCREEN_RATIO, abs_tol=1e-5):
                            errors.append(
                                f"Screen geometry ratio is {ratio:.8f}, expected {EXPECTED_SCREEN_RATIO:.8f}"
                            )
                        if p10[0] <= p00[0]:
                            errors.append("Screen U axis is mirrored")
                        vertical_delta = max((abs(p01[i] - p00[i]), i) for i in (1, 2))[1]
                        if p01[vertical_delta] <= p00[vertical_delta]:
                            errors.append("Screen V axis is mirrored")
                        screen_report = {"width_m": width, "height_m": height, "ratio": ratio, "uv": "0..1"}

    world_matrices = scene_world_matrices(document)
    world_positions = []
    for node_index, node in enumerate(nodes):
        if "mesh" not in node or node_index not in world_matrices:
            continue
        for primitive in document["meshes"][node["mesh"]].get("primitives", []):
            accessor_index = primitive.get("attributes", {}).get("POSITION")
            if accessor_index is None:
                continue
            world_positions.extend(
                transform_point(world_matrices[node_index], point)
                for point in read_accessor(document, binary, accessor_index)
            )
    bounds = None
    if world_positions:
        mins = tuple(min(point[i] for point in world_positions) for i in range(3))
        maxs = tuple(max(point[i] for point in world_positions) for i in range(3))
        bounds = {"min": mins, "max": maxs, "size": tuple(maxs[i] - mins[i] for i in range(3))}
        if abs(mins[1]) > 0.001:
            errors.append(f"model is not on glTF floor Y=0; min Y={mins[1]:.6f}")

    if path.stat().st_size > 5 * 1024 * 1024:
        errors.append(f"file is unexpectedly large: {path.stat().st_size} bytes")

    body_material = materials.get("BodyMaterial", {}).get("pbrMetallicRoughness", {})
    screen_material = materials.get("ScreenMaterial", {}).get("pbrMetallicRoughness", {})

    report = {
        "status": "PASS" if not errors else "FAIL",
        "file": str(path),
        "bytes": path.stat().st_size,
        "triangles": triangles,
        "required_nodes": sorted(name for name in ("Body", "Lid", "Screen") if name in node_by_name),
        "required_materials": sorted(name for name in ("BodyMaterial", "ScreenMaterial") if name in materials),
        "screen": screen_report,
        "bounds_y_up_metres": bounds,
        "body_material": {
            "metallic": body_material.get("metallicFactor"),
            "roughness": body_material.get("roughnessFactor"),
        },
        "screen_material": {
            "metallic": screen_material.get("metallicFactor"),
            "roughness": screen_material.get("roughnessFactor"),
        },
        "errors": errors,
    }
    return report


def main() -> None:
    path = Path(sys.argv[1] if len(sys.argv) > 1 else "laptop.glb").expanduser().resolve()
    if not path.is_file():
        raise SystemExit(f"GLB not found: {path}")
    report = validate(path)
    print(json.dumps(report, indent=2, ensure_ascii=False))
    raise SystemExit(0 if report["status"] == "PASS" else 1)


if __name__ == "__main__":
    main()
