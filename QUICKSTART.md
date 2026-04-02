# Quick Start Guide

## How to Use the K-Map Solver

### 1. Open the Application

**Option A: Direct open** (simplest)
- Double-click `index.html`
- Opens in your default browser

**Option B: Python server** (recommended for full features)
```bash
python server.py
```
Then visit: http://localhost:8000

**Option C: Node.js server**
```bash
npx serve -p 3000
```
Then visit: http://localhost:3000

### 2. Enter Your Input

#### Method 1: Minterms (Most Common)
Type decimal numbers where function = 1:
```
0,1,2,3,5,7
```

Use ranges:
```
0-3,5,7-9
```

#### Method 2: Don't Care Conditions
Leave don't cares blank, or add them:
- Minterms: `0,1,2,3`
- Don't cares: `4,5,6,7`

### 3. Select Variables

Choose 2-6 variables from the dropdown. This determines K-map size:
- 2 variables: 2×2 grid (4 cells)
- 3 variables: 4×2 grid (8 cells)
- 4 variables: 4×4 grid (16 cells)
- 5 variables: 4×8 grid (32 cells) - scrollable
- 6 variables: 8×8 grid (64 cells) - scrollable

### 4. Click "Solve K-Map"

Results appear instantly:
- Visual K-map with color-coded groups
- Minimized SOP (Sum of Products)
- Minimized POS (Product of Sums)
- Statistics (variables, literals, prime implicants)
- Algorithm steps (Quine-McCluskey)

### 5. Export Your Work

Choose from:
- 📄 **LaTeX**: Full LaTeX document with table
- 📝 **Text**: Plain text for notes
- 📊 **JSON**: All data for custom processing
- 📋 **Copy**: Quick copy SOP/POS to clipboard

---

## Common Examples

### Example 1: Majority Function (3 variables)
```
Minterms: 3,5,6,7
Output: A B + B C + A C
```
Majority vote of 3 inputs.

### Example 2: Full Adder Sum
```
Minterms: 1,2,4,7
Output: A' B' C + A' B C' + A B' C' + A B C
```

### Example 3: Even Parity (4 variables)
```
Minterms: 0,3,5,6,9,10,12,15
Output: A' B' C' D' + A' B C D + A B' C D + A B C' D'
```

### Example 4: With Don't Cares
```
Minterms: 0,1,2,4,5
Don't cares: 3,6,7
Result: Larger groups → fewer terms
```

---

## Understanding the Output

### SOP (Sum of Products)
Series of AND terms OR'd together: `A' + BC' + ABD`

- Each term is a product (AND) of literals
- Terms are summed (OR'd)
- This is the standard minimized form

### POS (Product of Sums)
Series of OR terms AND'd together: `(A+B)(A'+C)(B+C')`

- Each sum is an OR of literals
- All sums are multiplied (AND'd)
- Often from maxterms

### Groups
Colored regions on K-map show grouping patterns:
- **Green**: Minterms (cells with 1)
- **Orange**: Don't cares (cells with X)
- **Blue/Red/etc**: Group members (powers of 2: 1,2,4,8,16...)
- Groups wrap around edges!

---

## Tips & Tricks

### 1. Don't Cares Are Powerful
Don't care conditions (X) can help create larger groups, reducing literals.
Only use them if the output truly doesn't matter for those input combinations.

### 2. Wrap-Around Groups
K-maps wrap! Adjacency includes:
- Leftmost column → Rightmost column
- Top row → Bottom row
- All four corners can be a single group

### 3. Multiple Solutions
Different valid groupings may produce different but equivalent expressions.
The tool finds one minimal solution, but others may exist.

### 4. 5 & 6 Variable Maps
For larger maps:
- Use horizontal scroll
- Hover cells to see indices
- Export to LaTeX for better viewing

### 5. Verify Results
Always check your results manually, especially for critical applications.
Use this as a learning aid, not a black box.

---

## Troubleshooting

### "Please enter at least one minterm"
Enter at least one decimal number in the Minterms field.

### "Invalid input"
Check:
- Only numbers, commas, and dashes in ranges
- Numbers must be in range (0 to 2^n-1)

### K-map looks wrong
Make sure you selected the correct number of variables.
Gray code ordering may look unusual - that's correct!

### Groups not showing
All minterms should be covered. The solver tries to find maximal groups.
Not all valid groupings are found - the algorithm is greedy.

---

## Keyboard Shortcuts

- **Enter**: Solve (when in any input field)
- **Tab**: Navigate between fields
- **Space**: Click focused button

---

## Need Help?

See `README.md` for detailed documentation including:
- Algorithm details
- Technical specifications
- File structure
- Future enhancements

Run `test.html` for pre-made examples and demonstrations.

---

🎓 **Learning Tip**: Try predicting the groups before clicking Solve!
See the algorithm steps to understand the Quine-McCluskey method.
