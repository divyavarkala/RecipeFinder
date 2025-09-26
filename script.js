const recipesContainer = document.getElementById("recipes");
const ingredientsInput = document.getElementById("ingredients");
const searchBtn = document.getElementById("searchBtn");
const strictModeToggle = document.getElementById("strictModeToggle");

const apiKey = "c3665ed610a34091a1a841daee41cbd2"; // replace with your Spoonacular API key

const utils = {
  // Normalizes text for comparison (removes punctuation, converts to lowercase, handles plurals)
  normalizeForMatch: (s) => {
    if (!s) return "";
    let t = s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "");
    if (t.length > 3) {
      if (t.endsWith("es")) t = t.slice(0, -2);
      else if (t.endsWith("s")) t = t.slice(0, -1);
    }
    return t;
  },
  // Escapes HTML for security
  escapeHtml: (str) => {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },
};

// 🔹 Search Button Click
searchBtn.addEventListener("click", () => {
  handleSearch();
});

// 🔹 Enter Key Support
ingredientsInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleSearch();
  }
});

function handleSearch() {
  const rawInput = ingredientsInput.value.trim();
  if (!rawInput) {
    alert("Please enter at least one ingredient.");
    return;
  }

  const userIngredients = rawInput
    .split(",")
    .map(utils.normalizeForMatch)
    .filter(Boolean);

  if (userIngredients.length === 0) {
    alert("Please enter valid ingredients.");
    return;
  }

  // 👇 ADD THIS LINE to scroll down to the recipes section
  recipesContainer.scrollIntoView({ behavior: 'smooth' });

  fetchRecipes(rawInput, userIngredients);
}

// 🔹 Fetch Recipes (No changes here)
async function fetchRecipes(ingredientsRaw, userIngredients) {
  recipesContainer.innerHTML = "<p>Loading recipes...</p>";
  recipesContainer.classList.add("loading");

  try {
    const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(
      ingredientsRaw
    )}&number=20&ignorePantry=true&ranking=2&apiKey=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API error ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    let results = data.filter((r) => {
      const usedNames = (r.usedIngredients || []).map((i) =>
        utils.normalizeForMatch(i.name)
      );
      return userIngredients.every((ui) => usedNames.includes(ui));
    });

    if (strictModeToggle.checked) {
      results = results.filter((r) => (r.missedIngredientCount || 0) === 0);
    }

    if (results.length === 0) {
      recipesContainer.innerHTML =
        "<p>No recipes found with all your ingredients. Try a different search.</p>";
      return;
    }

    displayRecipes(results);
  } catch (err) {
    recipesContainer.innerHTML = `<p>Something went wrong: ${utils.escapeHtml(
      err.message
    )}. Please try again.</p>`;
    console.error(err);
  } finally {
    recipesContainer.classList.remove("loading");
  }
}

// 🔹 Display Recipes (No changes here)
function displayRecipes(recipes) {
  recipesContainer.innerHTML = "";

  recipes.forEach((recipe) => {
    const usedDisplay = (recipe.usedIngredients || []).map((i) => i.name);
    const missedDisplay = (recipe.missedIngredients || []).map((i) => i.name);

    const card = document.createElement("div");
    card.className = "recipe-card";
    card.innerHTML = `
      <img src="${utils.escapeHtml(recipe.image)}" alt="${utils.escapeHtml(
      recipe.title
    )}" />
      <h3>${utils.escapeHtml(recipe.title)}</h3>

      <p><strong>Used Ingredients:</strong> ${utils.escapeHtml(
      usedDisplay.join(", ")
    )}</p>

      <p><strong>Missing Ingredients:</strong> ${utils.escapeHtml(
      missedDisplay.join(", ") || "None"
    )}</p>

      <a href="https://spoonacular.com/recipes/${encodeURIComponent(
      recipe.title.replace(/\s+/g, "-")
    )}-${recipe.id}" target="_blank" rel="noopener">View Recipe</a>
    `;

    recipesContainer.appendChild(card);
  });
}