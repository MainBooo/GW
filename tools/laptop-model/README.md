# GenerationWeb cinematic laptop model

This package builds a clean 14-inch laptop for a Three.js product scene. The
model contains no camera, light, logo, baked lighting, or image textures.

## Build

Requires Blender 4.x:

```bash
blender --background --python blender_laptop.py
```

The command creates `laptop.glb` beside the script. To choose another path:

```bash
blender --background --python blender_laptop.py -- --output /absolute/path/laptop.glb
```

Screen aspect defaults to `16:9` because the real product screenshots are
16:9. Override only if the interface capture has different proportions:

```bash
blender --background --python blender_laptop.py -- --aspect 16:10
```

## Validate

The validator uses only the Python standard library:

```bash
python3 validate_laptop_glb.py laptop.glb
```

It checks:

- GLB 2.0 structure;
- separate `Body`, `Lid`, and `Screen` nodes;
- `BodyMaterial` and `ScreenMaterial` names;
- the 40,000-triangle budget;
- real-world metre scale and floor placement at glTF `Y=0`;
- a separate 16:9 screen with an unrotated, unmirrored UV rectangle covering
  `(0,0)` through `(1,1)`;
- material metallic and roughness factors.

You can also inspect the result at <https://gltf-viewer.donmccurdy.com/>.

## Three.js screen replacement

The interface screenshot must be 16:9 (real ReputationOS captures are 1672x941). When applying a texture loaded outside
`GLTFLoader`, set `flipY = false` so it follows glTF texture conventions:

```ts
const gltf = await loader.loadAsync('/models/laptop.glb');
const screen = gltf.scene.getObjectByName('Screen') as THREE.Mesh;

const texture = await new THREE.TextureLoader().loadAsync('/images/reputationos-screen.webp');
texture.colorSpace = THREE.SRGBColorSpace;
texture.flipY = false;
texture.needsUpdate = true;

screen.material = new THREE.MeshBasicMaterial({
  map: texture,
  toneMapped: false,
});
```

`Screen` is parented to `Lid`, so the complete lid may be animated around its
hinge without the interface separating from the display.

## Authored dimensions

- base: `0.310 × 0.220 × 0.015 m`;
- lid: `0.310 × 0.205 × 0.008 m`;
- opening angle: `102°` measured from the frontward base direction;
- screen: `0.286 × 0.160875 m`, exactly `16:9` (override with `--aspect W:H`);
- exterior bevel: `1.5 mm`;
- output coordinate system: glTF `+Y` up.

The world origin is the centre of the lower base plane, allowing the model to
stand directly on a Three.js floor at `y = 0`.

## Status in this repository

The hero scene currently builds the laptop procedurally in
`components/cases/product-stage.tsx` — two rounded boxes plus a screen plane.
That covers the framing used today without an extra network request.

This kit produces a more detailed body (applied bevels with weighted normals,
keyboard recess, hinge cylinder), which shows in close-up shots. To switch:

1. Run the build on a machine with Blender (it is intentionally not installed
   on the production server: the package pulls ~80 dependencies and the disk
   has little headroom).
2. Validate: `python3 validate_laptop_glb.py laptop.glb`.
3. Put the file in `public/models/laptop.glb`.
4. Replace the `<Laptop />` component in `product-stage.tsx` with a
   `useGLTF` load and assign the screenshot texture to the `Screen` mesh with
   `texture.flipY = false`. Nothing else in the scene changes.
