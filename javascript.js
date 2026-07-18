/* Ingredient_Check — OCR scan, health-risk report, history & preferences */

const SEVERITY_RANK = { high: 3, moderate: 2, low: 1 };

/**
 * Canonical findings: aliases collapse duplicates.
 * risks[] = health concerns if regularly consumed (educational, not medical advice).
 */
const INGREDIENT_DB = [
  // —— Sweeteners ——
  {
    id: "hfcs",
    name: "High Fructose Corn Syrup",
    aliases: ["high fructose corn syrup", "hfcs", "glucose-fructose syrup", "glucose fructose syrup"],
    category: "Sweeteners",
    severity: "moderate",
    note: "Cheap added sugar used heavily in sodas and packaged foods.",
    risks: [
      "Can raise blood sugar and contribute to weight gain when eaten often",
      "Linked with higher risk of fatty liver and metabolic issues in large amounts",
      "Easy to overconsume because it is very sweet and in many products",
    ],
    watchFor: "People managing diabetes, weight, or fatty liver.",
  },
  {
    id: "corn-syrup",
    name: "Corn Syrup",
    aliases: ["corn syrup"],
    category: "Sweeteners",
    severity: "low",
    note: "Added sugar syrup common in candy and processed snacks.",
    risks: [
      "Adds empty calories with little nutrition",
      "May cause blood sugar spikes, especially in larger servings",
    ],
    watchFor: "Anyone limiting added sugars or watching blood glucose.",
  },
  {
    id: "invert-sugar",
    name: "Invert Sugar",
    aliases: ["invert sugar", "invert syrup"],
    category: "Sweeteners",
    severity: "low",
    note: "Processed sugar that tastes sweeter and absorbs quickly.",
    risks: [
      "Can spike blood sugar quickly after eating",
      "Adds calories without useful nutrients",
    ],
    watchFor: "People with diabetes or insulin resistance.",
  },
  {
    id: "aspartame",
    name: "Aspartame",
    aliases: ["aspartame", "e951", "nutrasweet", "equal"],
    category: "Sweeteners",
    severity: "moderate",
    note: "Artificial sweetener found in diet drinks and sugar-free products.",
    risks: [
      "Some people report headaches or sensitivity after consuming it",
      "Must be avoided by people with phenylketonuria (PKU)",
      "Long-term high intake is still debated; many prefer to limit it",
    ],
    watchFor: "People with PKU, migraine triggers, or artificial-sweetener sensitivity.",
  },
  {
    id: "sucralose",
    name: "Sucralose",
    aliases: ["sucralose", "e955", "splenda"],
    category: "Sweeteners",
    severity: "moderate",
    note: "Zero-calorie sweetener used in many “sugar-free” foods.",
    risks: [
      "May alter gut bacteria in some research (still being studied)",
      "Can keep a preference for very sweet tastes",
      "Heating to very high temperatures may create unwanted byproducts",
    ],
    watchFor: "People limiting ultraprocessed or artificially sweetened foods.",
  },
  {
    id: "saccharin",
    name: "Saccharin",
    aliases: ["saccharin", "e954"],
    category: "Sweeteners",
    severity: "moderate",
    note: "Older artificial sweetener used in tabletop packets and diet foods.",
    risks: [
      "Some people notice aftertaste or digestive discomfort",
      "Often preferred to limit as part of cutting ultraprocessed additives",
    ],
    watchFor: "Anyone avoiding artificial sweeteners.",
  },
  {
    id: "ace-k",
    name: "Acesulfame Potassium (Ace-K)",
    aliases: ["acesulfame potassium", "acesulfame k", "ace-k", "acek", "e950"],
    category: "Sweeteners",
    severity: "moderate",
    note: "Artificial sweetener often blended with aspartame or sucralose.",
    risks: [
      "Adds intense sweetness without calories; may reinforce sweet cravings",
      "Long-term metabolic effects are still researched; many choose to limit",
    ],
    watchFor: "People reducing artificial sweeteners overall.",
  },
  {
    id: "neotame",
    name: "Neotame",
    aliases: ["neotame", "e961"],
    category: "Sweeteners",
    severity: "moderate",
    note: "Very potent artificial sweetener used in tiny amounts.",
    risks: [
      "Highly processed additive with limited everyday transparency on labels",
      "Same general concerns as other non-nutritive sweeteners for some consumers",
    ],
    watchFor: "Anyone avoiding high-intensity sweeteners.",
  },
  {
    id: "fructose",
    name: "Fructose",
    aliases: ["fructose"],
    category: "Sweeteners",
    severity: "low",
    note: "Sugar type often added in processed foods (beyond fruit).",
    risks: [
      "Large added amounts may stress the liver more than other sugars",
      "Can contribute to triglycerides and blood sugar issues when overdone",
    ],
    watchFor: "People with fatty liver, metabolic syndrome, or high triglycerides.",
  },
  {
    id: "dextrose",
    name: "Dextrose",
    aliases: ["dextrose"],
    category: "Sweeteners",
    severity: "low",
    note: "Simple sugar (glucose) used as a sweetener or filler.",
    risks: [
      "Raises blood sugar quickly after eating",
      "Adds refined carbs with little nutrition",
    ],
    watchFor: "People with diabetes or blood-sugar goals.",
  },
  {
    id: "added-sugar",
    name: "Sugar",
    aliases: [
      "cane sugar",
      "brown sugar",
      "powdered sugar",
      "icing sugar",
      "castor sugar",
      "table sugar",
      "sucrose",
      "glucose syrup",
      "sugar syrup",
    ],
    category: "Sweeteners",
    severity: "moderate",
    note: "Added sugar that raises blood glucose after eating.",
    risks: [
      "Raises blood sugar and can worsen diabetes control",
      "Frequent intake linked with weight gain and tooth decay",
      "Adds calories with little nutrition",
    ],
    watchFor: "People with diabetes or anyone limiting added sugars.",
  },

  // —— Preservatives ——
  {
    id: "sodium-benzoate",
    name: "Sodium Benzoate",
    aliases: ["sodium benzoate", "e211"],
    category: "Preservatives",
    severity: "moderate",
    note: "Preservative that keeps soft drinks and sauces from spoiling.",
    risks: [
      "Can form benzene (a concern chemical) when combined with vitamin C in some drinks",
      "Some people report sensitivity or hyperactivity concerns (especially with certain dyes)",
      "Best limited in everyday drinks rather than avoided only once",
    ],
    watchFor: "Kids, people drinking many preserved sodas, or dye/preservative sensitivity.",
  },
  {
    id: "potassium-benzoate",
    name: "Potassium Benzoate",
    aliases: ["potassium benzoate", "e212"],
    category: "Preservatives",
    severity: "moderate",
    note: "Benzoate preservative similar to sodium benzoate.",
    risks: [
      "Same class concerns as other benzoates when consumed often",
      "May bother people sensitive to preservatives",
    ],
    watchFor: "People limiting benzoate preservatives.",
  },
  {
    id: "potassium-sorbate",
    name: "Potassium Sorbate",
    aliases: ["potassium sorbate", "e202"],
    category: "Preservatives",
    severity: "low",
    note: "Common mold-inhibiting preservative in cheese, juice, and baked goods.",
    risks: [
      "Generally considered lower concern, but still a synthetic additive",
      "Rare skin or digestive sensitivity in some people",
    ],
    watchFor: "People with known sorbate sensitivity.",
  },
  {
    id: "calcium-propionate",
    name: "Calcium Propionate",
    aliases: ["calcium propionate", "e282"],
    category: "Preservatives",
    severity: "low",
    note: "Mold inhibitor widely used in bread.",
    risks: [
      "Some reports of irritability or sensitivity in a minority of people",
      "Adds to ultraprocessed-bread additive load",
    ],
    watchFor: "People who notice symptoms after packaged bread.",
  },
  {
    id: "sodium-nitrite",
    name: "Sodium Nitrite",
    aliases: ["sodium nitrite", "e250"],
    category: "Preservatives",
    severity: "high",
    note: "Used in cured meats (bacon, hot dogs, deli meat) for color and safety.",
    risks: [
      "Can form nitrosamines, compounds linked with higher colorectal cancer risk",
      "Regular processed-meat intake is associated with heart and cancer risk in large studies",
      "Better treated as an occasional food, not a daily staple",
    ],
    watchFor: "People who eat cured meats often; those reducing cancer risk factors.",
  },
  {
    id: "sodium-nitrate",
    name: "Sodium Nitrate",
    aliases: ["sodium nitrate", "e251"],
    category: "Preservatives",
    severity: "high",
    note: "Cured-meat preservative that can convert into nitrites in the body.",
    risks: [
      "Same broader concerns as nitrites and processed meats",
      "Linked with elevated risk when consumed frequently over years",
    ],
    watchFor: "Frequent consumers of cured or dried meats.",
  },
  {
    id: "bha",
    name: "BHA",
    aliases: ["bha", "butylated hydroxyanisole", "e320"],
    category: "Preservatives",
    severity: "high",
    note: "Synthetic antioxidant that keeps fats from going rancid.",
    risks: [
      "Classified by some agencies as a possible human carcinogen at high exposures",
      "May disrupt hormones in animal studies; human risk still debated",
      "Worth avoiding when a cleaner alternative exists",
    ],
    watchFor: "People minimizing additives classified as possible carcinogens.",
  },
  {
    id: "bht",
    name: "BHT",
    aliases: ["bht", "butylated hydroxytoluene", "e321"],
    category: "Preservatives",
    severity: "high",
    note: "Synthetic antioxidant preservative related to BHA.",
    risks: [
      "Possible links to liver and hormonal effects in animal research",
      "Often grouped with BHA as an additive to limit",
    ],
    watchFor: "Anyone avoiding synthetic fat preservatives.",
  },
  {
    id: "tbhq",
    name: "TBHQ",
    aliases: ["tbhq", "tertiary butylhydroquinone", "e319"],
    category: "Preservatives",
    severity: "high",
    note: "Petroleum-derived preservative used in fried snacks and oils.",
    risks: [
      "High doses have shown organ toxicity in animal studies",
      "May affect immune response or cause nausea at higher intakes",
      "A signal to choose less ultraprocessed snacks when possible",
    ],
    watchFor: "People who eat many packaged fried chips or packaged baked goods.",
  },
  {
    id: "sulfites",
    name: "Sulfites",
    aliases: [
      "sodium sulfite",
      "sodium metabisulfite",
      "potassium metabisulfite",
      "sulfur dioxide",
      "sulphur dioxide",
      "e220",
      "e221",
      "e223",
      "e224",
    ],
    category: "Preservatives",
    severity: "high",
    note: "Preservatives used in dried fruit, wine, and some packaged foods.",
    risks: [
      "Can trigger asthma attacks or breathing trouble in sensitive people",
      "May cause hives, flushing, or allergic-type reactions",
      "Must be labeled because reactions can be serious",
    ],
    watchFor: "People with asthma or known sulfite allergy — this can be urgent.",
  },

  // —— Artificial colors ——
  {
    id: "red-40",
    name: "Red 40 (Allura Red)",
    aliases: ["red 40", "red40", "red no. 40", "red no 40", "allura red", "e129", "fd&c red 40", "fdc red 40"],
    category: "Artificial Colors",
    severity: "moderate",
    note: "Bright synthetic red dye common in candy, drinks, and snacks.",
    risks: [
      "Linked with hyperactivity and attention issues in some children",
      "May cause allergic-type reactions (itching, hives) in sensitive people",
      "Adds no nutrition — only color",
    ],
    watchFor: "Children with ADHD/behavioral sensitivity; dye-sensitive adults.",
  },
  {
    id: "yellow-5",
    name: "Yellow 5 (Tartrazine)",
    aliases: ["yellow 5", "yellow5", "yellow no. 5", "yellow no 5", "tartrazine", "e102", "fd&c yellow 5"],
    category: "Artificial Colors",
    severity: "moderate",
    note: "Synthetic yellow dye (tartrazine) in drinks, snacks, and desserts.",
    risks: [
      "Among the dyes most associated with behavioral effects in sensitive kids",
      "Can trigger asthma or hives in people sensitive to tartrazine",
      "Often restricted or warned about in some countries",
    ],
    watchFor: "Children sensitive to dyes; people with aspirin/tartrazine sensitivity.",
  },
  {
    id: "yellow-6",
    name: "Yellow 6 (Sunset Yellow)",
    aliases: ["yellow 6", "yellow6", "yellow no. 6", "yellow no 6", "sunset yellow", "e110", "fd&c yellow 6"],
    category: "Artificial Colors",
    severity: "moderate",
    note: "Orange-yellow synthetic dye used in snacks and drinks.",
    risks: [
      "May contribute to hyperactivity concerns in some children",
      "Possible allergic reactions (rash, swelling) in sensitive people",
    ],
    watchFor: "Kids and adults with known dye sensitivities.",
  },
  {
    id: "blue-1",
    name: "Blue 1 (Brilliant Blue)",
    aliases: ["blue 1", "blue1", "blue no. 1", "blue no 1", "brilliant blue", "e133", "fd&c blue 1"],
    category: "Artificial Colors",
    severity: "moderate",
    note: "Synthetic blue dye in candy, ice pops, and sports drinks.",
    risks: [
      "Rare allergic reactions reported",
      "Part of the artificial-dye load linked with behavioral concerns in some kids",
    ],
    watchFor: "Children limiting artificial colors.",
  },
  {
    id: "blue-2",
    name: "Blue 2 (Indigo Carmine)",
    aliases: ["blue 2", "blue2", "blue no. 2", "blue no 2", "indigotine", "indigo carmine", "e132"],
    category: "Artificial Colors",
    severity: "moderate",
    note: "Synthetic blue-violet food dye.",
    risks: [
      "Possible allergic reactions in sensitive people",
      "No nutritional benefit; often a marker of ultraprocessed food",
    ],
    watchFor: "People avoiding artificial colors.",
  },
  {
    id: "caramel-color",
    name: "Caramel Color",
    aliases: ["caramel color", "caramel colour", "e150a", "e150b", "e150c", "e150d"],
    category: "Artificial Colors",
    severity: "low",
    note: "Brown coloring used in colas, sauces, and baked goods.",
    risks: [
      "Some types (Class III/IV) may contain 4-MEI, a compound of concern in high amounts",
      "Usually lower risk than bright artificial dyes, but still a processed additive",
    ],
    watchFor: "People who drink large amounts of dark sodas daily.",
  },
  {
    id: "artificial-color",
    name: "Artificial Color",
    aliases: ["artificial color", "artificial colour", "artificial colors", "artificial colours", "fd&c", "fdc"],
    category: "Artificial Colors",
    severity: "moderate",
    note: "Generic label for synthetic dyes (FD&C colors).",
    risks: [
      "May include dyes linked with hyperactivity in some children",
      "Possible allergy or sensitivity reactions",
      "Signal that the product is heavily processed",
    ],
    watchFor: "Families preferring naturally colored foods.",
  },

  // —— Fats & oils ——
  {
    id: "palm-oil",
    name: "Palm Oil",
    aliases: ["palm oil", "palm kernel oil"],
    category: "Fats & Oils",
    severity: "low",
    note: "Tropical oil high in saturated fat, common in packaged foods.",
    risks: [
      "High saturated fat may raise LDL cholesterol if eaten in large amounts",
      "Often found in ultraprocessed snacks that are easy to overeat",
    ],
    watchFor: "People managing cholesterol or heart-risk factors.",
  },
  {
    id: "hydrogenated",
    name: "Hydrogenated Oils / Trans Fats",
    aliases: [
      "hydrogenated vegetable oil",
      "partially hydrogenated",
      "hydrogenated oil",
      "fully hydrogenated",
    ],
    category: "Fats & Oils",
    severity: "high",
    note: "Processed fats; partially hydrogenated oils create industrial trans fats.",
    risks: [
      "Trans fats raise bad cholesterol (LDL) and lower good cholesterol (HDL)",
      "Increase risk of heart disease and stroke with regular intake",
      "Many countries tightly restrict or ban partially hydrogenated oils",
    ],
    watchFor: "Anyone — industrial trans fats are among the clearest dietary harms.",
  },
  {
    id: "interesterified",
    name: "Interesterified Fat",
    aliases: ["interesterified"],
    category: "Fats & Oils",
    severity: "moderate",
    note: "Industrial fat restructuring used as a trans-fat replacement.",
    risks: [
      "May affect blood lipids and metabolism; long-term evidence still growing",
      "Marker of heavily processed fats",
    ],
    watchFor: "People choosing less processed fats (olive oil, butter in moderation, etc.).",
  },
  {
    id: "shortening",
    name: "Shortening",
    aliases: ["shortening"],
    category: "Fats & Oils",
    severity: "low",
    note: "Solid baking fat that can be high in saturated or trans fats.",
    risks: [
      "Can contribute to higher saturated/trans fat intake",
      "Often in pastries and fried foods that are calorie-dense",
    ],
    watchFor: "People watching heart health and fried/bakery foods.",
  },

  // —— Flavor enhancers ——
  {
    id: "msg",
    name: "MSG (Monosodium Glutamate)",
    aliases: ["monosodium glutamate", "msg", "e621", "sodium glutamate"],
    category: "Flavor Enhancers",
    severity: "moderate",
    note: "Flavor enhancer that boosts savory (umami) taste.",
    risks: [
      "Some people get headache, flushing, or tingling shortly after eating it",
      "Adds sodium, which can matter for blood pressure",
      "Safe for most people in typical amounts, but sensitivity is real for some",
    ],
    watchFor: "People who notice MSG sensitivity or are limiting sodium.",
  },
  {
    id: "guanylate",
    name: "Disodium Guanylate",
    aliases: ["disodium guanylate", "e627"],
    category: "Flavor Enhancers",
    severity: "moderate",
    note: "Flavor booster often paired with MSG.",
    risks: [
      "Amplifies savoriness; can make packaged foods easier to overeat",
      "People sensitive to glutamates may also react when it is used with MSG",
    ],
    watchFor: "MSG-sensitive people; those reducing ultraprocessed snacks.",
  },
  {
    id: "inosinate",
    name: "Disodium Inosinate",
    aliases: ["disodium inosinate", "e631"],
    category: "Flavor Enhancers",
    severity: "moderate",
    note: "Nucleotide flavor enhancer commonly used with MSG.",
    risks: [
      "Similar overeating / sensitivity concerns as other glutamate boosters",
      "Derived sources may matter for strict vegetarians (sometimes from meat/fish)",
    ],
    watchFor: "MSG-sensitive people and some vegetarians/vegans checking sources.",
  },
  {
    id: "ribonucleotides",
    name: "Disodium Ribonucleotides",
    aliases: ["disodium 5'-ribonucleotides", "disodium ribonucleotides", "e635"],
    category: "Flavor Enhancers",
    severity: "moderate",
    note: "Blend of flavor enhancers related to guanylate/inosinate.",
    risks: [
      "Boosts taste intensity of salty/savory foods",
      "May bother people sensitive to MSG-type flavor systems",
    ],
    watchFor: "People avoiding flavor-enhancer stacks.",
  },
  {
    id: "yeast-extract",
    name: "Yeast Extract",
    aliases: ["yeast extract", "autolyzed yeast", "autolysed yeast"],
    category: "Flavor Enhancers",
    severity: "low",
    note: "Natural-sounding ingredient that contains free glutamates.",
    risks: [
      "Can act like MSG for people who are glutamate-sensitive",
      "Often high in sodium",
    ],
    watchFor: "MSG-sensitive people reading “natural” labels carefully.",
  },
  {
    id: "hvp",
    name: "Hydrolyzed Vegetable Protein",
    aliases: ["hydrolyzed vegetable protein", "hydrolysed vegetable protein", "hvp"],
    category: "Flavor Enhancers",
    severity: "moderate",
    note: "Processed protein used for savory flavor; contains glutamates.",
    risks: [
      "Can trigger MSG-type sensitivity symptoms in some people",
      "Marker of heavily seasoned ultraprocessed foods",
    ],
    watchFor: "People avoiding hidden glutamates.",
  },

  // —— Artificial flavors ——
  {
    id: "artificial-flavor",
    name: "Artificial Flavor",
    aliases: [
      "natural and artificial flavor",
      "natural and artificial flavour",
      "artificial flavor",
      "artificial flavour",
      "artificial flavors",
      "artificial flavours",
    ],
    category: "Artificial Flavors",
    severity: "low",
    note: "Synthetic or mixed flavor chemicals; exact formula is not listed.",
    risks: [
      "Opacity: you cannot see which chemicals were used",
      "Rare sensitivities or headaches in some people",
      "Usually a sign the food is designed for intense taste and overeating",
    ],
    watchFor: "People preferring simple, recognizable ingredients.",
  },

  // —— Emulsifiers & thickeners ——
  {
    id: "carrageenan",
    name: "Carrageenan",
    aliases: ["carrageenan", "e407"],
    category: "Emulsifiers & Thickeners",
    severity: "moderate",
    note: "Seaweed-derived thickener used in dairy alternatives and processed foods.",
    risks: [
      "Some people report digestive inflammation or bloating",
      "Degraded carrageenan is more concerning; food-grade differs but remains debated",
      "Often avoided by people with IBS or gut sensitivity",
    ],
    watchFor: "People with IBS, IBD, or chronic gut discomfort.",
  },
  {
    id: "polysorbate-80",
    name: "Polysorbate 80",
    aliases: ["polysorbate 80", "e433"],
    category: "Emulsifiers & Thickeners",
    severity: "moderate",
    note: "Emulsifier that keeps oil and water mixed in ice cream and sauces.",
    risks: [
      "Animal research links some emulsifiers with gut inflammation at high exposures",
      "May alter gut microbiome for some people (emerging science)",
    ],
    watchFor: "People with inflammatory gut conditions reducing emulsifiers.",
  },
  {
    id: "polysorbate-60",
    name: "Polysorbate 60",
    aliases: ["polysorbate 60", "e435"],
    category: "Emulsifiers & Thickeners",
    severity: "moderate",
    note: "Emulsifier used in baked goods and desserts.",
    risks: [
      "Similar gut/microbiome concerns as other polysorbates in emerging research",
      "Marker of highly processed food",
    ],
    watchFor: "People limiting industrial emulsifiers.",
  },
  {
    id: "propylene-glycol",
    name: "Propylene Glycol",
    aliases: ["propylene glycol", "e1520"],
    category: "Emulsifiers & Thickeners",
    severity: "low",
    note: "Moisture-holding agent and solvent in many processed foods.",
    risks: [
      "Generally recognized as safe in small food amounts",
      "High intakes can cause issues; some people prefer to avoid it",
      "Can bother people with certain rare metabolic conditions",
    ],
    watchFor: "People minimizing industrial solvents in food.",
  },

  // —— Other ——
  {
    id: "phosphates",
    name: "Phosphate Additives",
    aliases: [
      "sodium phosphate",
      "trisodium phosphate",
      "disodium phosphate",
      "sodium hexametaphosphate",
      "e339",
      "e451",
      "e452",
    ],
    category: "Other Additives",
    severity: "moderate",
    note: "Added phosphates improve texture and shelf life in meats, cheese, and sodas.",
    risks: [
      "Absorbed more efficiently than natural food phosphorus",
      "High intake may stress kidneys and affect bone minerals over time",
      "Especially important to limit if kidney function is reduced",
    ],
    watchFor: "People with chronic kidney disease; high soda/processed-meat diets.",
  },
  {
    id: "modified-starch",
    name: "Modified Food Starch",
    aliases: ["modified food starch", "modified starch"],
    category: "Other Additives",
    severity: "low",
    note: "Chemically or physically altered starch for texture.",
    risks: [
      "Usually low toxicity, but adds refined carbs",
      "Source may include wheat — a gluten concern if not labeled carefully",
    ],
    watchFor: "People with celiac disease if the starch source is unclear.",
  },
  {
    id: "maltodextrin",
    name: "Maltodextrin",
    aliases: ["maltodextrin"],
    category: "Other Additives",
    severity: "moderate",
    note: "Highly processed starch powder that acts like a fast sugar.",
    risks: [
      "Can spike blood sugar as much as or more than table sugar",
      "May affect gut bacteria with frequent intake",
      "Common filler in “low fat” or flavored packets",
    ],
    watchFor: "People with diabetes or blood-sugar goals.",
  },
  {
    id: "aluminum",
    name: "Sodium Aluminosilicate",
    aliases: ["sodium aluminosilicate", "e554"],
    category: "Other Additives",
    severity: "moderate",
    note: "Anti-caking agent that contains aluminum.",
    risks: [
      "Adds to dietary aluminum exposure",
      "People with kidney disease clear aluminum less well",
      "Many prefer to avoid aluminum additives when possible",
    ],
    watchFor: "People with kidney disease; those minimizing aluminum intake.",
  },
  {
    id: "titanium-dioxide",
    name: "Titanium Dioxide",
    aliases: ["titanium dioxide", "e171", "tio2"],
    category: "Other Additives",
    severity: "high",
    note: "White pigment used in candies, frosting, and some sauces.",
    risks: [
      "Banned as a food additive in the EU due to genotoxicity concerns (inability to rule out DNA damage)",
      "Nanoparticles may accumulate; long-term oral safety is disputed",
      "Adds only appearance — no nutrition",
    ],
    watchFor: "Anyone — especially kids who eat many brightly whitened candies.",
  },
  {
    id: "brominated-oil",
    name: "Brominated Vegetable Oil",
    aliases: ["brominated vegetable oil", "bvo"],
    category: "Other Additives",
    severity: "high",
    note: "Emulsifier formerly common in citrus sodas; restricted in many places.",
    risks: [
      "Bromine can build up in the body with heavy soda intake",
      "Linked with neurological and thyroid concerns at high exposures",
      "Banned or phased out in several countries",
    ],
    watchFor: "Anyone drinking BVO-containing sodas regularly.",
  },
  {
    id: "azodicarbonamide",
    name: "Azodicarbonamide",
    aliases: ["azodicarbonamide", "ada"],
    category: "Other Additives",
    severity: "high",
    note: "Dough conditioner once common in bread; banned in the EU and elsewhere.",
    risks: [
      "Breaks down into compounds of concern when baked",
      "Linked with respiratory irritation in occupational settings",
      "Widely considered an additive to avoid in food",
    ],
    watchFor: "Anyone preferring clean-label bread.",
  },
  {
    id: "potassium-bromate",
    name: "Potassium Bromate",
    aliases: ["potassium bromate", "e924"],
    category: "Other Additives",
    severity: "high",
    note: "Flour improver banned in many countries as a possible carcinogen.",
    risks: [
      "Classified as a possible human carcinogen",
      "Residues may remain if baking does not fully convert it",
      "Strong reason to avoid bread listing this ingredient",
    ],
    watchFor: "Anyone — this is a high-priority avoid.",
  },
];

