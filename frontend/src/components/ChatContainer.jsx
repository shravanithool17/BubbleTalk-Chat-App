import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import { MoreVertical, Trash2, Edit2 } from "lucide-react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const REACTION_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    getGroupMessages,
    isMessagesLoading,
    selectedUser,
    selectedGroup,
    subscribeToMessages,
    reactToMessage,
    deleteMessage,
    editMessage,
  } = useChatStore();

  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  const [activeMenuMessageId, setActiveMenuMessageId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    if (selectedGroup?._id) {
      getGroupMessages(selectedGroup._id);
    } else if (selectedUser?._id) {
      getMessages(selectedUser._id);
    }
    subscribeToMessages();
  }, [selectedUser?._id, selectedGroup?._id, getMessages, getGroupMessages, subscribeToMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleStartEdit = (message) => {
    setEditingMessageId(message._id);
    setEditText(message.text || "");
    setActiveMenuMessageId(null);
  };

  const handleSaveEdit = (messageId) => {
    if (editText.trim()) {
      editMessage(messageId, editText.trim());
    }
    setEditingMessageId(null);
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
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

          const isMenuOpen = activeMenuMessageId === message._id;
          const isEditing = editingMessageId === message._id;

          // Group reactions by emoji
          const reactionCounts = (message.reactions || []).reduce((acc, r) => {
            acc[r.emoji] = (acc[r.emoji] || 0) + 1;
            return acc;
          }, {});

          return (
            <div
              key={message._id}
              className={`chat ${isMyMessage ? "chat-end" : "chat-start"} group relative`}
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
                {/* Display Sender Name in Group Chat */}
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

              <div className="relative">
                {/* Quick Reaction Toolbar (on hover) */}
                <div
                  className={`absolute -top-7 ${
                    isMyMessage ? "right-0" : "left-0"
                  } hidden group-hover:flex items-center gap-1 bg-base-200 border border-base-300 rounded-full px-2 py-0.5 shadow-md z-10`}
                >
                  {REACTION_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => reactToMessage(message._id, emoji)}
                      className="hover:scale-125 transition-transform text-xs p-0.5"
                    >
                      {emoji}
                    </button>
                  ))}

                  {/* Options Menu Toggle for Sender */}
                  {isMyMessage && (
                    <button
                      onClick={() => setActiveMenuMessageId(isMenuOpen ? null : message._id)}
                      className="text-zinc-400 hover:text-zinc-200 ml-1"
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
                        onClick={() => handleStartEdit(message)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-300 hover:bg-base-300 rounded-lg"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                    )}
                    <button
                      onClick={() => {
                        deleteMessage(message._id);
                        setActiveMenuMessageId(null);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                )}

                {/* Message Bubble Content */}
                <div className="chat-bubble flex flex-col">
                  {/* Image Attachment */}
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Attachment"
                      className="sm:max-w-[240px] rounded-md mb-2 object-cover"
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
                        className="input input-xs input-bordered w-full text-xs text-base-content"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(message._id)}
                        className="btn btn-xs btn-primary text-[10px]"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    message.text && <p className="break-words text-sm">{message.text}</p>
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
                        className="bg-base-200 border border-base-300 text-[11px] px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-1"
                      >
                        <span>{emoji}</span>
                        {count > 1 && <span className="text-[9px] font-bold text-zinc-400">{count}</span>}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Fixed scroll anchor div */}
        <div ref={messageEndRef} />
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
