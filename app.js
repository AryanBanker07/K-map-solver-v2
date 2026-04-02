// K-Map Solver - Core Logic

class KMapSolver {
    constructor() {
        this.variables = 3;
        this.minterms = [];
        this.dontCares = [];
        this.primeImplicants = [];
        this.essentialPrimes = [];
        this.solution = { sop: '', pos: '' };
        this.groups = [];
        this.steps = [];
        this.kmapData = [];
    }

    // Parse minterm input (comma-separated, ranges like 0-3)
    parseMinterms(input) {
        const terms = new Set();
        const parts = input.split(',').map(s => s.trim()).filter(s => s);

        for (const part of parts) {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(Number);
                for (let i = start; i <= end; i++) {
                    terms.add(i);
                }
            } else if (part) {
                terms.add(Number(part));
            }
        }

        return Array.from(terms).filter(n => !isNaN(n) && n >= 0);
    }

    // Parse boolean expression to minterms
    // Supports: A'B + BC' + ABD, with variables A-Z
    parseBooleanExpression(expr, numVars) {
        expr = expr.replace(/\s+/g, '').toUpperCase();
        if (!expr) return [];

        const maxValue = 2 ** numVars;
        const variables = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, numVars);
        const minterms = new Set();

        // Evaluate expression for all possible input combinations
        for (let i = 0; i < maxValue; i++) {
            const binary = i.toString(2).padStart(numVars, '0');
            const values = {};

            // Set variable values
            for (let v = 0; v < numVars; v++) {
                values[variables[v]] = binary[v] === '1';
            }

            // Evaluate expression
            try {
                if (this.evaluateBooleanExpression(expr, values)) {
                    minterms.add(i);
                }
            } catch (e) {
                throw new Error(`Invalid expression: ${e.message}`);
            }
        }

        return Array.from(minterms).sort((a, b) => a - b);
    }

    // Evaluate a boolean expression given variable values
    evaluateBooleanExpression(expr, values) {
        // Tokenize: split by operators, keep parentheses
        const tokens = this.tokenize(expr);

        // Convert to RPN using Shunting Yard algorithm
        const rpn = this.toRPN(tokens);

        // Evaluate RPN
        const stack = [];
        for (const token of rpn) {
            if (this.isVariable(token)) {
                if (!(token in values)) {
                    throw new Error(`Unknown variable: ${token}`);
                }
                stack.push(values[token]);
            } else if (token === '1') {
                stack.push(true);
            } else if (token === '0') {
                stack.push(false);
            } else if (token === "'") {
                if (stack.length < 1) throw new Error('Invalid expression');
                stack.push(!stack.pop());
            } else if (token === '+') {
                if (stack.length < 2) throw new Error('Invalid expression');
                stack.push(stack.pop() || stack.pop());
            } else if (token === '*') {
                if (stack.length < 2) throw new Error('Invalid expression');
                stack.push(stack.pop() && stack.pop());
            } else {
                throw new Error(`Unknown operator: ${token}`);
            }
        }

        if (stack.length !== 1) throw new Error('Invalid expression');
        return stack[0];
    }

    // Tokenize expression
    tokenize(expr) {
        const tokens = [];
        let i = 0;

        while (i < expr.length) {
            const char = expr[i];

            if (this.isVariable(char)) {
                // Add implied * between adjacent variables, after a prime, or after a closing parenthesis
                if (tokens.length > 0 && (this.isVariable(tokens[tokens.length - 1]) || tokens[tokens.length - 1] === "'" || tokens[tokens.length - 1] === ')')) {
                    tokens.push('*');
                }
                tokens.push(char);
                i++;
            } else if (char === '0' || char === '1') {
                // Constants: can also have implied * before them? For simplicity, only allow explicit operators.
                // For consistency, allow implied * between a variable and a digit?
                if (tokens.length > 0 && (this.isVariable(tokens[tokens.length - 1]) || tokens[tokens.length - 1] === "'" || tokens[tokens.length - 1] === ')')) {
                    tokens.push('*');
                }
                tokens.push(char);
                i++;
            } else if (char === "'") {
                tokens.push("'");
                i++;
            } else if (char === '+' || char === '*' || char === '(' || char === ')') {
                tokens.push(char);
                i++;
            } else {
                throw new Error(`Invalid character: ${char}`);
            }
        }

        return tokens;
    }

    // Check if token is a variable (A-Z only, not digits)
    isVariable(token) {
        return /^[A-Z]$/.test(token);
    }

    // Get precedence for operators
    getPrecedence(op) {
        if (op === "'") return 3;
        if (op === '*') return 2;
        if (op === '+') return 1;
        return 0;
    }

    // Convert tokens to RPN using Shunting Yard
    toRPN(tokens) {
        const output = [];
        const stack = []; // operator stack

        for (const token of tokens) {
            if (this.isVariable(token) || token === '0' || token === '1') {
                output.push(token);
            } else if (token === "'") {
                stack.push(token);
            } else if (token === '+' || token === '*') {
                while (stack.length > 0) {
                    const top = stack[stack.length - 1];
                    if (top === '(') break;
                    // Pop while top has higher or equal precedence
                    if (this.getPrecedence(top) >= this.getPrecedence(token)) {
                        output.push(stack.pop());
                    } else {
                        break;
                    }
                }
                stack.push(token);
            } else if (token === '(') {
                stack.push(token);
            } else if (token === ')') {
                while (stack.length > 0 && stack[stack.length - 1] !== '(') {
                    output.push(stack.pop());
                }
                if (stack.length === 0 || stack[stack.length - 1] !== '(') {
                    throw new Error('Mismatched parentheses');
                }
                stack.pop();
            }
        }

        while (stack.length > 0) {
            const op = stack.pop();
            if (op === '(') throw new Error('Mismatched parentheses');
            output.push(op);
        }

        return output;
    }

    // Evaluate RPN tokens with given variable values
    evaluateRPN(rpn, values) {
        const stack = [];
        for (const token of rpn) {
            if (this.isVariable(token)) {
                if (!(token in values)) throw new Error(`Unknown variable: ${token}`);
                stack.push(values[token]);
            } else if (token === '0') {
                stack.push(false);
            } else if (token === '1') {
                stack.push(true);
            } else if (token === "'") {
                if (stack.length < 1) throw new Error('Invalid: NOT needs operand');
                stack.push(!stack.pop());
            } else if (token === '+') {
                if (stack.length < 2) throw new Error('Invalid: OR needs two operands');
                stack.push(stack.pop() || stack.pop());
            } else if (token === '*') {
                if (stack.length < 2) throw new Error('Invalid: AND needs two operands');
                stack.push(stack.pop() && stack.pop());
            } else {
                throw new Error(`Unknown operator: ${token}`);
            }
        }
        if (stack.length !== 1) throw new Error('Invalid expression');
        return stack[0];
    }

    // Evaluate boolean expression with variable values
    evaluateBooleanExpression(expr, values) {
        const tokens = this.tokenize(expr);
        const rpn = this.toRPN(tokens);
        return this.evaluateRPN(rpn, values);
    }

    // Generate Gray code order for K-map
    generateGrayCode(n) {
        if (n === 0) return [''];

        const prev = this.generateGrayCode(n - 1);
        const result = [];

        // Prefix 0
        for (const code of prev) {
            result.push('0' + code);
        }

        // Prefix 1 (reverse order)
        for (let i = prev.length - 1; i >= 0; i--) {
            result.push('1' + prev[i]);
        }

        return result;
    }

    // Convert Gray code to decimal
    grayToDecimal(gray) {
        let decimal = 0;
        let binary = gray[0];

        for (let i = 1; i < gray.length; i++) {
            binary += binary[i - 1] ^ gray[i];
        }

        return parseInt(binary, 2);
    }

    // Create K-map data structure
    buildKMap() {
        const n = this.variables;
        const rows = n <= 3 ? 2 ** Math.ceil(n / 2) : 2 ** Math.floor(n / 2);
        const cols = n <= 3 ? 2 ** Math.floor(n / 2) : 2 ** Math.ceil(n / 2);

        const rowGray = this.generateGrayCode(Math.ceil(n / 2));
        const colGray = this.generateGrayCode(Math.floor(n / 2));
        const rowLabels = rowGray.map(g => this.grayToDecimal(g));
        const colLabels = colGray.map(g => this.grayToDecimal(g));

        const kmap = [];
        const allOnes = new Set(this.minterms);
        const allDontCares = new Set(this.dontCares);

        for (let r = 0; r < rows; r++) {
            kmap[r] = [];
            for (let c = 0; c < cols; c++) {
                const rowBinary = rowGray[r];
                const colBinary = colGray[c];
                const binary = rowBinary + colBinary;
                const index = parseInt(binary, 2);

                let value = 0;
                if (allOnes.has(index)) value = 1;
                else if (allDontCares.has(index)) value = 'X';

                kmap[r][c] = {
                    value,
                    index,
                    rowLabel: rowLabels[r],
                    colLabel: colLabels[c],
                    group: 0
                };
            }
        }

        return { kmap, rowLabels, colLabels, rows, cols };
    }

    // Quine-McCluskey Algorithm - Step 1: Generate prime implicants
    quineMcCluskey() {
        this.steps = [];

        // Convert to binary
        const allTerms = [...this.minterms];
        const n = this.variables;

        // Step 1: Group minterms by number of 1s
        this.addStep('Group minterms by number of 1s');
        const groups = [];
        for (let i = 0; i <= n; i++) {
            groups[i] = [];
        }

        for (const term of allTerms) {
            const binary = term.toString(2).padStart(n, '0');
            const ones = binary.split('').filter(b => b === '1').length;
            groups[ones].push({ binary, combined: false, decimals: [term] });
        }

        this.logStep(`Initial groups: ${allTerms.join(', ')}`);

        // Step 2: Combine adjacent groups
        const primeImplicants = [];
        let combinedAny = true;
        let iteration = 0;

        while (combinedAny) {
            combinedAny = false;
            const newGroups = [];

            for (let i = 0; i < groups.length - 1; i++) {
                for (const term1 of groups[i]) {
                    for (const term2 of groups[i + 1]) {
                        const diff = this.findCombinePosition(term1.binary, term2.binary);

                        if (diff !== -1) {
                            combinedAny = true;
                            const combinedBinary = term1.binary.split('');
                            combinedBinary[diff] = '-';
                            const combined = {
                                binary: combinedBinary.join(''),
                                combined: false,
                                decimals: [...new Set([...term1.decimals, ...term2.decimals])].sort((a,b) => a-b)
                            };

                            term1.combined = true;
                            term2.combined = true;

                            if (!newGroups.find(g => g.binary === combined.binary)) {
                                newGroups.push(combined);
                            }
                        }
                    }
                }
            }

            // Add uncombined terms as prime implicants
            for (const group of groups) {
                for (const term of group) {
                    if (!term.combined) {
                        primeImplicants.push(term);
                    }
                }
            }

            if (combinedAny) {
                this.addStep(`Combination iteration ${++iteration}`);
                this.logStep(`Combined to: ${newGroups.map(g => g.binary).join(', ')}`);
            }

            // Re-bin newGroups into groups by number of 1s for next iteration
            if (newGroups.length > 0) {
                const binned = [];
                for (let i = 0; i <= n; i++) {
                    binned[i] = [];
                }
                for (const term of newGroups) {
                    const ones = term.binary.split('').filter(b => b === '1').length;
                    binned[ones].push(term);
                }
                // Replace groups with binned groups
                groups.length = 0;
                groups.push(...binned);
            } else {
                groups.length = 0;
            }
        }

        this.primeImplicants = primeImplicants;
        this.addStep(`Found ${primeImplicants.length} prime implicant(s)`);
        this.logStep(`Prime implicants: ${primeImplicants.map(p => this.binaryToExpression(p.binary, n)).join(', ')}`);

        return primeImplicants;
    }

    // Check if two binary strings (with '-' for don't cares) can be combined
    // Returns the position of the single non-dash difference, or -1 if cannot combine
    findCombinePosition(bin1, bin2) {
        if (bin1.length !== bin2.length) return -1;
        let diffPos = -1;

        for (let i = 0; i < bin1.length; i++) {
            const a = bin1[i];
            const b = bin2[i];

            // If either is dash, they must both be dash at that position
            if (a === '-' || b === '-') {
                if (a !== b) return -1; // dash vs bit - incompatible
                // else both dash, ok, continue
            } else {
                // Both are 0 or 1
                if (a !== b) {
                    // If this is second difference, fail
                    if (diffPos !== -1) return -1;
                    diffPos = i;
                }
            }
        }

        return diffPos; // -1 if identical or no valid diff
    }

    // Find essential prime implicants using prime chart
    findEssentialPrimes() {
        this.addStep('Build prime implicant chart');
        const chart = [];

        for (const minterm of this.minterms) {
            const covering = [];
            for (let i = 0; i < this.primeImplicants.length; i++) {
                const pi = this.primeImplicants[i];
                if (pi.decimals.includes(minterm)) {
                    covering.push(i);
                }
            }
            chart.push({ minterm, covering });
        }

        this.logStep(`Chart has ${this.minterms.length} rows, ${this.primeImplicants.length} columns`);

        // Find essential primes (columns with only one 1)
        const essential = new Set();
        const covered = new Set();

        for (const row of chart) {
            if (row.covering.length === 1) {
                essential.add(row.covering[0]);
                this.addStep(`Minterm ${row.minterm} is covered only by implicant ${row.covering[0]}`);
            }
        }

        this.essentialPrimes = Array.from(essential);
        this.logStep(`Essential prime implicants: ${this.essentialPrimes.map(i => this.primeImplicants[i].binary).join(', ')}`);

        // For now, use all primes as solution (can be enhanced with Petrick's method)
        return this.essentialPrimes;
    }

    // Convert binary pattern with dashes to Boolean expression
    binaryToExpression(binary, numVars) {
        const vars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, numVars);
        let expr = '';

        for (let i = 0; i < binary.length; i++) {
            if (binary[i] === '1') {
                expr += vars[i];
            } else if (binary[i] === '0') {
                expr += vars[i] + "'";
            }
        }

        return expr || '1';
    }

    // Generate minimized expressions
    generateExpressions() {
        this.quineMcCluskey();
        this.findEssentialPrimes();

        // SOP
        const sopTerms = this.essentialPrimes.map(i =>
            this.binaryToExpression(this.primeImplicants[i].binary, this.variables)
        );

        this.solution.sop = sopTerms.length > 0 ? sopTerms.join(' + ') : '0';

        // POS (simplified - using De Morgan's theorem)
        this.solution.pos = this.generatePOS();

        this.addStep('Minimization Complete');
        this.logStep(`SOP: ${this.solution.sop}`);
        this.logStep(`POS: ${this.solution.pos}`);

        return this.solution;
    }

    // Generate POS (Product of Sums)
    generatePOS() {
        // For POS, we need maxterms where function = 0
        const maxterms = [];
        const maxCount = 2 ** this.variables;

        for (let i = 0; i < maxCount; i++) {
            if (!this.minterms.includes(i) && !this.dontCares.includes(i)) {
                maxterms.push(i);
            }
        }

        if (maxterms.length === 0) return '1';

        // Apply Quine-McCluskey to maxterms for POS
        const zerosSolver = new KMapSolver();
        zerosSolver.variables = this.variables;
        zerosSolver.minterms = maxterms;
        zerosSolver.dontCares = [];
        zerosSolver.quineMcCluskey();

        const posTerms = zerosSolver.essentialPrimes.map(i =>
            '(' + zerosSolver.binaryToExpression(zerosSolver.primeImplicants[i].binary, this.variables) + ')'
        );

        return posTerms.join('');
    }

    // Find maximal groups for visualization (greedy algorithm)
    findGroups() {
        const { kmap, rows, cols } = this.buildKMap();
        const onesAndX = new Set([
            ...this.minterms,
            ...this.dontCares
        ]);

        const cells = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = kmap[r][c];
                if (onesAndX.has(cell.index)) {
                    cells.push({ r, c, index: cell.index });
                }
            }
        }

        // Power-of-2 group sizes
        const powers = [];
        for (let i = 0; i <= (rows > cols ? cols : rows); i++) {
            const size = 2 ** i;
            if (size <= rows * cols) powers.unshift(size);
        }

        this.groups = [];
        const used = new Set();
        let groupNum = 1;

        // Try groups from largest to smallest
        for (const size of powers) {
            const dimensions = this.getGroupDimensions(size, rows, cols);
            for (const { height, width } of dimensions) {
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        const groupCells = this.findGroupCells(r, c, height, width, rows, cols, onesAndX);

                        if (groupCells.length === size) {
                            // Check if this group adds new cells
                            const newCells = groupCells.filter(cell => !used.has(cell.index));
                            if (newCells.length > 0) {
                                this.groups.push({
                                    number: groupNum++,
                                    cells: groupCells,
                                    height,
                                    width,
                                    size
                                });
                                for (const cell of groupCells) {
                                    used.add(cell.index);
                                }
                            }
                        }
                    }
                }
            }
        }

        // Apply groups to K-map for visualization
        for (const group of this.groups) {
            for (const cell of group.cells) {
                if (kmap[cell.r][cell.c].value !== 'X') { // Only color minterms
                    kmap[cell.r][cell.c].group = group.number;
                }
            }
        }

        this.kmapData = { kmap, rows, cols };

        this.addStep(`Found ${this.groups.length} group(s)`);
        for (const group of this.groups) {
            const indices = group.cells.map(c => c.index).sort((a,b) => a-b);
            this.logStep(`Group ${group.number}: ${indices.join(', ')} (${group.size} cells)`);
        }
    }

    // Get possible dimensions for a given group size
    getGroupDimensions(size, maxRows, maxCols) {
        const dims = [];
        for (let h = 1; h <= maxRows; h++) {
            if (size % h === 0) {
                const w = size / h;
                if (w <= maxCols) {
                    dims.push({ height: h, width: w });
                }
            }
        }
        return dims;
    }

    // Find cells in a rectangular group (with wrap-around)
    findGroupCells(startR, startC, height, width, rows, cols, validIndices) {
        const cells = [];

        for (let dr = 0; dr < height; dr++) {
            const r = (startR + dr) % rows;
            for (let dc = 0; dc < width; dc++) {
                const c = (startC + dc) % cols;
                const { kmap } = this.buildKMap();
                const cell = kmap[r][c];

                if (validIndices.has(cell.index)) {
                    cells.push({ r, c, index: cell.index });
                } else {
                    return []; // Invalid group
                }
            }
        }

        return cells;
    }

    // Add a step to algorithm log
    addStep(title) {
        this.steps.push({ title, content: [] });
    }

    // Log content to current step
    logStep(msg) {
        if (this.steps.length > 0) {
            this.steps[this.steps.length - 1].content.push(msg);
        }
    }

    // Solve everything
    solve() {
        this.validateInput();

        this.steps = [];
        this.addStep('K-Map Solver Started');

        this.logStep(`Variables: ${this.variables}`);
        this.logStep(`Minterms: ${this.minterms.join(', ')}`);
        if (this.dontCares.length > 0) {
            this.logStep(`Don't cares: ${this.dontCares.join(', ')}`);
        }

        this.findGroups();
        this.generateExpressions();

        return {
            solution: this.solution,
            groups: this.groups,
            kmap: this.kmapData,
            steps: this.steps,
            stats: {
                variables: this.variables,
                mintermCount: this.minterms.length,
                primeCount: this.primeImplicants.length,
                essentialCount: this.essentialPrimes.length,
                sopLiterals: this.countLiterals(this.solution.sop)
            }
        };
    }

    // Count literals in expression
    countLiterals(expr) {
        if (expr === '0' || expr === '1') return 0;
        let count = 0;
        const vars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (const term of expr.split(' + ')) {
            for (const char of term) {
                if (vars.includes(char) || (term.includes(char + "'"))) {
                    count++;
                }
            }
        }
        return count;
    }

    // Validate input
    validateInput() {
        const maxTerms = 2 ** this.variables;

        // Check if expression input is provided
        const exprInput = document.getElementById('expression').value.trim();
        if (exprInput) {
            try {
                this.minterms = this.parseBooleanExpression(exprInput, this.variables);
                this.dontCares = []; // Dont' cares must be entered separately
                this.addStep('Parsed Boolean expression');
                this.logStep(`Expression: ${exprInput}`);
                this.logStep(`Converted to minterms: ${this.minterms.join(', ')}`);
            } catch (error) {
                throw new Error(`Expression error: ${error.message}`);
            }
        } else {
            this.minterms = this.parseMinterms(document.getElementById('minterms').value);
            this.dontCares = this.parseMinterms(document.getElementById('dontcares').value);
        }

        // Filter invalid numbers
        this.minterms = this.minterms.filter(m => m < maxTerms);
        this.dontCares = this.dontCares.filter(d => d < maxTerms && !this.minterms.includes(d));

        if (this.minterms.length === 0) {
            throw new Error('Please enter at least one minterm');
        }
    }

    // Render K-map to DOM
    renderKMap() {
        const { kmap, rows, cols } = this.kmapData;
        const container = document.getElementById('kmap');
        container.innerHTML = '';

        // Create table structure
        const table = document.createElement('div');
        table.className = 'kmap-grid';

        // Header row (column labels)
        const headerRow = document.createElement('div');
        headerRow.className = 'kmap-header-row';

        // Empty corner cell (top-left)
        const corner = document.createElement('div');
        corner.className = 'kmap-corner';
        headerRow.appendChild(corner);

        // Column headers
        for (let c = 0; c < cols; c++) {
            const header = document.createElement('div');
            header.className = 'kmap-header-col';
            header.textContent = kmap[0][c].colLabel.toString(2).padStart(
                this.variables <= 3 ? Math.floor(this.variables / 2) : Math.ceil(this.variables / 2),
                '0'
            );
            headerRow.appendChild(header);
        }
        table.appendChild(headerRow);

        // Data rows
        for (let r = 0; r < rows; r++) {
            const row = document.createElement('div');
            row.className = 'kmap-row';

            // Row header
            const rowHeader = document.createElement('div');
            rowHeader.className = 'kmap-row-header';
            rowHeader.textContent = kmap[r][0].rowLabel.toString(2).padStart(
                this.variables <= 3 ? Math.ceil(this.variables / 2) : Math.floor(this.variables / 2),
                '0'
            );
            row.appendChild(rowHeader);

            // Cells
            for (let c = 0; c < cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'kmap-cell';

                const data = kmap[r][c];
                if (data.value === 1) {
                    cell.classList.add('minterm');
                    cell.innerHTML = `<span class="cell-value">1</span><span class="cell-index">${data.index}</span>`;
                } else if (data.value === 'X') {
                    cell.classList.add('dontcare');
                    cell.innerHTML = `<span class="cell-value">X</span><span class="cell-index">${data.index}</span>`;
                } else {
                    cell.innerHTML = `<span class="cell-value">0</span><span class="cell-index">${data.index}</span>`;
                }

                if (data.group > 0) {
                    cell.classList.add(`group-${data.group}`);
                }

                row.appendChild(cell);
            }

            table.appendChild(row);
        }

        container.appendChild(table);
    }

    // Render algorithm steps
    renderSteps() {
        const container = document.getElementById('steps');
        container.innerHTML = '';

        for (const step of this.steps) {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'step';

            const title = document.createElement('div');
            title.className = 'step-title';
            title.textContent = step.title;
            stepDiv.appendChild(title);

            for (const content of step.content) {
                const para = document.createElement('div');
                para.className = 'step-content';
                para.innerHTML = content.replace(/\n/g, '<br>');
                stepDiv.appendChild(para);
            }

            container.appendChild(stepDiv);
        }
    }

    // Update statistics
    updateStats() {
        document.getElementById('stat-variables').textContent = this.variables;
        document.getElementById('stat-minterms').textContent = this.minterms.length;
        document.getElementById('stat-prime').textContent = this.primeImplicants.length;
        document.getElementById('stat-essential').textContent = this.essentialPrimes.length;
        document.getElementById('stat-literals').textContent = this.countLiterals(this.solution.sop);
    }

    // Update results display
    updateResults() {
        document.getElementById('sop-result').textContent = this.solution.sop || '-';
        document.getElementById('pos-result').textContent = this.solution.pos || '-';
    }

    // Export functions
    exportLatex() {
        const { kmap, rows, cols } = this.kmapData;
        let latex = '\\documentclass{article}\n\\usepackage{geometry}\n\\usepackage{array}\n\\usepackage{multirow}\n\\begin{document}\n\n';
        latex += '\\section*{Karnaugh Map}\n\n';
        latex += `Variables: ${this.variables}\\\\ Minterms: ${this.minterms.join(', ')}\\\\\n\n`;

        latex += '\\begin{tabular}{c|';
        for (let c = 0; c < cols; c++) latex += 'c';
        latex += '}\n\\cline{2-' + (cols + 1) + '}\n';

        // Column headers
        latex += '& ';
        for (let c = 0; c < cols; c++) {
            latex += kmap[0][c].colLabel.toString(2).padStart(Math.floor(this.variables / 2), '0');
            if (c < cols - 1) latex += ' & ';
        }
        latex += ' \\\\ \\cline{2-' + (cols + 1) + '}\n';

        // Rows
        for (let r = 0; r < rows; r++) {
            latex += kmap[r][0].rowLabel.toString(2).padStart(Math.ceil(this.variables / 2), '0') + ' & ';
            for (let c = 0; c < cols; c++) {
                const val = kmap[r][c].value;
                latex += (val === 1 ? '1' : val === 'X' ? 'X' : '0');
                if (c < cols - 1) latex += ' & ';
            }
            latex += ' \\\\ \\cline{1-' + (cols + 1) + '}\n';
        }

        latex += '\\end{tabular}\n\n';
        latex += '\\section*{Results}\n\n';
        latex += '\\textbf{SOP:} ' + this.solution.sop + '\\\\\n';
        latex += '\\textbf{POS:} ' + this.solution.pos + '\\\\\n';
        latex += '\\textbf{Literals:} ' + this.countLiterals(this.solution.sop) + '\n\n';
        latex += '\\end{document}';

        this.downloadFile('kmap.tex', latex);
    }

    exportText() {
        const { kmap, rows, cols } = this.kmapData;
        let text = 'K-MAP SOLVER RESULTS\n';
        text += '='.repeat(50) + '\n\n';
        text += `Variables: ${this.variables}\n`;
        text += `Minterms: ${this.minterms.join(', ')}\n`;
        if (this.dontCares.length > 0) {
            text += `Don't cares: ${this.dontCares.join(', ')}\n`;
        }
        text += '\n';

        text += 'KARNAUGH MAP\n';
        text += '-'.repeat(30) + '\n';

        // Header
        text += '    ';
        for (let c = 0; c < cols; c++) {
            text += kmap[0][c].colLabel.toString(2).padStart(Math.floor(this.variables / 2), '0') + '  ';
        }
        text += '\n';

        // Rows
        for (let r = 0; r < rows; r++) {
            text += kmap[r][0].rowLabel.toString(2).padStart(Math.ceil(this.variables / 2), '0') + '  ';
            for (let c = 0; c < cols; c++) {
                const val = kmap[r][c].value;
                text += (val === 1 ? '1' : val === 'X' ? 'X' : '0') + '  ';
            }
            text += '\n';
        }

        text += '\n';
        text += 'RESULTS\n';
        text += '-'.repeat(30) + '\n';
        text += `SOP: ${this.solution.sop}\n`;
        text += `POS: ${this.solution.pos}\n`;
        text += `Prime implicants: ${this.primeImplicants.length}\n`;
        text += `Essential primes: ${this.essentialPrimes.length}\n`;
        text += `Literals (SOP): ${this.countLiterals(this.solution.sop)}\n`;

        this.downloadFile('kmap.txt', text);
    }

    exportJSON() {
        const data = {
            variables: this.variables,
            minterms: this.minterms,
            dontCares: this.dontCares,
            kmap: this.kmapData,
            solution: this.solution,
            groups: this.groups,
            primeImplicants: this.primeImplicants,
            essentialPrimes: this.essentialPrimes,
            stats: {
                variables: this.variables,
                mintermCount: this.minterms.length,
                primeCount: this.primeImplicants.length,
                essentialCount: this.essentialPrimes.length,
                sopLiterals: this.countLiterals(this.solution.sop)
            },
            steps: this.steps
        };

        const json = JSON.stringify(data, null, 2);
        this.downloadFile('kmap.json', json);
    }

    copyResults() {
        const text = `SOP: ${this.solution.sop}\nPOS: ${this.solution.pos}\nLiterals: ${this.countLiterals(this.solution.sop)}`;
        navigator.clipboard.writeText(text).then(() => {
            alert('Results copied to clipboard!');
        });
    }

    downloadFile(filename, content) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    exportLogicSVG() {
        const wrapper = document.getElementById('logic-gate-wrapper');
        const svg = wrapper.querySelector('svg');
        if (!svg) {
            alert('No logic diagram to export. Solve a K-map first.');
            return;
        }
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'logic-diagram.svg';
        a.click();
        URL.revokeObjectURL(url);
    }

    // Generate truth table data
    generateTruthTableData() {
        const n = this.variables;
        const maxRows = 2 ** n;
        const variables = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, n);
        const onesSet = new Set(this.minterms);
        const dontCaresSet = new Set(this.dontCares);

        const rows = [];
        for (let i = 0; i < maxRows; i++) {
            const binary = i.toString(2).padStart(n, '0');
            const inputVals = {};
            for (let v = 0; v < n; v++) {
                inputVals[variables[v]] = binary[v] === '1';
            }

            let output;
            if (dontCaresSet.has(i)) {
                output = 'X';
            } else if (onesSet.has(i)) {
                output = '1';
            } else {
                output = '0';
            }

            rows.push({
                index: i,
                binary: binary,
                inputs: inputVals,
                output: output
            });
        }

        return { rows, variables };
    }

    // Render truth table
    renderTruthTable(limit = 16) {
        const { rows, variables } = this.generateTruthTableData();
        const wrapper = document.getElementById('truth-table-wrapper');

        // Filter rows if needed
        const displayRows = limit > 0 && rows.length > limit ? rows.slice(0, limit) : rows;

        // Build table HTML
        let html = '<table class="truth-table">';

        // Header row
        html += '<thead><tr>';
        html += '<th>#</th>';
        for (const v of variables) {
            html += `<th>${v}</th>`;
        }
        html += '<th>Out</th>';
        html += '</tr></thead>';

        // Body rows
        html += '<tbody>';
        for (const row of displayRows) {
            const rowClass = row.output === '1' ? 'row-one' : (row.output === 'X' ? 'row-x' : '');
            html += `<tr class="${rowClass}">`;
            html += `<td style="color: var(--text-dim); font-size: 0.8rem;">${row.index}</td>`;
            for (let i = 0; i < variables.length; i++) {
                const val = row.binary[i];
                html += `<td>${val}</td>`;
            }
            let outClass = '';
            if (row.output === '1') outClass = 'one';
            else if (row.output === '0') outClass = 'zero';
            html += `<td class="output-cell ${outClass}">${row.output}</td>`;
            html += `</tr>`;
        }
        html += '</tbody></table>';

        if (limit > 0 && rows.length > limit) {
            html += `<p style="margin-top: 10px; color: var(--text-dim); font-size: 0.85rem; text-align: center;">
                        ... showing first ${limit} of ${rows.length} rows. Check "Show all rows" to see full table.
                     </p>`;
        }

        wrapper.innerHTML = html;
    }

    // Render editable truth table for input
    renderTruthTableInput() {
        const n = this.variables;
        const maxRows = 2 ** n;
        const variables = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, n);
        const wrapper = document.getElementById('truth-table-wrapper');

        // Build editable table
        let html = '<table class="truth-table truth-table-input"><thead><tr>';
        html += '<th>#</th>';
        for (const v of variables) {
            html += `<th>${v}</th>`;
        }
        html += '<th>Out</th></tr></thead><tbody>';

        for (let i = 0; i < maxRows; i++) {
            const binary = i.toString(2).padStart(n, '0');
            html += `<tr data-index="${i}"><td style="color: var(--text-dim); font-size: 0.8rem;">${i}</td>`;
            for (let j = 0; j < n; j++) {
                html += `<td style="text-align: center; font-family: monospace; font-size: 1.1rem;">${binary[j]}</td>`;
            }
            // Output cell with select dropdown
            html += `<td style="text-align: center;">
                        <select class="truth-table-output" data-index="${i}" style="
                            padding: 4px 8px;
                            border: 1px solid var(--accent-blue);
                            border-radius: 4px;
                            background: var(--bg-tertiary);
                            color: var(--text-primary);
                            cursor: pointer;">
                            <option value="0">0</option>
                            <option value="1">1</option>
                            <option value="X">X</option>
                        </select>
                     </td></tr>`;
        }

        html += '</tbody></table>';
        html += '<p style="margin-top: 10px; color: var(--accent-green); font-size: 0.9rem;">Edit the table above, then click "Load from Truth Table" to use as input.</p>';

        wrapper.innerHTML = html;

        // Load current minterms/dontcares into the table
        this.loadTruthTableValues();
    }

    // Load current solver state into truth table input
    loadTruthTableValues() {
        const n = this.variables;
        const maxRows = 2 ** n;
        const onesSet = new Set(this.minterms);
        const dontCaresSet = new Set(this.dontCares);

        for (let i = 0; i < maxRows; i++) {
            const select = document.querySelector(`.truth-table-output[data-index="${i}"]`);
            if (select) {
                if (dontCaresSet.has(i)) {
                    select.value = 'X';
                } else if (onesSet.has(i)) {
                    select.value = '1';
                } else {
                    select.value = '0';
                }
            }
        }
    }

    // Parse SOP expression into product terms
    parseSOP(sop) {
        if (!sop || sop === '0') return [];
        if (sop === '1') return []; // Constant 1

        return sop.split(' + ').map(term => {
            // Parse each product term into literals
            const literals = [];
            let i = 0;
            while (i < term.length) {
                const char = term[i];
                if (/[A-Z]/.test(char)) {
                    // Check if next char is apostrophe (NOT)
                    if (i + 1 < term.length && term[i + 1] === "'") {
                        literals.push({ variable: char, negated: true });
                        i += 2;
                    } else {
                        literals.push({ variable: char, negated: false });
                        i++;
                    }
                } else {
                    i++; // Skip any unexpected chars
                }
            }
            return literals;
        });
    }

    // Generate logic gate SVG diagram
    renderLogicGateDiagram() {
        const wrapper = document.getElementById('logic-gate-wrapper');
        const terms = this.parseSOP(this.solution.sop);

        if (terms.length === 0) {
            wrapper.innerHTML = '<p class="placeholder">No expression to display (function is constant 0 or 1)</p>';
            return;
        }

        // Clear previous content and dispose any existing Fabric canvas
        if (this.fabricCanvas) {
            this.fabricCanvas.dispose();
            this.fabricCanvas = null;
        }
        wrapper.innerHTML = '';

        // Get computed variables for sizing
        const vars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, this.variables);

        // Layout parameters - horizontal only, optimized for Fabric canvas
        const gateWidth = 100;
        const gateHeight = 40;
        const margin = 70;
        const inputSpacing = 80;
        const gateSpacing = 90;

        // Calculate canvas dimensions for horizontal layout
        const canvasWidth = margin * 2 + 200 + gateWidth + vars.length * 60;
        const canvasHeight = margin * 2 + terms.length * gateSpacing + 60;

        // Create canvas element
        const canvas = document.createElement('canvas');
        canvas.id = 'logic-gate-canvas';
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        wrapper.appendChild(canvas);

        // Initialize Fabric canvas
        this.fabricCanvas = new fabric.Canvas('logic-gate-canvas', {
            selection: false,
            hoverCursor: 'default'
        });

        // Set background
        this.fabricCanvas.setBackgroundColor('#0d1117', this.fabricCanvas.renderAll.bind(this.fabricCanvas));

        // Colors
        const colors = {
            background: '#0d1117',
            text: '#00d4ff',
            wire: '#00ff9d',
            andGate: '#4dabf7',
            orGate: '#b147ff',
            output: '#ff6b6b',
            label: '#c9d1d9'
        };

        // Store positions for connections
        const inputPositions = [];
        const andGatePositions = [];

        // Draw input variable labels (stacked vertically on left)
        for (let i = 0; i < vars.length; i++) {
            const y = margin + 20 + i * inputSpacing;
            const x = margin + 30;

            inputPositions.push({ x, y, variable: vars[i] });

            const text = new fabric.Text(vars[i], {
                left: x,
                top: y,
                fill: colors.text,
                fontFamily: 'Fira Code, Consolas, monospace',
                fontSize: 16,
                fontWeight: '600',
                selectable: false,
                evented: false
            });
            this.fabricCanvas.add(text);
        }

        // Calculate gate positions (horizontal flow from left to right)
        const gateX = margin + 80;

        // Draw AND gates
        for (let t = 0; t < terms.length; t++) {
            const term = terms[t];
            const gateY = margin + t * gateSpacing + 35;

            andGatePositions.push({ x: gateX, y: gateY });

            // Draw AND gate (horizontal orientation only)
            const andGate = new fabric.Path('M 15,0 Q 100,0 100,20 Q 100,40 15,40 L 0,20 Z', {
                left: gateX,
                top: gateY - gateHeight/2,
                fill: '#0d1117',
                stroke: '#4dabf7',
                strokeWidth: 2,
                selectable: false,
                evented: false
            });
            this.fabricCanvas.add(andGate);

            // AND gate label
            const label = new fabric.Text('AND', {
                left: gateX + gateWidth/2,
                top: gateY + 2,
                fill: colors.label,
                fontFamily: 'Fira Code, Consolas, monospace',
                fontSize: 10,
                fontWeight: '500',
                textAlign: 'center',
                selectable: false,
                evented: false
            });
            this.fabricCanvas.add(label);

            // Connect inputs to AND gate
            for (let i = 0; i < term.length; i++) {
                const varName = term[i].variable;
                const inputIdx = vars.indexOf(varName);
                if (inputIdx === -1) continue;

                const inputPos = inputPositions[inputIdx];
                const gateInputX = gateX;
                const gateInputY = gateY;

                // Draw wire from input to gate (no inversion bubbles)
                const line = new fabric.Path(`M ${inputPos.x} ${inputPos.y + 8} L ${gateInputX} ${gateInputY}`, {
                    stroke: colors.wire,
                    strokeWidth: 2,
                    selectable: false,
                    evented: false
                });
                this.fabricCanvas.add(line);
            }
        }

        // Combine AND outputs with OR gate or direct output
        if (terms.length > 1) {
            const orX = gateX + gateWidth + 30;
            const orY = margin + terms.length * gateSpacing/2 - gateHeight/2;

            // Draw OR gate (horizontal orientation only)
            const orGate = new fabric.Path('M 15,0 Q -10,20 15,40 Q 100,40 100,20 Q 100,0 15,0 Z', {
                left: orX,
                top: orY,
                fill: '#0d1117',
                stroke: '#b147ff',
                strokeWidth: 2,
                selectable: false,
                evented: false
            });
            this.fabricCanvas.add(orGate);

            // OR label
            const orLabel = new fabric.Text('OR', {
                left: orX + gateWidth/2,
                top: orY + gateHeight/2 + 2,
                fill: colors.label,
                fontFamily: 'Fira Code, Consolas, monospace',
                fontSize: 10,
                fontWeight: '500',
                textAlign: 'center',
                selectable: false,
                evented: false
            });
            this.fabricCanvas.add(orLabel);

            // Connect AND outputs to OR
            for (const pos of andGatePositions) {
                const andOutputX = pos.x + gateWidth;
                const andOutputY = pos.y + gateHeight/2;
                const orInputX = orX;
                const orInputY = orY + gateHeight/2;

                const wire = new fabric.Path(`M ${andOutputX} ${andOutputY} L ${orInputX} ${orInputY}`, {
                    stroke: colors.wire,
                    strokeWidth: 2,
                    selectable: false,
                    evented: false
                });
                this.fabricCanvas.add(wire);
            }

            // Final output line
            const outX = orX + gateWidth + 30;
            const outY = orY + gateHeight/2;

            const outputLine = new fabric.Path(`M ${orX + gateWidth + 8} ${outY} L ${outX} ${outY}`, {
                stroke: colors.output,
                strokeWidth: 2,
                selectable: false,
                evented: false
            });
            this.fabricCanvas.add(outputLine);

            // Output label F
            const outputLabel = new fabric.Text('F', {
                left: outX + 10,
                top: outY - 8,
                fill: colors.output,
                fontFamily: 'Fira Code, Consolas, monospace',
                fontSize: 18,
                fontWeight: '700',
                selectable: false,
                evented: false
            });
            this.fabricCanvas.add(outputLabel);

        } else {
            // Single AND gate - output directly
            const and = andGatePositions[0];
            const outX = and.x + gateWidth + 30;
            const outY = and.y + gateHeight/2;

            const outputLine = new fabric.Path(`M ${and.x + gateWidth} ${and.y + gateHeight/2} L ${outX} ${outY}`, {
                stroke: colors.output,
                strokeWidth: 2,
                selectable: false,
                evented: false
            });
            this.fabricCanvas.add(outputLine);

            const outputLabel = new fabric.Text('F', {
                left: outX + 10,
                top: outY - 8,
                fill: colors.output,
                fontFamily: 'Fira Code, Consolas, monospace',
                fontSize: 18,
                fontWeight: '700',
                selectable: false,
                evented: false
            });
            this.fabricCanvas.add(outputLabel);
        }

        // Render everything
        this.fabricCanvas.renderAll();
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
    solver.steps = [];
    // Show editable truth table input
    solver.renderTruthTableInput();
});

