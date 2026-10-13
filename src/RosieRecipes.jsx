import React, { useEffect, useMemo, useRef, useState } from "react";
import { RECIPE_CATALOG, RECIPE_CATEGORIES } from "./rosieRecipesData.js";
import "./RosieRecipes.css";

const ROOT = "/rosieverse/recipes/";
const FAVORITES_KEY = "rosie-recipes-favorites-v1";
const icons = { Breakfast: "☼", "Small Bites": "✧", "Main Courses": "♛", Desserts: "✿" };
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
    <button type="button" className="recipes-card" onClick={() => onOpen(recipe.id)}
      aria-label={`View ${recipe.title}`}>
      <span className="recipes-card-image" aria-hidden="true">
        <span className="recipes-dish-symbol">{icons[recipe.category] || "✦"}</span>
        <small>FROM ROSIE’S KITCHEN</small>
      </span>
      <span className="recipes-card-copy">
        <strong>{recipe.title}</strong>
        <small>{recipe.category}</small>
      </span>
      <span className="recipes-card-footer" aria-hidden="true">VIEW RECIPE <span>↗</span></span>
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
  return <section id="recipes-detail" className="recipes-detail" aria-label={recipe.title}>
    <div className="recipes-detail-inner">
      <div className="recipes-detail-actions">
        <button type="button" onClick={onBack}>← The Collection</button>
        <button type="button" onClick={() => onFavorite(recipe.id)}
          aria-pressed={favorite}>{favorite ? "♥ Saved" : "♡ Save"}</button>
      </div>
      <span className="recipes-detail-crest" aria-hidden="true">♕ ✦ ♕</span>
      <p className="recipes-eyebrow">ROSIE’S ROYAL COOKBOOK · {recipe.category.toUpperCase()}</p>
      <h2>{recipe.title}</h2>
      {recipe.description && <p className="recipes-detail-description">{recipe.description}</p>}
      {ready ? <>
        <dl className="recipes-facts">
          {recipe.prepMinutes != null && <div><dt>Preparation</dt><dd>{recipe.prepMinutes} min</dd></div>}
          {recipe.cookMinutes != null && <div><dt>Cooking</dt><dd>{recipe.cookMinutes} min</dd></div>}
          {recipe.servings != null && <div><dt>Servings</dt><dd>{recipe.servings}</dd></div>}
          {recipe.difficulty && <div><dt>Difficulty</dt><dd>{recipe.difficulty}</dd></div>}
        </dl>
        <h3>Ingredients</h3>
        <ul className="recipes-ingredient-list">
          {recipe.ingredients.map((ingredient, i) =>
            <li key={i}><label><input type="checkbox" checked={checked.includes(i)}
              onChange={() => setChecked((old) => old.includes(i) ? old.filter(x => x !== i) : [...old,i])}/>
              <span>{ingredient}</span></label></li>)}
        </ul>
        <h3>Method</h3>
        <ol className="recipes-steps">
          {recipe.steps.map((step, i) => <li key={i}>{step}</li>)}
        </ol>
        {recipe.note && <aside className="recipes-note"><strong>Rosie’s Note</strong><p>{recipe.note}</p></aside>}
        <button type="button" className="recipes-print" onClick={() => window.print()}>Print Recipe</button>
      </> : <div className="recipes-awaiting-copy">
        <span aria-hidden="true">✦</span>
        <h3>From the Royal Cookbook</h3>
        <p>This recipe’s original ingredients and method have not yet been imported. Its title and place in the collection are preserved; no quantities or instructions have been invented.</p>
      </div>}
    </div>
  </section>;
}
export default function RosieRecipes() {
  const [query, setQuery] = useState("");
  const [crestReady, setCrestReady] = useState(false);
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("collection");
  const [favorites, setFavorites] = useState(loadFavorites);
  const [selectedId, setSelectedId] = useState(null);
  const detailRef = useRef(null);
  const searchRef = useRef(null);
  useEffect(() => {
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)); } catch {}
  }, [favorites]);
  const filtered = useMemo(() => {
    const normalized = query.toLocaleLowerCase().trim();
    const matches = RECIPE_CATALOG.filter((recipe) => {
      const categoryMatch = category === "All" || category === recipe.category ||
        (category === "Favorites" && favorites.includes(recipe.id));
      const words = `${recipe.title} ${recipe.category} ${recipe.description || ""}`.toLocaleLowerCase();
      return categoryMatch && (!normalized || words.includes(normalized));
    });
    return sort === "name" ? [...matches].sort((a,b) => a.title.localeCompare(b.title)) : matches;
  }, [query, category, sort, favorites]);
  const selected = RECIPE_CATALOG.find((recipe) => recipe.id === selectedId);
  const toggleFavorite = (id) => setFavorites((previous) =>
    previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]);
  function openRecipe(id) {
    setSelectedId(id);
    window.setTimeout(() => document.getElementById("recipes-detail")?.scrollIntoView({behavior:"smooth",block:"start"}), 10);
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
        <p>Twenty-five delicious human recipes, approved by the most discerning Shiba in the kingdom.</p>
      </header>
      <section className="recipes-index" aria-label="The recipe collection" ref={searchRef}>
        <div className="recipes-index-header">
          <span className="recipes-eyebrow">FROM THE ROYAL KITCHEN</span>
          <h2>The Recipe Collection</h2>
          <p>Discover breakfast favorites, irresistible bites, exceptional mains and splendid desserts.</p>
        </div>
        <div className="recipes-search-row">
          <label className="recipes-search"><span className="recipes-visually-hidden">Search recipes</span>
            <span aria-hidden="true">⌕</span>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)}
              placeholder="Find a recipe…" autoComplete="off"/>
          </label>
          <label className="recipes-sort">
            <span className="recipes-visually-hidden">Sort recipes</span>
            <select value={sort} onChange={e => setSort(e.target.value)}>
              <option value="collection">Cookbook order</option>
              <option value="name">Name A–Z</option>
            </select>
          </label>
        </div>
        <div className="recipes-category-tabs" aria-label="Filter recipes by category">
          {RECIPE_CATEGORIES.map((cat) => <button key={cat} type="button"
            className={category===cat?"is-active":""} aria-pressed={category===cat}
            onClick={() => {setCategory(cat);setSelectedId(null);}}>{cat}</button>)}
        </div>
        <p className="recipes-count" role="status">{filtered.length} {filtered.length===1?"recipe":"recipes"} in the collection</p>
        {filtered.length
          ? <div className="recipes-grid">{filtered.map((recipe) => <RecipeCard key={recipe.id}
            recipe={recipe} favorite={favorites.includes(recipe.id)}
            onOpen={openRecipe} onFavorite={toggleFavorite}/>)}</div>
          : <div className="recipes-empty">No matching recipes. <button type="button"
              onClick={() => {setQuery("");setCategory("All");}}>Show all recipes</button></div>}
      </section>
      {selected && <RecipeDetail recipe={selected}
        favorite={favorites.includes(selected.id)}
        onFavorite={toggleFavorite} onBack={closeRecipe} />}
      <footer className="recipes-signoff"><span aria-hidden="true">✦</span> Prepared with love, served with distinction. <span aria-hidden="true">✦</span></footer>
    </div>
  </main>;
}
