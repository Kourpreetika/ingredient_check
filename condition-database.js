/*
 * condition-database.js
 *
 * The additive lists this app checks a label against.
 *
 * Two datasets live here:
 *   CONDITION_LIBRARY  — per health condition, the ingredients / preservatives /
 *                        colours commonly found in packaged groceries that people
 *                        with that condition are usually told to avoid or limit.
 *   KIDS_SAFETY_RULES  — additive groups with an age threshold, used to grade
 *                        every scanned product for children.
 *
 * Terms are written the way they actually appear on packs (including Indian INS
 * codes and British spellings), because that is what OCR pulls off a label.
 *
 * Educational reference only. Not a clinical guideline.
 */

/* Shared term lists — several conditions warn about the same families. */
const ADDED_SUGAR_TERMS = [
  "sugar", "sucrose", "cane sugar", "brown sugar", "caster sugar", "icing sugar",
  "demerara", "muscovado", "invert sugar", "invert syrup", "golden syrup",
  "glucose syrup", "liquid glucose", "glucose solids", "glucose-fructose syrup",
  "corn syrup", "corn syrup solids", "high fructose corn syrup", "hfcs",
  "fructose", "crystalline fructose", "dextrose", "maltose", "malt extract",
  "malt syrup", "barley malt", "rice syrup", "brown rice syrup", "tapioca syrup",
  "molasses", "treacle", "honey", "jaggery", "palm sugar", "coconut sugar",
  "date syrup", "agave syrup", "agave nectar", "fruit juice concentrate",
  "sweetened condensed milk", "condensed milk", "sugar syrup", "caramel syrup",
];

const SUGAR_NEGATIONS = [
  "sugar free", "sugar-free", "no added sugar", "no added sugars", "zero sugar",
  "without added sugar", "unsweetened", "sugarless", "reduced sugar",
];

const REFINED_STARCH_TERMS = [
  "maltodextrin", "modified starch", "modified corn starch", "modified maize starch",
  "modified tapioca starch", "dextrin", "resistant dextrin", "refined wheat flour",
  "maida", "white flour", "rice flour", "corn starch", "maize starch",
  "potato starch", "tapioca starch",
];

const TRANS_FAT_TERMS = [
  "hydrogenated", "partially hydrogenated", "hydrogenated vegetable oil",
  "hydrogenated palm oil", "vanaspati", "dalda", "shortening", "margarine",
  "interesterified fat", "interesterified vegetable fat", "trans fat",
];

const SODIUM_TERMS = [
  "salt", "iodised salt", "iodized salt", "table salt", "sea salt", "rock salt",
  "sodium chloride", "brine", "celery salt", "garlic salt", "onion salt",
  "soy sauce", "sodium bicarbonate", "baking soda", "sodium carbonate", "e500",
  "sodium citrate", "e331", "sodium lactate", "e325", "sodium diacetate",
];

const FLAVOUR_ENHANCER_TERMS = [
  "monosodium glutamate", "msg", "e621", "disodium inosinate", "e631",
  "disodium guanylate", "e627", "disodium ribonucleotides", "e635",
  "hydrolysed vegetable protein", "hydrolyzed vegetable protein", "hvp",
  "yeast extract", "autolysed yeast", "autolyzed yeast extract", "flavour enhancer",
  "flavor enhancer",
];

const CURED_MEAT_TERMS = [
  "sodium nitrite", "e250", "sodium nitrate", "e251", "potassium nitrate", "e252",
  "potassium nitrite", "e249", "curing salt", "saltpetre",
];

const SYNTHETIC_COLOUR_TERMS = [
  "tartrazine", "e102", "yellow 5", "quinoline yellow", "e104", "sunset yellow",
  "e110", "yellow 6", "carmoisine", "azorubine", "e122", "amaranth", "e123",
  "ponceau", "e124", "erythrosine", "e127", "allura red", "e129", "red 40",
  "patent blue", "e131", "indigo carmine", "e132", "brilliant blue", "e133",
  "blue 1", "green s", "e142", "fast green", "e143", "brilliant black", "e151",
  "artificial colour", "artificial color", "synthetic food colour",
];

const BENZOATE_TERMS = [
  "benzoic acid", "e210", "sodium benzoate", "e211", "potassium benzoate", "e212",
  "calcium benzoate", "e213", "methylparaben", "e218", "propylparaben", "e216",
];

