import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState, useCallback } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import SwipeableMessageItem from "./SwipeableMessageItem";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    getGroupMessages,
    isMessagesLoading,
    selectedUser,
    selectedGroup,
    subscribeToMessages,
    unsubscribeFromMessages,
    reactToMessage,
    deleteMessage,
    editMessage,
    setReplyingTo,
  } = useChatStore();

  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const messageRefs = useRef({});
  const prevMessagesLengthRef = useRef(0);
  const currentChatIdRef = useRef(null);

  const [highlightedMessageId, setHighlightedMessageId] = useState(null);

  const activeChatId = selectedGroup?._id || selectedUser?._id;

  useEffect(() => {
    if (selectedGroup?._id) {
      getGroupMessages(selectedGroup._id);
    } else if (selectedUser?._id) {
      getMessages(selectedUser._id);
    }
    subscribeToMessages();

    return () => {
      unsubscribeFromMessages();
    };
  }, [selectedUser?._id, selectedGroup?._id, getMessages, getGroupMessages, subscribeToMessages, unsubscribeFromMessages]);

  // Optimized scrolling: Instant on chat change, smooth on new message
  useEffect(() => {
    if (!messageEndRef.current || !messages) return;

    const isNewChat = currentChatIdRef.current !== activeChatId;
    if (isNewChat) {
      currentChatIdRef.current = activeChatId;
      prevMessagesLengthRef.current = messages.length;
      messageEndRef.current.scrollIntoView({ behavior: "auto" });
      return;
    }

    if (messages.length > prevMessagesLengthRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, activeChatId]);

  const handleScrollToReply = useCallback((replyToId) => {
    if (!replyToId) return;
    const targetEl = messageRefs.current[replyToId];
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(replyToId);
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 1800);
    } else {
      toast("Original message is further up", { icon: "💬" });
    }
  }, []);

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

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <SwipeableMessageItem
            key={message._id}
            message={message}
            authUser={authUser}
            selectedUser={selectedUser}
            selectedGroup={selectedGroup}
            onReply={setReplyingTo}
            onScrollToReply={handleScrollToReply}
            onReact={reactToMessage}
            onDelete={deleteMessage}
            onEdit={editMessage}
            isHighlighted={highlightedMessageId === message._id}
            messageRef={(el) => {
              if (el) messageRefs.current[message._id] = el;
            }}
          />
        ))}

        {/* Scroll anchor div */}
        <div ref={messageEndRef} />
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