const HISTORY_KEY = "ingredient_check_history";
const CONDITIONS_KEY = "ingredient_check_conditions";
const MAX_HISTORY = 12;

/** User-selectable conditions → personalized “not recommended” advice. */
const HEALTH_CONDITIONS = [
  {
    id: "diabetes",
    label: "Diabetes",
    description: "Warn about sugars and ingredients that spike blood glucose",
  },
  {
    id: "hypertension",
    label: "High blood pressure",
    description: "Warn about sodium-heavy flavor enhancers and cured meats",
  },
  {
    id: "heart",
    label: "Heart disease",
    description: "Warn about trans fats, nitrates, and heart-risk additives",
  },
  {
    id: "kidney",
    label: "Kidney disease",
    description: "Warn about phosphates and additives harder on kidneys",
  },
  {
    id: "ibs",
    label: "IBS / sensitive gut",
    description: "Warn about emulsifiers and thickeners that may irritate guts",
  },
  {
    id: "asthma",
    label: "Asthma / sulfite sensitivity",
    description: "Warn about sulfites that can trigger breathing issues",
  },
];

/**
 * ingredient id → { conditionId: advice }
 * Used when a scan finds that ingredient and the user has the condition set.
 */
const AVOID_FOR = {
  "hfcs": {
    diabetes: "Not recommended with diabetes — high fructose corn syrup can raise blood sugar quickly.",
  },
  "corn-syrup": {
    diabetes: "Not recommended with diabetes — corn syrup raises blood sugar.",
  },
  "invert-sugar": {
    diabetes: "Not recommended with diabetes — invert sugar spikes blood glucose.",
  },
  "fructose": {
    diabetes: "Not recommended with diabetes — added fructose can worsen blood sugar and liver load.",
  },
  "dextrose": {
    diabetes: "Not recommended with diabetes — dextrose is pure glucose and raises blood sugar fast.",
  },
  "added-sugar": {
    diabetes: "Not recommended with diabetes — sugar raises blood glucose and is best limited or avoided.",
  },
  "maltodextrin": {
    diabetes: "Not recommended with diabetes — maltodextrin can spike blood sugar like sugar.",
  },
  "msg": {
    hypertension: "Not ideal with high blood pressure — MSG adds sodium and may encourage overeating salty foods.",
  },
  "yeast-extract": {
    hypertension: "Use caution with high blood pressure — yeast extract is often high in sodium.",
  },
  "hydrogenated": {
    heart: "Not recommended with heart disease — hydrogenated oils / trans fats raise cardiovascular risk.",
    hypertension: "Not recommended with high blood pressure — trans fats harm heart and vessel health.",
  },
  "shortening": {
    heart: "Limit with heart disease — shortening is often high in saturated or trans fats.",
  },
  "palm-oil": {
    heart: "Limit with heart disease — palm oil is high in saturated fat.",
  },
  "sodium-nitrite": {
    heart: "Limit with heart disease — cured-meat nitrites are linked with higher long-term heart and cancer risk.",
    hypertension: "Limit with high blood pressure — cured meats are usually very high in salt too.",
  },
  "sodium-nitrate": {
    heart: "Limit with heart disease — nitrates in processed meats are a concern with frequent intake.",
  },
  "phosphates": {
    kidney: "Not recommended with kidney disease — added phosphates are absorbed easily and stress kidneys.",
  },
  "aluminum": {
    kidney: "Avoid with kidney disease — aluminum additives clear poorly when kidneys are impaired.",
  },
  "carrageenan": {
    ibs: "Not recommended with IBS / sensitive gut — carrageenan may worsen bloating or inflammation for some people.",
  },
  "polysorbate-80": {
    ibs: "Use caution with IBS — some emulsifiers may irritate a sensitive gut.",
  },
  "polysorbate-60": {
    ibs: "Use caution with IBS — industrial emulsifiers may bother sensitive digestion.",
  },
  "sulfites": {
    asthma: "Not recommended with asthma / sulfite sensitivity — sulfites can trigger breathing problems.",
  },
  "yellow-5": {
    asthma: "Use caution with asthma — tartrazine (Yellow 5) can trigger reactions in some sensitive people.",
  },
};