const SULPHITE_TERMS = [
  "sulphur dioxide", "sulfur dioxide", "e220", "sodium sulphite", "sodium sulfite",
  "e221", "sodium bisulphite", "sodium bisulfite", "e222", "sodium metabisulphite",
  "sodium metabisulfite", "e223", "potassium metabisulphite", "e224",
  "calcium sulphite", "e226", "calcium bisulphite", "e227",
  "potassium bisulphite", "e228", "sulphites", "sulfites", "sulphiting agent",
];

const SYNTHETIC_ANTIOXIDANT_TERMS = [
  "tbhq", "tertiary butylhydroquinone", "e319", "bha", "butylated hydroxyanisole",
  "e320", "bht", "butylated hydroxytoluene", "e321", "propyl gallate", "e310",
  "octyl gallate", "e311", "dodecyl gallate", "e312",
];

const ARTIFICIAL_SWEETENER_TERMS = [
  "aspartame", "e951", "sucralose", "e955", "acesulfame", "acesulfame potassium",
  "acesulfame k", "e950", "saccharin", "e954", "neotame", "e961", "cyclamate",
  "e952", "advantame",
];

const CAFFEINE_TERMS = [
  "caffeine", "guarana", "coffee extract", "green coffee extract", "kola nut",
  "energy blend", "cocoa solids",
];

const PHOSPHATE_TERMS = [
  "phosphoric acid", "e338", "sodium phosphate", "monosodium phosphate",
  "disodium phosphate", "trisodium phosphate", "e339", "potassium phosphate",
  "e340", "calcium phosphate", "e341", "diphosphates", "e450",
  "sodium acid pyrophosphate", "tetrasodium pyrophosphate",
  "sodium tripolyphosphate", "triphosphates", "e451", "polyphosphates", "e452",
  "sodium aluminium phosphate", "added phosphate",
];

const POLYOL_TERMS = [
  "sorbitol", "e420", "mannitol", "e421", "isomalt", "e953", "maltitol", "e965",
  "lactitol", "e966", "xylitol", "e967", "erythritol", "e968", "polyols",
  "sugar alcohol", "hydrogenated glucose syrup",
];

const EMULSIFIER_TERMS = [
  "carrageenan", "e407", "polysorbate 80", "e433", "polysorbate 60", "e435",
  "polysorbate 65", "e436", "carboxymethylcellulose", "carboxymethyl cellulose",
  "cellulose gum", "cmc", "e466", "guar gum", "e412", "xanthan gum", "e415",
  "locust bean gum", "e410", "sodium stearoyl lactylate", "e481",
  "mono and diglycerides", "e471",
];

/**
 * Per-condition avoid lists.
 *
 * level: "avoid" = usually advised against outright
 *        "limit" = occasional amounts are generally tolerated
 */
