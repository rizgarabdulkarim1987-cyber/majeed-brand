# Majeed tea game (real 3D)

The "Brew it like you mean it" game on the home page (English and Arabic) is a real WebGL 3D scene:
a glass teapot with a steel lid, a tulip glass on a saucer, the Majeed pouch, a tap, a cooker, steam, flames and liquid that stays inside its vessels.
Five steps: leaves + cardamom, water from the tap, onto the cooker, boil, pour into the glass.

`index.html` at the repository root is the whole site as one file; the compiled game is embedded in it.
This folder holds the game's source so it can be changed later.

- `src/game.js`   the scene, the five steps and the pouring physics
- `src/models.js` teapot, glass, saucer, pouch, stove, tap, lamp, room
- `src/materials.js` refractive glass, tea/water, flame and steam shaders
- `src/fx.js`     leaves + cardamom, bubbles, streams, steam
- `src/textures.js`, `src/audio.js`, `src/util.js`

Build the engine: `npm install` then `node build.mjs dist/majeed3d.min.js --min` (about 560 KB). It exposes `MJTeaGame.TeaGame`.