// —— DOM ——
const scanBtn = document.getElementById("scanBtn");
const imageInput = document.getElementById("imageInput");
const resultBox = document.getElementById("resultBox");
const loader = document.getElementById("loader");
const foodQuestionStep = document.getElementById("foodQuestionStep");
const scanStep = document.getElementById("scanStep");
const notFoodStep = document.getElementById("notFoodStep");
const yesFoodBtn = document.getElementById("yesFoodBtn");
const noFoodBtn = document.getElementById("noFoodBtn");
const backFromScanBtn = document.getElementById("backFromScanBtn");
const backFromNotFoodBtn = document.getElementById("backFromNotFoodBtn");
const dropZone = document.getElementById("dropZone");
const previewWrap = document.getElementById("previewWrap");
const previewImg = document.getElementById("previewImg");
const clearPreviewBtn = document.getElementById("clearPreviewBtn");
const pasteToggleBtn = document.getElementById("pasteToggleBtn");
const pastePanel = document.getElementById("pastePanel");
const pasteText = document.getElementById("pasteText");
const analyzeTextBtn = document.getElementById("analyzeTextBtn");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const progressLabel = document.getElementById("progressLabel");
const conditionList = document.getElementById("conditionList");
const conditionActiveNote = document.getElementById("conditionActiveNote");

