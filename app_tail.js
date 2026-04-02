                stroke: '#b147ff',
                strokeWidth: 2,
                selectable: false,
                evented: false
            });
            group.addWithUpdate(path);
        } else {
            // Horizontal orientation
            const pathData = [
                'M', x + 15, y,
                'Q', x - 10, y + height/2, x + 15, y + height,
                'Q', x + width, y + height, x + width, y + height/2,
                'Q', x + width, y, x + 15, y,
                'Z'
            ].join(' ');

            const path = new fabric.Path(pathData, {
                fill: '#0d1117',
                stroke: '#b147ff',
                strokeWidth: 2,
                selectable: false,
                evented: false
            });
            group.addWithUpdate(path);
        }

        return group;
    }
    randomExample() {
        const n = this.variables;
        const max = 2 ** n;
        const numMinterms = Math.floor(Math.random() * (max / 2)) + 1;
        const minterms = new Set();

        while (minterms.size < numMinterms) {
            minterms.add(Math.floor(Math.random() * max));
        }

        const numDontCares = Math.floor(Math.random() * (max / 4));
        const dontCares = new Set();

        while (dontCares.size < numDontCares) {
            const d = Math.floor(Math.random() * max);
            if (!minterms.has(d)) {
                dontCares.add(d);
            }
        }

        document.getElementById('minterms').value = Array.from(minterms).sort((a,b) => a-b).join(', ');
        document.getElementById('dontcares').value = Array.from(dontCares).sort((a,b) => a-b).join(', ');
    }

}

// Initialize app
const solver = new KMapSolver();

document.getElementById('solveBtn').addEventListener('click', async () => {
    try {
        solver.variables = parseInt(document.getElementById('variables').value);
        const result = solver.solve();
        solver.renderKMap();
        solver.updateResults();
        solver.updateStats();
        solver.renderSteps();
        // Render truth table (default: first 16 rows)
        const showAll = document.getElementById('showAllRows').checked;
        solver.renderTruthTable(showAll ? 0 : 16);
        // Render logic gate diagram
        solver.renderLogicGateDiagram();
    } catch (error) {
        alert(error.message);
    }
});

document.getElementById('clearBtn').addEventListener('click', () => {
    document.getElementById('minterms').value = '';
    document.getElementById('dontcares').value = '';
    document.getElementById('expression').value = '';
    document.getElementById('kmap').innerHTML = '<p class="placeholder">Enter minterms and click Solve</p>';
    document.getElementById('sop-result').textContent = '-';
    document.getElementById('pos-result').textContent = '-';
    document.getElementById('steps').innerHTML = '<p class="placeholder">Solve a K-map to see the algorithm steps...</p>';
    document.getElementById('truth-table-wrapper').innerHTML = '<p class="placeholder">Solve a K-map to generate the truth table...</p>';
    document.getElementById('logic-gate-wrapper').innerHTML = '<p class="placeholder">Solve a K-map to generate the logic circuit diagram...</p>';
    document.getElementById('showAllRows').checked = false;
    document.getElementById('gateOrientation').value = 'horizontal';
    solver.steps = [];
});

document.getElementById('randomBtn').addEventListener('click', () => {
    solver.randomExample();
});

document.getElementById('exportLatex').addEventListener('click', () => {
    if (solver.solution.sop) {
        solver.exportLatex();
    } else {
        alert('Please solve a K-map first');
    }
});

document.getElementById('exportText').addEventListener('click', () => {
    if (solver.solution.sop) {
        solver.exportText();
    } else {
        alert('Please solve a K-map first');
    }
});

document.getElementById('exportJSON').addEventListener('click', () => {
    if (solver.solution.sop) {
        solver.exportJSON();
    } else {
        alert('Please solve a K-map first');
    }
});

document.getElementById('exportLogicSVG').addEventListener('click', () => {
    if (solver.solution.sop) {
        solver.exportLogicSVG();
    } else {
        alert('Please solve a K-map first');
    }
});

document.getElementById('copyResults').addEventListener('click', () => {
    if (solver.solution.sop) {
        solver.copyResults();
    } else {
        alert('Please solve a K-map first');
    }
});

// Truth table show all toggle
document.getElementById('showAllRows').addEventListener('change', (e) => {
    if (solver.solution.sop) {
        solver.renderTruthTable(e.target.checked ? 0 : 16);
    }
});

// Logic gate orientation change
document.getElementById('gateOrientation').addEventListener('change', () => {
    if (solver.solution.sop) {
        solver.renderLogicGateDiagram();
    }
});

// Parse boolean expression (basic parser for pre-solving)
document.getElementById('parseBtn').addEventListener('click', () => {
    const exprInput = document.getElementById('expression');
    const mintermsInput = document.getElementById('minterms');
    const variables = parseInt(document.getElementById('variables').value);

    const expr = exprInput.value.trim();
    if (!expr) {
        alert('Please enter a boolean expression');
        return;
    }

    try {
        const minterms = solver.parseBooleanExpression(expr, variables);

        if (minterms.length === 0) {
            alert('Expression evaluates to 0 (no minterms)');
            return;
        }

        mintermsInput.value = minterms.join(',');
        alert(`Parsed ${minterms.length} minterms: ${minterms.join(', ')}`);
        document.getElementById('solveBtn').click();
    } catch (error) {
        alert(`Error: ${error.message}\n\nSupported format: A'B + BC' + ABD\nVariables: ${variables} (${'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, variables).split('').join(', ')})`);
    }
});

// Solve with Enter key
document.querySelectorAll('input[type="text"]').forEach(input => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('solveBtn').click();
        }
    });
});

// Auto-solve on variables change
document.getElementById('variables').addEventListener('change', () => {
    // Clear previous results
    document.getElementById('kmap').innerHTML = '<p class="placeholder">Enter minterms and click Solve</p>';
});

console.log('K-Map Solver initialized');
