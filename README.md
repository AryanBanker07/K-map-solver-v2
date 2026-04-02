# K-Map Solver

A web-based Karnaugh Map solver for minimizing Boolean expressions. Features visual K-maps, step-by-step algorithm, and logic gate diagrams.

## Features

- 2-6 variable support with Gray code ordering
- Input via minterms, ranges, boolean expressions (A'B + BC'), **or truth table**
- Don't care conditions
- Visual K-map with color-coded groups
- Quine-McCluskey minimization
- SOP and POS expressions
- Algorithm steps visualization
- Interactive truth table editing
- **Logic gate diagram** (Fabric.js)
- Export: LaTeX, Text, JSON, SVG, Clipboard
- Random example generator

## Usage

1. Open `index.html` in a browser
2. Select number of variables (2-6)
3. Enter minterms (e.g., `0,1,2,3,5,7`), boolean expression, **or click "Input Truth Table" to edit directly**
4. Click **Solve K-Map**
5. View K-map, minimized expressions, truth table, and logic diagram

## Quick Input Methods

- **Minterms**: Enter comma-separated decimal numbers (e.g., `0,1,2,3,5,7`)
- **Ranges**: Use hyphens (e.g., `0-3,5,7-9`)
- **Expression**: Type Boolean expression (e.g., `A'B + BC'`)
- **Truth Table**: Click "Input Truth Table" button, then click cells to toggle values

## Files

- `index.html` - Main interface
- `app.js` - Solver logic & rendering
- `styles.css` - Neo-brutalist styling
- `test-core.js` - Test suite

## Technical

- Pure JavaScript, no build step
- Fabric.js for logic diagrams (CDN)
- Quine-McCluskey algorithm
- Greedy group finding for visualization

MIT License
