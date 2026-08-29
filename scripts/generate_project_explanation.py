#!/usr/bin/env python3
"""Build the interview-ready project explanation PDF."""

from pathlib import Path

from reportlab.lib.colors import Color, white
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "Ingredient_Check_Project_Explanation.pdf"

GREEN = Color(0.118, 0.361, 0.318)
GREEN_DARK = Color(0.086, 0.275, 0.239)
INK = Color(0.110, 0.098, 0.086)
INK2 = Color(0.290, 0.271, 0.243)
RULE = Color(0.878, 0.847, 0.800)
CREAM = Color(0.953, 0.933, 0.902)

pdfmetrics.registerFont(TTFont("Georgia", "/System/Library/Fonts/Supplemental/Georgia.ttf"))
pdfmetrics.registerFont(TTFont("Georgia-Bold", "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"))
pdfmetrics.registerFont(TTFont("Arial", "/System/Library/Fonts/Supplemental/Arial.ttf"))
pdfmetrics.registerFont(TTFont("Arial-Bold", "/System/Library/Fonts/Supplemental/Arial Bold.ttf"))
pdfmetrics.registerFont(TTFont("Arial-Italic", "/System/Library/Fonts/Supplemental/Arial Italic.ttf"))


def styles():
    base = getSampleStyleSheet()
    s = {
        "cover_kicker": ParagraphStyle(
            "cover_kicker",
            fontName="Arial-Bold",
            fontSize=9,
            leading=12,
            textColor=GREEN,
            letterSpacing=1.4,
            alignment=TA_LEFT,
            spaceAfter=10,
        ),
        "cover_title": ParagraphStyle(
            "cover_title",
            fontName="Georgia-Bold",
            fontSize=28,
            leading=34,
            textColor=INK,
            spaceAfter=10,
        ),
        "cover_sub": ParagraphStyle(
            "cover_sub",
            fontName="Arial",
            fontSize=12,
            leading=18,
            textColor=INK2,
            spaceAfter=6,
        ),
        "h1": ParagraphStyle(
            "h1",
            fontName="Georgia-Bold",
            fontSize=16,
            leading=21,
            textColor=GREEN_DARK,
            spaceBefore=16,
            spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "h2",
            fontName="Georgia-Bold",
            fontSize=12.5,
            leading=16,
            textColor=INK,
            spaceBefore=12,
            spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "body",
            fontName="Arial",
            fontSize=10,
            leading=14.5,
            textColor=INK,
            alignment=TA_JUSTIFY,
            spaceAfter=8,
        ),
        "bullet": ParagraphStyle(
            "bullet",
            fontName="Arial",
            fontSize=10,
            leading=14,
            textColor=INK,
            leftIndent=4,
        ),
        "caption": ParagraphStyle(
            "caption",
            fontName="Arial-Italic",
            fontSize=8.5,
            leading=12,
            textColor=INK2,
            spaceBefore=2,
            spaceAfter=10,
        ),
        "cell": ParagraphStyle(
            "cell",
            fontName="Arial",
            fontSize=8.5,
            leading=12,
            textColor=INK,
        ),
        "cell_h": ParagraphStyle(
            "cell_h",
            fontName="Arial-Bold",
            fontSize=8.5,
            leading=12,
            textColor=white,
        ),
        "toc": ParagraphStyle(
            "toc",
            fontName="Arial",
            fontSize=10.5,
            leading=18,
            textColor=INK,
        ),
        "footer": ParagraphStyle(
            "footer",
            fontName="Arial",
            fontSize=8,
            leading=10,
            textColor=INK2,
        ),
    }
    return s


def bullets(items, sty):
    return ListFlowable(
        [ListItem(Paragraph(item, sty["bullet"]), leftIndent=12, bulletColor=GREEN) for item in items],
        bulletType="bullet",
        start="bullet",
        leftIndent=16,
        bulletFontName="Arial",
        bulletFontSize=8,
        bulletColor=GREEN,
        spaceAfter=8,
    )


