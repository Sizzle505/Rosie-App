const ROOT = "https://api.themoviedb.org/3";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  const key = process.env.TMDB_API_KEY;
  if (!token && !key) return res.status(503).json({ error: "TMDB is not configured yet. Add TMDB_READ_ACCESS_TOKEN in Vercel." });
  const { mode = "trending", query = "", id = "", page = "1" } = req.query || {};
  const number = Number(id);
  const endpoints = {
    trending: "/trending/movie/week",
    search: "/search/movie",
    movie: Number.isSafeInteger(number) && number > 0 ? `/movie/${number}` : null,
    similar: Number.isSafeInteger(number) && number > 0 ? `/movie/${number}/recommendations` : null
  };
  if (!Object.hasOwn(endpoints, mode) || !endpoints[mode]) return res.status(400).json({ error: "Invalid request" });
  const params = new URLSearchParams({ language: "en-US" });
  if (mode === "search") {
    if (typeof query !== "string" || !query.trim() || query.length > 100) return res.status(400).json({ error: "Enter a movie title" });
    params.set("query", query.trim());
    params.set("include_adult", "false");
  }
  if (["search", "trending", "similar"].includes(mode)) params.set("page", String(Math.max(1, Math.min(20, Number(page) || 1))));
  if (key && !token) params.set("api_key", key);
  try {
    const response = await fetch(`${ROOT}${endpoints[mode]}?${params}`, { headers: token ? { Authorization: `Bearer ${token}`, Accept: "application/json" } : { Accept: "application/json" }, signal: AbortSignal.timeout(9000) });
    if (!response.ok) return res.status(response.status === 429 ? 429 : 502).json({ error: response.status === 429 ? "Movie search is temporarily rate-limited" : "Movie database request failed" });
    const data = await response.json();
    if (mode === "movie") return res.status(200).json({ id: data.id, title: data.title, overview: data.overview, release_date: data.release_date, runtime: data.runtime, poster_path: data.poster_path, backdrop_path: data.backdrop_path, genres: data.genres, vote_average: data.vote_average });
    return res.status(200).json({ results: (data.results || []).filter(item => item.id && item.title && !item.adult).map(item => ({ id: item.id, title: item.title, overview: item.overview, release_date: item.release_date, poster_path: item.poster_path, backdrop_path: item.backdrop_path, vote_average: item.vote_average })) });
  } catch {
    return res.status(502).json({ error: "Movie database is temporarily unavailable" });
  }
}
