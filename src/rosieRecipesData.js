// Rosie’s Recipes — source transcription of all 25 original recipes supplied by the user.
// Editorially benchmarked against comparable published recipes; not independently kitchen-tested.
// Time labels are estimated elapsed ranges; indicated advance prep and chilling are explicit.
// Original identities and yields retained; ingredient ratios and methods selectively corrected.
// Benchmark references and change rationale: docs/recipe-validation-2026-11-24.md.
import { NEW_RECIPES } from "./rosieRecipesExpansion.js";
export const COOKBOOK = {
  "collectionTitle": "Rosie’s Recipes",
  "subtitle": "The Royal Cookbook - 35 Recipes for Rosie’s Favorite Humans",
  "humanOnly": "These recipes are for humans, not for sharing with Rosie.",
  "labels": {
    "Breakfast": "Rise & Wag",
    "Small Bites": "Treats for the Pack",
    "Main Courses": "Best in Show",
    "Desserts": "Sweet Dreams & Puppy Eyes"
  }
};
const rows = [
  [
    "Breakfast",
    "The Barkfast Club",
    "Breakfast Sandwich with Crispy Bacon, Sharp Cheddar & Dijon",
    "Rosie believes every important day deserves a proper send-off. Preferably involving bacon.",
    "Easy",
    25,
    2,
    "2 servings",
    "2 brioche buns, 4 slices thick-cut bacon, 2 eggs, 2 slices sharp cheddar, 1 tbsp mayonnaise, 1 tsp Dijon mustard, 1 handful arugula, 1 tsp butter, salt and pepper",
    [
      "Cook the bacon. Place the 4 slices in a cold skillet in a single layer. Set over medium heat and cook for 8–12 minutes, turning occasionally, until crisp. Transfer to a paper-towel-lined plate; pour off excess fat, leaving a thin film if using it to toast the buns.",
      "Make the sauce. Stir the mayonnaise and Dijon together in a small bowl. Set aside.",
      "Toast the buns. Split both brioche buns and toast cut-side down in the skillet over medium heat for 1–2 minutes until golden. Transfer to plates.",
      "Fry the eggs. Lower the heat to medium-low and melt the butter in the skillet. Crack in both eggs, season with salt and pepper, and cook for 3–5 minutes, then flip and cook as needed until both whites and yolks are firm. Place a cheddar slice on each egg for the last minute and cover to melt.",
      "Assemble. Divide the Dijon mayo among the cut sides of the buns. Layer each bottom bun with 2 bacon slices, 1 cheese-topped egg and half the arugula. Close the sandwiches and serve immediately."
    ],
    "Toast the buns cut-side down in a little bacon fat for restaurant-quality flavor.",
    "20–25 min"
  ],
  [
    "Breakfast",
    "Frenchie Toast",
    "Orange-Vanilla Brioche French Toast with Warm Berries",
    "A little French sophistication for a dog who insists that breakfast should be an occasion.",
    "Easy",
    35,
    4,
    "4 servings",
    "8 brioche slices (¾-inch thick), 4 large eggs, 1 cup whole milk, 1 tsp vanilla, zest of 1 orange, 1 tbsp sugar, 3 tbsp butter, 1½ cups mixed berries, 1 tbsp honey, 2 tbsp orange juice",
    [
      "Make the berry topping. Combine the berries, honey and orange juice in a small saucepan over medium heat. Bring to a gentle simmer, then cook for 4–5 minutes, stirring occasionally, until the berries soften and release their juices. Keep warm on low heat.",
      "Prepare the custard. In a shallow dish, whisk the eggs, milk, vanilla, orange zest and sugar until evenly combined and no streaks of egg remain.",
      "Heat the skillet. Set a large nonstick skillet or griddle over medium heat. Melt a portion of the 3 tablespoons of butter; reserve the rest for subsequent batches.",
      "Dip and cook. Dip each brioche slice in the custard for about 10–15 seconds per side, until moistened but not falling apart. Let excess drip off. Cook in a single layer for about 3 minutes per side, until golden and the center is set with no wet custard (160°F / 71°C if checked with a thermometer). Reduce the heat if the outside browns too quickly.",
      "Repeat with the remaining brioche and butter. Hold finished slices on a rack in a 200°F (95°C) oven if cooking multiple batches. Serve 2 slices per person with the warm berry mixture and its juices spooned over the top."
    ],
    "Slightly stale brioche absorbs custard without falling apart.",
    "25–35 min"
  ],
  [
    "Breakfast",
    "Shiba Sunrise Hash",
    "Golden Potato, Pepper & Egg Breakfast Skillet",
    "Bright, colorful, slightly mischievous, and guaranteed to get everyone out of bed.",
    "Easy",
    45,
    4,
    "4 servings",
    "1 lb Yukon Gold potatoes, 1 red bell pepper, ½ yellow onion, 2 cups baby spinach, 4 eggs, 2 tbsp olive oil, 1 tsp smoked paprika, salt, pepper, chopped scallions",
    [
      "Prepare the vegetables. Cut the potatoes into ½-inch cubes, dice the bell pepper and onion, and chop the scallions.",
      "Parboil the potatoes. Place them in a saucepan, cover with cold salted water, bring to a boil and reduce to a simmer and cook for 4–7 minutes, until the edges soften but the centers still offer slight resistance. Drain thoroughly and let steam-dry for 2 minutes.",
      "Crisp the potatoes. Heat the olive oil in a 12-inch skillet over medium-high heat. Add the potatoes in a single layer and cook for about 10 minutes, turning every few minutes, until golden on several sides.",
      "Add the pepper, onion, smoked paprika, salt and pepper. Reduce to medium heat and cook for 5–7 minutes, stirring occasionally, until the vegetables soften. Stir in the spinach and cook 1–2 minutes, until wilted.",
      "Make four wells in the hash and crack one egg into each. Reduce to medium-low, cover and cook for 5–8 minutes, or longer if needed, until the whites and yolks are firm.",
      "Remove from the heat, scatter with scallions and serve directly from the skillet."
    ],
    "Don’t overcrowd the pan - potatoes need contact with the skillet to develop a proper golden crust.",
    "40–45 min"
  ],
  [
    "Breakfast",
    "Good Girl Pancakes",
    "Fluffy Lemon-Ricotta Pancakes with Blueberries",
    "Soft, sunny pancakes that deserve enthusiastic praise and absolutely no sharing.",
    "Easy",
    35,
    4,
    "4 servings",
    "1 cup (120 g) all-purpose flour, 1½ tsp baking powder, ¼ tsp baking soda, 2 tbsp (25 g) sugar, ¼ tsp salt, 1 large egg, ½–¾ cup milk, ½ cup (about 125 g) whole-milk ricotta, zest and 1 tbsp juice of 1 lemon, ¾ cup blueberries, butter for cooking",
    [
      "Combine the dry ingredients. Whisk the flour, baking powder, baking soda, sugar and salt in a medium bowl.",
      "Combine the wet ingredients. In a second bowl, whisk the egg, ½ cup milk, drained ricotta, lemon zest and 1 tablespoon lemon juice until mostly smooth.",
      "Make the batter. Pour the wet mixture into the dry ingredients and stir just until no dry flour remains. Leave small lumps. If it is too thick to drop from a ¼-cup measure, stir in the remaining milk a tablespoon at a time; gently fold in the blueberries. Do not beat the batter smooth.",
      "Heat a skillet or griddle over medium-low heat and lightly coat with butter. Test with a small drop of batter: it should sizzle gently without browning immediately.",
      "Cook in batches. Pour ¼ cup batter per pancake, leaving room between them. Cook for 2–3 minutes, until the edges look set and bubbles form on the surface. Flip once and cook for another 1–2 minutes, until golden and cooked through. Lower the heat if the outside browns before the middle sets.",
      "Repeat with the remaining batter to make approximately 9–12 pancakes, adding a little butter between batches as needed. Serve warm with maple syrup, if desired."
    ],
    "A slightly lumpy batter gives fluffier pancakes than one beaten completely smooth.",
    "25–35 min"
  ],
  [
    "Breakfast",
    "Sit. Stay. Shakshuka.",
    "Eggs Poached in Spiced Tomato Sauce with Feta",
    "An indulgent one-pan breakfast that makes everyone sit, stay, and appreciate the moment.",
    "Easy",
    40,
    4,
    "4 servings",
    "4 eggs, 1 can (28 oz) crushed tomatoes, 1 red bell pepper, 1 small onion, 3 garlic cloves, 2 tbsp olive oil, 1 tsp cumin, 1 tsp smoked paprika, ¼ tsp red pepper flakes, ⅓ cup crumbled feta, parsley, salt, crusty bread",
    [
      "Prepare the vegetables. Dice the onion and bell pepper into small pieces and mince the garlic.",
      "Build the sauce. Heat the olive oil in a 10–12-inch nonreactive skillet with a lid over medium heat. Add the onion and pepper and cook for 6–8 minutes, stirring occasionally, until softened. Add the garlic, cumin, paprika and pepper flakes; stir for 30 seconds until fragrant.",
      "Simmer. Add the crushed tomatoes and a pinch of salt. Bring to a gentle simmer, reduce to medium-low and cook uncovered for 12–15 minutes, stirring occasionally, until thick enough to hold a shallow well; if needed, simmer a few minutes longer.",
      "Cook the eggs. Make four wells in the sauce with the back of a spoon and crack an egg into each. Cover and simmer gently for 5–8 minutes, checking toward the end; continue for several more minutes if necessary until the whites and yolks are firm. Keep the sauce at a gentle bubble so the eggs cook evenly.",
      "Finish. Remove from the heat, scatter with the feta and chopped parsley, and serve with crusty bread for dipping."
    ],
    "A wide skillet prevents the eggs from crowding each other and makes the dish beautiful enough to serve straight from the stove.",
    "35–40 min"
  ],
  [
    "Small Bites",
    "Fetch Me That Feta",
    "Whipped Feta with Hot Honey, Lemon & Pistachios",
    "A sophisticated little appetizer Rosie would definitely claim credit for preparing.",
    "Easy",
    15,
    6,
    "6 servings",
    "8 oz block feta packed in brine, ½ cup plain Greek yogurt, 1 tbsp lemon juice, 1 tbsp olive oil, 2 tbsp honey, ¼ tsp chili flakes, 2 tbsp chopped pistachios, warm pita",
    [
      "Drain the feta well and allow it to soften slightly at room temperature while preparing the other ingredients and break it into small pieces. Add it to a food processor or blender with the Greek yogurt, lemon juice and olive oil.",
      "Blend for 1–2 minutes, stopping once or twice to scrape down the bowl, until smooth and fluffy. If the mixture is too thick to blend, pause and scrape it down rather than adding more oil.",
      "Make the hot honey. Combine the honey and chili flakes in a microwave-safe bowl. Warm in short 10-second bursts, up to about 30 seconds total, just until fluid; stir and let the chili steep briefly.",
      "Spread the whipped feta in a shallow serving bowl, making swirls with the back of a spoon. Drizzle over the warm honey and scatter with the chopped pistachios.",
      "Warm the pita briefly in a dry skillet or oven and serve alongside the dip."
    ],
    "Use block feta packed in brine rather than pre-crumbled feta for a creamier texture.",
    "10–15 min"
  ],
  [
    "Small Bites",
    "Ruff Day Rescue",
    "Creamy Tomato-Basil Soup with Grilled Cheese Croutons",
    "For the days when the weather is terrible, work is worse, and your dog is the only one who understands.",
    "Easy",
    40,
    4,
    "4 servings",
    "1 can (28 oz) whole peeled tomatoes, 1 small onion, 3 garlic cloves, 1–1½ cups vegetable stock, ¼ cup heavy cream, ¼ cup fresh basil, 2 tbsp olive oil, 4 slices sourdough, 2 slices cheddar, butter, salt and pepper",
    [
      "Chop the onion and garlic. Heat the olive oil in a 3-quart saucepan over medium heat; add the onion and cook for 5–7 minutes until soft and translucent. Add the garlic and stir for 30 seconds.",
      "Add the canned tomatoes with their juices and the vegetable stock (start with 1 cup; add a little extra if the finished soup is too thick). Break up the tomatoes with a spoon, bring to a simmer and cook uncovered for 20 minutes over medium-low heat.",
      "Blend the soup off the heat with an immersion blender until smooth. If using a countertop blender, let the soup cool slightly, work in batches and vent the lid carefully to release steam.",
      "Return the soup to low heat. Stir in the heavy cream and chopped basil; season with salt and pepper and warm gently without boiling.",
      "Make the croutons while the soup simmers. Put 1 cheddar slice between each pair of sourdough slices and butter the outsides. Cook in a skillet over medium-low heat for 3–4 minutes per side until golden and the cheese melts.",
      "Cut each sandwich into roughly 1-inch cubes. Ladle the hot soup into four bowls and add the grilled-cheese croutons just before serving."
    ],
    "A pinch of sugar can balance unusually acidic canned tomatoes.",
    "35–40 min"
  ],
  [
    "Small Bites",
    "Who’s a Good Dip?",
    "Bubbling Spinach-Artichoke Dip with Three Cheeses",
    "The kind of party dish that disappears while everyone pretends they’re only having one more bite.",
    "Easy",
    40,
    8,
    "8 servings",
    "10 oz frozen spinach (thawed and squeezed dry), 1 can (14 oz) artichoke hearts (drained and chopped), 8 oz softened cream cheese, ½ cup sour cream, ½ cup shredded mozzarella, ⅓ cup grated Parmesan, 1 minced garlic clove, salt and pepper",
    [
      "Preheat the oven to 375°F (190°C). Set out a small oven-safe baking dish, approximately 8 inches square or a similar capacity.",
      "Thaw the spinach completely. Squeeze it firmly in a clean towel or several layers of paper towel until no more liquid comes out. Rinse, drain, blot dry and roughly chop the artichoke hearts; mince the garlic.",
      "In a mixing bowl, stir the softened cream cheese and sour cream until smooth. Fold in the spinach, artichokes, garlic, Parmesan and most of the mozzarella, reserving about 2 tablespoons of mozzarella for the top. Season with salt and pepper.",
      "Spread the mixture evenly in the baking dish and sprinkle the reserved mozzarella over it.",
      "Bake uncovered on the middle rack for 20–25 minutes, until bubbling around the edges, hot in the center and lightly golden on top. Let stand 5 minutes before serving with pita chips or toasted bread, if desired."
    ],
    "Squeezing the spinach completely dry is the secret to thick, creamy dip instead of a watery one.",
    "35–40 min (spinach thawed)"
  ],
  [
    "Small Bites",
    "The Barkuterie Brie",
    "Warm Brie with Fig Jam, Rosemary & Toasted Walnuts",
    "An appetizer with the elegance of a dinner party and the effort of making toast.",
    "Easy",
    25,
    6,
    "6 servings",
    "1 wheel (8 oz) Brie, 3 tbsp fig jam, ¼ cup chopped walnuts, 1 tsp finely chopped fresh rosemary, 1 tsp honey, crackers or baguette slices",
    [
      "Preheat the oven to 350°F (175°C). Set the Brie in a small oven-safe dish with enough space to catch any melted cheese. Leave the edible rind intact. Remove all packaging, including any plastic, paper or wooden base.",
      "Spread the fig jam evenly over the top of the Brie. Chop the walnuts and rosemary if not already prepared.",
      "Scatter the walnuts and rosemary over the jam, loosely shielding the nuts with foil if they begin to darken before the cheese softens. Bake on the middle rack for 12–15 minutes, until the center yields gently when pressed and the nuts smell toasted; avoid baking until the rind bursts.",
      "Remove from the oven and drizzle with the honey. Let stand for 2–3 minutes, then serve warm with crackers or sliced baguette."
    ],
    "The Brie rind is edible and helps the cheese hold its shape while warming.",
    "20–25 min"
  ],
  [
    "Small Bites",
    "Little Paws, Big Flavor",
    "Crispy Garlic-Parmesan Smashed Potatoes",
    "Tiny golden potatoes, crispy edges, and enough Parmesan to inspire questionable table manners.",
    "Easy",
    70,
    4,
    "4 servings",
    "1½ lb baby potatoes, 3 tbsp olive oil, ⅓ cup finely grated Parmesan, 1 tsp garlic powder, ½ tsp smoked paprika, salt, pepper, chopped parsley",
    [
      "Preheat the oven to 425°F (220°C). Place the baby potatoes in a large saucepan and cover with cold salted water.",
      "Bring to a boil and cook for 15–25 minutes depending on size, until a fork slides easily through the largest potato. Drain and let steam-dry for 3–5 minutes.",
      "Lightly oil a large baking sheet using part of the olive oil. Arrange the potatoes with space between them and press each with the bottom of a glass to about ½ inch thick, keeping the potato mostly intact. Let the smashed potatoes release steam for another 3–5 minutes.",
      "Brush or drizzle with the remaining oil. Season with salt and pepper; reserve the garlic powder, smoked paprika and Parmesan for the last part of roasting.",
      "Roast on the middle rack for 25–35 minutes, until the edges begin to crisp. Sprinkle with the reserved garlic, paprika and Parmesan and return for 5–8 minutes until deeply golden. Check frequently so the cheese does not burn.",
      "Transfer to a serving plate, scatter with chopped parsley and serve hot."
    ],
    "The rougher the smashed edges, the more deliciously crunchy they become.",
    "55–70 min"
  ],
  [
    "Main Courses",
    "Off-Leash Lemon Chicken",
    "Golden Chicken Piccata with Lemon-Butter Caper Sauce",
    "Bright, buttery, and a little zesty. Much like Rosie when somebody opens the front door.",
    "Easy",
    35,
    4,
    "4 servings",
    "1½ lb thin chicken cutlets, ⅓ cup flour, 3 tbsp olive oil, 3 tbsp unsalted butter, ¾ cup low-sodium chicken broth, 2–3 tbsp fresh lemon juice, 2 tbsp capers, 2 tbsp chopped parsley, salt and pepper",
    [
      "Prepare the chicken. Pat the cutlets dry; if they vary in thickness, gently pound them to about ¼ inch. Season both sides with salt and pepper. Put the flour on a plate and dredge each cutlet, shaking off the excess.",
      "Heat 1½ tablespoons olive oil in a large skillet over medium-high heat until shimmering. Add the chicken in a single layer, working in batches if needed. Cook approximately 3–4 minutes per side until golden and the thickest part reaches 165°F (74°C). Transfer to a clean plate. Use the remaining oil for subsequent batches.",
      "Make the sauce. Reduce to medium heat. Add the chicken broth and 2 tablespoons lemon juice; scrape up the browned bits with a wooden spoon. Simmer for 3–5 minutes until reduced by about one-third. Taste and add the remaining tablespoon of lemon juice only if needed.",
      "Turn the heat to low and swirl in the cold cubed butter a little at a time until the sauce looks glossy, then add the drained capers. Return the chicken and any accumulated juices to the skillet; spoon the sauce over the cutlets for 30–60 seconds.",
      "Scatter with parsley and serve immediately, spooning the lemon-caper sauce over each portion."
    ],
    "Serve over angel hair pasta or mashed potatoes so none of the sauce goes to waste.",
    "30–35 min"
  ],
  [
    "Main Courses",
    "The Golden Fetch",
    "Honey-Miso Glazed Salmon with Sesame-Cucumber Rice",
    "Sweet, savory, glossy, and golden. This one’s worth retrieving from the kitchen immediately.",
    "Easy",
    35,
    4,
    "4 servings",
    "4 salmon fillets (5-6 oz each), 2 tbsp white miso paste, 1 tbsp honey, 1 tbsp soy sauce, 2 tsp rice vinegar (divided), 1 tsp sesame oil, 1 cucumber, 2 tsp sesame seeds, 2 cups cooked jasmine rice, sliced scallions",
    [
      "Preheat the oven to 400°F (205°C). Line a rimmed baking sheet with lightly oiled aluminum foil. Choose fillets of similar thickness (about 1 inch). Pat the salmon dry and arrange skin-side down if it has skin.",
      "Whisk the miso, honey, soy sauce and 1 teaspoon of the rice vinegar in a small bowl until smooth. Spread the glaze evenly over the top of each fillet.",
      "Bake on the middle rack for roughly 12–18 minutes, checking earlier for thin fillets. The thickest part must reach 145°F (63°C) on an instant-read thermometer; add time if necessary. For a darker glaze, broil on a broiler-safe pan for 30–60 seconds near the end, before the fish reaches its final temperature; watch continuously because miso and honey burn quickly. Confirm 145°F before serving.",
      "While the salmon bakes, dice the cucumber into small pieces and toss with the sesame oil, remaining 1 teaspoon rice vinegar and sesame seeds. Slice the scallions and warm freshly cooked rice, or reheat properly refrigerated leftover rice to 165°F (74°C).",
      "Divide the warm rice among four bowls. Add a salmon fillet to each and finish with the cucumber mixture and scallions."
    ],
    "Briefly broil at the end for caramelized edges, watching closely so the honey doesn’t burn.",
    "30–35 min (rice cooked)"
  ],
  [
    "Main Courses",
    "Pawsta La Vista, Baby",
    "Creamy Spicy Rigatoni alla Vodka",
    "An outrageously good pasta that will have everyone asking for another bowl. Hasta la vista, leftovers.",
    "Easy",
    30,
    4,
    "4 servings",
    "12 oz rigatoni, 1 shallot, 2 tbsp butter, ¼ cup tomato paste, ¼ cup vodka, ¾ cup heavy cream, ½ tsp red pepper flakes, ½ cup grated Parmesan, salt, reserved pasta water",
    [
      "Bring a large pot of salted water to a boil. Add the rigatoni and cook according to the package directions until about 1 minute shy of al dente. Before draining, reserve about 1 cup of the pasta water.",
      "While the pasta cooks, finely chop the shallot. Melt the butter in a large skillet over medium heat and cook the shallot for 3–4 minutes, stirring, until soft but not browned.",
      "Add the tomato paste and pepper flakes. Cook for 3–5 minutes, stirring constantly, until the paste turns brick-red and starts to stick lightly to the pan.",
      "Remove the skillet briefly from the heat before adding the vodka, especially on a gas stove. Return to medium heat and simmer for 2–3 minutes, stirring to loosen the paste, until the liquid has mostly reduced.",
      "Reduce to medium-low and stir 2 tablespoons of hot pasta water into the cream, then gradually stir the warmed cream into the sauce. Simmer gently for 2–3 minutes until smooth; do not boil vigorously.",
      "Add the drained rigatoni and toss over low heat for 1–2 minutes. Turn off the heat and gradually stir in the finely grated Parmesan, adding reserved pasta water 1–2 tablespoons at a time until the sauce coats the pasta in a glossy layer. Taste, adjust salt and serve immediately."
    ],
    "The secret is cooking the tomato paste until it darkens. That develops a much deeper flavor than simply stirring it into cream.",
    "30 min"
  ],
  [
    "Main Courses",
    "Rosie’s Sunday Walk",
    "Tender Italian Meatballs with Slow-Simmered Tomato Sauce",
    "A comforting Sunday classic, best enjoyed after a long walk and before a long nap.",
    "Medium",
    45,
    4,
    "4 servings",
    "1 lb ground beef, ½ lb ground pork, ½ cup (about 55 g) plain dry breadcrumbs, 1 egg, ¼ cup milk, ⅓ cup Parmesan, 2 minced garlic cloves, 24 oz marinara sauce, fresh basil, salt, pepper, olive oil",
    [
      "Preheat the oven to 425°F (220°C). Lightly oil a rimmed baking sheet. In a large bowl, combine the breadcrumbs and milk; let stand for 3–5 minutes to absorb the liquid.",
      "Add the ground beef, pork, egg, Parmesan, minced garlic, salt and pepper. Mix gently with clean hands just until evenly combined; do not knead or compact the meat.",
      "Divide the mixture into 12–16 equal portions (about 50–70 g each) and gently roll into balls of roughly 1½–2 inches. Arrange on the sheet with space between them.",
      "Roast for about 15 minutes, until the meatballs begin to brown and hold their shape. While they roast, bring the marinara to a gentle simmer in a wide saucepan.",
      "Transfer the meatballs into the sauce using tongs or a slotted spoon. Simmer gently for about 10 minutes, turning occasionally, until the centers of several of the largest meatballs reach 160°F (71°C). Add more simmering time if needed.",
      "Finish with fresh basil and serve hot with the sauce."
    ],
    "Mix gently and stop when combined. Overworking ground meat produces dense, rubbery meatballs.",
    "40–45 min"
  ],
  [
    "Main Courses",
    "The Top Dog Smash Burger",
    "Double Cheeseburger with Secret Sauce & Crispy Edges",
    "Every pack has an alpha. Among hamburgers, this is the one.",
    "Easy",
    35,
    4,
    "4 servings",
    "1½ lb 80/20 ground beef, 4 potato buns, 8 slices American cheese, 2 tbsp mayonnaise, 1 tbsp ketchup, 1 tsp yellow mustard, 8 dill pickle chips, ½ cup finely diced onion, shredded lettuce, salt and pepper",
    [
      "Make the sauce by mixing the mayonnaise, ketchup and mustard. Finely dice the onion, prepare the lettuce and pickles, and split the potato buns. Toast the buns cut-side down in a dry skillet for 1–2 minutes; set aside.",
      "Divide the beef into 8 equal loose balls, approximately 3 ounces each. Handle lightly and do not pack tightly. Keep chilled until cooking.",
      "Heat a cast-iron skillet or flat griddle over medium-high to high heat until a drop of water sizzles and evaporates immediately; turn on the exhaust fan. Work in batches so the patties have room to spread.",
      "Place a beef ball on the hot surface and immediately press with a sturdy spatula to about ¼ inch thick. Remove the spatula immediately after smashing and season the top with salt and pepper. Cook undisturbed for about 2–3 minutes, until a deep brown crust forms around the edges.",
      "Scrape firmly beneath each patty and flip once. Add 1 cheese slice per patty and cook for another 1–2 minutes, or until the center reaches 160°F (71°C), inserting a thin thermometer probe horizontally into a patty. Repeat with the remaining beef and cheese.",
      "Spread sauce on the toasted buns. Stack 2 patties on each bottom bun and add onion, 2 pickle chips and shredded lettuce. Close and serve immediately."
    ],
    "Don’t compress the meat before it hits the skillet. Smash only once, immediately upon contact, for maximum crust.",
    "25–35 min"
  ],
  [
    "Main Courses",
    "The Zoomies",
    "Spicy Sesame-Peanut Noodles with Crispy Tofu",
    "Fast, colorful, and full of unexpected energy. An excellent description of both dinner and Rosie at 9 p.m.",
    "Easy",
    40,
    4,
    "4 servings",
    "8 oz noodles, 14 oz extra-firm tofu, 3 tbsp smooth peanut butter, 2 tbsp soy sauce, 1 tbsp rice vinegar, 1 tsp chili crisp, 2 tsp honey, 1 tsp sesame oil, 2 tbsp cornstarch, 2 tbsp neutral oil, 1 cucumber, 2 scallions",
    [
      "Drain the tofu, wrap it in a clean towel and press gently under a heavy plate for 10–15 minutes while preparing the sauce and vegetables. Pat it dry. Cut into ¾–1-inch cubes and toss gently with the cornstarch until lightly coated.",
      "Heat the neutral oil in a large nonstick skillet over medium-high heat. Add the tofu in a single layer and cook for 10–15 minutes, turning every few minutes, until crisp and golden on several sides. Transfer to a plate.",
      "While the tofu cooks, bring water to a boil and cook the noodles according to the package directions. Reserve about ½ cup of the hot noodle water before draining.",
      "In a large bowl, whisk the peanut butter, soy sauce, rice vinegar, chili crisp, honey and sesame oil. Whisk in 2–4 tablespoons of hot noodle water, adding 1 tablespoon at a time until the sauce is smooth and pourable.",
      "Slice the cucumber and scallions. Add the warm drained noodles to the sauce and toss until evenly coated, adding more reserved water as needed.",
      "Divide among four bowls and top with the crispy tofu, cucumber and scallions. Serve immediately."
    ],
    "Adjust the sauce with warm water until it coats the noodles like a silky glaze rather than thick peanut butter.",
    "35–40 min"
  ],
  [
    "Main Courses",
    "Barkbecue Chicken",
    "Sticky Honey-Smoky Chicken Thighs with Roasted Sweet Potatoes",
    "All the pleasure of backyard barbecue, without needing a backyard.",
    "Easy",
    50,
    4,
    "4 servings",
    "2 lb boneless chicken thighs, 1 lb sweet potatoes, 1 red onion, 2 tbsp olive oil, 2 tbsp honey, 1 tbsp tomato paste, 1 tbsp apple cider vinegar, 1 tsp smoked paprika, 1 tsp garlic powder, ½ tsp chili powder, salt and pepper",
    [
      "Preheat the oven to 425°F (220°C). Set out a large rimmed baking sheet, or two if needed to avoid crowding.",
      "Cut the sweet potatoes into ¾-inch cubes and the onion into wedges. Toss with the olive oil, salt and pepper, then spread over the sheet pan. Pat the chicken dry, season with salt and pepper and arrange beside the vegetables in a single layer.",
      "Roast on the middle rack for 15 minutes. Meanwhile, whisk the honey, tomato paste, apple cider vinegar, smoked paprika, garlic powder and chili powder in a small bowl.",
      "Remove the pan and turn the vegetables with a spatula. Brush the glaze over the chicken. Discard any glaze that contacts the brush after it touches partially cooked chicken; wash the brush and utensils.",
      "Return to the oven for 10–15 minutes, or until the chicken reaches at least 165°F (74°C) in the thickest part and the sweet potatoes are fork-tender. If the glaze darkens too quickly, loosely shield the chicken with foil. If the chicken reaches 165°F first, transfer it to a clean plate and continue roasting the vegetables until tender.",
      "Rest the chicken for 3–5 minutes, then divide it and the roasted vegetables among four plates."
    ],
    "Use two sheet pans if necessary. Crowded ingredients steam instead of roasting.",
    "40–50 min"
  ],
  [
    "Main Courses",
    "The Shepherd’s Best Friend",
    "Golden Cottage Pie with Savory Beef & Buttery Mashed Potatoes",
    "The ultimate comfort dish, inspired by the centuries-old friendship between shepherds and their faithful dogs.",
    "Intermediate",
    70,
    6,
    "6 servings",
    "1¼ lb ground beef, 2 lb potatoes, 1 onion, 2 carrots, 1 cup frozen peas, 2 tbsp tomato paste, 1 tbsp Worcestershire sauce, 1 cup beef broth, 2 tbsp flour, 3 tbsp butter, ⅓ cup milk, 1 tsp fresh thyme, salt and pepper",
    [
      "Preheat the oven to 400°F (205°C). Peel the potatoes and cut into roughly 1½-inch chunks. Cover with cold salted water, bring to a boil and cook for 15–20 minutes until easily pierced with a fork.",
      "Drain well and return the potatoes to the warm pot for 1 minute to release excess steam. Mash with the butter and milk; season with salt and pepper. Set aside.",
      "While the potatoes cook, dice the onion and carrots into small pieces. In a large skillet over medium-high heat, cook the beef, onion and carrots for 8–10 minutes, breaking the beef into small pieces and stirring until browned and the vegetables soften. Drain excess fat if necessary. Cook beef to 160°F (71°C).",
      "Stir in the flour and tomato paste and cook for 1 minute. Gradually pour in the broth while stirring, then add Worcestershire sauce, thyme and peas. Simmer for 5–8 minutes until thick enough that a spoon dragged across the pan leaves a brief trail. Season to taste. If the filling is runny, simmer longer before adding the potatoes.",
      "Transfer the filling to an 2½–3-quart oven-safe dish. Spoon the mashed potatoes over the filling, spread to the edges and roughen the surface with a fork.",
      "Bake for 20–25 minutes, until the filling bubbles around the edges and the potato peaks turn golden. Rest for 5–10 minutes before serving so the filling settles."
    ],
    "Fork-made ridges in the mashed potatoes create the beautifully crisp, browned peaks.",
    "60–70 min"
  ],
  [
    "Main Courses",
    "Tail-Wagging Tikka",
    "Creamy Chicken Tikka Masala with Fragrant Spices",
    "A rich, aromatic curry that smells so wonderful even the neighbors may come begging.",
    "Intermediate",
    60,
    4,
    "4 servings",
    "1½ lb boneless chicken thighs, ½ cup plain yogurt, 1 tbsp garam masala, 1 tsp cumin, 1 tsp paprika, 1 onion, 3 garlic cloves, 1 tbsp grated ginger, 1 cup tomato purée, ¾ cup heavy cream, 2 tbsp neutral oil, 1 tsp salt, cilantro, cooked basmati rice",
    [
      "Cut the chicken into roughly 1-inch pieces. In a bowl, combine the yogurt, paprika and half the garam masala. Toss the chicken in the mixture and refrigerate for at least 15 minutes (30–60 minutes if you have time; allow extra time) while preparing the sauce ingredients.",
      "Finely dice the onion, mince the garlic and grate the ginger. Heat about half the neutral oil in a large skillet over medium-high heat.",
      "Lift the chicken from the marinade, letting excess drip off, and sear in batches for 4–6 minutes per batch, turning to brown several sides. Transfer to a clean plate reserved for partially cooked chicken; it need not be fully cooked yet and will finish immediately in the sauce. Discard any unused raw marinade.",
      "Reduce the heat to medium and add the remaining oil. Cook the onion for 5–6 minutes until soft, then add the garlic and ginger for 30 seconds. Stir in the remaining garam masala, cumin and salt for another 30 seconds.",
      "Add the tomato purée and simmer gently for 10 minutes, stirring occasionally. Reduce the heat, stir in the cream, and return the chicken and its juices to the pan.",
      "Simmer gently for 10–12 minutes, or until the largest chicken piece reaches 165°F (74°C). Avoid a vigorous boil. Serve over cooked basmati rice and garnish with cilantro."
    ],
    "Chicken thighs stay tender and forgiving, even if you simmer the sauce a few minutes longer than planned.",
    "50–60 min (rice cooked)"
  ],
  [
    "Main Courses",
    "A Very Good Risotto",
    "Creamy Parmesan-Mushroom Risotto with Fresh Thyme",
    "For the patient cook who knows that good things are worth waiting for. Rosie, unfortunately, does not subscribe to this philosophy.",
    "Intermediate",
    45,
    4,
    "4 servings",
    "1½ cups Arborio rice, 8 oz cremini mushrooms, 1 shallot, 2 tbsp butter, 2 tbsp olive oil, 5–6 cups low-sodium vegetable broth, ½ cup grated Parmesan, 1 tsp fresh thyme leaves, salt and pepper",
    [
      "Warm 5–6 cups vegetable broth in a saucepan and keep it at a gentle simmer. Slice the mushrooms, finely dice the shallot and prepare the Parmesan and thyme.",
      "Heat the olive oil in a wide skillet over medium-high heat. Add the mushrooms in a single layer (in batches if necessary) and cook for 6–8 minutes, stirring occasionally, until their moisture evaporates and they are deeply golden. Transfer to a plate.",
      "Reduce the heat to medium. Melt the butter in the same skillet and cook the shallot for 2–3 minutes, until translucent. Add the Arborio rice and stir for 2 minutes to coat and lightly toast the grains.",
      "Add ½ cup warm broth and stir frequently until most is absorbed. Continue adding broth ½ cup at a time, allowing each addition to mostly absorb before the next. Maintain a gentle simmer, not a rapid boil.",
      "After about 18 minutes of broth additions, begin tasting the rice. Continue up to approximately 25 minutes, or until creamy and tender with a slight bite. Use only as much of the broth as necessary.",
      "Remove from the heat and fold in the mushrooms, Parmesan and thyme. Season with salt and pepper. Add a splash of warm broth if needed so the risotto gently spreads on the plate. Serve immediately."
    ],
    "Proper risotto should gently spread across a plate, not stand in a rigid mound. Loosen with a little extra warm broth before serving.",
    "40–45 min"
  ],
  [
    "Desserts",
    "Best in Show Brownies",
    "Fudgy Dark-Chocolate Brownies with Crackly Tops",
    "No ribbon required. These are the undisputed champions of the dessert table.",
    "Easy",
    90,
    9,
    "9 brownies",
    "½ cup (113 g) unsalted butter, 1 cup (198 g) granulated sugar, 2 large eggs, 1 tsp vanilla, ⅓ cup (28 g) unsweetened cocoa powder, ½ cup (60 g) all-purpose flour, ¼ tsp fine salt, ½ cup (85 g) dark chocolate chunks",
    [
      "Preheat the oven to 350°F (175°C). Line an 8-inch square metal baking pan with parchment, leaving an overhang on two sides for lifting.",
      "Melt the butter in a small saucepan over low heat. Stir in the sugar and warm gently until glossy and hot but not boiling. Transfer to a mixing bowl and cool until warm rather than hot, then proceed.",
      "Add the eggs and vanilla and whisk for 1–2 minutes until glossy and well combined.",
      "Add the cocoa powder, flour and salt. Fold with a spatula just until no dry streaks remain, then fold in the chocolate chunks. Avoid overmixing.",
      "Spread the batter evenly in the pan and bake on the middle rack for 22–28 minutes. Begin checking at 22 minutes: the edges should be set and a toothpick inserted in a spot without a chocolate chunk should come out with moist crumbs, not liquid batter.",
      "Cool in the pan on a rack until set, at least 30 minutes and ideally until completely cool. Lift out using the parchment and cut into 9 squares. Refrigerate for a firmer texture, if desired."
    ],
    "Refrigerating cooled brownies for an hour gives them an especially dense, truffle-like texture.",
    "35–40 min + 30–50 min cooling"
  ],
  [
    "Desserts",
    "Puppy Love Cookies",
    "Brown-Butter Chocolate Chunk Cookies with Flaky Sea Salt",
    "Crisp at the edges, soft in the middle, and capable of inspiring unconditional love.",
    "Intermediate",
    85,
    16,
    "16 cookies",
    "½ cup (113 g) unsalted butter, ¾ cup (160 g) packed brown sugar, ¼ cup (50 g) granulated sugar, 1 large egg, 1 tsp vanilla, 1¼ cups (150 g) all-purpose flour, ½ tsp baking soda, ½ tsp fine salt, ¾ cup (128 g) chocolate chunks, flaky sea salt",
    [
      "Brown the butter in a light-colored saucepan over medium heat, stirring or swirling frequently. It will foam, then develop golden-brown milk solids and a nutty aroma after roughly 5–8 minutes. Immediately pour into a mixing bowl, including the browned bits; cool for 10 minutes.",
      "While the butter cools, whisk the flour, baking soda and fine salt together in a separate bowl. Preheat the oven to 350°F (175°C) and line baking sheets with parchment.",
      "Whisk the cooled brown butter with both sugars until combined, then whisk in the egg and vanilla. Stir in the dry ingredients just until no flour streaks remain; fold in the chocolate chunks.",
      "Refrigerate the dough for at least 30 minutes, until firm enough to scoop. Divide into 16 equal portions, approximately 40 g each, and place on the prepared sheets at least 2 inches apart.",
      "Bake one sheet at a time on the middle rack for 10–14 minutes, until the edges are golden and centers look soft but no longer wet. Keep the remaining dough chilled while the first batch bakes. If the first cookie spreads excessively, chill the remaining dough for another 15–20 minutes before baking.",
      "Sprinkle the warm cookies with flaky sea salt. Let set on the baking sheet for 5 minutes before transferring to a wire rack."
    ],
    "Pull cookies out when their centers still look slightly underdone. They’ll finish setting as they cool.",
    "75–85 min (includes chilling)"
  ],
  [
    "Desserts",
    "The Wagging Tail Apple Crisp",
    "Warm Cinnamon Apples Beneath a Buttery Oat Crumble",
    "The dessert equivalent of curling up under a blanket with your favorite dog.",
    "Easy",
    70,
    6,
    "6 servings",
    "6 medium apples (about 750–900 g peeled and cored), 2 tbsp lemon juice, ⅓ cup (70 g) packed brown sugar for filling, 1 tsp cinnamon, 1 tbsp cornstarch; topping: ¾ cup (64 g) old-fashioned rolled oats, ½ cup (60 g) all-purpose flour, ⅓ cup (70 g) packed brown sugar, 6 tbsp (85 g) cold unsalted butter, pinch of salt",
    [
      "Preheat the oven to 375°F (190°C). Set out a deep 8- or 9-inch square baking dish (about 2–2½ quarts). Peel and core the apples, then slice them about ¼ inch thick.",
      "Make the filling. In a large bowl, toss the apples with lemon juice, the ⅓ cup brown sugar for the filling, cinnamon and cornstarch until evenly coated. Spread in the baking dish.",
      "Make the topping. Combine the flour, remaining ⅓ cup brown sugar and pinch of salt. Cut the cold butter into small cubes and rub it into the dry mixture with your fingertips until coarse crumbs and pea-sized clumps form. Stir in the oats.",
      "Scatter the topping evenly over the apples without packing it down.",
      "Bake on the middle rack for 35–45 minutes, until the topping is golden, the fruit juices bubble around the edges and a knife slides easily through the apples. If the topping browns before the apples soften, loosely cover with foil.",
      "Let rest for 10–15 minutes so the juices thicken. Serve warm, with vanilla ice cream if desired."
    ],
    "Combine tart Granny Smith and sweet Honeycrisp apples for better flavor and texture. Serve warm with vanilla ice cream.",
    "60–70 min (includes resting)"
  ],
  [
    "Desserts",
    "Rosie’s Strawberry Pawfait",
    "No-Bake Strawberry Cheesecake in Individual Glasses",
    "Elegant little cheesecakes with absolutely no baking. Rosie approves of desserts that don’t delay gratification.",
    "Easy",
    90,
    6,
    "6 servings",
    "1 cup (about 100 g) graham cracker crumbs, 3 tbsp (42 g) melted unsalted butter, 8 oz (227 g) softened full-fat block cream cheese, ⅓ cup (38 g) powdered sugar, 1 tsp vanilla, 1 cup cold heavy whipping cream, 1 cup sliced strawberries, 1 tbsp sugar",
    [
      "Prepare six 6–8 oz serving glasses. Melt the butter and mix it with the graham cracker crumbs until the mixture resembles damp sand.",
      "Slice the strawberries and toss with the 1 tablespoon granulated sugar. Let stand for 10 minutes while making the filling, so the berries release a little juice.",
      "Beat the softened cream cheese with the powdered sugar and vanilla for 1–2 minutes until completely smooth; scrape down the bowl.",
      "In a separate chilled bowl, whip the cold heavy cream to firm peaks that hold their shape but are not grainy. Fold one-third into the cream cheese to lighten it, then gently fold in the remaining cream until no streaks remain.",
      "Divide the crumb mixture among the six glasses and press lightly into even layers. Spoon equal portions of cheesecake filling on top and smooth gently. Refrigerate the berries separately until serving so their juice does not soften the filling.",
      "Cover and refrigerate for at least 1 hour to chill and set. Divide the strawberries and a little of their juice among the glasses just before serving. Keep refrigerated until ready to serve."
    ],
    "Clear glasses show off the layers and make these feel like miniature restaurant desserts.",
    "20–30 min + 1 hour chilling"
  ],
  [
    "Desserts",
    "Paws for Tiramisu",
    "Espresso-Mascarpone Tiramisu Cups with Cocoa",
    "A luxurious Italian dessert that commands you to pause, sit, and savor every bite.",
    "Easy",
    270,
    6,
    "6 servings",
    "8 oz (227 g) mascarpone, 1 cup cold heavy whipping cream, ⅓ cup (38 g) powdered sugar, 1 tsp vanilla, 1 cup strong cooled espresso or coffee, 18-24 crisp ladyfinger biscuits, 1 tbsp unsweetened cocoa powder",
    [
      "Brew the espresso or strong coffee and let it cool completely. Pour it into a shallow bowl. Set out six 6–8 oz dessert glasses.",
      "In a chilled mixing bowl, whip the cold heavy cream, powdered sugar and vanilla until medium peaks form. In a separate bowl, gently stir the mascarpone just until smooth.",
      "Fold about one-third of the whipped cream into the mascarpone to loosen it, then gently fold in the rest until smooth and fluffy. Avoid overworking the mascarpone, which can become grainy.",
      "Break the ladyfingers as needed to fit the glasses. Dip each piece into the cooled coffee for about 1 second per side, then place a layer in the bottom of each glass. Do not soak them until soggy.",
      "Spoon a layer of mascarpone cream over the biscuits. Repeat with another layer of briefly dipped ladyfingers and finish with the remaining cream, dividing the ingredients evenly among the six glasses (roughly 3–4 ladyfingers per glass; use only as many as fit).",
      "Cover and refrigerate for at least 4 hours or overnight so the layers set and the biscuits soften. Just before serving, dust the tops evenly with cocoa using a fine-mesh sieve."
    ],
    "Dip ladyfingers for barely a second per side. They should absorb coffee while retaining enough structure to create distinct layers.",
    "20–30 min + 4 hours chilling"
  ]
];
const normalizeIngredients = (source) => source.split(/[,;]/g).map(value => value.trim()).filter(Boolean);
const normalizeSteps = (source) => Array.isArray(source) ? source.map(step => step.trim()).filter(Boolean) : source.split(/\.\s+(?=[A-ZÀ-Ÿ])/u).map(step => step.trim()).filter(Boolean);
const foundingRecipes = rows.map(([category,title,subtitle,description,difficulty,totalMinutes,servings,servingsLabel,ingredientsText,methodText,note,timeLabel]) => ({
 id:title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""),
 category, title, subtitle, description, difficulty, totalMinutes, timeLabel: timeLabel || `${totalMinutes} min`,
 servings, servingsLabel, ingredientsText, methodText: Array.isArray(methodText) ? methodText.join(" ") : methodText, note, ingredients: normalizeIngredients(ingredientsText), steps: normalizeSteps(methodText)
}));
export const RECIPE_CATALOG = [...foundingRecipes, ...NEW_RECIPES];
export const RECIPE_CATEGORIES = ["All","Breakfast","Small Bites","Main Courses","Desserts","Favorites"];