const CONDITION_LIBRARY = [
  {
    id: "diabetes",
    label: "Diabetes",
    aka: "Type 1, type 2, prediabetes",
    focus: "Sugars and refined starches that move blood glucose fast.",
    groups: [
      {
        id: "diabetes-sugars",
        title: "Added sugars & syrups",
        level: "avoid",
        why: "These are absorbed within minutes and push blood glucose up sharply. On an ingredients list they are often split across three or four names so no single one appears near the top.",
        terms: ADDED_SUGAR_TERMS,
        negations: SUGAR_NEGATIONS,
      },
      {
        id: "diabetes-starch",
        title: "Fast-digesting starches",
        level: "avoid",
        why: "They do not taste sweet, but they break down into glucose as fast as table sugar — maltodextrin actually has a higher glycaemic index than sucrose.",
        terms: REFINED_STARCH_TERMS,
      },
      {
        id: "diabetes-fat",
        title: "Trans & hydrogenated fats",
        level: "avoid",
        why: "They worsen insulin resistance and add to the cardiovascular risk that already runs higher with diabetes.",
        terms: TRANS_FAT_TERMS,
      },
      {
        id: "diabetes-sweeteners",
        title: "Artificial sweeteners",
        level: "limit",
        why: "They do not raise glucose directly, but they keep the taste for sweetness going and almost always sit in a heavily processed product.",
        terms: ARTIFICIAL_SWEETENER_TERMS,
      },
    ],
    nutrition: [
      { key: "sugar", limit: 10, unit: "g", why: "More than about 10g of sugar per 100g makes this a high-sugar product." },
    ],
    guidance: "Check the order of the ingredients list — sugars in the first three positions mean the product is mostly sugar by weight.",
  },

  {
    id: "hypertension",
    label: "High blood pressure",
    aka: "Hypertension",
    focus: "Sodium in all its forms, plus liquorice.",
    groups: [
      {
        id: "bp-sodium",
        title: "Salt & sodium compounds",
        level: "avoid",
        why: "Sodium holds water in the bloodstream, which raises the volume the heart has to push against. Most dietary sodium comes from packaged food, not the salt shaker.",
        terms: SODIUM_TERMS,
      },
      {
        id: "bp-enhancers",
        title: "Flavour enhancers (hidden sodium)",
        level: "avoid",
        why: "Every one of these is a sodium salt. They do not taste salty, so a product can carry a large sodium load without tasting like it.",
        terms: FLAVOUR_ENHANCER_TERMS,
      },
      {
        id: "bp-cured",
        title: "Cured-meat preservatives",
        level: "avoid",
        why: "Nitrite curing goes hand in hand with very high salt levels, and cured meats are consistently linked to raised blood pressure.",
        terms: CURED_MEAT_TERMS,
      },
      {
        id: "bp-liquorice",
        title: "Liquorice & glycyrrhizin",
        level: "avoid",
        why: "Glycyrrhizin causes the body to hold sodium and lose potassium. It is a documented cause of raised blood pressure, and it hides in sweets, herbal teas and digestive mixes.",
        terms: ["liquorice", "licorice", "glycyrrhizin", "glycyrrhizic acid", "mulethi", "yashtimadhu"],
      },
      {
        id: "bp-sodium-preservatives",
        title: "Sodium-based preservatives",
        level: "limit",
        why: "Each adds a little more sodium. Individually small, they add up across a day of packaged food.",
        terms: ["sodium benzoate", "e211", "sodium metabisulphite", "e223", "sodium propionate", "e281", "sodium erythorbate", "e316", "sodium nitrite", "sodium sorbate"],
      },
      {
        id: "bp-caffeine",
        title: "Caffeine loads",
        level: "limit",
        why: "Caffeine causes a short, sharp rise in blood pressure — it matters most in energy drinks where the dose is large.",
        terms: CAFFEINE_TERMS,
      },
    ],
    nutrition: [
      { key: "sodium", limit: 0.6, unit: "g", why: "Above roughly 0.6g sodium (1.5g salt) per 100g counts as a high-salt food." },
    ],
    guidance: "Labels list sodium, not salt. Multiply sodium by 2.5 to get the salt figure.",
  },

  {
    id: "hypotension",
    label: "Low blood pressure",
    aka: "Hypotension",
    focus: "Alcohol, diuretics and big refined-carb loads.",
    inverts: "hypertension",
    note: "Salt warnings written for high blood pressure do not apply to you. With hypotension most clinicians advise keeping fluids and salt up rather than cutting them — so this scan does not flag sodium for you.",
    groups: [
      {
        id: "lowbp-alcohol",
        title: "Alcohol",
        level: "avoid",
        why: "It widens blood vessels and dehydrates at the same time, which can drop pressure further and bring on dizziness or fainting.",
        terms: ["alcohol", "ethyl alcohol", "ethanol", "rum", "brandy", "liqueur", "wine", "beer", "rectified spirit"],
      },
      {
        id: "lowbp-diuretic",
        title: "Diuretic & pressure-lowering extracts",
        level: "avoid",
        why: "These increase fluid loss or actively relax blood vessels. Both work against you when your baseline pressure is already low.",
        terms: ["hibiscus", "roselle extract", "dandelion extract", "juniper extract", "green tea extract", "hawthorn", "celery seed extract", "beetroot juice concentrate", "nitrate concentrate"],
      },
      {
        id: "lowbp-carbs",
        title: "Large refined-carbohydrate loads",
        level: "limit",
        why: "A big refined-carb hit pulls blood towards the gut to digest it, which causes post-meal (postprandial) drops in pressure — a common trigger for afternoon dizziness.",
        terms: [...REFINED_STARCH_TERMS, "glucose syrup", "corn syrup", "sugar", "dextrose"],
        negations: SUGAR_NEGATIONS,
      },
      {
        id: "lowbp-caffeine",
        title: "Heavy caffeine",
        level: "limit",
        why: "Small amounts can nudge pressure up and are sometimes used deliberately, but large doses act as a diuretic and leave you worse off once they wear off.",
        terms: CAFFEINE_TERMS,
      },
    ],
    nutrition: [],
    guidance: "Rebound matters more than the peak — a strong coffee or energy drink often helps for an hour and then leaves you lower than you started.",
  },

  {
    id: "heart",
    label: "Heart disease",
    aka: "Cardiac / cholesterol concerns",
    focus: "Trans fats, tropical saturated fats, nitrites and salt.",
    groups: [
      {
        id: "heart-trans",
        title: "Trans & hydrogenated fats",
        level: "avoid",
        why: "Trans fats raise LDL cholesterol and lower HDL at the same time — the only fat known to move both in the wrong direction. There is no safe intake with existing heart disease.",
        terms: TRANS_FAT_TERMS,
      },
      {
        id: "heart-tropical",
        title: "Tropical & animal saturated fats",
        level: "limit",
        why: "Palm and palm kernel oil are close to 50% saturated fat and are the default cheap fat in biscuits, instant noodles and spreads.",
        terms: ["palm oil", "palmolein", "palm kernel oil", "edible vegetable fat", "vegetable fat", "butter oil", "milk fat", "tallow", "lard", "coconut oil"],
      },
      {
        id: "heart-cured",
        title: "Cured-meat preservatives",
        level: "avoid",
        why: "Nitrites form N-nitroso compounds during cooking, and processed meat intake tracks closely with cardiovascular events.",
        terms: CURED_MEAT_TERMS,
      },
      {
        id: "heart-sodium",
        title: "Salt & flavour enhancers",
        level: "limit",
        why: "Sodium raises blood pressure, which is the single biggest load on a damaged heart.",
        terms: [...SODIUM_TERMS, ...FLAVOUR_ENHANCER_TERMS],
      },
      {
        id: "heart-antioxidants",
        title: "Synthetic fat antioxidants",
        level: "limit",
        why: "TBHQ, BHA and BHT are added to keep cheap frying fats from going rancid — their presence signals a product built on reheated industrial oil.",
        terms: SYNTHETIC_ANTIOXIDANT_TERMS,
      },
      {
        id: "heart-sugar",
        title: "Added sugars",
        level: "limit",
        why: "High added-sugar intake raises triglycerides independently of fat intake.",
        terms: ADDED_SUGAR_TERMS,
        negations: SUGAR_NEGATIONS,
      },
    ],
    nutrition: [
      { key: "fat", limit: 17.5, unit: "g", why: "Over 17.5g fat per 100g is a high-fat product under standard front-of-pack rules." },
    ],
    guidance: "\"Edible vegetable oil\" without a named oil usually means palm — the pack does not have to say so.",
  },

  {
    id: "kidney",
    label: "Kidney disease",
    aka: "CKD, reduced kidney function",
    focus: "Added phosphates, potassium salts and sodium.",
    groups: [
      {
        id: "kidney-phosphate",
        title: "Added phosphates",
        level: "avoid",
        why: "Added phosphate salts are absorbed almost completely, unlike the phosphorus bound up in natural foods. Failing kidneys cannot clear the excess, and it pulls calcium out of bone.",
        terms: PHOSPHATE_TERMS,
      },
      {
        id: "kidney-potassium",
        title: "Potassium additives & salt substitutes",
        level: "avoid",
        why: "\"Low sodium\" and \"lite\" salts swap sodium for potassium. That is helpful for blood pressure but genuinely dangerous in kidney disease, where potassium builds up and affects heart rhythm.",
        terms: ["potassium chloride", "e508", "low sodium salt", "lite salt", "light salt", "salt substitute", "potassium lactate", "e326", "potassium citrate", "e332", "potassium bicarbonate", "e501", "potassium sorbate", "e202"],
      },
      {
        id: "kidney-sodium",
        title: "Salt & sodium compounds",
        level: "avoid",
        why: "Sodium drives fluid retention and blood pressure, both of which speed up the loss of remaining kidney function.",
        terms: [...SODIUM_TERMS, ...FLAVOUR_ENHANCER_TERMS],
      },
      {
        id: "kidney-aluminium",
        title: "Aluminium additives",
        level: "limit",
        why: "Aluminium is cleared by the kidneys and accumulates when they are impaired.",
        terms: ["aluminium", "aluminum", "sodium aluminium silicate", "e554", "aluminium silicate", "e559", "potassium alum", "e522", "aluminium sulphate", "e520", "sodium aluminium phosphate"],
      },
    ],
    nutrition: [],
    guidance: "Phosphate additives are not always declared by name — \"raising agent\", \"stabiliser\" and \"emulsifying salts\" in processed cheese and cola are usually phosphates.",
  },

  {
    id: "gut",
    label: "Sensitive gut",
    aka: "IBS, bloating, reflux",
    focus: "Emulsifiers, polyols and fermentable fibres.",
    groups: [
      {
        id: "gut-emulsifiers",
        title: "Industrial emulsifiers & thickeners",
        level: "avoid",
        why: "These keep water and oil mixed in the pack, and there is reasonable evidence they also thin the mucus layer that protects the gut wall. Carrageenan and polysorbate 80 are the two most often reported as triggers.",
        terms: EMULSIFIER_TERMS,
      },
      {
        id: "gut-polyols",
        title: "Sugar alcohols (polyols)",
        level: "avoid",
        why: "They are poorly absorbed, so they travel to the large intestine intact, pull in water and ferment. This is the single most common cause of bloating from \"sugar-free\" products.",
        terms: POLYOL_TERMS,
      },
      {
        id: "gut-fodmap-fibre",
        title: "Fermentable added fibres",
        level: "limit",
        why: "Added to raise the fibre number on the pack, but they ferment fast and produce gas — a problem when the gut is already sensitive.",
        terms: ["inulin", "chicory root", "chicory root fibre", "chicory root fiber", "fructo-oligosaccharide", "fructooligosaccharide", "fos", "oligofructose", "galacto-oligosaccharide", "gos", "polydextrose", "resistant dextrin", "soluble corn fibre"],
      },
      {
        id: "gut-fodmap-flavour",
        title: "High-FODMAP flavourings",
        level: "limit",
        why: "Onion and garlic powder are concentrated fructans and are in almost every savoury seasoning mix. Fructose in excess of glucose has the same effect.",
        terms: ["onion powder", "garlic powder", "dehydrated onion", "dehydrated garlic", "onion extract", "garlic extract", "high fructose corn syrup", "hfcs", "fructose", "apple juice concentrate", "pear juice concentrate", "honey", "inulin"],
      },
      {
        id: "gut-irritants",
        title: "Direct gut irritants",
        level: "limit",
        why: "Caffeine speeds up gut transit, alcohol and sulphites irritate the lining, and artificial sweeteners shift the bacterial balance.",
        terms: [...CAFFEINE_TERMS, ...ARTIFICIAL_SWEETENER_TERMS, ...SULPHITE_TERMS, "alcohol", "capsaicin", "chilli extract", "chili extract"],
      },
      {
        id: "gut-lactose",
        title: "Concentrated lactose sources",
        level: "limit",
        why: "Milk solids and whey powder concentrate lactose well beyond what plain milk contains.",
        terms: ["lactose", "milk solids", "skimmed milk powder", "skim milk powder", "whey powder", "whey permeate", "milk permeate"],
      },
    ],
    nutrition: [],
    guidance: "\"Sugar-free\" is the label to be most careful with — it usually means polyols, which are harder on a sensitive gut than sugar was.",
  },

  {
    id: "asthma",
    label: "Asthma",
    aka: "Also sulphite sensitivity",
    focus: "Sulphites, azo dyes and benzoates.",
    groups: [
      {
        id: "asthma-sulphites",
        title: "Sulphites",
        level: "avoid",
        why: "Sulphites release sulphur dioxide gas in the stomach. Breathing it in can trigger bronchospasm within minutes, and roughly 5–10% of people with asthma react. Dried fruit, wine, packaged juice and prawns are the usual sources.",
        terms: SULPHITE_TERMS,
      },
      {
        id: "asthma-colours",
        title: "Azo dyes & synthetic colours",
        level: "avoid",
        why: "Tartrazine is the best documented trigger, and cross-reaction with other azo dyes is common in people who react to aspirin.",
        terms: SYNTHETIC_COLOUR_TERMS,
      },
      {
        id: "asthma-benzoates",
        title: "Benzoate preservatives",
        level: "avoid",
        why: "Benzoates are a recognised trigger for both asthma and urticaria in sensitive people, and they turn up in nearly every soft drink and squash.",
        terms: BENZOATE_TERMS,
      },
      {
        id: "asthma-enhancers",
        title: "Flavour enhancers",
        level: "limit",
        why: "MSG-triggered asthma is rarer than once believed, but it is still reported in a small group of people with severe asthma.",
        terms: FLAVOUR_ENHANCER_TERMS,
      },
      {
        id: "asthma-antioxidants",
        title: "Synthetic antioxidants",
        level: "limit",
        why: "BHA and BHT are occasional triggers in the same people who react to benzoates and dyes.",
        terms: SYNTHETIC_ANTIOXIDANT_TERMS,
      },
      {
        id: "asthma-natural-colours",
        title: "Reactive natural colours",
        level: "limit",
        why: "Carmine and annatto are natural but are still among the more allergenic colourings.",
        terms: ["carmine", "cochineal", "e120", "carminic acid", "annatto", "e160b"],
      },
    ],
    nutrition: [],
    guidance: "Dried fruit that stays bright orange has been sulphited. Unsulphited apricots go brown — that is the one you want.",
  },

  {
    id: "pcos",
    label: "PCOS / PCOD",
    aka: "Polycystic ovary syndrome",
    focus: "Anything that worsens insulin resistance or inflammation.",
    groups: [
      {
        id: "pcos-sugars",
        title: "Added sugars & syrups",
        level: "avoid",
        why: "Insulin resistance sits underneath most PCOS symptoms. Repeated glucose spikes drive insulin higher, and high insulin pushes the ovaries to make more androgen.",
        terms: ADDED_SUGAR_TERMS,
        negations: SUGAR_NEGATIONS,
      },
      {
        id: "pcos-starch",
        title: "Refined starches",
        level: "avoid",
        why: "Maida and modified starches behave like sugar once digested, without the sweet taste that would warn you.",
        terms: REFINED_STARCH_TERMS,
      },
      {
        id: "pcos-fat",
        title: "Trans & hydrogenated fats",
        level: "avoid",
        why: "Trans fats worsen both insulin resistance and the low-grade inflammation that runs alongside PCOS.",
        terms: [...TRANS_FAT_TERMS, "palm oil", "palmolein"],
      },
      {
        id: "pcos-sweeteners",
        title: "Artificial sweeteners",
        level: "limit",
        why: "Useful for cutting sugar in the short term, but they maintain the sweet preference that makes lower-sugar eating harder to hold.",
        terms: ARTIFICIAL_SWEETENER_TERMS,
      },
      {
        id: "pcos-ultraprocessed",
        title: "Ultra-processed markers",
        level: "limit",
        why: "Colours, MSG and artificial flavour are not individually harmful for PCOS, but together they reliably mark a product engineered to be over-eaten.",
        terms: [...SYNTHETIC_COLOUR_TERMS, ...FLAVOUR_ENHANCER_TERMS, "artificial flavour", "artificial flavor", "nature identical flavouring"],
      },
      {
        id: "pcos-caffeine",
        title: "Caffeine & energy blends",
        level: "limit",
        why: "Large caffeine doses raise cortisol, which works against blood-sugar stability.",
        terms: CAFFEINE_TERMS,
      },
    ],
    nutrition: [
      { key: "sugar", limit: 10, unit: "g", why: "Over about 10g sugar per 100g is a meaningful glucose load in one sitting." },
    ],
    guidance: "Sugar paired with fibre, protein or fat spikes glucose far less than sugar on its own — which is why a biscuit and a fruit with nuts are not equivalent.",
  },
];

