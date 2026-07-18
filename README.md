# Ingredient_Check

A web app that helps users scan food product ingredient labels, extract text with OCR, and flag potentially concerning additives with severity levels and health-related notes.

## Overview

**Ingredient_Check** lets users upload or photograph an ingredient label on a packaged food product. The app uses **Optical Character Recognition (OCR)** to read the label text, then matches it against a curated database of additives (with aliases and E-numbers collapsed into single findings).

> **Disclaimer:** This app is for educational and informational purposes only. It does not provide medical advice. Flagged ingredients reflect a curated list — absence of a flag does not mean a product is safe.

## Features

- **Food product check** — Asks whether the item is food before allowing a scan
- **OCR label scanning** — Reads ingredient text from photos via [Tesseract.js](https://tesseract.projectnaptha.com/)
- **Drag & drop + camera** — Drop an image, pick a file, or use the phone camera
- **Paste text fallback** — Analyze a pasted ingredients list when OCR struggles
- **Smarter matching** — Canonical ingredients with aliases (e.g. MSG / E621 / monosodium glutamate → one result); word-boundary checks for short codes
- **Severity report** — High / moderate / low concern badges, grouped by category
- **Health conditions** — Set diabetes, heart disease, etc.; scans warn when ingredients are not recommended for you
- **Scan history** — Recent checks on this device; tap to restore a report

No build step, framework, or backend required — runs entirely in the browser.

## Project Structure

```
ingredient_check/
├── index.html           # UI, styles, and layout
├── javascript.js        # OCR flow, ingredient DB, matching, history
├── ingredient_check.mp4 # Full-screen background video
├── image (2).png        # Sample/reference image
└── README.md
```

## How to run

Open `index.html` in a modern browser (Chrome, Edge, Firefox, Safari). For camera capture on a phone, serve over HTTPS or `localhost`.

## Tips for better scans

- Use good lighting and a straight, in-focus photo
- Crop to the ingredients section if possible
- Plain text screenshots work well for testing
- If OCR is weak, use **Paste text instead**

### Sample label text for testing

```
Ingredients: Water, Sugar, High Fructose Corn Syrup, Sodium Benzoate,
Red 40, Yellow 5, Monosodium Glutamate, Partially Hydrogenated Soybean Oil,
Carrageenan, Artificial Flavor.
```

## How it works

```
User uploads image (or pastes text)
       ↓
Tesseract.js extracts text (OCR) — skipped for paste
       ↓
Text normalized (case, punctuation, spacing)
       ↓
Each database entry checked via aliases (longest first)
       ↓
Duplicates collapsed · severity sorted
       ↓
Report + history saved on this device
```

Ingredient data lives in `javascript.js` as entries like:

```js
{
  id: "msg",
  name: "MSG (Monosodium Glutamate)",
  aliases: ["monosodium glutamate", "msg", "e621"],
  category: "Flavor Enhancers",
  severity: "moderate",
  note: "Flavor enhancer; may cause sensitivity in some people.",
}
```

## Ingredient categories covered

- Sweeteners (HFCS, aspartame, sucralose, E950–E955)
- Preservatives (sodium benzoate, BHT, TBHQ, nitrates, sulfites)
- Artificial colors (Red 40, Yellow 5, tartrazine, E102–E133)
- Fats & oils (palm oil, hydrogenated oils)
- Flavor enhancers (MSG, E621, yeast extract)
- Emulsifiers & thickeners (carrageenan, polysorbate 80)
- Other additives (maltodextrin, titanium dioxide, brominated vegetable oil, etc.)

## Limitations

- OCR accuracy depends on image quality; blurry or curved labels may misread text
- Matching is substring / boundary based — typos or unusual spellings may be missed
- Database is static and manually maintained — not exhaustive
- History stays in the browser (`localStorage`) only
