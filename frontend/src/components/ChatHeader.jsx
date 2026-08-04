import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = () => {
  const { selectedUser, selectedGroup, setSelectedUser, setSelectedGroup, typingUsers } =
    useChatStore();
  const { onlineUsers } = useAuthStore();

  const handleClose = () => {
    if (selectedGroup) setSelectedGroup(null);
    if (selectedUser) setSelectedUser(null);
  };

  // Render Group Chat Header
  if (selectedGroup) {
    const memberCount = selectedGroup.members?.length || 0;
    const memberNames = (selectedGroup.members || [])
      .map((m) => m.fullName || "Member")
      .join(", ");

    return (
      <div className="p-2.5 border-b border-base-300 bg-base-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="size-10 rounded-full relative border border-primary/20">
                <img
                  src={selectedGroup.groupPic || "/avatar.png"}
                  alt={selectedGroup.name}
                  className="size-10 rounded-full object-cover"
                />
              </div>
            </div>

            <div>
              <h3 className="font-medium text-sm sm:text-base flex items-center gap-1.5">
                👨‍👩‍👧‍👦 {selectedGroup.name}
              </h3>
              <p className="text-xs text-zinc-400 truncate max-w-[200px] sm:max-w-md">
                {memberCount} members: {memberNames}
              </p>
            </div>
          </div>

          <button onClick={handleClose} className="btn btn-ghost btn-circle btn-sm">
            <X size={20} />
          </button>
        </div>
      </div>
    );
  }

  // Render Direct Contact 1-on-1 Chat Header
  const isOnline = selectedUser?._id
    ? onlineUsers.some((id) => String(id) === String(selectedUser._id))
    : false;
  const isTyping = typingUsers[selectedUser?._id];

  return (
    <div className="p-2.5 border-b border-base-300 bg-base-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img
                src={selectedUser?.profilePic || "/avatar.png"}
                alt={selectedUser?.fullName}
                className="size-10 rounded-full object-cover"
              />
              {isOnline && (
                <span className="absolute bottom-0 right-0 size-2.5 bg-green-500 rounded-full ring-2 ring-base-100" />
              )}
            </div>
          </div>

          <div>
            <h3 className="font-medium text-sm sm:text-base">{selectedUser?.fullName}</h3>
            <p className="text-xs">
              {isTyping ? (
                <span className="text-primary font-semibold animate-pulse flex items-center gap-1">
                  typing<span className="animate-bounce">...</span>
                </span>
              ) : isOnline ? (
                <span className="text-green-500 font-medium">Online</span>
              ) : (
                <span className="text-base-content/60">Offline</span>
              )}
            </p>
          </div>
        </div>

        <button onClick={handleClose} className="btn btn-ghost btn-circle btn-sm">
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;