/**
 * Kids safety rules. Every scan is graded against these, whichever conditions
 * the user has set. `minAge` is the age below which the group is a problem.
 */
const KIDS_SAFETY_RULES = [
  {
    id: "kids-botulism",
    label: "Honey",
    minAge: 1,
    severity: "high",
    terms: ["honey", "raw honey", "honey powder"],
    why: "Honey can carry Clostridium botulinum spores. An infant gut cannot handle them, and infant botulism is a genuine risk under one year.",
  },
  {
    id: "kids-added-sugar",
    label: "Added sugar",
    minAge: 5,
    severity: "high",
    terms: ADDED_SUGAR_TERMS,
    negations: SUGAR_NEGATIONS,
    why: "The WHO position is no added sugar at all under two, and as little as possible up to five. Early sugar exposure sets taste preferences that last into adulthood, and it is the main driver of decay in milk teeth.",
  },
  {
    id: "kids-colours",
    label: "Artificial colours",
    minAge: 10,
    severity: "high",
    terms: SYNTHETIC_COLOUR_TERMS,
    why: "The Southampton study linked six dyes to increased hyperactivity and reduced attention in children. Products containing them carry a warning label in the EU for exactly this reason.",
  },
  {
    id: "kids-benzoate",
    label: "Benzoate preservatives",
    minAge: 10,
    severity: "moderate",
    terms: BENZOATE_TERMS,
    why: "Sodium benzoate was part of the same hyperactivity finding, and the effect was strongest when it appeared together with artificial colours.",
  },
  {
    id: "kids-caffeine",
    label: "Caffeine",
    minAge: 12,
    severity: "high",
    terms: CAFFEINE_TERMS,
    why: "There is no established safe caffeine intake for children. It disturbs sleep at doses adults would not notice, and poor sleep in turn affects attention and growth.",
  },
  {
    id: "kids-sweeteners",
    label: "Artificial sweeteners",
    minAge: 5,
    severity: "moderate",
    terms: ARTIFICIAL_SWEETENER_TERMS,
    why: "Intake limits are set per kilogram of body weight, so a child reaches the daily maximum on a fraction of what an adult can have.",
  },
  {
    id: "kids-trans-fat",
    label: "Trans fats",
    minAge: 10,
    severity: "high",
    terms: TRANS_FAT_TERMS,
    why: "Arterial changes begin in childhood. Trans fat has no nutritional role at any age and least of all during growth.",
  },
  {
    id: "kids-sodium",
    label: "High-sodium additives",
    minAge: 5,
    severity: "moderate",
    terms: [...SODIUM_TERMS, ...FLAVOUR_ENHANCER_TERMS],
    why: "A child's sodium limit is far below an adult's — around 2g of salt a day at ages 4–6. A single packet of savoury snacks can use most of it.",
  },
  {
    id: "kids-cured",
    label: "Nitrite-cured meat",
    minAge: 10,
    severity: "high",
    terms: CURED_MEAT_TERMS,
    why: "Nitrite-cured meats are classed as group 1 carcinogens, and lifetime exposure counts — starting early means more of it.",
  },
  {
    id: "kids-antioxidants",
    label: "Synthetic antioxidants",
    minAge: 10,
    severity: "moderate",
    terms: SYNTHETIC_ANTIOXIDANT_TERMS,
    why: "BHA and TBHQ have narrow acceptable daily intakes that are easier for a small body to exceed.",
  },
  {
    id: "kids-polyols",
    label: "Sugar alcohols",
    minAge: 5,
    severity: "moderate",
    terms: POLYOL_TERMS,
    why: "Polyols draw water into the bowel. In a child's smaller gut this causes cramping and diarrhoea at modest amounts.",
  },
];