def table(headers, rows, col_widths):
    head = [Paragraph(h, STY["cell_h"]) for h in headers]
    body = [[Paragraph(c, STY["cell"]) for c in row] for row in rows]
    t = Table([head] + body, colWidths=col_widths, repeatRows=1)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), GREEN),
                ("TEXTCOLOR", (0, 0), (-1, 0), white),
                ("BACKGROUND", (0, 1), (-1, -1), CREAM),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("GRID", (0, 0), (-1, -1), 0.4, RULE),
                ("FONTNAME", (0, 0), (-1, 0), "Arial-Bold"),
            ]
        )
    )
    return t


def header_footer(canvas, doc):
    canvas.saveState()
    w, h = A4
    if doc.page > 1:
        canvas.setFillColor(GREEN_DARK)
        canvas.rect(0, h - 12 * mm, w, 12 * mm, fill=1, stroke=0)
        canvas.setFillColor(white)
        canvas.setFont("Arial", 8)
        canvas.drawString(18 * mm, h - 7.5 * mm, "Ingredient Check")
        canvas.drawRightString(w - 18 * mm, h - 7.5 * mm, "Project explanation")
        canvas.setFillColor(INK2)
        canvas.setFont("Arial", 8)
        canvas.drawString(18 * mm, 12 * mm, "Educational reference only  ·  not medical advice")
        canvas.drawRightString(w - 18 * mm, 12 * mm, f"{doc.page}")
        canvas.setStrokeColor(RULE)
        canvas.setLineWidth(0.4)
        canvas.line(18 * mm, 16 * mm, w - 18 * mm, 16 * mm)
    canvas.restoreState()


STY = styles()


