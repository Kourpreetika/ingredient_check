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

function showFoodQuestion() {
  foodQuestionStep.classList.remove("hidden");
  scanStep.classList.add("hidden");
  notFoodStep.classList.add("hidden");
  resetResultBox();
  stopScanning();
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

yesFoodBtn.addEventListener("click", showScanStep);
noFoodBtn.addEventListener("click", showNotFoodStep);
backFromScanBtn.addEventListener("click", showFoodQuestion);
backFromNotFoodBtn.addEventListener("click", showFoodQuestion);

function resetResultBox() {
  resultBox.classList.remove("result-show", "result-danger", "result-safe", "result-error");
  resultBox.innerHTML = "";
}

function showResults(html, type) {
  resultBox.innerHTML = html;
  resultBox.classList.add("result-show", type);
}

function startScanning() {
  scanBtn.classList.add("scanning");
  scanBtn.textContent = "Scanning...";
  loader.classList.remove("hidden");
  resetResultBox();
  resultBox.innerHTML = '<p class="scan-status">Reading text from image...</p>';
  resultBox.classList.add("result-show");
}

function stopScanning() {
  scanBtn.classList.remove("scanning");
  scanBtn.textContent = "Scan the Product";
  loader.classList.add("hidden");
  imageInput.value = "";
}

  const harmfulIngredients = {
    // === SWEETENERS ===
    "high fructose corn syrup": "Added sugar linked to blood sugar and weight concerns.",
    "hfcs": "High fructose corn syrup; added sugar.",
    "corn syrup": "Added sugar; common in processed foods.",
    "glucose-fructose syrup": "Added sugar syrup; similar concerns to HFCS.",
    "invert sugar": "Added sugar; may spike blood sugar quickly.",
    "aspartame": "Artificial sweetener; some people choose to avoid it.",
    "sucralose": "Artificial sweetener; some people choose to avoid it.",
    "saccharin": "Artificial sweetener; some people choose to avoid it.",
    "acesulfame potassium": "Artificial sweetener (Ace-K).",
    "acesulfame k": "Artificial sweetener (Ace-K).",
    "neotame": "Artificial sweetener; highly processed.",
    "e950": "Artificial sweetener (Acesulfame K).",
    "e951": "Artificial sweetener (Aspartame).",
    "e955": "Artificial sweetener (Sucralose).",
    "e954": "Artificial sweetener (Saccharin).",
    // === PRESERVATIVES ===
    "sodium benzoate": "Preservative; some people may want to limit intake.",
    "potassium benzoate": "Preservative related to benzoates.",
    "potassium sorbate": "Preservative commonly used in processed foods.",
    "calcium propionate": "Preservative used in breads and baked goods.",
    "sodium nitrite": "Cured-meat preservative; limit intake when possible.",
    "sodium nitrate": "Cured-meat preservative; limit intake when possible.",
    "bha": "Synthetic antioxidant preservative (BHA).",
    "bht": "Synthetic antioxidant preservative (BHT).",
    "tbhq": "Synthetic antioxidant preservative (TBHQ).",
    "sodium sulfite": "Sulfite preservative; may affect sensitive people.",
    "sodium metabisulfite": "Sulfite preservative; may affect sensitive people.",
    "e211": "Preservative (Sodium benzoate).",
    "e202": "Preservative (Potassium sorbate).",
    "e282": "Preservative (Calcium propionate).",
    "e250": "Preservative (Sodium nitrite).",
    "e251": "Preservative (Sodium nitrate).",
    "e320": "Antioxidant preservative (BHA).",
    "e321": "Antioxidant preservative (BHT).",
    "e319": "Antioxidant preservative (TBHQ).",
    // === ARTIFICIAL COLORS ===
    "red 40": "Artificial color; may cause sensitivity in some people.",
    "red 40 lake": "Artificial color; may cause sensitivity in some people.",
    "allura red": "Artificial red color (Red 40).",
    "yellow 5": "Artificial color; may cause sensitivity in some people.",
    "yellow 6": "Artificial color; may cause sensitivity in some people.",
    "blue 1": "Artificial color; may cause sensitivity in some people.",
    "blue 2": "Artificial color; may cause sensitivity in some people.",
    "tartrazine": "Artificial yellow color (Yellow 5).",
    "sunset yellow": "Artificial yellow color (Yellow 6).",
    "brilliant blue": "Artificial blue color (Blue 1).",
    "caramel color": "Processed coloring; some types are debated.",
    "e102": "Artificial color (Tartrazine / Yellow 5).",
    "e110": "Artificial color (Sunset Yellow / Yellow 6).",
    "e129": "Artificial color (Allura Red / Red 40).",
    "e133": "Artificial color (Brilliant Blue / Blue 1).",
    "e150a": "Caramel color (Class I).",
    "e150d": "Caramel color (Class IV); some people avoid it.",
    "artificial color": "Synthetic coloring; may cause sensitivity in some people.",
    "artificial colour": "Synthetic coloring; may cause sensitivity in some people.",
    "fd&c": "FDA-certified artificial dye.",
    // === FATS & OILS ===
    "palm oil": "High in saturated fat; environmental concerns for some buyers.",
    "palm kernel oil": "High in saturated fat.",
    "hydrogenated vegetable oil": "May contain trans fats depending on processing.",
    "partially hydrogenated": "Associated with trans fats; many countries restrict it.",
    "interesterified": "Highly processed fat substitute.",
    "shortening": "Often high in saturated or trans fats.",
    // === FLAVOR ENHANCERS ===
    "msg": "Flavor enhancer; may cause sensitivity in some people.",
    "monosodium glutamate": "Flavor enhancer (MSG); may cause sensitivity in some people.",
    "disodium guanylate": "Flavor enhancer often used with MSG.",
    "disodium inosinate": "Flavor enhancer often used with MSG.",
    "yeast extract": "Natural source of glutamates; similar to MSG for some people.",
    "autolyzed yeast": "Contains glutamates; similar concern to MSG for some people.",
    "hydrolyzed vegetable protein": "Source of glutamates; processed flavor enhancer.",
    "e621": "Flavor enhancer (MSG).",
    "e627": "Flavor enhancer (Disodium guanylate).",
    "e631": "Flavor enhancer (Disodium inosinate).",
    "e635": "Flavor enhancer (Ribonucleotides).",
    // === ARTIFICIAL FLAVORS ===
    "artificial flavor": "Synthetic flavoring; not from natural sources.",
    "artificial flavour": "Synthetic flavoring; not from natural sources.",
    "natural and artificial flavor": "Contains synthetic flavor components.",
    "natural and artificial flavour": "Contains synthetic flavor components.",
    // === THICKENERS & EMULSIFIERS ===
    "carrageenan": "Thickener; some people choose to avoid it.",
    "polysorbate 80": "Emulsifier; highly processed additive.",
    "polysorbate 60": "Emulsifier; highly processed additive.",
    "propylene glycol": "Humectant/solvent; used in many processed foods.",
    "e407": "Thickener (Carrageenan).",
    "e433": "Emulsifier (Polysorbate 80).",
    "e1520": "Humectant (Propylene glycol).",
    // === OTHER COMMON ADDITIVES ===
    "sodium phosphate": "Phosphate additive; high intake may be a concern for some.",
    "trisodium phosphate": "Phosphate additive used in processed foods.",
    "modified food starch": "Highly processed starch; check source if avoiding gluten etc.",
    "maltodextrin": "Highly processed carbohydrate; can spike blood sugar.",
    "dextrose": "Simple sugar; may affect blood sugar.",
    "fructose": "Added sugar; may affect blood sugar and liver load.",
    "invert syrup": "Added sugar syrup.",
    "sodium aluminosilicate": "Anti-caking agent; some people avoid aluminum compounds.",
    "titanium dioxide": "Whitening agent; restricted in some regions.",
    "e171": "Whitening agent (Titanium dioxide).",
};

scanBtn.addEventListener("click", () => {
  imageInput.click();
});

imageInput.addEventListener("change", async () => {
  const file = imageInput.files[0];

  if (!file) {
    return;
  }

  startScanning();

  try {
    const result = await Tesseract.recognize(file, "eng");
    const extractedText = result.data.text;
    const lowerText = extractedText.toLowerCase();

    const found = [];

    for (const ingredient in harmfulIngredients) {
      if (lowerText.includes(ingredient)) {
        found.push({
          name: ingredient,
          risk: harmfulIngredients[ingredient]
        });
      }
    }

    if (found.length === 0) {
      showResults(`
        <h3>No harmful ingredients found</h3>
        <p>Extracted text:</p>
        <p>${extractedText}</p>
      `, "result-safe");
    } else {
      let html = "<h3>Harmful Ingredients Found</h3>";

      found.forEach((item, index) => {
        html += `
          <div class="ingredient-item" style="animation-delay: ${index * 0.15}s">
            <h4>${item.name}</h4>
            <p>${item.risk}</p>
          </div>
        `;
      });

      html += `
        <h3>Extracted Text</h3>
        <p>${extractedText}</p>
      `;

      showResults(html, "result-danger");
    }
  } catch (error) {
    showResults(
      "<h3>Scan failed</h3><p>Could not scan the image. Try a clearer label photo.</p>",
      "result-error"
    );
  }

  stopScanning();
});