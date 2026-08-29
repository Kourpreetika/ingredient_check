# Ingredient_Check

Photograph the ingredients panel on a packaged food and get back a plain-language report: which additives are in it, what each one does, which of them clash with your health conditions, and the youngest age the product is suitable for.

Runs in the browser — no build step. Label photos are read on the device. Accounts, conditions and scan history for signed-in users live in a Supabase Postgres database.

> **Educational information only — not medical advice.** Risk depends on quantity, frequency and your own health. An ingredient not being flagged does not mean it is absent or safe. Follow your clinician's guidance over anything here.

## What it does

- **Reads the label** — OCR ([Tesseract.js](https://tesseract.projectnaptha.com/)) pulls the ingredients and nutrition text out of a photo, on your device. Paste the text instead if the print is too small.
- **Explains the risk** — every finding carries a severity, what it does in food, and what regular consumption is associated with.
- **Matches your conditions** — seven avoid lists, each group carrying the reason it is on the list and the exact term that triggered it.
- **Grades every product for children** — not a blanket warning: the additives found set a minimum age, and each one explains itself.
- **Suggests swaps** — name a product and get alternatives for the same craving.
- **Keeps history per profile** — a side drawer of past scans, tap any one to reopen the report.
- **Persistent accounts** — sign up with email; the session stays on this device, and your conditions and history follow you on the next one.

## Running it

Serve the folder (camera capture needs `localhost` or HTTPS):

```bash
python3 serve.py 8765
```

Then visit `http://127.0.0.1:8765/`. Guest scanning works with no further setup. Sign-in needs the Supabase steps below.

## Project structure

```
ingredient_check/
├── index.html                 # Landing page + scanner, history drawer, profile modals
├── styles.css                 # Visual system
├── supabase-config.js         # Project URL + anon key (fill these in)
├── supabase-config.example.js # Copy of the config file with placeholders
├── supabase/schema.sql        # Postgres tables, RLS, signup trigger
├── ingredient-database.js     # The additive reference + product swap suggestions
├── condition-database.js      # Per-condition avoid lists, kids rules, matching engine
├── profile.js                 # Supabase Auth + account data sync
├── app.js                     # UI flow, OCR, report rendering, history
└── img1.png … img5.png        # Reference imagery
```

Scripts load in that order — the data files declare globals that `app.js` consumes.

## Accounts (Supabase)

Guest mode still stores scans in this browser only. A signed-in account is a real user in `auth.users`, with two public tables behind row-level security:

| Table | What it holds |
| --- | --- |
| `profiles` | Display name, created time (`id` = `auth.users.id`) |
| `user_data` | Conditions, kids-product flag, last 24 scans (JSON) |

The browser never sees a password hash. Supabase Auth issues an access token and a refresh token; `profile.js` keeps that session in `localStorage` (`ingredient_check_supabase_auth`) and refreshes it, so closing the tab does not sign you out.

### One-time setup

1. Create a project at [supabase.com](https://supabase.com).
2. **Authentication → Providers → Email**: leave email/password on. For local testing, turn **Confirm email** off so sign-up signs you in immediately. If you leave confirmation on, the app asks the user to check their inbox, then sign in.
3. **Authentication → URL Configuration**: set Site URL to `http://127.0.0.1:8765` and add the same origin under Redirect URLs. Add your production origin when you deploy.
4. **Project Settings → API**: copy **Project URL** and **anon public** key into `supabase-config.js`.
5. **SQL Editor**: paste and run `supabase/schema.sql`. That creates the tables, RLS policies, a trigger that inserts `profiles` + `user_data` on signup, and `delete_own_account()` so a user can remove themselves.

The anon key is meant to ship in the client. RLS is what stops one account from reading another: every policy is `auth.uid() = id` (or `user_id`). Do not put the **service_role** key in this repo.

Until `supabase-config.js` has real values, **Create a profile** / **Sign in** explain that the database is not connected yet. Scanning as a guest still works.

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

Signed-in users are scoped by their Supabase user id (`ingredient_check_history:u_<uuid>` locally, plus a row in `user_data`). Signing out returns you to the guest scope. Deleting a profile calls `delete_own_account()`, which removes the auth user; `profiles` and `user_data` cascade with it.

Guest data never uploads. Signing in does not merge guest scans into the account.

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
- Guest scans live in `localStorage` — clearing site data wipes them, and they do not sync
- Signed-in history syncs through Supabase; label photos are never uploaded