def build_story():
    s = STY
    story = []

    story.append(Paragraph("PROJECT EXPLANATION  ·  INTERVIEW BRIEF", s["cover_kicker"]))
    story.append(Paragraph("Ingredient Check", s["cover_title"]))
    story.append(
        Paragraph(
            "A browser-based food-label scanner that reads an ingredients list, "
            "explains the additives it finds, and grades the pack against the "
            "shopper’s health conditions and a child’s age.",
            s["cover_sub"],
        )
    )
    story.append(Spacer(1, 6))
    story.append(
        Paragraph(
            "This document describes the product as built: purpose, scope, architecture, "
            "matching logic, data, privacy model, and known limits. It is written so you "
            "can walk an interviewer through the work without needing the source open.",
            s["body"],
        )
    )

    story.append(Paragraph("Contents", s["h1"]))
    toc = [
        "1. Purpose and the problem it solves",
        "2. What a user actually does",
        "3. Scope: what it is and what it is not",
        "4. Features",
        "5. Architecture and file map",
        "6. Technologies",
        "7. Ingredient matching",
        "8. Condition engine",
        "9. Kids safety",
        "10. OCR and nutrition parsing",
        "11. Reports and PDF export",
        "12. Profiles, storage, and privacy",
        "13. Interface and experience",
        "14. How to run it",
        "15. Outcomes and talking points",
        "16. Limitations and honest answers",
    ]
    for line in toc:
        story.append(Paragraph(line, s["toc"]))

    # 1
    story.append(Paragraph("1. Purpose and the problem it solves", s["h1"]))
    story.append(
        Paragraph(
            "Packaged food in India and elsewhere lists ingredients for regulators, not for "
            "shoppers. Names are split (sugar, invert syrup, liquid glucose), codes appear as "
            "INS 621 or E211, and a “no added sugar” claim can sit above a list of syrups. "
            "People managing diabetes, blood pressure, PCOD, asthma, heart or kidney disease, "
            "or a sensitive gut are told to avoid families of additives, but they cannot "
            "reliably decode a pack in an aisle.",
            s["body"],
        )
    )
    story.append(
        Paragraph(
            "Ingredient Check turns a photo (or a paste) of the ingredients panel into a "
            "plain-language report: which additives are present, why they matter, which of "
            "the user’s selected conditions they clash with, and the youngest age the "
            "product is suitable for a child. It is an educational decision aid, not a "
            "diagnosis and not a substitute for a clinician.",
            s["body"],
        )
    )

    # 2
    story.append(Paragraph("2. What a user actually does", s["h1"]))
    story.append(
        Paragraph(
            "The product is a two-view static site. Hash routing switches between a marketing "
            "home page (<font name='Arial-Bold'>#/</font>) and the scanner (<font name='Arial-Bold'>#/scan</font>).",
            s["body"],
        )
    )
    story.append(
        Paragraph(
            "On the scan screen the flow is deliberately linear:",
            s["body"],
        )
    )
    story.append(
        bullets(
            [
                "<b>My conditions</b> — a native multi-select of nine health conditions. Several can be ticked at once.",
                "<b>Is this for a child?</b> — optional. Kids safety already runs on every scan; the checkbox only leads the report with the age rating.",
                "<b>Drop the label</b> — photograph the ingredients list, or type/paste the text if OCR will struggle.",
                "<b>Create a full report</b> — a photo starts analysis as soon as it is added; the button is for pasted text or a refresh after changing conditions.",
                "<b>Download PDF</b> — a keepable copy of the same verdict, findings, and condition notes.",
            ],
            s,
        )
    )
    story.append(
        Paragraph(
            "History lives in a side drawer. Opening an old scan rebuilds the report from the stored extracted text, so conditions can be changed later and the same label re-graded.",
            s["body"],
        )
    )

    # 3
    story.append(Paragraph("3. Scope: what it is and what it is not", s["h1"]))
    story.append(Paragraph("In scope", s["h2"]))
    story.append(
        bullets(
            [
                "Packaged grocery labels: biscuits, namkeen, chips, drinks, sauces, instant mixes.",
                "Text matching of common additive names, Indian INS numbers, EU E-numbers, and everyday grocery staples (maida, palmolein, jaggery, vanaspati, edible common salt).",
                "Nine selectable adult conditions plus a always-on kids age floor.",
                "On-device OCR, local history, and optional local profiles for a shared computer.",
            ],
            s,
        )
    )
    story.append(Paragraph("Out of scope", s["h2"]))
    story.append(
        bullets(
            [
                "It is not medical advice, not a clinical guideline, and not 100% accurate in a medical sense. Risk depends on amount, frequency, and the person.",
                "It does not contact a backend, does not upload photos, and does not sync across devices.",
                "It does not claim to list every additive in existence. The databases are curated.",
                "It does not replace a dietitian’s advice for renal protein, potassium from whole foods, or insulin dosing.",
            ],
            s,
        )
    )

    # 4
    story.append(Paragraph("4. Features", s["h1"]))
    story.append(
        table(
            ["Feature", "What the user gets"],
            [
                [
                    "Label reading",
                    "Tesseract.js OCR on a contrast-boosted photo, or paste the ingredients text. Both paths produce the same report.",
                ],
                [
                    "Additive findings",
                    "Each match has a display name, severity (high / moderate / low), what it does in food, and associated risks if eaten often.",
                ],
                [
                    "Condition grading",
                    "Avoid vs limit groups, the exact term that hit, and a short why. Verdict is “not recommended” if any avoid group fires.",
                ],
                [
                    "Kids safety",
                    "Every scan gets a minimum age from the strictest matching rule (honey under 1, caffeine under 12, and so on).",
                ],
                [
                    "Nutrition flags",
                    "Sugar, fat, protein, and sodium parsed from the panel and compared with per-condition limits (e.g. high-salt at 0.6 g sodium / 100 g).",
                ],
                [
                    "Product swaps",
                    "If the extracted text names a known product (Lay’s, Maggi, Kurkure, cola, biscuits, namkeen, energy drinks), simpler alternatives are suggested.",
                ],
                [
                    "PDF report",
                    "jsPDF builds an A4 file from the current verdict, findings, conditions, kids rating, and extracted text.",
                ],
                [
                    "History and profiles",
                    "Up to 24 scans per profile in localStorage. Guest vs signed-in scopes do not mix.",
                ],
            ],
            [42 * mm, 130 * mm],
        )
    )
    story.append(Paragraph("Feature map as implemented in the current build.", s["caption"]))

    # 5
    story.append(Paragraph("5. Architecture and file map", s["h1"]))
    story.append(
        Paragraph(
            "There is no build step and no framework. Five JavaScript files load as classic scripts and share globals. Data files never touch the DOM; <font name='Arial-Bold'>app.js</font> is the only UI layer.",
            s["body"],
        )
    )
    story.append(
        table(
            ["File", "Responsibility"],
            [
                [
                    "index.html",
                    "Home page, scanner, history drawer, profile and sign-in modals. Scripts load: ingredient-database, condition-database, profile, app, then Tesseract and jsPDF from a CDN (deferred).",
                ],
                [
                    "styles.css",
                    "Visual system: paper cream ground, Fraunces for display type, Source Sans 3 for UI, forest green #1e5c51.",
                ],
                [
                    "ingredient-database.js",
                    "INGREDIENT_DB (canonical additives and grocery staples with aliases, severity, risks) and PRODUCT_ALTERNATIVES (name-based swaps).",
                ],
                [
                    "condition-database.js",
                    "CONDITION_LIBRARY, KIDS_SAFETY_RULES, shared term lists, and the matching engine (normalise, collapse INS/E codes, longest-match, negations, safe-context skips).",
                ],
                [
                    "profile.js",
                    "Local profiles: salted password hash, session id, Auth.scope() used to namespace storage.",
                ],
                [
                    "app.js",
                    "Routing, OCR pipeline, findIngredients, report HTML, PDF download, history, condition dropdown.",
                ],
                [
                    "serve.py",
                    "Threaded HTTP server on 127.0.0.1 with Cache-Control: no-store so reloads pick up edits. Default port 8765.",
                ],
            ],
            [42 * mm, 130 * mm],
        )
    )
    story.append(
        Paragraph(
            "Load order matters: databases and Auth must exist before app.js runs. CDN libraries are deferred so a blocked network does not prevent the paste-text path from working.",
            s["body"],
        )
    )

    # 6
    story.append(Paragraph("6. Technologies", s["h1"]))
    story.append(
        bullets(
            [
                "<b>HTML, CSS, vanilla JavaScript</b> — no React, no bundler, no package.json. Easy to explain and to run.",
                "<b>Tesseract.js 5</b> (jsDelivr) — client-side OCR, English traineddata, runs in the browser.",
                "<b>jsPDF 2.5.1</b> — client-side PDF of the current report.",
                "<b>localStorage</b> — conditions, history, and profiles, namespaced per Auth.scope().",
                "<b>Web Crypto</b> — SHA-256 of salt + password when crypto.subtle is available (HTTPS or localhost). Fallback hash on plain http:// file origins.",
                "<b>Canvas / createImageBitmap</b> — upscale and contrast-boost the photo before OCR.",
                "<b>Python 3 http.server</b> (custom threaded, no-cache handler) — local development; camera capture needs localhost or HTTPS.",
                "<b>Google Fonts</b> — Fraunces and Source Sans 3. The app still works if fonts fail to load.",
            ],
            s,
        )
    )
    story.append(
        Paragraph(
            "If an interviewer asks “why no backend?”: the photos never need to leave the device, there is no user account server, and the matching data is small enough to ship as JS. The trade-off is no cross-device sync and a database that updates only when the files do.",
            s["body"],
        )
    )

    # 7
    story.append(Paragraph("7. Ingredient matching", s["h1"]))
    story.append(
        Paragraph(
            "findIngredients() in app.js is the general additive finder. It is separate from the condition engine so a guest with no conditions still sees what is in the pack.",
            s["body"],
        )
    )
    story.append(Paragraph("Pipeline", s["h2"]))
    story.append(
        bullets(
            [
                "Prefer the ingredients block if OCR captured the whole reverse of the pack (cut at “Nutritional Information”, “Manufactured by”, FSSAI licence, and similar).",
                "enhanceOcrText() folds INS 621 / E-621 / OCR “lNS” into e621, and repairs common misreads (malda → maida, tartrazin, vanaspati, carageenan).",
                "Each INGREDIENT_DB item tries aliases longest-first. Short codes (msg, e102, bha) use word-boundary regex so they do not match inside longer words.",
                "Overlapping spans: the longer match wins, so “high fructose corn syrup” does not also report “corn syrup”.",
                "Bare “sugar” is handled with a word-boundary helper that ignores “sugar-free” and nutrition-table “of which sugars”.",
            ],
            s,
        )
    )
    story.append(Paragraph("What the database contains", s["h2"]))
    story.append(
        Paragraph(
            "About 61 canonical entries covering sweeteners, preservatives, colours, fats, flavour enhancers, emulsifiers, phosphates, grocery staples (maida, salt, lecithin, milk solids, sorbitol), and a handful of higher-concern additives (titanium dioxide, brominated vegetable oil, potassium bromate). Each entry has aliases, a category, severity, a short note, risk bullets, and a “watch for” line. Product swaps are a second list keyed by brand/product aliases (Lay’s Magic Masala, Maggi, Kurkure, Coca-Cola, biscuits, namkeen, energy drinks).",
            s["body"],
        )
    )

    # 8
    story.append(Paragraph("8. Condition engine", s["h1"]))
    story.append(
        Paragraph(
            "condition-database.js owns both the data and the matcher. evaluateConditions(labelText, ids) returns only conditions that actually hit, sorted with “avoid” verdicts first.",
            s["body"],
        )
    )
    story.append(
        Paragraph(
            "Shared term arrays (sugars, refined starches, trans fats, sodium, flavour enhancers, sulphites, benzoates, polyols, phosphates, and so on) are reused across conditions so the same pack wording is not maintained in nine places. Each group has a level of <b>avoid</b> or <b>limit</b>, a title, a why, and optional negations.",
            s["body"],
        )
    )
    story.append(
        table(
            ["Condition", "Avoid (typical)", "Limit (typical)"],
            [
                [
                    "Diabetes Type A",
                    "Added sugars and syrups; trans / hydrogenated fats",
                    "Artificial sweeteners",
                ],
                [
                    "Diabetes Type B",
                    "Those sugars plus maida, maltodextrin, modified starch; trans fats",
                    "Artificial sweeteners",
                ],
                [
                    "High BP",
                    "Salt, soy sauce, MSG, cured-meat nitrites, liquorice",
                    "Baking powder and other sodium additives, caffeine",
                ],
                [
                    "Low BP",
                    "Alcohol, diuretic extracts",
                    "Large refined-carb loads, heavy caffeine. Salt is not flagged.",
                ],
                [
                    "Heart disease",
                    "Trans fats, salt, MSG, nitrite-cured meats",
                    "Palmolein / coconut / ghee, added sugars, caffeine",
                ],
                [
                    "Kidney disease",
                    "Added phosphates (INS 338–452), salt, MSG, potassium chloride / low-sodium salt, aluminium anti-caking agents",
                    "Cured meats, caffeine",
                ],
                [
                    "PCOD",
                    "Sugars, maida, trans fats",
                    "Palmolein (not treated as trans fat), colours, MSG, caffeine",
                ],
                [
                    "Asthma",
                    "Sulphites, azo dyes (tartrazine, sunset yellow), benzoates",
                    "MSG, TBHQ/BHA, unnamed “class II preservative”, carmine / annatto",
                ],
                [
                    "Sensitive gut",
                    "Carrageenan, polysorbates, polyols",
                    "Inulin / FOS, onion and garlic powder, milk solids. Soya lecithin is not treated as a gut-avoid emulsifier.",
                ],
            ],
            [32 * mm, 70 * mm, 70 * mm],
        )
    )
    story.append(Paragraph("Condition groups as implemented. Wording on the pack is matched, not clinical staging of the disease.", s["caption"]))

    story.append(Paragraph("Matching details worth defending in an interview", s["h2"]))
    story.append(
        bullets(
            [
                "<b>Longest term wins</b> inside a group, so nested names do not double-count.",
                "<b>INS / E collapse</b> — “INS 621”, “E-621”, and OCR “lNS 621” all become e621 before matching.",
                "<b>Negations</b> — “no added sugar”, “sugar-free”, “low salt” prefixes do not fire the sugar or salt groups.",
                "<b>Safe context</b> — “whole wheat flour” is not maida; “non-hydrogenated” is not trans fat; “wine vinegar” is not alcohol; “peanut butter” is not dairy butter; “cream of tartar” is not cream.",
                "<b>Ingredients vs nutrition table</b> — if both are in the OCR dump, matching uses the ingredients list so “of which sugars 1.2 g” does not flag diabetes on a whole-wheat loaf.",
                "<b>Low BP inverts high BP</b> — sodium warnings are omitted and the report states that explicitly.",
                "<b>Palmolein vs trans fat</b> — palmolein is a saturated tropical oil (heart/PCOD limit), not hydrogenated fat.",
            ],
            s,
        )
    )

    # 9
    story.append(Paragraph("9. Kids safety", s["h1"]))
    story.append(
        Paragraph(
            "KIDS_SAFETY_RULES runs on every scan, whether or not the pack is marketed to children. Each rule has a minAge and severity. The product floor is the maximum minAge among hits. Copy such as “for kids” or “tiffin” only changes whether the UI treats it as a children’s product; it does not turn the rules off.",
            s["body"],
        )
    )
    story.append(
        table(
            ["Floor", "Triggered by"],
            [
                ["Under 1", "Honey (infant botulism risk)"],
                ["Under 5", "Added sugar, artificial sweeteners, high-sodium additives, sugar alcohols (polyols)"],
                ["Under 10", "Artificial colours, benzoates, trans fats, nitrite-cured meat, synthetic antioxidants (BHA, TBHQ)"],
                ["Under 12", "Caffeine (coffee extract, guarana, energy blends — not cocoa solids on a biscuit)"],
            ],
            [32 * mm, 140 * mm],
        )
    )
    story.append(Paragraph("Age floors. The on-screen rating uses the strictest match.", s["caption"]))

    # 10
    story.append(Paragraph("10. OCR and nutrition parsing", s["h1"]))
    story.append(Paragraph("Photo path", s["h2"]))
    story.append(
        bullets(
            [
                "User drops or chooses an image (camera capture is offered on phones).",
                "prepareImageForOcr() scales up to about 2000 px on the long side and boosts contrast (darken below a grey threshold, lift highlights) so small pack print is easier for Tesseract.",
                "Tesseract.recognize(blob, \"eng\") returns text. Progress is shown as a percentage.",
                "If the library failed to load, the UI asks the user to type the ingredients instead — same matcher.",
            ],
            s,
        )
    )
    story.append(Paragraph("Nutrition", s["h2"]))
    story.append(
        Paragraph(
            "parseNutritionText() looks for sugar, fat, protein, and sodium (mg converted to grams). Salt grams are converted to sodium by dividing by 2.5 when sodium is missing. Per-condition nutrition[] limits then flag “high for heart disease” and similar. Interviewers sometimes ask if we trust the panel over the ingredients list: ingredients drive additive matching; the panel only adds quantitative flags when numbers are present.",
            s["body"],
        )
    )

    # 11
    story.append(Paragraph("11. Reports and PDF export", s["h1"]))
    story.append(
        Paragraph(
            "displayFindings() builds the on-screen report: a verdict, counts of high/moderate/low findings, per-condition avoid/limit groups with the terms found, kids rating, nutrition, additive cards, optional swaps, the extracted text in a disclosure, and Download PDF.",
            s["body"],
        )
    )
    story.append(
        Paragraph(
            "Verdict logic: if any selected condition has an avoid-level hit, the headline is “Not recommended for you” and lists those conditions. If only limit-level hits, the tone is caution. If nothing matches the selected conditions, the report still shows general additive findings.",
            s["body"],
        )
    )
    story.append(
        Paragraph(
            "jsPDF writes an A4 document from lastReport (verdict, findings, condition groups, kids, nutrition, extracted text). If the CDN script did not load, the user is told to check the connection rather than failing silently.",
            s["body"],
        )
    )

    # 12
    story.append(Paragraph("12. Profiles, storage, and privacy", s["h1"]))
    story.append(
        Paragraph(
            "There is no server-side account. A “profile” is a localStorage record so two people on one laptop do not share conditions and history. The UI is explicit that this is not real authentication: anyone with the browser can read the data.",
            s["body"],
        )
    )
    story.append(
        bullets(
            [
                "Users key: ingredient_check_users — id, name, email, salt, hash, createdAt.",
                "Session: ingredient_check_session — the current user id, or guest.",
                "Scoped keys: ingredient_check_conditions:u_<id>, ingredient_check_history:u_<id>, and the guest equivalents.",
                "Passwords: 16-byte salt + SHA-256 when SubtleCrypto exists; a weaker local hash if the page is opened as a file on http that is not localhost.",
                "History cap: 24 scans. Extracted text is truncated when stored.",
                "Photos are never stored; they exist only as a blob URL for preview and OCR, then are discarded.",
                "Deleting a profile removes that user’s stored records. Clearing site data wipes everything.",
            ],
            s,
        )
    )
    story.append(
        Paragraph(
            "If asked “is this GDPR / production-ready auth?”: no. It is a convenience namespace on a trusted device. Production would need a real backend, proper password hashing (Argon2/bcrypt on a server), and a privacy policy. That honesty is better in an interview than overselling localStorage.",
            s["body"],
        )
    )

    # 13
    story.append(Paragraph("13. Interface and experience", s["h1"]))
    story.append(
        Paragraph(
            "The visual system is editorial rather than generic SaaS: warm paper background, serif headlines, forest green, hairline rules instead of heavy card shadows. The scan screen is a four-step worksheet. The conditions control is a native <font name='Arial-Bold'>&lt;details&gt;</font> / <font name='Arial-Bold'>&lt;summary&gt;</font> menu so it opens even if JavaScript on the page is delayed. Checkboxes are also in the HTML as a fallback before app.js re-renders them from CONDITION_LIBRARY.",
            s["body"],
        )
    )
    story.append(
        Paragraph(
            "Responsive behaviour: at about 720 px the history tab becomes a bottom-right chip; nav section links hide on very small screens; the hero stacks. Camera capture is offered via the file input’s capture attribute on phones.",
            s["body"],
        )
    )

    # 14
    story.append(Paragraph("14. How to run it", s["h1"]))
    story.append(
        Paragraph(
            "From the project folder:",
            s["body"],
        )
    )
    story.append(
        Paragraph(
            "<font name='Arial-Bold'>python3 serve.py 8765</font>  then open  <font name='Arial-Bold'>http://127.0.0.1:8765/</font>",
            s["body"],
        )
    )
    story.append(
        Paragraph(
            "Opening index.html as a file works for paste-text, but the camera and some crypto APIs expect localhost or HTTPS. The custom server is threaded and sends no-store cache headers so CSS and JS edits appear on a normal reload.",
            s["body"],
        )
    )
    story.append(
        Paragraph(
            "Best scan results: crop to the ingredients list, even light, no plastic glare. If OCR is messy, paste the list — the report path is identical.",
            s["body"],
        )
    )

    # 15
    story.append(Paragraph("15. Outcomes and talking points", s["h1"]))
    story.append(
        Paragraph(
            "What you can claim, precisely:",
            s["body"],
        )
    )
    story.append(
        bullets(
            [
                "An end-to-end product: capture → OCR → domain matching → personalised report → PDF, with no backend.",
                "Domain modelling: nine conditions as data, not hard-coded if/else per disease, so adding a condition is a data change.",
                "Practical NLP-lite on dirty OCR: code collapsing, negation, longest-match, and Indian pack vocabulary (maida, palmolein, vanaspati, INS numbers).",
                "Product judgement: educational disclaimer, kids rules always on, low BP not inheriting salt warnings, palmolein not labelled as trans fat.",
                "Privacy stance: photos stay on device; storage is local and scoped.",
                "Front-end craft: routing, empty/error/OCR-failure states, history replay, accessible native controls.",
            ],
            s,
        )
    )
    story.append(Paragraph("Sample walkthrough for a demo", s["h2"]))
    story.append(
        Paragraph(
            "Tick Diabetes Type B and Asthma. Paste: refined wheat flour (maida), sugar, palmolein, invert syrup, sodium metabisulphite, tartrazine, MSG, sodium benzoate, maltodextrin, salt. Expect a “not recommended” verdict for both conditions, maida and sugars on Type B, sulphites/dye/benzoate on asthma, and a kids floor driven by colours (10+) or caffeine if present (12+).",
            s["body"],
        )
    )

    # 16
    story.append(Paragraph("16. Limitations and honest answers", s["h1"]))
    story.append(
        table(
            ["Likely question", "Straight answer"],
            [
                [
                    "Is the report 100% accurate?",
                    "No. It is as accurate as the photo, the OCR, and a curated term list. Unusual spellings and unnamed “class II preservative” without a number are ambiguous. It is educational, not a lab assay.",
                ],
                [
                    "Why vanilla JS?",
                    "The app is a few screens and static data. A framework would add a build step without helping OCR or matching. The matching engine is easier to test as plain functions.",
                ],
                [
                    "How do you test matching?",
                    "The matchers are pure functions on strings. Fixtures include biscuits, chips, cola, sugar-free polyol packs, whole-wheat bread, wine vinegar, and nutrition-table traps.",
                ],
                [
                    "Security of profiles?",
                    "Local convenience only. Hashes are not a substitute for server-side auth. XSS on the origin could read localStorage.",
                ],
                [
                    "What would you build next?",
                    "A maintained additive taxonomy, better OCR (region detect the ingredients block), i18n for Hindi packs, and an optional signed-in cloud backup — with a real privacy design.",
                ],
                [
                    "Why Tesseract in the browser?",
                    "Keeps photos on the device and works offline after the first script load. Quality is weaker than a cloud vision API on curved glossy packs; that is why paste exists.",
                ],
            ],
            [48 * mm, 124 * mm],
        )
    )

    story.append(Paragraph("Closing summary", s["h1"]))
    story.append(
        Paragraph(
            "Ingredient Check is a complete, client-side product that reads a grocery label and explains it in the language of the shopper’s conditions and of kids’ safety. The interesting engineering is not the framework choice; it is the matching layer on messy real-world pack text, the separation of data from UI, and the decision to keep personal health context on the device. Treat the output as a well-informed second look at the back of the pack, then defer to a clinician for anything that changes treatment.",
            s["body"],
        )
    )
    story.append(Spacer(1, 8))
    story.append(
        Paragraph(
            "Document generated from the Ingredient Check codebase. Educational information only.",
            s["caption"],
        )
    )
    return story


def main():
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
        title="Ingredient Check — Project Explanation",
        author="Ingredient Check",
        subject="Interview-ready explanation of the Ingredient Check web app",
    )
    doc.build(build_story(), onFirstPage=header_footer, onLaterPages=header_footer)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
