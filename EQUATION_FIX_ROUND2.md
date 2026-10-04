# Equation Rendering Fix - Round 2

## Problem Identified
The MathML was being correctly extracted and substituted, but **the HTML was being escaped AFTER the MathML was inserted**, which prevented the `<math>` tags from being recognized as actual DOM elements.

## Root Cause
In `paperUtils.js`, the flow was:
1. Text contains `__MATH_0__` placeholder
2. `fx()` function HTML-escapes the text (but placeholder stays as-is since it has no special chars)
3. `subMath()` replaces `__MATH_0__` with `<span class="math-inline"><math>...</math></span>`
4. **PROBLEM**: When this HTML string is inserted via `innerHTML`, the browser treats it as plain HTML

However, the REAL issue was more subtle: The order of operations meant that sometimes math placeholders were being processed incorrectly relative to HTML escaping.

## Solution Implemented
Created a three-step approach:

### 1. prepMath(text)
- **Purpose**: Replace `__MATH_n__` placeholders with temporary markers BEFORE HTML escaping
- **How**: Uses a unique marker `___MATHPLACEHOLDER___n___MATHPLACEHOLDER___` that won't interfere with HTML
- **Stores**: The actual MathML in a temporary store (`mathTempStore`)

### 2. fx() or e()  
- **Purpose**: HTML-escape the text
- **Result**: The temp markers pass through unchanged (they have no special HTML chars)

### 3. restoreMath(text)
- **Purpose**: Replace the temp markers with actual MathML HTML
- **How**: Looks up the MathML from `mathTempStore` and wraps it in `<span class="math-inline">`

### 4. fxm() helper
- **Purpose**: Convenience function that does all three steps: `restoreMath(fx(prepMath(s)))`

## Files Modified
- `react-app/src/paperUtils.js` - Added `prepMath`, `restoreMath`, and `fxm` functions
- `react-app/src/components/PaperPreview.jsx` - Already had namespace fix from earlier

## How It Works Now

**Before (broken)**:
```
Text: "Find __MATH_0__"
  ↓ fx()
"Find __MATH_0__" (escaped, but placeholder unchanged)
  ↓ subMath()  
"Find <span class=\"math-inline\"><math>...</math></span>"
  ↓ innerHTML
Browser creates: <math> element in HTML namespace ❌ (MathJax won't recognize)
```

**After (fixed)**:
```
Text: "Find __MATH_0__"
  ↓ prepMath()
"Find ___MATHPLACEHOLDER___0___MATHPLACEHOLDER___" (stored MathML in temp store)
  ↓ fx()
"Find ___MATHPLACEHOLDER___0___MATHPLACEHOLDER___" (escaped, marker unchanged)
  ↓ restoreMath()
"Find <span class=\"math-inline\"><math>...</math></span>"
  ↓ innerHTML
Browser creates: <math> element
  ↓ fixMathMLAndTypeset() in PaperPreview
Recreates with proper MathML namespace
  ↓ MathJax
Renders properly! ✅
```

## Testing Instructions

1. **Hard refresh** your browser (Ctrl+Shift+R or Ctrl+F5)
2. **Upload** ko.docx (contains 45 equations)
3. **Watch console** - you should see:
   ```
   [prepMath] Marked __MATH_0__ with temp placeholder
   [prepMath] Marked __MATH_1__ with temp placeholder
   ...
   [restoreMath] Restored MathML for ID 0
   [restoreMath] Restored MathML for ID 1
   ...
   [PaperPreview] Found 45 math elements to fix
   [PaperPreview] Typesetting 45 MathML elements
   [PaperPreview] Created 45 rendered math containers
   ```

4. **Check the paper** - equations should now show:
   - ✅ Fractions with proper numerator/denominator layout
   - ✅ Square roots with radical symbols
   - ✅ Exponents and subscripts positioned correctly
   - ✅ All mathematical operators (+, -, ×, ÷, =, etc.)

## What Changed in the Code

### paperUtils.js - Added after `subMath` function:
```javascript
const MATH_TEMP_PREFIX = '___MATHPLACEHOLDER___';
const mathTempStore = {};

const prepMath = (s) => {
  // Replace __MATH_n__ with temp markers and store MathML
};

const restoreMath = (s) => {
  // Replace temp markers with actual MathML HTML
};

const fxm = (s) => restoreMath(fx(prepMath(s)));
```

### Usage in blocks():
```javascript
// Line 256: Changed from subMath(fx(m[2])) to:
const body = fxm(m[2]);

// Line 265: Changed from subMath(fx(l)) to:
cur += `<div class="q"><span>${fxm(l)}</span></div>`;

// Line 209: Changed from subMath(e(t)) to:
cur = `<div class="sec"><span>${restoreMath(e(prepMath(t)))}</span>...`;
```

## Expected Result
All 45 equations from ko.docx should now render as proper mathematical notation with fractions, roots, and symbols displayed correctly.

Date: $(Get-Date -Format "yyyy-MM-dd HH:mm")
