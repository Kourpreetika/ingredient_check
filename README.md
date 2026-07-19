# Ingredient_Check

A browser app that scans food ingredient labels (photo or text), flags concerning additives, explains health risks if consumed, and warns when a product doesn’t fit your personal health conditions (for example diabetes).

## Overview

**Ingredient_Check** lets you upload or photograph a packaged food label. It uses **OCR** ([Tesseract.js](https://tesseract.projectnaptha.com/)) to read the text, then matches it against a curated additive database (aliases and E-numbers collapse into one finding).

You can also set **health conditions** (diabetes, high blood pressure, heart disease, kidney disease, IBS, asthma/sulfites). When a scan finds conflicting ingredients — such as sugar with diabetes — the app shows a clear **Not recommended for you** warning.

> **Disclaimer:** Educational and informational use only. Not medical advice. A missing flag does not mean a product is safe. Always follow your clinician’s guidance.

## Features

- **Food check** — Confirms the item is food before scanning
- **OCR label scan** — Reads ingredient & nutrition text from photos of any edible packaged product
- **Drag & drop + camera** — Drop an image, pick a file, or use the phone camera
- **Paste text fallback** — Analyze a pasted ingredients list when OCR struggles
- **Harmful-ingredient report** — Lists every matched additive of concern
- **Health risks** — For each finding: risks if consumed regularly, severity, and who should be careful
- **Smarter matching** — Aliases collapsed (e.g. MSG / E621 / monosodium glutamate → one result); nested false matches reduced
- **Health conditions** — Personalized “not recommended” alerts (saved on this device)
- **Healthy alternatives** — Enter the product name after an unhealthy scan for better swaps (e.g. Lay’s Magic Masala → Too Yumm, roasted makhana, baked chips)
- **Kids Safety Mode** — When enabled (or the product is for children): flags Artificial Color, High Sugar, and Caffeine, with “Not recommended below 10 years”
- **AI chatbot** — After a scan, ask questions like “Can I eat this if I have PCOS?” and get an answer tied to that product’s findings
- **Scan history** — Recent checks on this device; tap to restore a report
- **No backend** — Runs fully in the browser (no build step)

## Project structure

```
ingredient_check/
├── index.html           # UI, styles, and layout
├── javascript.js        # OCR, ingredient DB, matching, conditions, history
├── ingredient_check.mp4 # Full-screen background video
├── image (2).png        # Sample/reference image
└── README.md
```

## How to run

**Option A — open the file**

Open `index.html` in Chrome, Edge, Firefox, or Safari.

**Option B — local server (recommended for camera)**

```powershell
cd c:\Users\kourp\ingredient_check
python -m http.server 5500
```

Then visit `http://localhost:5500/`.

Camera capture on a phone works best over **HTTPS** or **localhost**.

## Tips for better scans

- Use good lighting and a straight, in-focus photo
- Crop to the **Ingredients** section when possible
- Plain text screenshots work well for testing
- If OCR is weak, use **Paste text instead**

### Sample label text for testing

```
Ingredients: Water, Sugar, High Fructose Corn Syrup, Sodium Benzoate,
Red 40, Yellow 5, Monosodium Glutamate, Partially Hydrogenated Soybean Oil,
Carrageenan, Artificial Flavor.
```

With **Diabetes** selected under *My health conditions*, sugar / HFCS-style ingredients should trigger a personalized not-recommended warning.

## How it works

```
Set health conditions (optional)
       ↓
Upload label photo or paste text
       ↓
Tesseract.js extracts text (skipped for paste)
       ↓
Text normalized · image lightly preprocessed for OCR
       ↓
Match aliases (longest first) · collapse duplicates
       ↓
Build report: harmful list + risks + condition warnings
       ↓
Ask product name → healthy alternative suggestions (if concerns found)
       ↓
Save scan to history on this device
```


With a concerning scan, enter e.g. **Lay's Magic Masala** to see swaps like Too Yumm, roasted makhana, and baked chips. Unknown products still get category-based suggestions.

Ingredient entries in `javascript.js` look like:

```js
{
  id: "msg",
  name: "MSG (Monosodium Glutamate)",
  aliases: ["monosodium glutamate", "msg", "e621"],
  category: "Flavor Enhancers",
  severity: "moderate",
  note: "Flavor enhancer that boosts savory (umami) taste.",
  risks: [
    "Some people get headache, flushing, or tingling shortly after eating it",
    "Adds sodium, which can matter for blood pressure",
  ],
  watchFor: "People who notice MSG sensitivity or are limiting sodium.",
}
```

Condition-specific advice is mapped separately (for example sugar → not recommended with diabetes).

## Ingredient categories covered

- Sweeteners (sugar, HFCS, aspartame, sucralose, E950–E955)
- Preservatives (sodium benzoate, BHT, TBHQ, nitrates, sulfites)
- Artificial colors (Red 40, Yellow 5, tartrazine, E102–E133)
- Fats & oils (palm oil, hydrogenated / trans fats)
- Flavor enhancers (MSG, E621, yeast extract)
- Emulsifiers & thickeners (carrageenan, polysorbate 80)
- Other additives (maltodextrin, titanium dioxide, brominated vegetable oil, etc.)

## Health conditions

| Condition | Example warnings |
| --- | --- |
| Diabetes | Sugar, HFCS, maltodextrin, dextrose |
| High blood pressure | MSG, yeast extract, cured-meat additives |
| Heart disease | Hydrogenated oils / trans fats, nitrites |
| Kidney disease | Phosphates, aluminum additives |
| IBS / sensitive gut | Carrageenan, polysorbates |
| Asthma / sulfite sensitivity | Sulfites, some dyes (e.g. Yellow 5) |

## Limitations

- OCR depends on image quality; blurry or curved labels may misread text
- Matching is text-based — typos or unusual spellings can be missed
- Database is curated and static — not exhaustive
- History and health conditions stay in the browser (`localStorage`) only
- Personalized tips are educational, not a clinical diet plan

## Push to GitHub

```powershell
cd c:\Users\kourp\ingredient_check
git add .
git commit -m "Improve Ingredient_Check: health risks, conditions, and UI"
git push -u origin HEAD
```
