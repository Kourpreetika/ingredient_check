# Ingredient_Check

Photograph the ingredients panel on a packaged food and get back a plain-language report: which additives are in it, what each one does, which of them clash with your health conditions, and the youngest age the product is suitable for.

Runs entirely in the browser. No build step, no backend, no network calls except the OCR library.

> **Educational information only — not medical advice.** Risk depends on quantity, frequency and your own health. An ingredient not being flagged does not mean it is absent or safe. Follow your clinician's guidance over anything here.

## What it does

- **Reads the label** — OCR ([Tesseract.js](https://tesseract.projectnaptha.com/)) pulls the ingredients and nutrition text out of a photo, on your device. Paste the text instead if the print is too small.
- **Explains the risk** — every finding carries a severity, what it does in food, and what regular consumption is associated with.
- **Matches your conditions** — seven avoid lists, each group carrying the reason it is on the list and the exact term that triggered it.
- **Grades every product for children** — not a blanket warning: the additives found set a minimum age, and each one explains itself.
- **Suggests swaps** — name a product and get alternatives for the same craving.
- **Keeps history per profile** — a side drawer of past scans, tap any one to reopen the report.
- **Local profiles** — several people can use the same browser without sharing conditions or history.

## Running it

Open `index.html` directly, or serve it (recommended — camera capture needs `localhost` or HTTPS):

```bash
cd ingredient_check
python3 -m http.server 5500
```

Then visit `http://localhost:5500/`.

## Project structure

```
ingredient_check/
├── index.html             # Landing page + scanner, history drawer, profile modals
├── styles.css             # Visual system
├── ingredient-database.js # The additive reference + product swap suggestions
├── condition-database.js  # Per-condition avoid lists, kids rules, matching engine
├── profile.js             # Local profiles and scoped storage
├── app.js                 # UI flow, OCR, report rendering, history
└── img1.png               # Hero imagery
```

Scripts load in that order — the data files declare globals that `app.js` consumes.

## The condition database

`condition-database.js` is the file to edit when you want to change what gets flagged. Each condition owns groups of label terms, and every group states its level and its reason:

```js
{
  id: "asthma",
  label: "Asthma",
  focus: "Sulphites, azo dyes and benzoates.",
  groups: [
    {
      id: "asthma-sulphites",
      title: "Sulphites",
      level: "avoid",          // "avoid" | "limit"
      why: "Sulphites release sulphur dioxide gas in the stomach...",
      terms: ["sodium metabisulphite", "e223", "sulphur dioxide", ...],
    },
  ],
  nutrition: [{ key: "sodium", limit: 0.6, unit: "g", why: "..." }],
}
```

Terms are written the way they appear on real packs, including British spellings and E-numbers. Matching is longest-first with negation guards, so `no added sugar` does not trigger the sugar group and `high fructose corn syrup` does not also report `corn syrup`.

### Conditions covered

| Condition | Focus |
| --- | --- |
| Diabetes Type A | Added sugars, syrups, trans fats |
| Diabetes Type B | Added sugars, syrups, fast-digesting starches, trans fats |
| High BP | Sodium compounds, flavour enhancers, cured meats, liquorice |
| Low BP | Alcohol, diuretic extracts, large refined-carb loads |
| PCOD | Added sugars, refined starches, trans fats, ultra-processed markers |
| Asthma | Sulphites, azo dyes, benzoates |
| Sensitive gut | Emulsifiers, polyols, fermentable fibres, FODMAP flavourings |

Low blood pressure deliberately does **not** inherit the sodium warnings — over-restricting salt is the wrong advice there, and the report says so.

## Kids safety

`KIDS_SAFETY_RULES` runs on every scan whether or not the pack is aimed at children. Each rule carries a `minAge`, and the strictest match sets the product's floor:

| Rule | Minimum age |
| --- | --- |
| Honey | 1 |
| Added sugar, artificial sweeteners, high sodium, sugar alcohols | 5 |
| Artificial colours, benzoates, trans fats, cured meat, synthetic antioxidants | 10 |
| Caffeine | 12 |

The sidebar toggle only controls whether the rating leads the report — it never turns the check off.

## Profiles

Profiles are records in `localStorage`, not accounts. Passwords are salted and SHA-256 hashed so they are not stored in plain text, but **this is not authentication** — anyone with access to the browser can read the data, and the sign-up dialog says so. Its purpose is separating several people's conditions and history on a shared device.

Storage is namespaced per profile (`ingredient_check_history:u_<id>`), so signing out returns you to the guest scope and deleting a profile removes everything stored under it.

## Tips for better scans

- Crop tight to the ingredients block rather than photographing the whole pack
- Good light, flat surface, no glare from the plastic
- If OCR struggles, use **Paste text instead** — the report is identical

### Sample label text

```
Ingredients: Refined wheat flour (maida), sugar, edible vegetable oil (palm),
invert syrup, sodium metabisulphite, tartrazine, monosodium glutamate, sodium
benzoate, maltodextrin, caffeine, partially hydrogenated vegetable oil, salt.
Nutrition per 100g: Total Sugars 28g, Total Fat 24g, Protein 6g, Sodium 850mg.
```

With **Diabetes Type B** and **Asthma** ticked this returns a *Not recommended for you* verdict, a kids floor of 12 years, and twelve flagged additives.

## Limitations

- OCR accuracy depends on the photo; curved or glossy packaging misreads
- Matching is text-based, so unusual spellings and OCR errors can be missed
- The databases are curated, not exhaustive
- Everything lives in `localStorage` — clearing site data wipes it, and it does not sync between devices