let currentObjectUrl = null;
let isScanning = false;

// —— Health conditions ——
function loadConditions() {
  try {
    const raw = JSON.parse(localStorage.getItem(CONDITIONS_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((id) => HEALTH_CONDITIONS.some((c) => c.id === id)) : [];
  } catch {
    return [];
  }
}

function saveConditions(ids) {
  localStorage.setItem(CONDITIONS_KEY, JSON.stringify(ids));
}

let activeConditions = loadConditions();

function conditionLabel(id) {
  return HEALTH_CONDITIONS.find((c) => c.id === id)?.label || id;
}

function renderConditions() {
  if (!conditionList) return;
  conditionList.innerHTML = HEALTH_CONDITIONS.map((c) => {
    const checked = activeConditions.includes(c.id) ? "checked" : "";
    return `
      <label class="condition-row">
        <input type="checkbox" data-condition="${c.id}" ${checked}>
        <span>
          <strong>${escapeHtml(c.label)}</strong>
          <span>${escapeHtml(c.description)}</span>
        </span>
      </label>`;
  }).join("");

  conditionList.querySelectorAll("input[type=checkbox]").forEach((el) => {
    el.addEventListener("change", () => {
      activeConditions = [...conditionList.querySelectorAll("input:checked")].map((i) => i.dataset.condition);
      saveConditions(activeConditions);
      updateConditionNote();
    });
  });
  updateConditionNote();
}

function updateConditionNote() {
  if (!conditionActiveNote) return;
  if (activeConditions.length === 0) {
    conditionActiveNote.textContent = "No conditions selected — you’ll still see general additive risks.";
    return;
  }
  const names = activeConditions.map(conditionLabel).join(", ");
  conditionActiveNote.textContent = `Active: ${names}. Scans will flag foods not recommended for these.`;
}

/** Attach personal “not recommended” tips based on selected conditions. */
function withConditionAdvice(findings) {
  return findings.map((item) => {
    const map = AVOID_FOR[item.id] || {};
    const tips = activeConditions
      .filter((cid) => map[cid])
      .map((cid) => ({ conditionId: cid, label: conditionLabel(cid), advice: map[cid] }));
    return { ...item, conditionTips: tips };
  });
}

function getConditionAlerts(findings) {
  const alerts = [];
  for (const item of findings) {
    for (const tip of item.conditionTips || []) {
      alerts.push({
        ingredient: item.name,
        conditionId: tip.conditionId,
        condition: tip.label,
        advice: tip.advice,
      });
    }
  }
  return alerts;
}

// —— History ——
function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(entries) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
}

function addHistoryEntry({ source, findings, extractedText }) {
  const entries = loadHistory();
  entries.unshift({
    id: Date.now().toString(36),
    at: new Date().toISOString(),
    source,
    count: findings.length,
    high: findings.filter((f) => f.severity === "high").length,
    moderate: findings.filter((f) => f.severity === "moderate").length,
    low: findings.filter((f) => f.severity === "low").length,
    names: findings.slice(0, 5).map((f) => f.name),
    snippet: (extractedText || "").replace(/\s+/g, " ").trim().slice(0, 140),
    extractedText: (extractedText || "").slice(0, 4000),
    findingIds: findings.map((f) => f.id),
  });
  saveHistory(entries);
  renderHistory();
}

function renderHistory() {
  if (!historyList) return;
  const entries = loadHistory();
  if (entries.length === 0) {
    historyList.innerHTML = `<p class="history-empty">No scans yet. Your recent checks will show up here.</p>`;
    return;
  }

  historyList.innerHTML = entries
    .map((e) => {
      const when = formatRelative(e.at);
      const summary =
        e.count === 0
          ? "No concerns flagged"
          : `${e.count} harmful if consumed${e.high ? ` · ${e.high} high risk` : ""}`;
      return `
        <button type="button" class="history-item" data-id="${e.id}">
          <span class="history-meta">${escapeHtml(when)} · ${escapeHtml(e.source)}</span>
          <span class="history-summary">${escapeHtml(summary)}</span>
          ${e.names?.length ? `<span class="history-tags">${e.names.map((n) => escapeHtml(n)).join(" · ")}</span>` : ""}
        </button>`;
    })
    .join("");

  historyList.querySelectorAll(".history-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const entry = loadHistory().find((x) => x.id === btn.dataset.id);
      if (entry) replayHistory(entry);
    });
  });
}

