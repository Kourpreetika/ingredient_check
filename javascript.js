const scanBtn = document.getElementById("scanBtn");
const imageInput = document.getElementById("imageInput");
const resultBox = document.getElementById("resultBox");

const harmfulIngredients = {
  "high fructose corn syrup": "May increase risk of obesity and blood sugar issues.",
  "sodium benzoate": "Preservative that some people may want to limit.",
  "artificial color": "May cause sensitivity in some people.",
  "palm oil": "High in saturated fat.",
  "msg": "May cause sensitivity in some people.",
  "aspartame": "Artificial sweetener that some users avoid."
};

scanBtn.addEventListener("click", () => {
  imageInput.click();
});

imageInput.addEventListener("change", async () => {
  const file = imageInput.files[0];

  if (!file) {
    return;
  }

  scanBtn.textContent = "Scanning...";
  resultBox.textContent = "Reading text from image...";

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
      resultBox.innerHTML = `
        <h3>No harmful ingredients found</h3>
        <p>Extracted text:</p>
        <p>${extractedText}</p>
      `;
    } else {
      resultBox.innerHTML = "<h3>Harmful Ingredients Found</h3>";

      found.forEach((item) => {
        resultBox.innerHTML += `
          <div>
            <h4>${item.name}</h4>
            <p>${item.risk}</p>
          </div>
        `;
      });

      resultBox.innerHTML += `
        <h3>Extracted Text</h3>
        <p>${extractedText}</p>
      `;
    }
  } catch (error) {
    resultBox.textContent = "Could not scan the image. Try a clearer label photo.";
  }

  scanBtn.textContent = "Scan the Product";
});