import { useState, useRef, useEffect } from "react";
import { Smile, Image as ImageIcon, Sparkles, Search, X, Loader2 } from "lucide-react";

const EMOJI_CATEGORIES = [
  {
    name: "Popular & Expressions",
    emojis: ["😂", "🤣", "❤️", "😍", "😊", "🔥", "👍", "🎉", "😭", "😎", "👀", "✨", "🙏", "💯", "🥳", "💀", "🤍", "🥺", "🥰", "🙌", "🤡", "😈", "🥳", "🤪"]
  },
  {
    name: "Reactions & Feelings",
    emojis: ["😘", "🤩", "🤯", "🥶", "😡", "🤐", "🤢", "🤮", "🤧", "🤠", "🥸", "🧐", "🤓", "😴", "👻", "👽", "🤖", "💩", "🙋‍♂️", "🏻", "🙈", "🙉", "🙊"]
  },
  {
    name: "Hands & Gestures",
    emojis: ["👍", "👎", "👏", "🙌", "👐", "🤲", "🤝", "✍️", "✋", "✌️", "🤞", "🤟", "🤘", "👈", "👉", "👆", "👇", "💪", "👊", "👋", "🖕", "✍️"]
  },
  {
    name: "Animals & Cute",
    emojis: ["🐱", "🐶", "🐼", "🦊", "🐯", "🦁", "🐰", "🐻", "🐵", "🦄", "🐙", "🐬", "🌟", "🌈", "☀️", "🌙", "🌸", "🍀", "⚡", "🦋", "🐝", "🦉"]
  },
  {
    name: "Food & Activity",
    emojis: ["🍕", "🍔", "🍟", "🌭", "🍿", "🍩", "🍦", "🎂", "☕", "🍺", "⚽", "🏀", "🎮", "🎸", "🎧", "🚀", "🚗", "💎", "🎁", "🎈", "🏆", "🎯"]
  }
];

const WHATSAPP_STICKER_PACKS = [
  {
    category: "Pepe & Memes",
    stickers: [
      { id: "p1", name: "Pepe Cool", url: "https://cdn-icons-png.flaticon.com/512/742/742751.png" },
      { id: "p2", name: "Doge Wow", url: "https://cdn-icons-png.flaticon.com/512/91/91544.png" },
      { id: "p3", name: "Smirk Cat", url: "https://cdn-icons-png.flaticon.com/512/1864/1864514.png" },
      { id: "p4", name: "Party Cat", url: "https://cdn-icons-png.flaticon.com/512/4712/4712109.png" },
      { id: "p5", name: "Cool Cat", url: "https://cdn-icons-png.flaticon.com/512/616/616430.png" },
      { id: "p6", name: "Crying Cat", url: "https://cdn-icons-png.flaticon.com/512/1864/1864593.png" },
    ]
  },
  {
    category: "Cute Animals & Chibi",
    stickers: [
      { id: "a1", name: "Panda Cute", url: "https://cdn-icons-png.flaticon.com/512/3069/3069172.png" },
      { id: "a2", name: "Fox Love", url: "https://cdn-icons-png.flaticon.com/512/3069/3069224.png" },
      { id: "a3", name: "Boba Bear", url: "https://cdn-icons-png.flaticon.com/512/3081/3081162.png" },
      { id: "a4", name: "Shiba Inu", url: "https://cdn-icons-png.flaticon.com/512/2829/2829813.png" },
      { id: "a5", name: "Bunny Kiss", url: "https://cdn-icons-png.flaticon.com/512/3069/3069189.png" },
      { id: "a6", name: "Unicorn Star", url: "https://cdn-icons-png.flaticon.com/512/3468/3468377.png" },
    ]
  },
  {
    category: "Reactions & Emoticons",
    stickers: [
      { id: "r1", name: "Fire Flame", url: "https://cdn-icons-png.flaticon.com/512/785/785116.png" },
      { id: "r2", name: "Sparkle Heart", url: "https://cdn-icons-png.flaticon.com/512/2589/2589175.png" },
      { id: "r3", name: "Game On", url: "https://cdn-icons-png.flaticon.com/512/808/808439.png" },
      { id: "r4", name: "Rocket Launch", url: "https://cdn-icons-png.flaticon.com/512/1356/1356479.png" },
      { id: "r5", name: "Party Popper", url: "https://cdn-icons-png.flaticon.com/512/3567/3567035.png" },
      { id: "r6", name: "Target Bullseye", url: "https://cdn-icons-png.flaticon.com/512/2965/2965787.png" },
    ]
  }
];