function replayHistory(entry) {
  const findings = INGREDIENT_DB.filter((i) => entry.findingIds?.includes(i.id)).map((i) => ({
    ...i,
    matchedAlias: i.aliases[0],
  }));
  displayFindings(findings, entry.extractedText || entry.snippet || "", { fromHistory: true });
}

function formatRelative(iso) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

// —— Matching ——
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019']/g, "")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^a-z0-9\s.\-&]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Fix common OCR mix-ups before matching. */
function enhanceOcrText(text) {
  return text
    .replace(/\bE\s*[-]?\s*(\d{3}[a-z]?)\b/gi, "e$1")
    .replace(/\bFD\s*[& ]?\s*C\b/gi, "fd&c")
    .replace(/\bmonosodiurn\b/gi, "monosodium")
    .replace(/\bbenzoat[eo]\b/gi, "benzoate")
    .replace(/\bcarageenan\b/gi, "carrageenan")
    .replace(/\bpartially\s+hydrogenat[eo]d\b/gi, "partially hydrogenated");
}

function findAliasIndex(normalized, alias) {
  const a = normalizeText(alias);
  if (!a) return -1;
  if (a.length <= 4 || /^e\d+[a-z]?$/i.test(a) || /^(msg|bha|bht|ada|bvo|hvp|hfcs|tio2|acek|ace-k)$/i.test(a)) {
    const escaped = a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?:^|[^a-z0-9])(${escaped})(?:[^a-z0-9]|$)`, "i");
    const m = normalized.match(re);
    if (!m) return -1;
    return normalized.indexOf(m[1], m.index);
  }
  return normalized.indexOf(a);
}

function spansOverlap(aStart, aLen, bStart, bLen) {
  const aEnd = aStart + aLen;
  const bEnd = bStart + bLen;
  return aStart < bEnd && bStart < aEnd;
}

function findIngredients(rawText) {
  const normalized = normalizeText(enhanceOcrText(rawText));
  const candidates = [];

  for (const item of INGREDIENT_DB) {
    const aliasesByLen = [...item.aliases].sort((a, b) => b.length - a.length);
    for (const alias of aliasesByLen) {
      const idx = findAliasIndex(normalized, alias);
      if (idx === -1) continue;
      const aliasNorm = normalizeText(alias);
      candidates.push({
        ...item,
        matchedAlias: alias,
        matchStart: idx,
        matchLen: aliasNorm.length,
      });
      break; // one alias per ingredient
    }
  }

  // Prefer longer matches; drop shorter ones that sit inside a longer hit (HFCS vs corn syrup).
  candidates.sort((a, b) => b.matchLen - a.matchLen || SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
  const kept = [];
  for (const c of candidates) {
    const nested = kept.some((k) =>
      spansOverlap(c.matchStart, c.matchLen, k.matchStart, k.matchLen) && c.matchLen < k.matchLen
    );
    if (!nested) kept.push(c);
  }

  kept.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || a.name.localeCompare(b.name));
  const found = kept.map(({ matchStart, matchLen, ...rest }) => rest);

  // Plain "sugar" / "sugars" (but not "sugar free") — important for diabetes checks
  if (!found.some((f) => f.id === "added-sugar") && hasAddedSugarWord(normalized)) {
    const sugarItem = INGREDIENT_DB.find((i) => i.id === "added-sugar");
    if (sugarItem) {
      found.push({ ...sugarItem, matchedAlias: "sugar" });
      found.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || a.name.localeCompare(b.name));
    }
  }

  return found;
}

function hasAddedSugarWord(normalized) {
  return /(?:^|[^a-z0-9])sugars?(?!\s*free)(?:[^a-z0-9]|$)/i.test(normalized);
}

// —— UI flow ——
function showFoodQuestion() {
  foodQuestionStep.classList.remove("hidden");
  scanStep.classList.add("hidden");
  notFoodStep.classList.add("hidden");
  resetResultBox();
  stopScanning();
  clearPreview();
}

function showScanStep() {
  foodQuestionStep.classList.add("hidden");
  notFoodStep.classList.add("hidden");
  scanStep.classList.remove("hidden");
}

function showNotFoodStep() {
  foodQuestionStep.classList.add("hidden");
  scanStep.classList.add("hidden");
  notFoodStep.classList.remove("hidden");
}

function resetResultBox() {
  resultBox.classList.remove("result-show", "result-danger", "result-safe", "result-error", "result-mixed");
  resultBox.innerHTML = "";
}

function showResults(html, type) {
  resultBox.innerHTML = html;
  resultBox.className = "";
  resultBox.id = "resultBox";
  resultBox.classList.add("result-show", type);
  resultBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function startScanning(label = "Reading label photo...") {
  isScanning = true;
  scanBtn.classList.add("scanning");
  scanBtn.textContent = "Scanning...";
  scanBtn.disabled = true;
  loader.classList.remove("hidden");
  if (progressLabel) {
    progressLabel.textContent = label;
    progressLabel.classList.remove("hidden");
  }
  resetResultBox();
}

function stopScanning() {
  isScanning = false;
  scanBtn.classList.remove("scanning");
  scanBtn.textContent = "Choose photo";
  scanBtn.disabled = false;
  loader.classList.add("hidden");
  if (progressLabel) progressLabel.classList.add("hidden");
  imageInput.value = "";
}

function clearPreview() {
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
  if (previewWrap) previewWrap.classList.add("hidden");
  if (previewImg) previewImg.removeAttribute("src");
}

function setPreview(file) {
  clearPreview();
  currentObjectUrl = URL.createObjectURL(file);
  previewImg.src = currentObjectUrl;
  previewWrap.classList.remove("hidden");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function verdictFor(findings, conditionAlerts = []) {
  if (conditionAlerts.length > 0) {
    const condNames = [...new Set(conditionAlerts.map((a) => a.condition))].join(", ");
    return {
      type: "result-danger",
      label: "Not recommended for your conditions",
      detail: `${conditionAlerts.length} ingredient${conditionAlerts.length === 1 ? "" : "s"} conflict with: ${condNames}.`,
    };
  }
  if (findings.length === 0) {
    return {
      type: "result-safe",
      label: "No harmful additives matched",
      detail: "Nothing on our concern list was found. That does not guarantee the product is healthy.",
    };
  }
  const high = findings.filter((f) => f.severity === "high").length;
  if (high > 0) {
    return {
      type: "result-danger",
      label: `${findings.length} harmful if consumed`,
      detail: `${high} high-risk ingredient${high === 1 ? "" : "s"} — see health risks below before regular use.`,
    };
  }
  return {
    type: "result-mixed",
    label: `${findings.length} concern${findings.length === 1 ? "" : "s"} if consumed`,
    detail: "Review each ingredient’s health risks below. Occasional use differs from daily intake.",
  };
}

function groupByCategory(findings) {
  const map = new Map();
  for (const f of findings) {
    if (!map.has(f.category)) map.set(f.category, []);
    map.get(f.category).push(f);
  }
  return map;
}

function renderIngredientCard(item, delayIndex) {
  const risks = (item.risks || []).map((r) => `<li>${escapeHtml(r)}</li>`).join("");
  const tips = item.conditionTips || [];
  const tipHtml = tips
    .map(
      (t) => `
      <div class="condition-tag">${escapeHtml(t.label)} — not recommended</div>
      <p class="watch-for"><span>For your ${escapeHtml(t.label)}:</span> ${escapeHtml(t.advice)}</p>`
    )
    .join("");

  return `
    <article class="ingredient-item${tips.length ? " has-condition-warn" : ""}" style="animation-delay: ${delayIndex * 0.08}s">
      <div class="ingredient-top">
        <h4>${escapeHtml(item.name)}</h4>
        <span class="sev-badge sev-${item.severity}">${item.severity} risk</span>
      </div>
      <p class="ingredient-note">${escapeHtml(item.note)}</p>
      ${tipHtml}
      <div class="risk-block">
        <p class="risk-heading">If you consume this regularly</p>
        <ul class="risk-list">${risks}</ul>
      </div>
      ${
        item.watchFor
          ? `<p class="watch-for"><span>Who should be careful:</span> ${escapeHtml(item.watchFor)}</p>`
          : ""
      }
      <p class="matched-as">Found on label as “${escapeHtml(item.matchedAlias)}”</p>
    </article>`;
}

function displayFindings(allFindings, extractedText, { fromHistory = false, source = "scan" } = {}) {
  const findings = withConditionAdvice(allFindings);
  const conditionAlerts = getConditionAlerts(findings);
  const verdict = verdictFor(findings, conditionAlerts);
  const high = findings.filter((f) => f.severity === "high").length;
  const moderate = findings.filter((f) => f.severity === "moderate").length;
  const low = findings.filter((f) => f.severity === "low").length;

  let html = `
    <div class="report-header">
      <div class="verdict-block">
        <p class="verdict-label">${escapeHtml(verdict.label)}</p>
        <p class="verdict-detail">${escapeHtml(verdict.detail)}</p>
        ${fromHistory ? `<p class="history-replay-note">Restored from history</p>` : ""}
      </div>
      <div class="score-pills" aria-label="Risk breakdown">
        <span class="pill pill-high"><strong>${high}</strong> high</span>
        <span class="pill pill-mod"><strong>${moderate}</strong> mod</span>
        <span class="pill pill-low"><strong>${low}</strong> low</span>
      </div>
    </div>
  `;

  if (conditionAlerts.length > 0) {
    html += `
      <div class="condition-alert-box">
        <h3>Not recommended for you</h3>
        <p>Based on your saved health conditions, these ingredients are a poor match if you eat this product:</p>
        <ul class="condition-alert-list">
          ${conditionAlerts
            .map(
              (a) => `
            <li>
              <strong>${escapeHtml(a.ingredient)} · ${escapeHtml(a.condition)}</strong>
              ${escapeHtml(a.advice)}
            </li>`
            )
            .join("")}
        </ul>
      </div>`;
  } else if (activeConditions.length > 0 && findings.length === 0) {
    html += `
      <div class="empty-findings">
        <h3>No conflicts with your conditions</h3>
        <p>Nothing matched your selected conditions (${escapeHtml(activeConditions.map(conditionLabel).join(", "))}) on this label. Still not a full medical OK.</p>
      </div>`;
  } else if (findings.length === 0) {
    html += `
      <div class="empty-findings">
        <h3>No harmful ingredients found</h3>
        <p>Based on our curated list — absence of a flag is not a safety guarantee.</p>
      </div>
    `;
  }

  if (findings.length > 0) {
    html += `
      <div class="harmful-summary">
        <h3 class="report-section-title">Harmful ingredients in this product</h3>
        <p class="summary-lead">If you eat or drink this, these are the flagged additives and why they matter:</p>
        <ol class="harmful-name-list">
          ${findings
            .map(
              (item, i) => `
            <li>
              <span class="harmful-index">${i + 1}</span>
              <span class="harmful-name">${escapeHtml(item.name)}</span>
              <span class="sev-badge sev-${item.severity}">${item.severity}</span>
              ${
                item.conditionTips?.length
                  ? `<span class="condition-tag">Not for ${escapeHtml(item.conditionTips.map((t) => t.label).join(", "))}</span>`
                  : ""
              }
            </li>`
            )
            .join("")}
        </ol>
      </div>
      <h3 class="report-section-title">Health risks by ingredient</h3>
    `;

    const groups = groupByCategory(findings);
    let delay = 0;
    for (const [category, items] of groups) {
      html += `<div class="cat-group"><h4 class="cat-title">${escapeHtml(category)}</h4>`;
      for (const item of items) {
        html += renderIngredientCard(item, delay);
        delay += 1;
      }
      html += `</div>`;
    }
  }

  const safeText = escapeHtml(extractedText || "(empty)");
  html += `
    <details class="extracted-details">
      <summary>Text read from your photo</summary>
      <pre class="extracted-text">${safeText}</pre>
    </details>
    <p class="disclaimer-inline">Educational information only — not medical advice. Risks depend on amount, frequency, and your health. Ask a clinician for personal guidance.</p>
  `;

  showResults(html, verdict.type);

  if (!fromHistory) {
    addHistoryEntry({ source, findings: allFindings, extractedText });
  }
}

/** Upscale / sharpen contrast a bit so OCR reads small label type better. */
async function prepareImageForOcr(file) {
  try {
    const bitmap = await createImageBitmap(file);
    const maxSide = 2000;
    const scale = Math.min(2, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const imageData = ctx.getImageData(0, 0, w, h);
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const boosted = gray < 140 ? gray * 0.75 : Math.min(255, gray * 1.15);
      d[i] = d[i + 1] = d[i + 2] = boosted;
    }
    ctx.putImageData(imageData, 0, 0);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    return blob || file;
  } catch {
    return file;
  }
}

async function processImageFile(file) {
  if (!file || isScanning) return;
  if (!file.type.startsWith("image/")) {
    showResults("<h3>Invalid file</h3><p>Please upload a photo of an ingredient label.</p>", "result-error");
    return;
  }

  setPreview(file);
  startScanning("Preparing your label photo...");

  try {
    const prepared = await prepareImageForOcr(file);
    if (progressLabel) progressLabel.textContent = "Reading ingredients from photo...";

    const result = await Tesseract.recognize(prepared, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text" && progressLabel && typeof m.progress === "number") {
          progressLabel.textContent = `Reading ingredients… ${Math.round(m.progress * 100)}%`;
        }
      },
    });
    const extractedText = (result.data.text || "").trim();
    if (extractedText.length < 8) {
      showResults(
        `<h3>Hard to read this photo</h3>
         <p>We could not read enough text. Try brighter light, a flatter label, crop to Ingredients only, or paste the list below — then we will list every harmful ingredient and its health risks.</p>
         <details class="extracted-details" open><summary>What we got</summary><pre class="extracted-text">${escapeHtml(extractedText || "(empty)")}</pre></details>`,
        "result-error"
      );
      pastePanel?.classList.remove("hidden");
      return;
    }

    if (progressLabel) progressLabel.textContent = "Checking for harmful ingredients...";
    const findings = findIngredients(extractedText);
    displayFindings(findings, extractedText, { source: "photo" });
  } catch (error) {
    console.error(error);
    showResults(
      "<h3>Scan failed</h3><p>Could not read the photo. Try a clearer label image, or paste the ingredient text — we will still show harmful ingredients and health risks.</p>",
      "result-error"
    );
  } finally {
    stopScanning();
  }
}

function analyzePastedText() {
  const text = (pasteText?.value || "").trim();
  if (!text) {
    showResults("<h3>No text</h3><p>Paste an ingredients list first.</p>", "result-error");
    return;
  }
  const findings = findIngredients(text);
  displayFindings(findings, text, { source: "paste" });
}

// —— Events ——
yesFoodBtn.addEventListener("click", showScanStep);
noFoodBtn.addEventListener("click", showNotFoodStep);
backFromScanBtn.addEventListener("click", showFoodQuestion);
backFromNotFoodBtn.addEventListener("click", showFoodQuestion);

scanBtn.addEventListener("click", () => imageInput.click());
imageInput.addEventListener("change", () => {
  const file = imageInput.files?.[0];
  if (file) processImageFile(file);
});

clearPreviewBtn?.addEventListener("click", () => {
  clearPreview();
  resetResultBox();
});

pasteToggleBtn?.addEventListener("click", () => {
  pastePanel.classList.toggle("hidden");
  if (!pastePanel.classList.contains("hidden")) pasteText?.focus();
});

analyzeTextBtn?.addEventListener("click", analyzePastedText);

clearHistoryBtn?.addEventListener("click", () => {
  if (confirm("Clear all scan history on this device?")) {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  }
});

if (dropZone) {
  ["dragenter", "dragover"].forEach((evt) => {
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.add("drag-over");
    });
  });
  ["dragleave", "drop"].forEach((evt) => {
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.remove("drag-over");
    });
  });
  dropZone.addEventListener("drop", (e) => {
    const file = e.dataTransfer?.files?.[0];
    if (file) processImageFile(file);
  });
  dropZone.addEventListener("click", (e) => {
    if (e.target === dropZone || e.target.closest("[data-drop-trigger]")) {
      imageInput.click();
    }
  });
  dropZone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      imageInput.click();
    }
  });
}

renderConditions();
renderHistory();
