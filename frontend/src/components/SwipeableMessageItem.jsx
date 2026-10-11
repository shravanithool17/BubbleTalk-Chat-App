import { useState, useRef } from "react";
import { MoreVertical, Trash2, Edit2, Reply } from "lucide-react";
import { formatMessageTime } from "../lib/utils";

const REACTION_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

const SwipeableMessageItem = ({
  message,
  authUser,
  selectedUser,
  selectedGroup,
  onReply,
  onScrollToReply,
  onReact,
  onDelete,
  onEdit,
  isHighlighted,
  messageRef,
}) => {
  const [dragOffset, setDragOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text || "");

  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const isPointerDown = useRef(false);
  const pointerIdRef = useRef(null);
  const hasVibratedRef = useRef(false);

  const senderObj =
    typeof message.senderId === "object" ? message.senderId : null;
  const senderIdStr = senderObj ? senderObj._id : message.senderId;
  const isMyMessage = senderIdStr === authUser._id;

  const senderName = isMyMessage
    ? authUser.fullName
    : senderObj?.fullName || selectedUser?.fullName || "Member";

  const senderAvatar = isMyMessage
    ? authUser.profilePic || "/avatar.png"
    : senderObj?.profilePic || selectedUser?.profilePic || "/avatar.png";

  // Group reactions by emoji
  const reactionCounts = (message.reactions || []).reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  // Quoted reply details
  const repliedId =
    typeof message.replyTo === "object"
      ? message.replyTo?._id
      : message.replyTo;
  const repliedSenderName =
    message.replyDetails?.senderName ||
    (message.replyTo?.senderId?.fullName ? message.replyTo.senderId.fullName : "") ||
    "User";
  const repliedText =
    message.replyDetails?.text || message.replyTo?.text || "";
  const repliedImage =
    message.replyDetails?.image || message.replyTo?.image || "";
  const repliedAudio =
    message.replyDetails?.audio || message.replyTo?.audio || "";
  const hasReply = !!(repliedId || repliedText || repliedImage || repliedAudio);

  const handlePointerDown = (e) => {
    // Ignore interactive elements
    if (
      e.target.closest("button") ||
      e.target.closest("input") ||
      e.target.closest("audio") ||
      e.target.closest("a")
    ) {
      return;
    }

    isPointerDown.current = true;
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    pointerIdRef.current = e.pointerId;
    hasVibratedRef.current = false;
    setIsSwiping(false);
  };

  const handlePointerMove = (e) => {
    if (!isPointerDown.current) return;

    const diffX = e.clientX - dragStartX.current;
    const diffY = e.clientY - dragStartY.current;

    // Determine swipe vs vertical scroll
    if (!isSwiping) {
      if (Math.abs(diffY) > 8 && Math.abs(diffY) > Math.abs(diffX)) {
        // User is scrolling vertically
        isPointerDown.current = false;
        return;
      }
      if (diffX > 8 && Math.abs(diffX) > Math.abs(diffY)) {
        setIsSwiping(true);
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch (_) {}
      }
    }

    if (isSwiping && diffX > 0) {
      // Swipe right with resistance
      const dampedOffset = Math.min(diffX * 0.55, 65);
      setDragOffset(dampedOffset);

      if (dampedOffset >= 42 && !hasVibratedRef.current) {
        hasVibratedRef.current = true;
        if (navigator.vibrate) {
          navigator.vibrate(20);
        }
      } else if (dampedOffset < 42) {
        hasVibratedRef.current = false;
      }
    }
  };

  const handlePointerEnd = (e) => {
    if (!isPointerDown.current && !isSwiping) return;

    isPointerDown.current = false;
    try {
      if (pointerIdRef.current !== null) {
        e.currentTarget.releasePointerCapture(pointerIdRef.current);
      }
    } catch (_) {}

    if (isSwiping && dragOffset >= 40) {
      onReply({
        _id: message._id,
        text: message.text,
        senderName,
        image: message.image,
        audio: message.audio,
      });
    }

    setIsSwiping(false);
    setDragOffset(0);
    hasVibratedRef.current = false;
  };

  const handleSaveEdit = () => {
    if (editText.trim()) {
      onEdit(message._id, editText.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      ref={messageRef}
      className={`chat ${
        isMyMessage ? "chat-end" : "chat-start"
      } group relative transition-colors duration-500 rounded-xl p-1 select-none ${
        isHighlighted
          ? "ring-2 ring-primary ring-offset-2 ring-offset-base-100 bg-primary/10"
          : ""
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      style={{ touchAction: "pan-y" }}
    >
      <div className="chat-image avatar">
        <div className="size-10 rounded-full border">
          <img
            src={senderAvatar}
            alt={senderName}
            className="size-10 rounded-full object-cover"
          />
        </div>
      </div>

      <div className="chat-header mb-1 flex items-center gap-1">
        {selectedGroup && !isMyMessage && (
          <span className="text-xs font-semibold text-primary mr-1">
            {senderName}
          </span>
        )}
        <time className="text-xs opacity-50 ml-1">
          {formatMessageTime(message.createdAt)}
        </time>
        {message.isEdited && (
          <span className="text-[10px] text-zinc-500 font-italic">(edited)</span>
        )}
      </div>

      <div
        className="relative"
        style={{
          transform: `translateX(${dragOffset}px)`,
          transition: isSwiping ? "none" : "transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      >
        {/* Swipe Reply indicator behind message */}
        <div
          className="absolute -left-10 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none transition-all"
          style={{
            opacity: Math.min(dragOffset / 35, 1),
            transform: `scale(${Math.min(0.6 + dragOffset / 70, 1.15)}) translateY(-50%)`,
          }}
        >
          <div
            className={`size-7 rounded-full flex items-center justify-center shadow-md transition-colors ${
              dragOffset >= 40
                ? "bg-primary text-primary-content"
                : "bg-base-300 text-zinc-300"
            }`}
          >
            <Reply size={14} />
          </div>
        </div>

        {/* Quick Reaction & Reply Toolbar (on hover) */}
        <div
          className={`absolute -top-7 ${
            isMyMessage ? "right-0" : "left-0"
          } hidden group-hover:flex items-center gap-1 bg-base-200 border border-base-300 rounded-full px-2 py-0.5 shadow-md z-10`}
        >
          {REACTION_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onReact(message._id, emoji)}
              className="hover:scale-125 transition-transform text-xs p-0.5"
            >
              {emoji}
            </button>
          ))}

          {/* Quick Reply Button on Desktop */}
          <button
            onClick={() =>
              onReply({
                _id: message._id,
                text: message.text,
                senderName,
                image: message.image,
                audio: message.audio,
              })
            }
            className="text-zinc-400 hover:text-primary p-0.5 ml-0.5 transition-colors"
            title="Reply to message (or swipe right)"
          >
            <Reply size={12} />
          </button>

          {/* Options Menu Toggle for Sender */}
          {isMyMessage && (
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-zinc-400 hover:text-zinc-200 ml-0.5"
            >
              <MoreVertical size={12} />
            </button>
          )}
        </div>

        {/* Sender Options Dropdown Menu */}
        {isMenuOpen && isMyMessage && (
          <div className="absolute top-0 right-0 mt-2 z-20 bg-base-100 border border-base-300 rounded-xl shadow-xl p-1 flex flex-col w-32">
            {message.text && (
              <button
                onClick={() => {
                  setIsEditing(true);
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-300 hover:bg-base-300 rounded-lg"
              >
                <Edit2 size={12} /> Edit
              </button>
            )}
            <button
              onClick={() => {
                onDelete(message._id);
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg"
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        )}

        {/* Message Bubble Content */}
        <div className="chat-bubble flex flex-col max-w-[85vw] sm:max-w-md">
          {/* Quoted Reply inside message */}
          {hasReply && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (repliedId) onScrollToReply(repliedId);
              }}
              className="mb-1.5 p-2 rounded-lg bg-black/25 dark:bg-black/40 border-l-4 border-primary text-xs cursor-pointer hover:bg-black/35 transition-all flex items-center justify-between gap-2 overflow-hidden"
              title="Click to jump to quoted message"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-primary truncate flex items-center gap-1 text-[11px]">
                  <Reply size={10} className="shrink-0" />
                  <span>{repliedSenderName}</span>
                </div>
                <p className="opacity-80 truncate text-[11px] mt-0.5">
                  {repliedText ||
                    (repliedImage
                      ? "📷 Photo"
                      : repliedAudio
                      ? "🎤 Voice note"
                      : "Attachment")}
                </p>
              </div>
              {repliedImage && (
                <img
                  src={repliedImage}
                  alt="Reply thumbnail"
                  className="size-8 rounded object-cover shrink-0 border border-white/10"
                />
              )}
            </div>
          )}

          {/* Image Attachment */}
          {message.image && (
            <img
              src={message.image}
              alt="Attachment"
              className="sm:max-w-[240px] rounded-md mb-2 object-cover"
              loading="lazy"
            />
          )}

          {/* Voice Note Player */}
          {message.audio && (
            <div className="flex items-center gap-2 p-1">
              <audio controls src={message.audio} className="max-w-[220px] h-9" />
            </div>
          )}

          {/* Inline Text Editing */}
          {isEditing ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEdit();
                  if (e.key === "Escape") setIsEditing(false);
                }}
                className="input input-xs input-bordered w-full text-xs text-base-content"
                autoFocus
              />
              <button
                onClick={handleSaveEdit}
                className="btn btn-xs btn-primary text-[10px]"
              >
                Save
              </button>
            </div>
          ) : (
            message.text && (
              <p className="break-words text-sm whitespace-pre-wrap">
                {message.text}
              </p>
            )
          )}
        </div>

        {/* Emoji Reaction Badges */}
        {Object.keys(reactionCounts).length > 0 && (
          <div
            className={`flex gap-1 mt-1 ${
              isMyMessage ? "justify-end" : "justify-start"
            }`}
          >
            {Object.entries(reactionCounts).map(([emoji, count]) => (
              <span
                key={emoji}
                className="bg-base-200 border border-base-300 text-[11px] px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-1 cursor-pointer hover:scale-110 transition-transform"
                onClick={() => onReact(message._id, emoji)}
              >
                <span>{emoji}</span>
                {count > 1 && (
                  <span className="text-[9px] font-bold text-zinc-400">
                    {count}
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SwipeableMessageItem;
