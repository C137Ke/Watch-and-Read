import React, { useState, useMemo } from "react";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');`;

const TYPE_META = {
  book: { label: "Book", glyph: "📖" },
  movie: { label: "Movie", glyph: "🎞" },
  tutorial: { label: "Tutorial", glyph: "▶" },
};

const STATUS_META = {
  "to-watch": { label: "To Watch/Read", color: "#52657A", stamp: "SHELVED" },
  "in-progress": { label: "In Progress", color: "#A6472B", stamp: "CHECKED OUT" },
  completed: { label: "Completed", color: "#5B7553", stamp: "RETURNED" },
};

const SEED_ITEMS = [
  { id: 1, title: "Piranesi", creator: "Susanna Clarke", year: 2020, type: "book", status: "completed", rating: 5, notes: "Reread the ending twice. The House as a character, not a setting." },
  { id: 2, title: "Past Lives", creator: "Celine Song", year: 2023, type: "movie", status: "completed", rating: 4, notes: "Quiet. Devastating restraint in the last 10 minutes." },
  { id: 3, title: "Postgres Indexing Deep Dive", creator: "Justin Jaffray", year: 2024, type: "tutorial", status: "in-progress", rating: 0, notes: "" },
  { id: 4, title: "The Employees", creator: "Olga Ravn", year: 2020, type: "book", status: "to-watch", rating: 0, notes: "" },
  { id: 5, title: "Perfect Days", creator: "Wim Wenders", year: 2023, type: "movie", status: "in-progress", rating: 0, notes: "" },
  { id: 6, title: "Building a Query Planner", creator: "CMU Databases", year: 2023, type: "tutorial", status: "to-watch", rating: 0, notes: "" },
  { id: 7, title: "Klara and the Sun", creator: "Kazuo Ishiguro", year: 2021, type: "book", status: "to-watch", rating: 0, notes: "" },
  { id: 8, title: "Aftersun", creator: "Charlotte Wells", year: 2022, type: "movie", status: "completed", rating: 5, notes: "The strobe-light scene undid me. Watch it twice." },
  { id: 9, title: "Designing Data-Intensive Systems", creator: "O'Reilly", year: 2022, type: "tutorial", status: "completed", rating: 4, notes: "Chapter 5 on replication is the one to revisit." },
];

const TMDB_API_KEY = "b16401a66a1fb1eb728babda70bd2940";

async function fetchBooks(q) {
  const res = await fetch(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=12`
  );
  if (!res.ok) throw new Error("Open Library request failed");
  const data = await res.json();
  return (data.docs || []).map((d) => ({
    key: `book-${d.key}`,
    title: d.title,
    creator: (d.author_name && d.author_name[0]) || "Unknown author",
    year: d.first_publish_year || "—",
    type: "book",
    cover: d.cover_i
      ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`
      : null,
  }));
}

async function fetchMovies(q) {
  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
      q
    )}`
  );
  if (!res.ok) throw new Error("TMDB request failed — check your API key");
  const data = await res.json();
  return (data.results || []).slice(0, 12).map((r) => ({
    key: `movie-${r.id}`,
    title: r.title,
    creator: "TMDB",
    year: r.release_date ? r.release_date.slice(0, 4) : "—",
    type: "movie",
    cover: r.poster_path
      ? `https://image.tmdb.org/t/p/w200${r.poster_path}`
      : null,
  }));
}

function Stamp({ status }) {
  const meta = STATUS_META[status];
  return (
    <div
      className="stamp"
      style={{ color: meta.color, borderColor: meta.color }}
    >
      {meta.stamp}
    </div>
  );
}

