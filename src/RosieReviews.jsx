import React, { useEffect, useMemo, useState } from "react";
import "./RosieReviews.css";

const STORE = "rosie-reviews-diary-v1";
const poster = (path, width = 342) => path ? `https://image.tmdb.org/t/p/w${width}${path}` : null;
const readDiary = () => {
  try { const data = JSON.parse(localStorage.getItem(STORE) || "{}"); return data && typeof data === "object" && !Array.isArray(data) ? data : {}; }
  catch { return {}; }
};
const year = movie => movie?.release_date?.slice(0, 4) || "—";
function MoviePoster({ movie, onClick }) {
  return <button type="button" className="review-poster" onClick={onClick} aria-label={`View ${movie.title}`}>
    {movie.poster_path ? <img loading="lazy" src={poster(movie.poster_path)} alt="" onError={event => { event.currentTarget.style.display = "none"; }} /> : null}
    <span className="review-poster-fallback">{movie.title}</span>
  </button>;
}
function StarRating({ rating, onChange }) {
  return <div className="review-rating" role="group" aria-label="Your rating in half-star increments">
    {Array.from({ length: 5 }, (_, index) => <span className="rating-star" key={index}>
      {[0.5, 1].map(step => { const value = index + step; return <button key={step} type="button" className={`rating-half ${step === 1 ? "right" : "left"} ${value <= rating ? "selected" : ""}`} onClick={() => onChange(value === rating ? 0 : value)} aria-label={`Rate ${value} stars`} aria-pressed={rating === value}>★</button>; })}
    </span>)}
    <output>{rating ? `${rating.toFixed(1)} / 5` : "Not rated"}</output>
  </div>;
}
export default function RosieReviews() {
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [tab, setTab] = useState("discover");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [diary, setDiary] = useState(readDiary);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  useEffect(() => { try { localStorage.setItem(STORE, JSON.stringify(diary)); } catch { /* local storage may be blocked */ } }, [diary]);
  useEffect(() => {
    if (tab !== "discover") return undefined;
    const controller = new AbortController();
    setLoading(true); setError("");
    const url = appliedQuery ? `/api/movies?mode=search&query=${encodeURIComponent(appliedQuery)}` : "/api/movies?mode=trending";
    fetch(url, { signal: controller.signal }).then(async response => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Movie search failed");
      setResults(body.results || []);
    }).catch(e => { if (e.name !== "AbortError") { setResults([]); setError(e.message); } }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [appliedQuery, tab]);
  useEffect(() => {
    if (!selected) { setDetails(null); return undefined; }
    const controller = new AbortController();
    setDetails(selected);
    fetch(`/api/movies?mode=movie&id=${selected.id}`, { signal: controller.signal }).then(r => r.ok ? r.json() : null).then(d => { if (d && !controller.signal.aborted) setDetails(d); }).catch(() => {});
    return () => controller.abort();
  }, [selected]);
  const entry = selected ? diary[selected.id] || {} : {};
  const movies = useMemo(() => Object.values(diary).filter(item => item.movie), [diary]);
  const visible = tab === "discover" ? results : movies.filter(item => tab === "diary" ? item.watched : tab === "favorites" ? item.favorite : item.watchlist).map(item => item.movie).sort((a,b) => a.title.localeCompare(b.title));
  const save = patch => {
    if (!selected) return;
    setDiary(previous => ({ ...previous, [selected.id]: { ...(previous[selected.id] || {}), movie: { id: selected.id, title: selected.title, release_date: selected.release_date, poster_path: selected.poster_path, overview: selected.overview }, ...patch } }));
  };
  function openMovie(movie) { setSelected(movie); setDraft(diary[movie.id]?.review || ""); setEditing(false); }
  function submitReview(event) { event.preventDefault(); save({ review: draft.trim() }); setEditing(false); }
  return <main className="rosie-reviews" aria-label="Rosie's Reviews - Canine Critiques">
    <header className="reviews-hero">
      <div className="reviews-hero-copy"><span className="reviews-eyebrow">ROSIE'S PRIVATE CINEMA</span><h1>Rosie’s<br/>Reviews</h1><p>Canine Critiques</p></div>
      <div className="reviews-marquee">★ MOVIES WORTH WAGGING ABOUT ★</div>
    </header>
    <div className="reviews-content">
      <form className="reviews-search" onSubmit={event => { event.preventDefault(); setAppliedQuery(query.trim()); setTab("discover"); }}>
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search movies…" aria-label="Search movies by title" />
        <button type="submit">Search</button>
      </form>
      <nav className="reviews-tabs" aria-label="Movie diary sections">{[["discover","Discover"],["diary","Watched"],["favorites","Favorites"],["watchlist","Watchlist"]].map(([id,label]) => <button key={id} type="button" onClick={() => setTab(id)} className={tab === id ? "current" : ""} aria-current={tab === id ? "page" : undefined}>{label}</button>)}</nav>
      <section className="reviews-collection" aria-live="polite">
        <h2>{tab === "discover" ? (appliedQuery ? `Results for “${appliedQuery}”` : "Now Showing") : { diary:"Your Movie Diary", favorites:"The Favorites", watchlist:"Your Watchlist" }[tab]}</h2>
        {loading && <p role="status">Finding movies…</p>}
        {error && <p className="reviews-error" role="status">{error}. {error.includes("not configured") ? "Your diary still works once you have saved some films." : "Please try again."}</p>}
        {!loading && !error && !visible.length && <p>{tab === "discover" ? "No movies found. Try a different title." : "Nothing here yet. Find a movie and add it to your collection."}</p>}
        <div className="reviews-film-grid">{visible.map(movie => <div className="reviews-film-card" key={movie.id}><MoviePoster movie={movie} onClick={() => openMovie(movie)} /><button type="button" className="reviews-film-title" onClick={() => openMovie(movie)}>{movie.title}</button><small>{year(movie)} {diary[movie.id]?.rating ? `· ★ ${diary[movie.id].rating}` : ""}</small></div>)}</div>
      </section>
      <p className="reviews-attribution">Movie information and posters provided by <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">TMDB</a>. This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
    </div>
    {selected && <div className="reviews-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setSelected(null); }}>
      <section className="reviews-detail" role="dialog" aria-modal="true" aria-label={selected.title}>
        <button type="button" className="reviews-close" onClick={() => setSelected(null)} aria-label="Close movie details">×</button>
        <div className="reviews-detail-head">
          <div className="reviews-detail-poster">{details?.poster_path && <img src={poster(details.poster_path, 500)} alt="" />}</div>
          <div><p className="reviews-eyebrow">NOW SHOWING</p><h2>{details?.title || selected.title}</h2><p>{year(details || selected)}{details?.runtime ? ` · ${details.runtime} min` : ""}</p><p>{details?.genres?.map(g => g.name).join(" · ")}</p></div>
        </div>
        <p className="reviews-synopsis">{details?.overview || selected.overview || "No description available."}</p>
        <h3>Your Rating</h3><StarRating rating={entry.rating || 0} onChange={rating => save({rating})} />
        <div className="reviews-action-grid">
          <button type="button" className={entry.watched ? "is-on" : ""} onClick={() => save({ watched: !entry.watched, watchedDate: !entry.watched ? new Date().toISOString().slice(0,10) : null })}>{entry.watched ? "✓ Watched" : "Mark Watched"}</button>
          <button type="button" className={entry.favorite ? "is-on" : ""} onClick={() => save({favorite: !entry.favorite})}>{entry.favorite ? "♥ Favorite" : "♡ Favorite"}</button>
          <button type="button" className={entry.watchlist ? "is-on" : ""} onClick={() => save({watchlist: !entry.watchlist})}>{entry.watchlist ? "✓ Watchlisted" : "+ Watchlist"}</button>
        </div>
        {entry.watched && <label className="reviews-date">Watched on <input type="date" value={entry.watchedDate || ""} onChange={event => save({watchedDate:event.target.value})} /></label>}
        <div className="reviews-review-heading"><h3>My Review</h3><button type="button" onClick={() => { setDraft(entry.review || ""); setEditing(v => !v); }}>{editing ? "Cancel" : entry.review ? "Edit" : "Write Review"}</button></div>
        {editing ? <form onSubmit={submitReview}><textarea rows="5" value={draft} maxLength={5000} placeholder="What did you think?" onChange={event => setDraft(event.target.value)} /><button className="reviews-save" type="submit">Save Review</button></form> : <p className="reviews-review-body">{entry.review || "Your critique awaits its premiere."}</p>}
      </section>
    </div>}
  </main>;
}
