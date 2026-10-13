// Original Rosie’s Recipes titles recovered from the October 12 cookbook draft.
// Intentionally do not invent ingredient quantities or cooking instructions.
// The detailed source copy will populate ingredients, steps and timing later.
const sections = [
  ["Breakfast", [
    "The Barkfast Club",
    "Frenchie Toast",
    "Shiba Sunrise Hash",
    "Good Girl Pancakes",
    "Sit. Stay. Shakshuka."
  ]],
  ["Small Bites", [
    "Fetch Me That Feta",
    "Ruff Day Rescue",
    "Who’s a Good Dip?",
    "The Barkuterie Brie",
    "Little Paws, Big Flavor"
  ]],
  ["Main Courses", [
    "Off-Leash Lemon Chicken",
    "The Golden Fetch",
    "Pawsta La Vista, Baby",
    "Rosie’s Sunday Walk",
    "The Top Dog Smash Burger",
    "The Zoomies",
    "Barkbecue Chicken",
    "The Shepherd’s Best Friend",
    "Tail-Wagging Tikka",
    "A Very Good Risotto"
  ]],
  ["Desserts", [
    "Best in Show Brownies",
    "Puppy Love Cookies",
    "The Wagging Tail Apple Crisp",
    "Rosie’s Strawberry Pawfait",
    "Paws for Tiramisu"
  ]]
];
export const RECIPE_CATEGORIES = ["All", ...sections.map(([label]) => label), "Favorites"];
export const RECIPE_CATALOG = sections.flatMap(([category, titles]) =>
  titles.map((title) => ({
    id: title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    title,
    category,
    // Preserve the source recipe text exactly once supplied.
    prepMinutes: null,
    cookMinutes: null,
    servings: null,
    difficulty: null,
    description: "",
    ingredients: [],
    steps: [],
    note: ""
  }))
);