/** Wording on a pack that says it is aimed at children. */
const KIDS_PRODUCT_SIGNALS = [
  "for kids", "for children", "childrens", "kids snack", "kids special",
  "toddler", "baby food", "infant", "junior", "school snack", "tiffin",
  "lunch box", "lunchbox", "growing children", "my first",
];

/* ————————————————————————————————————————————————————————————
   Matching engine
   ———————————————————————————————————————————————————————————— */

/** Fold label text into a plain lowercase form that regexes can work on. */
function cdNormalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[\u2018\u2019']/g, "")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^a-z0-9\s.\-&]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Indian packs print "INS 621", EU packs print "E621", and OCR loves to insert
 * a space or a dot. Collapse all of those into one comparable form.
 */
function cdCollapseCodes(text) {
  return text.replace(/\b(?:ins|e)[\s.\-]?(\d{3}[a-z]?)\b/g, "e$1");
}

const cdTermCache = new Map();

function cdTermRegex(term) {
  if (!cdTermCache.has(term)) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "[\\s-]+");
    cdTermCache.set(term, new RegExp(`(^|[^a-z0-9])(${escaped})([^a-z0-9]|$)`, "g"));
  }
  const re = cdTermCache.get(term);
  re.lastIndex = 0;
  return re;
}

/** True when the match sits inside a phrase like "no added sugar". */
function cdIsNegated(text, index, negations) {
  if (!negations || negations.length === 0) return false;
  const before = text.slice(Math.max(0, index - 24), index);
  const around = text.slice(Math.max(0, index - 24), index + 40);
  if (/\b(no|without|zero|free\s+from|reduced|low)\s+(added\s+)?$/.test(before)) return true;
  return negations.some((phrase) => around.includes(phrase));
}

