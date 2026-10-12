# Wedding Fabric Studio — Calculator + 3D Preview

Phase 1 MVP based on the 12 October 2026 wedding-fabric brief. This is a working React + Vite web app with native JavaScript calculation modules, unit tests, and React Three Fiber 3D rendering. UI labels are in Thai; source code and code comments are in English.

## Requirements

- Node.js 20.19+ (Node.js 22 recommended)
- npm
- A browser with WebGL support

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## Build and test

```bash
npm test
npm run build
npm run preview
```

The production output lives in `dist/` and can be deployed on any static host. The Vite `base` is `./` so asset URLs work under a GitHub Pages repository subpath.

## Deploy to GitHub Pages

1. Push this project to a GitHub repository.
2. Create a `gh-pages` branch by running:

   ```bash
   npm run deploy
   ```

3. In GitHub, open **Settings → Pages → Build and deployment**. Choose **Deploy from a branch**, `gh-pages`, and `/(root)`.
4. Wait for GitHub Pages to finish, then open `https://<username>.github.io/<repository>/`.

Deployment requires Git credentials/access to the repository. Do not put secret API tokens in this app; it needs none.

## Project structure

```text
src/
  calculations/
    backdrop.js          # panel count and unbuffered length
    ceilingDrape.js      # swag count, brief approximation / exact catenary
    catenary.js          # catenary fitting and arc length
    engine.js            # input validation, allowances, common result model
    engine.test.js       # Vitest calculations and realistic case
  scene/
    geometry.js          # geometric mesh deformation, independent of UI
    geometry.test.js     # pleat and mesh tests
    FabricScene.jsx      # R3F models, orbit controls and camera
  utils/
    export.js            # JSON and CSV download
  App.jsx                # Thai-language input and results UI
  styles.css             # responsive layout
  main.jsx
```

## Calculations and unit definitions

All internal lengths are **centimetres**; the UI formats values in **metres** for ordering.

### Backdrop

```text
panelCount = ceil(backdropWidth × fullnessRatio / fabricWidth)
theoreticalLengthCm = panelCount × backdropHeight
```

Example from the brief (using 2.0× fullness and 7% seam + 5% waste):

- Width 500 cm, height 250 cm, fabric roll width 150 cm.
- 7 panels; theoretical length 17.50 m.
- Order recommendation before merchant rounding: 19.60 m.
- If the vendor sells in 0.5 m steps, order 20.00 m.

### Ceiling drape

The brief calls for a simplified estimate:

```text
sagFactor = 1 + (sagDepth / spanDistance) × 0.6
swagLength = spanDistance × sagFactor
theoreticalLengthCm = swagLength × numberOfSwags
```

An **optional accurate catenary mode** provides true curve length. The renderer always shows a geometric catenary fitted to the selected span and sag, so it does not force a physically impossible shape to match the simplified estimate. The UI shows the difference between both methods. For precise ordering, use exact mode, confirm how fabric is attached at the endpoints, and account for hanging/tying details with allowances.

For a 400 cm span, 80 cm sag and 3 separate fabric swags, the brief approximation gives 4.48 m per swag, 13.44 m total before buffers. Here **one swag means one strip of fabric at the given roll width**, not an arrangement of many strips across an additional specified ceiling area.

### Buffers

```text
totalBufferPercent = seamBuffer + shrinkageBuffer + patternMatchBuffer + wastageBuffer
recommendedLengthCm = theoreticalLengthCm × (1 + totalBufferPercent / 100)
```

**Important clarification**: The brief's first backdrop/swag example appears to apply `seamAllowance` inside the length formula, whereas pages 3–4 require an unbuffered theoretical length followed by separate adjustable allowances. To avoid double-counting seam allowance and to honour the explicitly defined 2-layer display, this implementation keeps the geometric theoretical length unbuffered and adds the seam percentage **once** in the buffer layer.

Additional vendor rounding is **separate**, selectable in 0.1 m, 0.5 m, or 1 m increments. Vendor rounding does not alter the theoretical/recommended quantities.

### 3D notes and limitations

- **Backdrop:** Pleats are horizontal sine-wave deformations sized to consume the selected fabric roll width per panel; panel height corresponds to input height. This is a parametric preview, not a full cloth physics simulator.
- **Ceiling:** The longitudinal surface follows a mathematically fitted catenary; a subtle cross-fabric ripple helps readability. Exact-mode length uses the same underlying catenary geometry. The brief mode remains an estimate, and can differ from rendered arc length.
- 3D geometry is designed to depict proportions, not hardware clearances, stitching, hem turns, installation knots, or shrinkage behavior.
- The builder estimates **fabric roll running metres**, not fabric area. Pricing, stock sizes, join seams and fabric direction should be checked with the vendor.
- Data is stored in browser `localStorage` only. Use CSV/JSON exports for a portable record. No user account or cloud sync is provided.
- This phase supports backdrop + ceiling drape. Chair sash / table runner are planned for Phase 2.

## Data model

Each calculation returns:

```js
{
  id,
  type: 'backdrop' | 'ceilingDrape',
  inputs: { fabricWidth, fullnessRatio, dimensions, ... },
  buffers: { seamBuffer, shrinkageBuffer, patternMatchBuffer, wastageBuffer },
  result: { theoreticalLength, recommendedLength, panelCount, totalBufferPercent, ... },
  sceneParams: { kind, ... }  // consumed by 3D, not by numeric formulas
}
```

New element types should get dedicated files in `calculations/`, a geometry/model in `scene/`, new UI inputs, and unit tests. The `calculation` modules must not depend on React or Three.js.

## Production notes

For real-world orders, verify the sample cloth at the chosen pleat ratio, selvage-to-selvage joins, fabric pattern repeat direction, any prewashing, hemming, ceiling rigging hardware, and whether the merchant sells fractional roll lengths. A 3D preview cannot confirm these site-specific matters.
