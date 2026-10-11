import { useEffect, useState } from "react";
import { Users, Search, X, Plus } from "lucide-react";

import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import CreateGroupModal from "./CreateGroupModal";

const Sidebar = () => {
  const {
    getUsers,
    getGroups,
    users,
    groups,
    searchResults,
    searchUsers,
    clearSearch,
    isSearching,
    selectedUser,
    selectedGroup,
    setSelectedUser,
    setSelectedGroup,
    isUsersLoading,
    unreadCounts,
  } = useChatStore();

  const { onlineUsers } = useAuthStore();

  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  useEffect(() => {
    getUsers();
    getGroups();
  }, [getUsers, getGroups]);

  const isUserOnline = (userId) => {
    if (!userId) return false;
    const idStr = String(userId);
    return onlineUsers.some((onlineId) => String(onlineId) === idStr);
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      clearSearch();
      return;
    }
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers, clearSearch]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearSearchInput = () => {
    setSearchQuery("");
    clearSearch();
  };

  const isSearchingActive = searchQuery.trim().length > 0;
  const displayUsersList = isSearchingActive ? searchResults : users;

  const filteredUsers = showOnlineOnly
    ? displayUsersList.filter((user) => isUserOnline(user._id))
    : displayUsersList;

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <>
      <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
        {/* Header & Search Bar */}
        <div className="border-b border-base-300 w-full p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-primary" />
              <span className="font-medium hidden lg:block text-base">Chats</span>
            </div>

            {/* Create Group Button */}
            <button
              onClick={() => setIsGroupModalOpen(true)}
              className="btn btn-xs lg:btn-sm btn-primary rounded-lg flex items-center gap-1 font-normal"
              title="Create New Group"
            >
              <Plus size={16} />
              <span className="hidden lg:inline text-xs">New Group</span>
            </button>
          </div>

          {/* Search Input Field */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="input input-sm input-bordered w-full pl-8 pr-8 text-xs sm:text-sm"
            />
            <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            {searchQuery && (
              <button
                onClick={clearSearchInput}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Online Filter Toggle */}
          <div className="hidden lg:flex items-center justify-between gap-2 pt-1">
            <label className="cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="checkbox checkbox-xs"
              />
              <span className="text-xs text-zinc-400">Online only</span>
            </label>

            <span className="text-xs text-zinc-500">
              ({Math.max(onlineUsers.length - 1, 0)} online)
            </span>
          </div>
        </div>

        {/* Chats & Groups List Container */}
        <div className="overflow-y-auto w-full py-2 space-y-2">
          {/* GROUPS SECTION (If not searching) */}
          {!isSearchingActive && groups.length > 0 && (
            <div>
              <p className="hidden lg:block text-[10px] uppercase font-bold text-zinc-400 px-4 mb-1">
                Group Chats ({groups.length})
              </p>
              {groups.map((group) => {
                const unread = unreadCounts[group._id] || 0;
                const isSelected = selectedGroup?._id === group._id;

                return (
                  <button
                    key={group._id}
                    onClick={() => setSelectedGroup(group)}
                    className={`
                      w-full p-3 flex items-center gap-3
                      hover:bg-base-300 transition-colors relative
                      ${isSelected ? "bg-base-300 ring-1 ring-base-300" : ""}
                    `}
                  >
                    <div className="relative mx-auto lg:mx-0">
                      <img
                        src={group.groupPic || "/avatar.png"}
                        alt={group.name}
                        className="size-12 object-cover rounded-full border border-primary/20"
                      />
                      {/* Unread Badge (Mobile) */}
                      {unread > 0 && !isSelected && (
                        <span className="lg:hidden absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full size-4 flex items-center justify-center font-bold">
                          {unread}
                        </span>
                      )}
                    </div>

                    <div className="hidden lg:block text-left min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate text-sm flex items-center gap-1">
                          👨‍👩‍👧‍👦 {group.name}
                        </span>
                        {/* Unread Badge (Desktop) */}
                        {unread > 0 && !isSelected && (
                          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                            {unread}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400 truncate">
                        {group.members?.length || 0} members
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* DIRECT CHATS SECTION */}
          <div>
            {!isSearchingActive && (
              <p className="hidden lg:block text-[10px] uppercase font-bold text-zinc-400 px-4 mb-1 mt-2">
                Direct Contacts
              </p>
            )}

            {isSearching && (
              <div className="text-center text-xs text-zinc-500 py-4">Searching...</div>
            )}

            {!isSearching &&
              filteredUsers.map((user) => {
                const unread = unreadCounts[user._id] || 0;
                const isSelected = selectedUser?._id === user._id;
                const userOnline = isUserOnline(user._id);

                return (
                  <button
                    key={user._id}
                    onClick={() => setSelectedUser(user)}
                    className={`
                      w-full p-3 flex items-center gap-3
                      hover:bg-base-300 transition-colors relative
                      ${isSelected ? "bg-base-300 ring-1 ring-base-300" : ""}
                    `}
                  >
                    <div className="relative mx-auto lg:mx-0">
                      <img
                        src={user.profilePic || "/avatar.png"}
                        alt={user.fullName}
                        className="size-12 object-cover rounded-full"
                      />

                      {/* Online Indicator Badge */}
                      {userOnline && (
                        <span
                          className="absolute bottom-0 right-0 size-3 bg-green-500
                          rounded-full ring-2 ring-base-100"
                        />
                      )}

                      {/* Unread Badge (Mobile) */}
                      {unread > 0 && !isSelected && (
                        <span className="lg:hidden absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full size-4 flex items-center justify-center font-bold">
                          {unread}
                        </span>
                      )}
                    </div>

                    <div className="hidden lg:block text-left min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate text-sm">{user.fullName}</span>
                        {/* Unread Badge (Desktop) */}
                        {unread > 0 && !isSelected && (
                          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                            {unread}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400">
                        {userOnline ? (
                          <span className="text-green-500 font-medium">Online</span>
                        ) : (
                          "Offline"
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}

            {!isSearching && filteredUsers.length === 0 && (
              <div className="text-center text-zinc-500 py-6 px-4 text-xs">
                {isSearchingActive
                  ? "No users matched your search"
                  : showOnlineOnly
                  ? "No online contacts"
                  : "No recent chats. Search users or create a group!"}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
      />
    </>
  );
};

export default Sidebar;