const PRESET_GIFS = [
  { id: "g1", name: "Mind Blown", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHp1c3RwYnhuaHFuZHBtdWdqbXBhNWhsZXRldTVqZGF0eTRicHlmbCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l3q2K5jinAlChoCLS/giphy.gif" },
  { id: "g2", name: "Laughing", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbm91NnZ4Yjlhd2U5bXJleW9zYTF1enZxdWZubzhrbDZydXQzMjF5OCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/cM2CN5UevVL1sA4ygu/giphy.gif" },
  { id: "g3", name: "Love Heart", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYXZ6MDBzb3ZndmtxdHBnMGtna2YxMTF4cXBhOHkyYWpldnl4YnA4NSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26flX27CR6BSyU63K/giphy.gif" },
  { id: "g4", name: "Dance Party", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3drOHdsYnhuZzI2dnBqazQxZnlhbDVpdTV4cnRndTF0Nmg5NWlsZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/10UeedrT5MIfPG/giphy.gif" },
  { id: "g5", name: "Cheers", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDVqbmpxeGUzaTJpcnFnZnlyMXV2dms4NHY0N2EyaG4zaGV2NGgxaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/g9582DNuQppxC/giphy.gif" },
  { id: "g6", name: "Cat Thumbs Up", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbm04dWUwcWRndnlxc2d2ZTZudHZ0OHpzOGg5ZmtvdHhtNXlhaTVkciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0AMJzvhO1GqEB16g/giphy.gif" },
  { id: "g7", name: "Cat Dance", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN3J6czF1bDRhNG4xMzgwNGdrOWVwZGptMnZwZzY5bnU3OXN0dmx4NyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/14urMYvGQ3tfBi/giphy.gif" },
  { id: "g8", name: "Shocked", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNXAzbDY1bTB2YmU4OWlmbTFxMHVsbWVycndyazBicmxndWRzOW9oZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/5vk99m8hM6E2V3p1wV/giphy.gif" },
  { id: "g9", name: "Popcorn Meme", url: "https://media.giphy.com/media/hNmaZ4CCJgPP2/giphy.gif" },
  { id: "g10", name: "Facepalm", url: "https://media.giphy.com/media/3o7TKr3NZbh5y06I24/giphy.gif" }
];

const MediaPicker = ({ onSelectEmoji, onSelectMedia }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("emojis");
  const [searchQuery, setSearchQuery] = useState("");
  const [gifQuery, setGifQuery] = useState("");
  const [onlineGifs, setOnlineGifs] = useState([]);
  const [isLoadingGifs, setIsLoadingGifs] = useState(false);
  const pickerRef = useRef(null);

  // Close picker on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Live GIF search or fetch using Klipy / GIPHY public API
  useEffect(() => {
    if (activeTab !== "gifs" || !gifQuery.trim()) {
      setOnlineGifs([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingGifs(true);
      try {
        // Fetch live search GIFs from public GIPHY endpoint
        const res = await fetch(
          `https://api.giphy.com/v1/gifs/search?api_key=CWzAKbdMw5Wj9s0bsYmcjchBwFiV63xD&q=${encodeURIComponent(
            gifQuery.trim()
          )}&limit=16`
        );
        const data = await res.json();
        if (data && data.data) {
          const formatted = data.data.map((item) => ({
            id: item.id,
            name: item.title || "GIF",
            url: item.images?.fixed_height?.url || item.images?.original?.url,
          }));
          setOnlineGifs(formatted);
        }
      } catch (err) {
        console.error("Giphy fetch error:", err);
      } finally {
        setIsLoadingGifs(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [gifQuery, activeTab]);

  const handleEmojiClick = (emoji) => {
    onSelectEmoji(emoji);
  };

  const handleMediaClick = (url) => {
    onSelectMedia(url);
    setIsOpen(false);
  };

  const filteredEmojis = searchQuery.trim()
    ? EMOJI_CATEGORIES.flatMap((cat) => cat.emojis).filter((e) => e.includes(searchQuery))
    : null;

  const displayGifs = onlineGifs.length > 0 ? onlineGifs : PRESET_GIFS;

  return (
    <div className="relative" ref={pickerRef}>
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`btn btn-circle btn-ghost btn-sm sm:btn-md transition-colors ${
          isOpen ? "text-primary bg-base-300" : "text-zinc-400 hover:text-zinc-200"
        }`}
        title="Emojis, GIFs & WhatsApp Stickers"
      >
        <Smile size={20} />
      </button>

      {/* Popover Container */}
      {isOpen && (
        <div className="absolute bottom-12 right-0 sm:right-auto sm:left-0 z-50 w-72 sm:w-84 h-[420px] bg-base-100 border border-base-300 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-enter">
          {/* Header Tabs */}
          <div className="flex items-center justify-between border-b border-base-300 px-3 py-2.5 bg-base-200/60">
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab("emojis")}
                className={`btn btn-xs rounded-lg flex items-center gap-1 ${
                  activeTab === "emojis" ? "btn-primary" : "btn-ghost text-zinc-400"
                }`}
              >
                <Smile size={14} /> Emojis
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("gifs")}
                className={`btn btn-xs rounded-lg flex items-center gap-1 ${
                  activeTab === "gifs" ? "btn-primary" : "btn-ghost text-zinc-400"
                }`}
              >
                <ImageIcon size={14} /> GIFs
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("stickers")}
                className={`btn btn-xs rounded-lg flex items-center gap-1 ${
                  activeTab === "stickers" ? "btn-primary" : "btn-ghost text-zinc-400"
                }`}
              >
                <Sparkles size={14} /> Stickers
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-zinc-200 p-1"
            >
              <X size={16} />
            </button>
          </div>

          {/* EMOJIS TAB */}
          {activeTab === "emojis" && (
            <div className="flex-1 flex flex-col overflow-hidden p-2.5">
              <div className="relative mb-2">
                <input
                  type="text"
                  placeholder="Search emoji..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input input-xs input-bordered w-full pl-7 pr-7 text-xs"
                />
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                {filteredEmojis ? (
                  <div className="grid grid-cols-7 gap-1">
                    {filteredEmojis.map((emoji, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleEmojiClick(emoji)}
                        className="text-xl p-1.5 hover:bg-base-300 rounded-lg transition-transform hover:scale-125"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                ) : (
                  EMOJI_CATEGORIES.map((cat, i) => (
                    <div key={i}>
                      <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1 px-1">{cat.name}</p>
                      <div className="grid grid-cols-7 gap-1">
                        {cat.emojis.map((emoji, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleEmojiClick(emoji)}
                            className="text-xl p-1.5 hover:bg-base-300 rounded-lg transition-transform hover:scale-125"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* GIFS TAB */}
          {activeTab === "gifs" && (
            <div className="flex-1 flex flex-col overflow-hidden p-2.5">
              <div className="relative mb-2">
                <input
                  type="text"
                  placeholder="Search GIPHY GIFs (e.g. happy, cat, dance)..."
                  value={gifQuery}
                  onChange={(e) => setGifQuery(e.target.value)}
                  className="input input-xs input-bordered w-full pl-7 pr-7 text-xs"
                />
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                {gifQuery && (
                  <button
                    onClick={() => setGifQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {isLoadingGifs ? (
                <div className="flex-1 flex items-center justify-center text-xs text-zinc-400 gap-2">
                  <Loader2 className="animate-spin size-4 text-primary" /> Loading GIFs...
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2 pr-1">
                  {displayGifs.map((gif) => (
                    <button
                      key={gif.id}
                      type="button"
                      onClick={() => handleMediaClick(gif.url)}
                      className="relative group rounded-xl overflow-hidden border border-base-300 hover:border-primary transition-all aspect-video bg-base-300"
                    >
                      <img
                        src={gif.url}
                        alt={gif.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[10px] text-white p-1 text-center truncate">
                        {gif.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STICKERS TAB */}
          {activeTab === "stickers" && (
            <div className="flex-1 flex flex-col overflow-hidden p-2.5">
              <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                {WHATSAPP_STICKER_PACKS.map((pack, idx) => (
                  <div key={idx}>
                    <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1 px-1">{pack.category}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {pack.stickers.map((sticker) => (
                        <button
                          key={sticker.id}
                          type="button"
                          onClick={() => handleMediaClick(sticker.url)}
                          className="p-2 bg-base-200/80 hover:bg-base-300 rounded-xl border border-base-300 hover:border-primary flex flex-col items-center justify-center transition-all hover:scale-105"
                        >
                          <img src={sticker.url} alt={sticker.name} className="size-12 object-contain mb-1" />
                          <span className="text-[9px] text-zinc-400 truncate w-full text-center">{sticker.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MediaPicker;