/** Find every term in a group that appears in the text. Longest match wins. */
function cdMatchGroup(text, group) {
  const hits = [];
  const claimed = [];
  const terms = [...group.terms].sort((a, b) => b.length - a.length);

  for (const term of terms) {
    const re = cdTermRegex(term);
    let m;
    while ((m = re.exec(text)) !== null) {
      const start = m.index + m[1].length;
      const end = start + m[2].length;
      if (claimed.some(([s, e]) => start < e && end > s)) continue;
      if (cdIsNegated(text, start, group.negations)) continue;
      claimed.push([start, end]);
      if (!hits.includes(term)) hits.push(term);
      break; // one mention of a term is enough to report it
    }
  }

  return hits;
}

/**
 * Grade a label against one condition.
 * Returns null when nothing from that condition's lists is present.
 */
function evaluateCondition(labelText, conditionId) {
  const condition = CONDITION_LIBRARY.find((c) => c.id === conditionId);
  if (!condition) return null;

  const text = cdCollapseCodes(cdNormalize(labelText));
  if (!text) return null;

  const matchedGroups = [];
  for (const group of condition.groups) {
    const hits = cdMatchGroup(text, group);
    if (hits.length > 0) {
      matchedGroups.push({
        id: group.id,
        title: group.title,
        level: group.level,
        why: group.why,
        found: hits,
      });
    }
  }

  if (matchedGroups.length === 0) return null;

  matchedGroups.sort((a, b) => (a.level === b.level ? 0 : a.level === "avoid" ? -1 : 1));
  const avoidCount = matchedGroups.filter((g) => g.level === "avoid").length;

  return {
    conditionId: condition.id,
    label: condition.label,
    focus: condition.focus,
    note: condition.note || "",
    guidance: condition.guidance || "",
    groups: matchedGroups,
    verdict: avoidCount > 0 ? "avoid" : "limit",
    totalFound: matchedGroups.reduce((sum, g) => sum + g.found.length, 0),
  };
}