function StarRating({ value, onChange, readOnly }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="stars" role={readOnly ? undefined : "radiogroup"} aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = hover ? n <= hover : n <= value;
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            className="star-btn"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onMouseEnter={() => !readOnly && setHover(n)}
            onMouseLeave={() => !readOnly && setHover(0)}
            onClick={() => !readOnly && onChange(n)}
            style={{ cursor: readOnly ? "default" : "pointer" }}
          >
            <svg viewBox="0 0 24 24" width="17" height="17">
              <path
                d="M12 2.5l2.9 6.2 6.7.7-5 4.7 1.4 6.7L12 17.6 6 20.8l1.4-6.7-5-4.7 6.7-.7z"
                fill={filled ? "#C08A28" : "none"}
                stroke="#C08A28"
                strokeWidth="1.3"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

function Card({ item, onRate, onNote }) {
  const t = TYPE_META[item.type];
  const isDone = item.status === "completed";
  return (
    <div className="card">
      <div className="card-top">
        <span className="glyph">{t.glyph}</span>
        <span className="type-label">{t.label}</span>
        <Stamp status={item.status} />
      </div>
      <div className="perforation" aria-hidden="true">
        {Array.from({ length: 26 }).map((_, i) => (
          <span key={i} />
        ))}
      </div>
      <div className="card-body">
        <h3>{item.title}</h3>
        <p className="creator">
          {item.creator} · {item.year}
        </p>
        <StarRating
          value={item.rating}
          readOnly={!isDone}
          onChange={(n) => onRate(item.id, n)}
        />
        {isDone ? (
          <textarea
            className="notes"
            placeholder="Quick notes on this one…"
            value={item.notes}
            onChange={(e) => onNote(item.id, e.target.value)}
          />
        ) : (
          <p className="hint">Rate &amp; add notes once it's marked completed.</p>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [items, setItems] = useState(SEED_ITEMS);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState("mylist"); // 'mylist' | 'discover'
  const [discoverType, setDiscoverType] = useState("book");
  const [discoverQuery, setDiscoverQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [addedKeys, setAddedKeys] = useState([]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const matchesQuery =
        i.title.toLowerCase().includes(query.toLowerCase()) ||
        i.creator.toLowerCase().includes(query.toLowerCase());
      const matchesType = typeFilter === "all" || i.type === typeFilter;
      const matchesStatus = statusFilter === "all" || i.status === statusFilter;
      return matchesQuery && matchesType && matchesStatus;
    });
  }, [items, query, typeFilter, statusFilter]);

  const counts = useMemo(() => {
    const c = { "to-watch": 0, "in-progress": 0, completed: 0 };
    items.forEach((i) => (c[i.status] += 1));
    return c;
  }, [items]);

  const rate = (id, n) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, rating: n } : i)));
  const note = (id, text) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, notes: text } : i)));

  const runDiscoverSearch = async (e) => {
    e.preventDefault();
    if (!discoverQuery.trim()) return;
    setSearching(true);
    setSearchError("");
    try {
      const found =
        discoverType === "book"
          ? await fetchBooks(discoverQuery)
          : await fetchMovies(discoverQuery);
      setResults(found);
    } catch (err) {
      setSearchError(err.message || "Something went wrong");
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const addToList = (result) => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        title: result.title,
        creator: result.creator,
        year: result.year,
        type: result.type,
        status: "to-watch",
        rating: 0,
        notes: "",
      },
    ]);
    setAddedKeys((prev) => [...prev, result.key]);
  };

  return (
    <div className="app">
      <style>{`
        ${FONT_IMPORT}
        :root {
          --ink: #1D2321;
          --bg: #12181A;
          --bg-2: #1A2224;
          --paper: #F1ECDD;
          --paper-dim: #E6DFC9;
          --gold: #C08A28;
          --moss: #5B7553;
          --rust: #A6472B;
          --slate: #52657A;
        }
        * { box-sizing: border-box; }
        .app {
          background: var(--bg);
          background-image: radial-gradient(circle at 15% 0%, #1E2729 0%, var(--bg) 55%);
          min-height: 100vh;
          font-family: 'IBM Plex Sans', sans-serif;
          color: var(--paper);
          padding: 40px 32px 64px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          flex-wrap: wrap;
          gap: 20px;
          border-bottom: 1px solid rgba(241,236,221,0.18);
          padding-bottom: 22px;
          margin-bottom: 28px;
        }
        .wordmark {
          font-family: 'Fraunces', serif;
          font-optical-sizing: auto;
          font-weight: 600;
          font-size: 34px;
          letter-spacing: 0.01em;
          margin: 0;
        }
        .wordmark span { color: var(--gold); font-style: italic; font-weight: 500; }
        .subtitle {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11.5px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(241,236,221,0.55);
          margin: 6px 0 0;
        }
        .shelf-tabs { display: flex; gap: 10px; flex-wrap: wrap; }
        .shelf-tab {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          background: transparent;
          border: 1px solid rgba(241,236,221,0.3);
          color: rgba(241,236,221,0.75);
          padding: 8px 12px;
          border-radius: 3px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: border-color .15s, color .15s;
        }
        .shelf-tab:hover { border-color: var(--gold); color: var(--paper); }
        .shelf-tab.active {
          border-color: var(--gold);
          color: var(--ink);
          background: var(--gold);
        }
        .shelf-tab .n {
          background: rgba(0,0,0,0.18);
          border-radius: 2px;
          padding: 1px 5px;
          font-size: 10px;
        }
        .controls {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          align-items: center;
          margin-bottom: 30px;
        }
        .search-wrap {
          position: relative;
          flex: 1;
          min-width: 220px;
        }
        .search-wrap::before {
          content: 'SEARCH';
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          color: rgba(29,35,33,0.4);
          pointer-events: none;
        }
        .search-wrap input {
          width: 100%;
          background: var(--paper);
          border: 1px solid var(--paper-dim);
          color: var(--ink);
          font-family: 'IBM Plex Sans', sans-serif;
          font-size: 14px;
          padding: 12px 14px 12px 78px;
          border-radius: 3px;
          outline: none;
        }
        .search-wrap input:focus { border-color: var(--gold); }
        .chip-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .chip {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: var(--bg-2);
          border: 1px solid rgba(241,236,221,0.22);
          color: rgba(241,236,221,0.75);
          padding: 8px 12px;
          border-radius: 999px;
          cursor: pointer;
        }
        .chip.active {
          background: var(--paper);
          color: var(--ink);
          border-color: var(--paper);
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 22px;
        }
        .card {
          background: var(--paper);
          color: var(--ink);
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 10px 24px rgba(0,0,0,0.28);
          display: flex;
          flex-direction: column;
        }
        .card-top {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 16px 10px;
        }
        .glyph { font-size: 15px; }
        .type-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(29,35,33,0.55);
          flex: 1;
        }
        .stamp {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9.5px;
          letter-spacing: 0.08em;
          border: 1.5px solid;
          border-radius: 3px;
          padding: 3px 7px;
          transform: rotate(-4deg);
          font-weight: 500;
        }
        .perforation {
          display: flex;
          justify-content: space-between;
          padding: 0 10px;
          position: relative;
        }
        .perforation::before {
          content: '';
          position: absolute;
          top: 4px; left: 0; right: 0;
          border-top: 1px dashed rgba(29,35,33,0.25);
        }
        .perforation span {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: var(--bg);
          margin-top: 0.5px;
        }
        .card-body { padding: 16px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
        .card-body h3 {
          font-family: 'Fraunces', serif;
          font-weight: 600;
          font-size: 19px;
          margin: 0;
          line-height: 1.25;
        }
        .creator {
          font-size: 12.5px;
          color: rgba(29,35,33,0.6);
          margin: 0;
        }
        .stars { display: flex; gap: 2px; }
        .star-btn { background: none; border: none; padding: 2px; }
        .notes {
          font-family: 'IBM Plex Sans', sans-serif;
          font-size: 12.5px;
          border: 1px solid var(--paper-dim);
          background: rgba(255,255,255,0.4);
          border-radius: 4px;
          padding: 8px 10px;
          resize: vertical;
          min-height: 54px;
          color: var(--ink);
        }
        .notes:focus { outline: none; border-color: var(--gold); }
        .hint {
          font-size: 11.5px;
          font-style: italic;
          color: rgba(29,35,33,0.4);
          margin: 0;
        }
        .empty {
          text-align: center;
          padding: 60px 20px;
          color: rgba(241,236,221,0.5);
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .view-toggle {
          display: flex;
          gap: 4px;
          background: var(--bg-2);
          border-radius: 999px;
          padding: 4px;
          width: fit-content;
          margin-bottom: 24px;
        }
        .view-btn {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11.5px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          background: transparent;
          border: none;
          color: rgba(241,236,221,0.6);
          padding: 9px 18px;
          border-radius: 999px;
          cursor: pointer;
        }
        .view-btn.active { background: var(--gold); color: var(--ink); }
        .discover-source-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        .source-note {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          color: rgba(241,236,221,0.4);
          margin-left: 4px;
        }
        .key-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 16px;
          max-width: 420px;
        }
        .key-hint {
          font-size: 11px;
          color: rgba(241,236,221,0.4);
          line-height: 1.4;
        }
        .discover-search {
          display: flex;
          gap: 10px;
          margin-bottom: 26px;
          max-width: 520px;
        }
        .discover-search input {
          flex: 1;
          background: var(--paper);
          color: var(--ink);
          border: 1px solid var(--paper-dim);
          padding: 12px 14px;
          border-radius: 4px;
          font-size: 14px;
        }
        .discover-search input:focus { outline: none; border-color: var(--gold); }
        .discover-search button {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: var(--gold);
          color: var(--ink);
          border: none;
          padding: 0 20px;
          border-radius: 4px;
          cursor: pointer;
        }
        .discover-search button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .search-error {
          color: #E2A38A;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          margin-bottom: 18px;
        }
        .result-card {
          background: var(--paper);
          color: var(--ink);
          border-radius: 6px;
          overflow: hidden;
          display: flex;
          gap: 12px;
          padding: 12px;
          box-shadow: 0 8px 18px rgba(0,0,0,0.24);
        }
        .result-cover {
          width: 56px;
          height: 80px;
          flex-shrink: 0;
          background: var(--paper-dim);
          border-radius: 3px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .result-cover img { width: 100%; height: 100%; object-fit: cover; }
        .cover-placeholder { font-size: 20px; }
        .result-info { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .result-info h4 {
          font-family: 'Fraunces', serif;
          font-size: 14.5px;
          font-weight: 600;
          margin: 0;
          line-height: 1.25;
        }
        .result-info p {
          font-size: 11.5px;
          color: rgba(29,35,33,0.6);
          margin: 0;
        }
        .add-btn {
          margin-top: auto;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          letter-spacing: 0.04em;
          background: var(--moss);
          color: var(--paper);
          border: none;
          padding: 7px 10px;
          border-radius: 3px;
          cursor: pointer;
          width: fit-content;
        }
        .add-btn.added { background: rgba(91,117,83,0.35); color: rgba(241,236,221,0.6); cursor: default; }
      `}</style>

      <div className="header">
        <div>
          <h1 className="wordmark">
            Watch <span>&amp;</span> Read
          </h1>
          <p className="subtitle">Personal media catalog · {items.length} items on file</p>
        </div>
        <div className="shelf-tabs">
          {["all", "to-watch", "in-progress", "completed"].map((s) => (
            <button
              key={s}
              className={`shelf-tab ${statusFilter === s ? "active" : ""}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === "all" ? "All Shelves" : STATUS_META[s].label}
              {s !== "all" && <span className="n">{counts[s]}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="view-toggle">
        <button
          className={`view-btn ${view === "mylist" ? "active" : ""}`}
          onClick={() => setView("mylist")}
        >
          My List
        </button>
        <button
          className={`view-btn ${view === "discover" ? "active" : ""}`}
          onClick={() => setView("discover")}
        >
          Discover
        </button>
      </div>

      {view === "mylist" ? (
        <>
          <div className="controls">
            <div className="search-wrap">
              <input
                type="text"
                placeholder="Title or creator…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="chip-row">
              {["all", "book", "movie", "tutorial"].map((t) => (
                <button
                  key={t}
                  className={`chip ${typeFilter === t ? "active" : ""}`}
                  onClick={() => setTypeFilter(t)}
                >
                  {t === "all" ? "All Types" : TYPE_META[t].label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty">No items match — try clearing a filter.</div>
          ) : (
            <div className="grid">
              {filtered.map((item) => (
                <Card key={item.id} item={item} onRate={rate} onNote={note} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="discover">
          <div className="discover-source-toggle">
            {["book", "movie"].map((t) => (
              <button
                key={t}
                className={`chip ${discoverType === t ? "active" : ""}`}
                onClick={() => {
                  setDiscoverType(t);
                  setResults([]);
                  setSearchError("");
                }}
              >
                {TYPE_META[t].glyph} {TYPE_META[t].label}s
              </button>
            ))}
            <span className="source-note">
              {discoverType === "book" ? "via Open Library" : "via TMDB"}
            </span>
          </div>

          {discoverType === "movie" && (
            <div className="key-row">
              <span className="key-hint">Powered by TMDB.</span>
            </div>
          )}

          <form className="discover-search" onSubmit={runDiscoverSearch}>
            <input
              type="text"
              placeholder={
                discoverType === "book"
                  ? "Search books by title or author…"
                  : "Search movies by title…"
              }
              value={discoverQuery}
              onChange={(e) => setDiscoverQuery(e.target.value)}
            />
            <button type="submit" disabled={searching}>
              {searching ? "Searching…" : "Search"}
            </button>
          </form>

          {searchError && <div className="search-error">{searchError}</div>}

          {results.length > 0 && (
            <div className="grid">
              {results.map((r) => {
                const already = addedKeys.includes(r.key);
                return (
                  <div key={r.key} className="result-card">
                    <div className="result-cover">
                      {r.cover ? (
                        <img src={r.cover} alt={r.title} />
                      ) : (
                        <span className="cover-placeholder">
                          {TYPE_META[r.type].glyph}
                        </span>
                      )}
                    </div>
                    <div className="result-info">
                      <h4>{r.title}</h4>
                      <p>
                        {r.creator} · {r.year}
                      </p>
                      <button
                        className={`add-btn ${already ? "added" : ""}`}
                        disabled={already}
                        onClick={() => addToList(r)}
                      >
                        {already ? "Added ✓" : "+ Add to My List"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
