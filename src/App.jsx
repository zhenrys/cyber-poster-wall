import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Upload, Download, Trash2, Edit3, Link as LinkIcon, Clipboard as ClipboardIcon, Image as ImageIcon } from "lucide-react";
import { Moon, Sun } from "lucide-react";


const LS_KEY = "cyberwall.posters.v1";

function useLocalData() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
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

function blobToCompressedDataURL(blob, { maxWidth = 800, quality = 0.85 } = {}) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataURL = canvas.toDataURL("image/jpeg", quality);
        resolve(dataURL);
      };
      img.crossOrigin = "anonymous";
      img.src = e.target.result;
    };
    reader.readAsDataURL(blob);
  });
}

async function compressFromFile(file) {
  return await blobToCompressedDataURL(file);
}

async function compressFromUrl(url) {
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error("Failed to fetch image");
  const blob = await res.blob();
  return await blobToCompressedDataURL(blob);
}

function Drawer({ open, onClose, items, setItems, onAdd, editingItem }) {
  const [title, setTitle] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [review, setReview] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const imgInputRef = useRef(null);
  const jsonInputRef = useRef(null);

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setPosterUrl(editingItem.posterUrl);
      setReview(editingItem.review);
    } else if (open) {
      setTitle("");
      setPosterUrl("");
      setReview("");
      setUrlInput("");
    }
  }, [editingItem, open]);

  useEffect(() => {
    const handlePaste = (e) => {
      const file = e.clipboardData?.files?.[0];
      if (file && file.type.startsWith("image/")) {
        compressFromFile(file).then((dataURL) => setPosterUrl(dataURL));
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    compressFromFile(file).then((dataURL) => setPosterUrl(dataURL));
  };

  const handleFetchFromUrl = async () => {
    if (!urlInput) return;
    try {
      const dataURL = await compressFromUrl(urlInput);
      setPosterUrl(dataURL);
    } catch (err) {
      alert("❌ Failed to fetch image (CORS or invalid link)");
    }
  };

  const submit = () => {
    if (!title || !posterUrl) return;
    if (editingItem) {
      const updated = items.map((p) =>
        p.id === editingItem.id ? { ...p, title, posterUrl, review } : p
      );
      setItems(updated);
    } else {
      const newPoster = {
        id: title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now(),
        title,
        posterUrl,
        review,
      };
      onAdd(newPoster);
    }
    onClose();
  };

  const importJson = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        setItems(parsed);
        localStorage.setItem(LS_KEY, JSON.stringify(parsed));
        alert(`✅ Imported ${parsed.length} posters.`);
      } else alert("⚠️ Invalid JSON structure.");
    } catch {
      alert("❌ Failed to parse JSON file.");
    }
  };

  const exportJson = () => {
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

  const clearStorage = () => {
    if (confirm("⚠️ Clear all local data?")) {
      localStorage.removeItem(LS_KEY);
      setItems([]);
      alert("🧹 Local storage cleared.");
    }
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
            {/* 右上角退出按钮 */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">
                {editingItem ? "Edit Poster" : "Poster Manager"}
              </h3>
              <button onClick={onClose} className="p-2 rounded hover:bg-zinc-800 text-black">
                <X size={18} />
              </button>
            </div>

            
            <div className="space-y-3">
              {/* 标题名字 */}
              <label className="block">
                <span className="text-sm text-zinc-300">Title</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-800 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </label>

              {/* 插入图片的方式设置 */}
              <div className="space-y-2">
                <span className="text-sm text-zinc-300">Poster Image (3 Ways)</span>
                <div className="flex gap-2">
                  <input
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Enter Image URL"
                    className="flex-1 bg-zinc-800 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                  <button
                    onClick={handleFetchFromUrl}
                    className="px-3 py-2 rounded bg-cyan-500 text-black font-semibold hover:bg-cyan-400"
                  >
                    <LinkIcon size={16} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => imgInputRef.current?.click()}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-800 text-black hover:bg-zinc-700 py-2"
                  >
                    <ImageIcon size={16} /> Upload File
                  </button>
                  <input
                    ref={imgInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="flex items-center gap-1 text-xs text-zinc-400">
                    <ClipboardIcon size={14} /> Paste image
                  </div>
                </div>
              </div>

              {posterUrl && (
                <div className="mt-2">
                  <img
                    src={posterUrl}
                    alt="Preview"
                    className="rounded-xl border border-zinc-700 max-h-64 mx-auto"
                  />
                </div>
              )}


              {/* Short Review 框*/}
              <label className="block">
                <span className="text-sm text-zinc-300">Short Review</span>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-800 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </label>
              
              {/* submit 按钮*/}
              <button
                onClick={submit}
                className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-2"
              >
                <Plus size={16} /> {editingItem ? "Save Changes" : "Add Poster"}
              </button>

              <hr className="my-4 border-zinc-700" />

              {/* import json 按钮 */}
              <button
                onClick={() => jsonInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 py-2 text-black"
              >
                <Upload size={16} /> Import Posters JSON
              </button>
              <input
                ref={jsonInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={importJson}
              />

              {/* export json 按钮 */}
              <button
                onClick={exportJson}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 py-2 text-black"
              >
                <Download size={16} /> Export Posters JSON
              </button>

              {/* clear 按钮 */}
              <button
                onClick={clearStorage}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 text-black py-2"
              >
                <Trash2 size={16} /> Clear Local Storage
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// poster 卡片的翻转效果
function FlipCard({ poster, onEdit }) {
  const [flipped, setFlipped] = useState(false);

  if (!poster || typeof poster !== 'object') return null;
  const { posterUrl = '', title = 'Untitled', review = '' } = poster;

  return (
    <div
      className="relative w-full aspect-[2/3] perspective cursor-pointer"
      onClick={() => setFlipped(!flipped)}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
    >
      <motion.div
        className="absolute inset-0 preserve-3d transition-transform duration-700"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* 正面 */}
        <div className="absolute inset-0 backface-hidden">
          <img
            src={posterUrl}
            alt={title}
            className={`h-full w-full object-cover rounded-2xl border border-zinc-800 transition-all duration-700 ${flipped ? 'blur-sm scale-105' : ''}`}
          />
        </div>

        {/* 反面 */}
        <div
          className="absolute inset-0 rounded-2xl border border-zinc-800 p-4 text-zinc-200 backface-hidden flex flex-col justify-between"
          style={{
            transform: 'rotateY(180deg)',
            background:
              'radial-gradient(circle at top center, rgba(255, 215, 0, 0.15), rgba(0, 0, 0, 0.95))',
            boxShadow: '0 -10px 30px rgba(255, 223, 100, 0.2)',
          }}
        >
          <div>
            <h3 className="font-semibold text-lg mb-2 text-yellow">
              {title}
            </h3>
            <p
              className="text-sm text-zinc-300 line-clamp-6"
              style={{
                color: '#fffff0',
                textShadow: '0 0 10px rgba(255, 255, 160, 0.65), 0 0 20px rgba(255, 255, 180, 0.45)',
              }}
            >
              {review || '(No review yet)'}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit && onEdit(poster);
            }}
            className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-500 text-black font-semibold hover:bg-cyan-400 self-end"
          >
            <Edit3 size={14} /> Edit
          </button>
        </div>
      </motion.div>
    </div>
  );
}


export default function App() {
  const { items, setItems } = useLocalData();
  const [drawer, setDrawer] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-700 ${
        darkMode
          ? "bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(34,211,238,0.1),transparent),radial-gradient(1200px_600px_at_80%_120%,rgba(244,63,94,0.1),transparent)] text-zinc-100 bg-zinc-950"
          : "bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(34,211,238,0.05),transparent),radial-gradient(1200px_600px_at_80%_120%,rgba(244,63,94,0.05),transparent)] text-zinc-900 bg-zinc-50"
      }`}
    >
    
    {/* 此处通过 ml-15 与 mr-15 调整标题内容间距，左右边距，实现全面屏 */}
    <header className="sticky top-0 z-20 backdrop-blur border-b border-zinc-800/60 bg-zinc-950/60 ">
      <div className="mx-auto max-w-8xl px-4 py-3 flex items-center justify-between ml-20 mr-15">
        <h1 className="text-lg md:text-2xl font-semibold tracking-wide mr-40">
          🎞️ 🌉 📸 Cyber Poster Wall 🎞️ 🌉 📸 
        </h1>
        <div className="flex items-center gap-3 ">

          {/* 黑夜模式按钮 */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 transition-colors ${
              darkMode
                ? "border border-zinc-700 hover:border-cyan-400 text-black"
                : "border border-zinc-300 hover:border-cyan-500 text-black"
            }`}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            <span className="text-sm">{darkMode ? "Light" : "Dark"}</span>
          </button>
          
          {/* poster manage 按钮 */}
          <button
            onClick={() => {
              setEditingItem(null);
              setDrawer(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 text-black px-3 py-2 hover:bg-cyan-400"
          >
            <Plus size={16} /> Add / Manage
          </button>
        </div>
      </div>
    </header>

      {/*  poster 展板部分主体部分几行几列 */}
      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <FlipCard
              key={p.id}
              poster={p}
              onEdit={(poster) => {
                setEditingItem(poster);
                setDrawer(true);
              }}
            />
          ))}
        </div>
      </main>
      
      {/* 末尾的提示语 */}
      <footer className="mx-auto max-w-6xl px-4 py-10 text-xs text-zinc-500 text-center">
        <p>
          Import your <code>posters.json</code> → Add/Edit posters → Export JSON → Clear storage. Fully offline & portable.
        </p>
      </footer>

      
      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        items={items}
        setItems={setItems}
        onAdd={(p) => setItems([p, ...items])}
        editingItem={editingItem}
      />
    </div>
  );
}