/** Grade a label against every condition the user has selected. */
function evaluateConditions(labelText, conditionIds) {
  return (conditionIds || [])
    .map((id) => evaluateCondition(labelText, id))
    .filter(Boolean)
    .sort((a, b) => {
      if (a.verdict !== b.verdict) return a.verdict === "avoid" ? -1 : 1;
      return b.totalFound - a.totalFound;
    });
}

/** True when the pack wording suggests the product is sold for children. */
function looksLikeKidsProduct(labelText) {
  const text = cdNormalize(labelText);
  if (!text) return false;
  if (KIDS_PRODUCT_SIGNALS.some((signal) => text.includes(signal))) return true;
  return /\bages?\s*\d/.test(text) || /\b\d+\s*[+]\s*years?\b/.test(text);
}

/**
 * Grade any product for children. Runs on every scan.
 * Returns a minimum age, the groups that set it, and a plain-language rating.
 */
function evaluateKidsSafety(labelText) {
  const text = cdCollapseCodes(cdNormalize(labelText));
  const flags = [];

  for (const rule of KIDS_SAFETY_RULES) {
    const hits = cdMatchGroup(text, rule);
    if (hits.length > 0) {
      flags.push({
        id: rule.id,
        label: rule.label,
        minAge: rule.minAge,
        severity: rule.severity,
        why: rule.why,
        found: hits,
      });
    }
  }

  flags.sort((a, b) => b.minAge - a.minAge || (a.severity === "high" ? -1 : 1));

  const minAge = flags.reduce((age, f) => Math.max(age, f.minAge), 0);
  const highCount = flags.filter((f) => f.severity === "high").length;

  let rating;
  if (flags.length === 0) {
    rating = { key: "clear", label: "Nothing flagged for children", tone: "safe" };
  } else if (highCount >= 3 || minAge >= 12) {
    rating = { key: "avoid", label: `Not recommended below ${minAge} years`, tone: "danger" };
  } else if (highCount >= 1) {
    rating = { key: "occasional", label: `Not recommended below ${minAge} years`, tone: "danger" };
  } else {
    rating = { key: "caution", label: `Occasional only below ${minAge} years`, tone: "warn" };
  }

  return {
    minAge,
    flags,
    rating,
    looksLikeKidsProduct: looksLikeKidsProduct(labelText),
  };
}
