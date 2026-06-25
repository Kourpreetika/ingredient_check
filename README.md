# Ingredient_Check

A web app that helps users scan food product ingredient labels, extract text with OCR, and flag potentially harmful additives with health-related notes.


## Overview

**Ingredient_Check** lets users upload or photograph an ingredient label on a packaged food product. The app uses **Optical Character Recognition (OCR)** to read the label text, then compares it against a hardcoded database of ingredients to surface possible health concerns.

> **Disclaimer:** This app is for educational and informational purposes only. It does not provide medical advice. Flagged ingredients reflect a curated list — absence of a flag does not mean a product is safe.

## Features

- **Food product check** — Asks whether the item is an eating product before allowing a scan
- **OCR label scanning** — Reads ingredient text from uploaded images using [Tesseract.js](https://tesseract.projectnaptha.com/)
- **Harmful ingredient detection** — Matches label text against 80+ hardcoded additives, sweeteners, preservatives, colors, and E-numbers
- **Health risk notes** — Shows a short explanation for each flagged ingredient.

No build step, framework, or backend required — runs entirely in the browser.

## Project Structure


ingredient_check/
├── index.html           # UI, styles, and layout
├── javascript.js        # OCR logic, ingredient database, scan flow
├── ingredient_check.mp4 # Full-screen background video
├── image (2).png        # Sample/reference image
└── README.md

### Tips for better scans

- Use good lighting and a straight, in-focus photo
- Crop to the ingredients section if possible
- Plain text screenshots work well for testing

### Sample label text for testing


## How It Works

```
User uploads image
       ↓
Tesseract.js extracts text (OCR)
       ↓
Text converted to lowercase
       ↓
Each key in harmfulIngredients checked via .includes()
       ↓
Matches displayed with risk notes
```

The ingredient database lives in `javascript.js` as a plain object:

```js
const harmfulIngredients = {
  "sodium benzoate": "Preservative; some people may want to limit intake.",
  "red 40": "Artificial color; may cause sensitivity in some people.",
  // ...
}


## Ingredient Categories Covered

- Sweeteners (HFCS, aspartame, sucralose, E950–E955)
- Preservatives (sodium benzoate, BHT, TBHQ, nitrates, E-numbers)
- Artificial colors (Red 40, Yellow 5, tartrazine, E102–E133)
- Fats & oils (palm oil, hydrogenated oils)
- Flavor enhancers (MSG, E621, yeast extract)
- Emulsifiers & thickeners (carrageenan, polysorbate 80)
- Other common additives (maltodextrin, titanium dioxide, etc.)


┌─────────────────────┐
│  Ingredient_Check   │  ← Header (logo + tagline)
│   Scan · Analyze    │
└─────────────────────┘
         ↓
┌─────────────────────┐
│      Welcome        │
│  Is this food?      │
│  [Yes]    [No]      │
└─────────────────────┘
         ↓ Yes
┌─────────────────────┐
│      Scan Me        │
│ [Scan the Product]  │
│     Results         │
└─────────────────────┘
```

---

## Limitations

- OCR accuracy depends on image quality; blurry or curved labels may misread text
- Matching uses simple substring search — typos or unusual spellings may be missed
- Duplicate flags can appear when multiple aliases match (e.g. `msg`, `e621`, `monosodium glutamate`)
- Database is static and manually maintained — not exhaustive

---