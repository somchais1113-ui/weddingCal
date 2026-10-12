# QA / verification notes

Date: 2026-10-12

## Verified in current environment

- `npm run test:smoke` — passes; no external packages required.
- All calculation modules pass `node --check` (ESM JavaScript syntax verification).
- Default backdrop: 500 cm wide × 250 cm high, 150 cm fabric, 2× fullness: 7 panels; 17.50 m theoretical; 19.60 m with 12% total allowances; 20.00 m purchase rounded to 0.5 m.
- Default ceiling: 400 cm span, 80 cm sag, 3 swags: 4.48 m/swag, 13.44 m theoretical using the brief approximation; 15.0528 m with 12% allowances; 15.50 m rounded in 0.5 m steps.
- Exact catenary test: 4.398872835 m/swag, sag endpoint 80 cm, centre sag 0 cm.
- Theoretical length does not include allowance; buffer applied once, avoiding seam double counting.

## Not executable in current sandbox

- `npm install`, `npm test` (Vitest), `npm run build` (Vite), browser-based React and WebGL testing: package registry DNS inaccessible in this environment.
- The React / R3F source is supplied with all required package declarations, but the dependency-installation and browser render must be verified on a machine with npm registry access. No production build output is included or claimed.

## Suggested acceptance checks after npm install

1. Run `npm test` and `npm run build`; both should exit successfully.
2. Run `npm run dev` and open the page in a WebGL-capable desktop browser.
3. Verify 7 backdrop panels at 500×250 cm, 150 cm roll, 2× fullness and 20 m rounded order.
4. Change fabric width to 280 cm; ensure panel count and quantity update immediately.
5. Switch to ceiling, change 400×80 cm, three swags, compare the brief and exact calculation modes.
6. Rotate/zoom the scene; verify changes are reflected in the geometry.
7. Adjust seam/waste percentage; verify theoretical length is unchanged and recommended length updates.
8. Export CSV and JSON; reload them in other tools; test local history persistence.
9. Verify the layout at 390 px mobile, tablet, and wide desktop widths.

## GitHub Pages deployment patch (Phase 1.0.1)

- Added `.github/workflows/deploy.yml`: install dependencies, run smoke + Vitest, compile Vite project, publish `dist` via official GitHub Pages Actions.
- Added `DEPLOY_GITHUB_TH.md` with Thai instructions, GitHub Pages Actions source selection, and troubleshooting for 404 / blank page.
- Added `public/.nojekyll` to keep GitHub Pages static publishing straightforward.
- Added `SceneErrorBoundary` around the WebGL preview, so renderer failures do not crash the calculation panel.
- Protected browser `localStorage` writes so disabled storage does not abort the entire React app.
- Confirmed `npm run test:smoke` passes after patch.
- Live GitHub URL and npm/Vitest production build are still **not yet verified** because no published URL was supplied and package registry connectivity is unavailable in this environment.
