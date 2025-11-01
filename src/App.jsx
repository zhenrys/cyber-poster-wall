import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Search, Plus, X, Download, Upload } from "lucide-react";

// ------------ Seed Data ------------
const seed = [
  {
    id: "bladerunner2049",
    title: "Blade Runner 2049",
    year: 2017,
    genres: ["Sci-Fi", "Cyberpunk"],
    rating: 8.1,
    posterUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=800&auto=format&fit=crop",
    review:
      "Hypnotic neon-noir that meditates on memory and meaning. Visuals that hum like rain on neon glass.",
  },
  {
    id: "akira1988",
    title: "AKIRA",
    year: 1988,
    genres: ["Anime", "Cyberpunk"],
    rating: 8.0,
    posterUrl:
      "https://images.unsplash.com/photo-1558980664-10eaaffc74c0?q=80&w=800&auto=format&fit=crop",
    review:
      "Boiling energy and dystopian grit. The motorcycle-light trails are pure adrenaline.",
  },
  {
    id: "ghostintheshell",
    title: "Ghost in the Shell",
    year: 1995,
    genres: ["Anime", "Sci-Fi"],
    rating: 7.9,
    posterUrl:
      "https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=800&auto=format&fit=crop",
    review:
      "A cool, philosophical drift through cybernetic identity and surveillance.",
  },
  {
    id: "matrix1999",
    title: "The Matrix",
    year: 1999,
    genres: ["Sci-Fi", "Action"],
    rating: 8.7,
    posterUrl:
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop",
    review:
      "Bullet-time ballet. Questions reality with black-lacquer swagger.",
  },
];

const LS_KEY = "cyberwall.posters.v1";

function useLocalData() {
  const [items, setItems] = useState(seed);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(mergeAndDedupe(seed, parsed));
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(items));
    } catch (_) {}
  }, [items]);

  return { items, setItems };
}

function mergeAndDedupe(a, b) {
  const map = new Map();
  [...a, ...b].forEach((p) => map.set(p.id, p));
  return [...map.values()];
}

// ------------ Drawer ------------
function Drawer({ open, onClose, onAdd }) {
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [genres, setGenres] = useState("");
  const [rating, setRating] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [review, setReview] = useState("");

  useEffect(() => {
    if (!open) {
      setTitle("");
      setYear("");
      setGenres("");
      setRating("");
      setPosterUrl("");
      setReview("");
    }
  }, [open]);

  const submit = () => {
    if (!title || !posterUrl) return;
    const p = {
      id: title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now(),
      title,
      year: Number(year) || new Date().getFullYear(),
      genres: genres
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean),
      rating: Number(rating) || 0,
      posterUrl,
      review: review || "",
    };
    onAdd(p);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
            className="absolute right-0 top-0 h-full w-full max-w-md bg-zinc-900 text-zinc-100 p-6 overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Add Poster</h3>
              <button
                onClick={onClose}
                className="p-2 rounded hover:bg-zinc-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <Field label="Title">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-800 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="e.g., Blade Runner"
                />
              </Field>
              <Field label="Year">
                <input
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full bg-zinc-800 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="2017"
                />
              </Field>
              <Field label="Genres (comma-separated)">
                <input
                  value={genres}
                  onChange={(e) => setGenres(e.target.value)}
                  className="w-full bg-zinc-800 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="Cyberpunk, Sci-Fi"
                />
              </Field>
              <Field label="Rating (0–10)">
                <input
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="w-full bg-zinc-800 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="8.3"
                />
              </Field>
              <Field label="Poster URL">
                <input
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  className="w-full bg-zinc-800 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="https://.../poster.jpg"
                />
              </Field>
              <Field label="Short Review">
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows={4}
                  className="w-full bg-zinc-800 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="One or two punchy lines..."
                />
              </Field>

              <button
                onClick={submit}
                className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-2"
              >
                <Plus size={16} /> Add
              </button>
              <p className="text-xs text-zinc-400">
                New items are stored locally in your browser (localStorage). To
                persist in the repo, export JSON and commit it as posters.json.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm text-zinc-300">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

// ------------ Modal ------------
function PosterModal({ item, onClose }) {
  if (!item) return null;
  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 16 }}
            className="mx-auto my-10 max-w-4xl rounded-2xl overflow-hidden shadow-2xl bg-zinc-950/90 border border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid md:grid-cols-2 gap-0">
              <div className="relative aspect-[2/3]">
                <img
                  src={item.posterUrl}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-cyan-500/10 to-fuchsia-500/10" />
              </div>
              <div className="p-6 flex flex-col">
                <h3 className="text-2xl font-semibold tracking-wide">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-400 mt-1">
                  {item.year} · {item.genres.join(" / ")} · ⭐{" "}
                  {item.rating.toFixed(1)}
                </p>
                <p className="mt-4 text-zinc-200 leading-relaxed">
                  {item.review || "(No review yet)"}
                </p>
                <button
                  onClick={onClose}
                  className="mt-auto self-end inline-flex items-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-2"
                >
                  <X size={16} /> Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ------------ Stats ------------
