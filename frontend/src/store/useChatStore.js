import React from "react";
import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);
  } catch (e) {
    // Audio Context playback fallback
  }
};

const triggerDesktopNotification = (title, body, icon) => {
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon });
    } else if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }
};

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  groups: [],
  searchResults: [],
  selectedUser: null,
  selectedGroup: null,
  isUsersLoading: false,
  isGroupsLoading: false,
  isMessagesLoading: false,
  isSearching: false,
  isCreatingGroup: false,
  unreadCounts: {},
  typingUsers: {},

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error loading contacts");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error loading groups");
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  createGroup: async (groupData) => {
    set({ isCreatingGroup: true });
    try {
      const res = await axiosInstance.post("/groups/create", groupData);
      set({ groups: [res.data, ...get().groups] });
      toast.success(`Group "${res.data.name}" created! 🎉`);
      get().setSelectedGroup(res.data);
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create group");
    } finally {
      set({ isCreatingGroup: false });
    }
  },

  searchUsers: async (query) => {
    if (!query || !query.trim()) {
      set({ searchResults: [], isSearching: false });
      return;
    }
    set({ isSearching: true });
    try {
      const res = await axiosInstance.get(`/messages/search?query=${encodeURIComponent(query)}`);
      set({ searchResults: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Search failed");
    } finally {
      set({ isSearching: false });
    }
  },

  clearSearch: () => set({ searchResults: [] }),

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  getGroupMessages: async (groupId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/groups/${groupId}/messages`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load group messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, selectedGroup, messages, users } = get();

    if (selectedGroup) {
      try {
        const res = await axiosInstance.post(`/groups/${selectedGroup._id}/send`, messageData);
        set({ messages: [...messages, res.data] });
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to send group message");
      }
      return;
    }

    if (selectedUser) {
      try {
        const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
        set({ messages: [...messages, res.data] });

        const filteredUsers = users.filter((u) => u._id !== selectedUser._id);
        set({ users: [selectedUser, ...filteredUsers] });
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to send message");
      }
    }
  },

  sendTypingStatus: (receiverId, isTyping) => {
    const socket = useAuthStore.getState().socket;
    if (!socket || !receiverId) return;

    if (isTyping) {
      socket.emit("typing", { receiverId });
    } else {
      socket.emit("stopTyping", { receiverId });
    }
  },

  reactToMessage: async (messageId, emoji) => {
    try {
      const res = await axiosInstance.put(`/messages/react/${messageId}`, { emoji });
      const updatedMessage = res.data;
      set({
        messages: get().messages.map((m) => (m._id === messageId ? updatedMessage : m)),
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to react");
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      set({
        messages: get().messages.filter((m) => m._id !== messageId),
      });
      toast.success("Message deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  },

  editMessage: async (messageId, text) => {
    try {
      const res = await axiosInstance.put(`/messages/edit/${messageId}`, { text });
      const updatedMessage = res.data;
      set({
        messages: get().messages.map((m) => (m._id === messageId ? updatedMessage : m)),
      });
      toast.success("Message updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to edit message");
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    socket.off("newMessage");
    socket.off("newGroupMessage");
    socket.off("groupCreated");
    socket.off("userTyping");
    socket.off("userStopTyping");
    socket.off("messageReaction");
    socket.off("messageDeleted");
    socket.off("messageEdited");

    // Listening for typing indicators
    socket.on("userTyping", ({ senderId }) => {
      set({ typingUsers: { ...get().typingUsers, [senderId]: true } });
    });

    socket.on("userStopTyping", ({ senderId }) => {
      set({ typingUsers: { ...get().typingUsers, [senderId]: false } });
    });

    // Listening for reactions
    socket.on("messageReaction", (updatedMessage) => {
      set({
        messages: get().messages.map((m) => (m._id === updatedMessage._id ? updatedMessage : m)),
      });
    });

    // Listening for message deletions
    socket.on("messageDeleted", (deletedId) => {
      set({
        messages: get().messages.filter((m) => m._id !== deletedId),
      });
    });

    // Listening for message edits
    socket.on("messageEdited", (editedMessage) => {
      set({
        messages: get().messages.map((m) => (m._id === editedMessage._id ? editedMessage : m)),
      });
    });

    // Listening for new group creation
    socket.on("groupCreated", (newGroup) => {
      const exists = get().groups.some((g) => g._id === newGroup._id);
      if (!exists) {
        set({ groups: [newGroup, ...get().groups] });
        toast(`👨‍👩‍👧‍👦 You were added to group "${newGroup.name}"!`);
      }
    });

    // Listening for new group messages
    socket.on("newGroupMessage", async (newGroupMsg) => {
      const { selectedGroup, groups, getGroups } = get();

      playNotificationSound();

      if (selectedGroup && selectedGroup._id === newGroupMsg.groupId) {
        set({ messages: [...get().messages, newGroupMsg] });
      } else {
        const groupId = newGroupMsg.groupId;
        let currentGroup = groups.find((g) => g._id === groupId);
        if (!currentGroup) {
          await getGroups();
          currentGroup = get().groups.find((g) => g._id === groupId);
        }
        const groupName = currentGroup ? currentGroup.name : "Group Chat";
        const senderName = newGroupMsg.senderId?.fullName || "Member";
        const messagePreview = newGroupMsg.text || (newGroupMsg.image ? "📷 Image" : (newGroupMsg.audio ? "🎤 Voice note" : "New message"));

        triggerDesktopNotification(`👨‍👩‍👧‍👦 ${groupName}: ${senderName}`, messagePreview, currentGroup?.groupPic || "/avatar.png");

        toast.custom(
          (t) =>
            React.createElement(
              "div",
              {
                onClick: () => {
                  if (currentGroup) get().setSelectedGroup(currentGroup);
                  toast.dismiss(t.id);
                },
                className: `${
                  t.visible ? "animate-enter" : "animate-leave"
                } max-w-md w-full bg-base-100 shadow-xl rounded-xl border border-primary/30 p-3 flex items-center gap-3 cursor-pointer hover:bg-base-200 transition-all`,
              },
              React.createElement("img", {
                src: currentGroup?.groupPic || "/avatar.png",
                alt: groupName,
                className: "size-10 rounded-full object-cover border border-primary/20",
              }),
              React.createElement(
                "div",
                { className: "flex-1 min-w-0" },
                React.createElement(
                  "p",
                  { className: "text-xs font-bold text-primary flex items-center gap-1" },
                  `👨‍👩‍👧‍👦 ${groupName} • ${senderName}`
                ),
                React.createElement(
                  "p",
                  { className: "text-xs text-zinc-300 truncate mt-0.5" },
                  messagePreview
                )
              )
            ),
          { duration: 4000, position: "top-right" }
        );

        set({
          unreadCounts: {
            ...get().unreadCounts,
            [groupId]: (get().unreadCounts[groupId] || 0) + 1,
          },
        });
      }
    });

    // Listening for direct 1-on-1 messages
    socket.on("newMessage", async (newMessage) => {
      const { selectedUser, users, setSelectedUser, getUsers } = get();

      const senderId = newMessage.senderId;
      let senderUser = users.find((u) => u._id === senderId);

      if (!senderUser) {
        await getUsers();
        senderUser = get().users.find((u) => u._id === senderId);
      }

      const senderName = senderUser ? senderUser.fullName : "Someone";
      const messagePreview = newMessage.text || (newMessage.image ? "📷 Sent an image" : (newMessage.audio ? "🎤 Sent a voice note" : "New message"));

      playNotificationSound();

      if (selectedUser && (newMessage.senderId === selectedUser._id || newMessage.receiverId === selectedUser._id)) {
        set({ messages: [...get().messages, newMessage] });
      } else {
        const currentUnread = get().unreadCounts[senderId] || 0;

        triggerDesktopNotification(`${senderName} messaged you`, messagePreview, senderUser?.profilePic || "/avatar.png");

        toast.custom(
          (t) =>
            React.createElement(
              "div",
              {
                onClick: () => {
                  if (senderUser) setSelectedUser(senderUser);
                  toast.dismiss(t.id);
                },
                className: `${
                  t.visible ? "animate-enter" : "animate-leave"
                } max-w-md w-full bg-base-100 shadow-xl rounded-xl border border-primary/30 p-3 flex items-center gap-3 cursor-pointer hover:bg-base-200 transition-all`,
              },
              React.createElement("img", {
                src: senderUser?.profilePic || "/avatar.png",
                alt: senderName,
                className: "size-10 rounded-full object-cover border border-primary/20",
              }),
              React.createElement(
                "div",
                { className: "flex-1 min-w-0" },
                React.createElement(
                  "p",
                  { className: "text-xs font-bold text-primary flex items-center gap-1" },
                  `🔔 ${senderName} messaged you`
                ),
                React.createElement(
                  "p",
                  { className: "text-xs text-zinc-300 truncate mt-0.5" },
                  messagePreview
                )
              )
            ),
          { duration: 4000, position: "top-right" }
        );

        set({
          unreadCounts: {
            ...get().unreadCounts,
            [senderId]: currentUnread + 1,
          },
        });
      }

      if (senderUser) {
        const currentUsers = get().users;
        const remainingUsers = currentUsers.filter((u) => u._id !== senderId);
        set({ users: [senderUser, ...remainingUsers] });
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
      socket.off("newGroupMessage");
      socket.off("groupCreated");
      socket.off("userTyping");
      socket.off("userStopTyping");
      socket.off("messageReaction");
      socket.off("messageDeleted");
      socket.off("messageEdited");
    }
  },

  setSelectedUser: (selectedUser) => {
    if (!selectedUser) {
      set({ selectedUser: null });
      return;
    }

    const { users, unreadCounts } = get();
    const updatedUnreads = { ...unreadCounts, [selectedUser._id]: 0 };

    const isAlreadyInList = users.some((u) => u._id === selectedUser._id);
    const updatedUsers = isAlreadyInList ? users : [selectedUser, ...users];

    set({
      selectedUser,
      selectedGroup: null,
      users: updatedUsers,
      unreadCounts: updatedUnreads,
      searchResults: [],
    });
  },

  setSelectedGroup: (selectedGroup) => {
    if (!selectedGroup) {
      set({ selectedGroup: null });
      return;
    }

    const { unreadCounts } = get();
    const updatedUnreads = { ...unreadCounts, [selectedGroup._id]: 0 };

    set({
      selectedGroup,
      selectedUser: null,
      unreadCounts: updatedUnreads,
    });

    get().getGroupMessages(selectedGroup._id);
  },
}));