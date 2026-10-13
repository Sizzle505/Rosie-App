import React, { useEffect, useMemo, useRef, useState } from "react";
import { COOKBOOK, RECIPE_CATALOG, RECIPE_CATEGORIES } from "./rosieRecipesData.js";
import "./RosieRecipes.css";
import "./RosieRecipesAssetLayout.css";

const ROOT = "/rosieverse/recipes/";
const FAVORITES_KEY = "rosie-recipes-favorites-v1";
const recipeArt = (recipe) => `${ROOT}dishes/${recipe.id}.webp`;
function loadFavorites() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch { return []; }
}
function hasInstructions(recipe) {
  return Boolean(recipe.ingredients?.length && recipe.steps?.length);
}
function RecipeCard({ recipe, favorite, onOpen, onFavorite }) {
  return <article className="recipes-tile">
    <button type="button" className={`recipes-card recipes-card--${recipe.category.toLowerCase().replace(/[^a-z]+/g,"-")}`} onClick={() => onOpen(recipe.id)}
      aria-label={`View ${recipe.title}`}>
      <span className={`recipes-card-image recipes-card-image--${recipe.category.toLowerCase().replace(/[^a-z]+/g,"-")}`} aria-hidden="true">
        <img src={recipeArt(recipe)} alt="" loading="lazy" draggable="false" />
      </span>
      <span className="recipes-card-copy">
        <strong>{recipe.title}</strong>
      </span>
      <span className="recipes-card-metrics">
        <span><b>◷ Time</b>{recipe.timeLabel || "—"}</span>
        <span><b>✦ Level</b>{recipe.difficulty || "—"}</span>
        <span><b>♟ Serves</b>{recipe.servingsLabel || "—"}</span>
      </span>
    </button>
    <button type="button" className={`recipes-favorite ${favorite ? "is-favorite" : ""}`}
      aria-pressed={favorite}
      aria-label={favorite ? `Remove ${recipe.title} from favorites` : `Add ${recipe.title} to favorites`}
      onClick={() => onFavorite(recipe.id)}>{favorite ? "♥" : "♡"}</button>
  </article>;
}
function RecipeDetail({ recipe, favorite, onBack, onFavorite }) {
  const ready = hasInstructions(recipe);
  const [checked, setChecked] = useState([]);
  useEffect(() => setChecked([]), [recipe.id]);
  return <section id="recipes-detail" className={`recipes-detail ${ready ? "is-ready" : "is-placeholder"}`} aria-label={recipe.title}>
    <div className="recipes-detail-actions">
      <button type="button" onClick={onBack}>← The Collection</button>
      <button type="button" onClick={() => onFavorite(recipe.id)}
        aria-pressed={favorite}>{favorite ? "♥ Saved" : "♡ Save"}</button>
    </div>
    <section className="recipes-detail-cover" aria-label={`${recipe.title} overview`}>
      <div className="recipes-detail-photo"><img src={recipeArt(recipe)} alt="" /></div>
      <div className="recipes-detail-intro">
        <p className="recipes-detail-category">{COOKBOOK.labels[recipe.category] || recipe.category}</p>
        <h2>{recipe.title}</h2>
        <p>{ready ? recipe.subtitle : "A place reserved in Rosie’s Royal Cookbook."}</p>
      </div>
    </section>
    <dl className="recipes-summary-strip">
      <div><dt>Time</dt><dd>{recipe.timeLabel}</dd></div>
      <div><dt>Yield</dt><dd>{recipe.servingsLabel}</dd></div>
      <div><dt>Difficulty</dt><dd>{recipe.difficulty}</dd></div>
    </dl>
    {ready && <div className="recipes-written-method">
      <p className="recipes-detail-description">{recipe.description}</p>
      <p className="recipes-overview-meta"><strong>Total time:</strong> {recipe.timeLabel} <span aria-hidden="true">·</span> <strong>Yield:</strong> {recipe.servingsLabel} <span aria-hidden="true">·</span> <strong>Difficulty:</strong> {recipe.difficulty}</p>
      <h3>Ingredients</h3>
      <ul className="recipes-ingredient-list">{recipe.ingredients.map((ingredient, i) =>
        <li key={i}><label><input type="checkbox" checked={checked.includes(i)}
          onChange={() => setChecked((old) => old.includes(i) ? old.filter(x => x !== i) : [...old,i])}/>
          <span>{ingredient}</span></label></li>)}</ul>
      <h3>Method</h3>
      <ol className="recipes-steps">{recipe.steps.map((step, i) => <li key={i}>{step}</li>)}</ol>
      {recipe.note && <aside className="recipes-note"><strong>Rosie’s Tip</strong><p>{recipe.note}</p></aside>}
      <p className="recipes-human-only">{COOKBOOK.humanOnly}</p>
      <button type="button" className="recipes-print" onClick={() => window.print()}>Print Recipe</button>
    </div>}
    {!ready && <div className="recipes-awaiting-copy"><span>✦</span><h3>Rosie’s Recipe Collection</h3><p>The original ingredients and instructions for this dish will be placed here when the complete cookbook is imported.</p></div>}
  </section>;
}
export default function RosieRecipes() {
  const [query, setQuery] = useState("");
  const [crestReady, setCrestReady] = useState(false);
  const [category, setCategory] = useState("All");
  const [browseOpen, setBrowseOpen] = useState(false);
  const [favorites, setFavorites] = useState(loadFavorites);
  const [selectedId, setSelectedId] = useState(null);
  const searchRef = useRef(null);
  useEffect(() => {
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)); } catch {}
  }, [favorites]);
  const filtered = useMemo(() => {
    const normalized = query.toLocaleLowerCase().trim();
    const matches = RECIPE_CATALOG.filter((recipe) => {
      const categoryMatch = category === "All" || category === recipe.category ||
        (category === "Favorites" && favorites.includes(recipe.id));
      const words = `${recipe.title} ${recipe.subtitle} ${recipe.category} ${recipe.description || ""} ${recipe.ingredientsText}`.toLocaleLowerCase();
      return categoryMatch && (!normalized || words.includes(normalized));
    });
    return matches;
  }, [query, category, favorites]);
  const selected = RECIPE_CATALOG.find((recipe) => recipe.id === selectedId);
  const toggleFavorite = (id) => setFavorites((previous) =>
    previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]);
  function openRecipe(id) {
    setSelectedId(id);
    window.setTimeout(() => document.getElementById("recipes-detail")?.scrollIntoView({behavior:"smooth",block:"start"}), 20);
  }
  function closeRecipe() {
    setSelectedId(null);
    window.setTimeout(() => searchRef.current?.scrollIntoView({behavior:"smooth",block:"start"}), 10);
  }
  return <main className="recipes-page" aria-label="Rosie’s Recipes">
    <div className="recipes-top-scene" role="img" aria-label="Rosie cooking a royal feast in her warm golden kitchen" />
    <div className="recipes-body">
      <header className="recipes-heading">
        <h1 className="recipes-visually-hidden">Rosie’s Recipes</h1>
        <div className={`recipes-crest ${crestReady ? "has-art" : ""}`} role="img" aria-label="Rosie’s Recipes - The Royal Cookbook">
          <img src={ROOT + "recipes-title.webp"} alt="" onLoad={() => setCrestReady(true)} onError={() => setCrestReady(false)} />
          <span>Rosie’s Recipes</span><small>THE ROYAL COOKBOOK</small>
        </div>
        <p>The Founding Cookbook - 25 Recipes for Rosie’s Favorite Humans</p>
        <p className="recipes-human-warning">Delicious human food, with a little of Rosie’s personality in every dish. Not for sharing with Rosie.</p>
      </header>
      {!selected && <section className="recipes-index" aria-label="The recipe collection" ref={searchRef}>
        <div className="recipes-browse">
          <button type="button" className="recipes-browse-trigger" aria-expanded={browseOpen}
            onClick={() => setBrowseOpen(open => !open)}>
            <span>Browse recipes</span><small>{category === "All" ? "25 recipes" : COOKBOOK.labels[category] || category}</small><b aria-hidden="true">⌄</b>
          </button>
          {browseOpen && <div className="recipes-browse-menu">
            <label className="recipes-search"><span className="recipes-visually-hidden">Search recipes</span>
              <span aria-hidden="true">⌕</span>
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)}
                placeholder="Find a recipe…" autoComplete="off"/>
            </label>
            <div className="recipes-category-tabs" aria-label="Filter recipes by category">
              {RECIPE_CATEGORIES.map((cat) => <button key={cat} type="button"
                className={category===cat?"is-active":""} aria-pressed={category===cat}
                onClick={() => {setCategory(cat);setBrowseOpen(false);}}>{COOKBOOK.labels[cat] || cat}</button>)}
            </div>
            {(query || category !== "All") && <p className="recipes-count" role="status">{filtered.length} {filtered.length===1?"recipe":"recipes"}</p>}
          </div>}
        </div>
        {filtered.length
          ? <div className="recipes-grid">{filtered.map((recipe) => <RecipeCard key={recipe.id}
            recipe={recipe} favorite={favorites.includes(recipe.id)}
            onOpen={openRecipe} onFavorite={toggleFavorite}/>)}</div>
          : <div className="recipes-empty">No matching recipes. <button type="button"
              onClick={() => {setQuery("");setCategory("All");}}>Show all recipes</button></div>}
      </section>}
      {selected && <RecipeDetail recipe={selected}
        favorite={favorites.includes(selected.id)}
        onFavorite={toggleFavorite} onBack={closeRecipe} />}
      <footer className="recipes-signoff"><span aria-hidden="true">✦</span> Prepared with love, served with distinction. <span aria-hidden="true">✦</span></footer>
    </div>
  </main>;
}