function Stats({ items }) {
  const genreCounts = useMemo(() => {
    const map = new Map();
    items.forEach((p) =>
      p.genres.forEach((g) => map.set(g, (map.get(g) || 0) + 1))
    );
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [items]);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-zinc-100">Genre Distribution</h4>
        <span className="text-xs text-zinc-400">Hover for details</span>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={genreCounts}>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              strokeOpacity={0.15}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: "#d4d4d8", fontSize: 12 }}
              axisLine={{ stroke: "#52525b" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#d4d4d8", fontSize: 12 }}
              axisLine={{ stroke: "#52525b" }}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: "#0a0a0b",
                border: "1px solid #27272a",
                borderRadius: 12,
                color: "#e4e4e7",
              }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ------------ Toolbar ------------
function Toolbar({ q, setQ, onAddClick, items, setItems }) {
  const download = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "posters.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) setItems(mergeAndDedupe(items, parsed));
    } catch (err) {
      alert("Invalid JSON file");
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={18} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title, genre, or year..."
          className="pl-10 pr-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 outline-none focus:ring-2 focus:ring-cyan-400 min-w-[260px]"
        />
      </div>

      <div className="flex gap-2">
        <label className="inline-flex items-center gap-2 rounded-xl bg-zinc-900/60 border border-zinc-800 px-3 py-2 cursor-pointer hover:bg-zinc-900">
          <Upload size={16} /> Import JSON
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={onImport}
          />
        </label>
        <button
          onClick={download}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900/60 border border-zinc-800 px-3 py-2 hover:bg-zinc-900"
        >
          <Download size={16} /> Export JSON
        </button>
        <button
          onClick={onAddClick}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 text-black px-3 py-2 hover:bg-cyan-400"
        >
          <Plus size={16} /> Add Poster
        </button>
      </div>
    </div>
  );
}

// ------------ Grid ------------
function Grid({ items, onOpen }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {items.map((p) => (
        <motion.div
          key={p.id}
          whileHover={{ scale: 1.02 }}
          className="group relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/40 hover:shadow-[0_0_40px_rgba(34,211,238,0.25)] transition-shadow"
          onClick={() => onOpen(p)}
        >
          <div className="aspect-[2/3] overflow-hidden">
            <img
              src={p.posterUrl}
              alt={p.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="p-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium tracking-wide text-zinc-100 line-clamp-1">
                {p.title}
              </h3>
              <span className="text-xs text-zinc-400">{p.year}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-zinc-400">
              <span className="line-clamp-1">{p.genres.join(" / ")}</span>
              <span>⭐ {p.rating.toFixed(1)}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ------------ Root App ------------
export default function App() {
  const { items, setItems } = useLocalData();
  const [drawer, setDrawer] = useState(false);
  const [modal, setModal] = useState(null);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((p) => {
      const hay = [p.title, p.year, ...p.genres].join(" ").toLowerCase();
      return hay.includes(s);
    });
  }, [q, items]);

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(34,211,238,0.15),transparent),radial-gradient(1200px_600px_at_80%_120%,rgba(244,63,94,0.12),transparent)] text-zinc-100">
      <header className="sticky top-0 z-20 backdrop-blur border-b border-zinc-800/60 bg-zinc-950/60">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg md:text-2xl font-semibold tracking-wide">
            Cyber Poster Wall
          </h1>
          <span className="text-xs text-zinc-400">
            Minimal · Modern · Open-Source
          </span>
        </div>
      </header>

      {/* 此处可以调整网页宽度max-w-6xl -> max-w-14xl */}
      <main className="mx-auto max-w-14xl px-4 py-6 space-y-6"> 
        <Toolbar
          q={q}
          setQ={setQ}
          onAddClick={() => setDrawer(true)}
          items={items}
          setItems={setItems}
        />

        <Stats items={filtered} />

        <Grid items={filtered} onOpen={(p) => setModal(p)} />
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-10 text-xs text-zinc-500">
        <p>
          Built with React, Tailwind, Framer Motion, and Recharts. Add your
          posters via the{" "}
          <span className="text-zinc-300">Add Poster</span> drawer (local) or
          commit a <code>posters.json</code> file to the repo (persistent).
        </p>
      </footer>

      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        onAdd={(p) => setItems([p, ...items])}
      />
      <PosterModal item={modal} onClose={() => setModal(null)} />
    </div>
  );
}