// Load truth table input into solver
document.getElementById('loadFromTruthTable').addEventListener('click', () => {
    const n = solver.variables;
    const maxRows = 2 ** n;
    const minterms = [];
    const dontCares = [];

    for (let i = 0; i < maxRows; i++) {
        const select = document.querySelector(`.truth-table-output[data-index="${i}"]`);
        if (select) {
            if (select.value === '1') {
                minterms.push(i);
            } else if (select.value === 'X') {
                dontCares.push(i);
            }
        }
    }

    if (minterms.length === 0) {
        alert('Please set at least one minterm (output = 1) in the truth table.');
        return;
    }

    document.getElementById('minterms').value = minterms.sort((a, b) => a - b).join(', ');
    document.getElementById('dontcares').value = dontCares.sort((a, b) => a - b).join(', ');
    alert(`Loaded ${minterms.length} minterm(s) and ${dontCares.length} don't care(s). Click "Solve K-Map" to minimize.`);
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
    // Re-render truth table input with new variable count
    solver.renderTruthTableInput();
});

// Initialize truth table input on page load
solver.renderTruthTableInput();

// Quick navigation: scroll to truth table
document.getElementById('scrollToTruthTable').addEventListener('click', () => {
    const truthTableSection = document.querySelector('.truth-table-section');
    if (truthTableSection) {
        truthTableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});

// Input truth table button
document.getElementById('inputTruthTableBtn').addEventListener('click', () => {
    const truthTableSection = document.querySelector('.truth-table-section');
    if (truthTableSection) {
        truthTableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});

console.log('K-Map Solver initialized');
