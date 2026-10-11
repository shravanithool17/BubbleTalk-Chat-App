import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, Mic, Square, Trash2, Reply } from "lucide-react";
import toast from "react-hot-toast";
import MediaPicker from "./MediaPicker";

const compressImage = (file, maxWidth = 1200, quality = 0.82) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingEmittedRef = useRef(false);

  const { sendMessage, sendTypingStatus, selectedUser, replyingTo, clearReplyingTo } =
    useChatStore();

  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const handleTextChange = (e) => {
    const value = e.target.value;
    setText(value);

    if (selectedUser?._id) {
      if (!isTypingEmittedRef.current) {
        sendTypingStatus(selectedUser._id, true);
        isTypingEmittedRef.current = true;
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(selectedUser._id, false);
        isTypingEmittedRef.current = false;
      }, 1500);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    try {
      const compressed = await compressImage(file);
      setImagePreview(compressed);
    } catch (err) {
      console.error("Image compression error:", err);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSelectEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleSelectMedia = async (mediaUrl) => {
    try {
      await sendMessage({
        text: text.trim(),
        image: mediaUrl,
      });
      setText("");
      setImagePreview(null);
    } catch (error) {
      console.error("Failed to send sticker/GIF:", error);
    }
  };

  // Voice Note Recording Handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      toast.error("Microphone access denied or unsupported");
      console.error("Audio recording error:", err);
    }
  };

  const stopAndSendRecording = () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result;
        try {
          await sendMessage({ audio: base64Audio, text: "" });
          toast.success("Voice note sent 🎤");
        } catch (err) {
          toast.error("Failed to send voice note");
        }
      };
      reader.readAsDataURL(audioBlob);

      // Stop audio stream tracks
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    };

    mediaRecorderRef.current.stop();
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    audioChunksRef.current = [];
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    if (selectedUser?._id) {
      sendTypingStatus(selectedUser._id, false);
      isTypingEmittedRef.current = false;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });

      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="p-4 w-full">
      {/* Replying To Banner */}
      {replyingTo && (
        <div className="mb-2 bg-base-200/90 border border-base-300 border-l-4 border-l-primary rounded-xl p-2.5 flex items-center justify-between gap-3 shadow-md backdrop-blur-sm animate-enter">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Reply size={13} className="shrink-0" />
              <span className="truncate">Replying to {replyingTo.senderName || "Message"}</span>
            </div>
            <p className="text-xs text-base-content/70 truncate mt-0.5">
              {replyingTo.text || (replyingTo.image ? "📷 Photo" : (replyingTo.audio ? "🎤 Voice note" : "Attachment"))}
            </p>
          </div>
          {replyingTo.image && (
            <img
              src={replyingTo.image}
              alt="Reply preview"
              className="size-10 rounded-lg object-cover border border-base-300 shrink-0"
            />
          )}
          <button
            type="button"
            onClick={clearReplyingTo}
            className="btn btn-circle btn-ghost btn-xs text-zinc-400 hover:text-zinc-200"
            title="Cancel reply"
          >
            <X size={14} />
          </button>
        </div>
      )}
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {/* Voice Recording Viewport */}
      {isRecording ? (
        <div className="flex items-center justify-between gap-3 bg-base-300 p-2.5 rounded-xl animate-pulse">
          <div className="flex items-center gap-2 text-red-500 font-semibold text-xs sm:text-sm">
            <span className="size-3 bg-red-500 rounded-full animate-ping" />
            Recording Audio ({formatRecordingTime(recordingTime)})
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelRecording}
              className="btn btn-circle btn-xs btn-ghost text-zinc-400 hover:text-red-400"
              title="Cancel Recording"
            >
              <Trash2 size={16} />
            </button>

            <button
              type="button"
              onClick={stopAndSendRecording}
              className="btn btn-circle btn-sm btn-primary text-primary-content"
              title="Send Voice Note"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <div className="flex-1 flex gap-2 items-center">
            {/* Emojis, GIFs & Stickers Picker */}
            <MediaPicker
              onSelectEmoji={handleSelectEmoji}
              onSelectMedia={handleSelectMedia}
            />

            <input
              type="text"
              ref={inputRef}
              className="w-full input input-bordered rounded-lg input-sm sm:input-md"
              placeholder="Type a message..."
              value={text}
              onChange={handleTextChange}
            />

            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageChange}
            />

            <button
              type="button"
              className={`hidden sm:flex btn btn-circle btn-sm sm:btn-md btn-ghost
                       ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <Image size={20} />
            </button>

            {/* Mic Record Button */}
            <button
              type="button"
              onClick={startRecording}
              className="btn btn-circle btn-sm sm:btn-md btn-ghost text-zinc-400 hover:text-primary"
              title="Record Voice Note"
            >
              <Mic size={20} />
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-sm sm:btn-md btn-circle btn-primary"
            disabled={!text.trim() && !imagePreview}
          >
            <Send size={18} />
          </button>
        </form>
      )}
    </div>
  );
};
export default MessageInput;
