import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { X, Users, Image as ImageIcon, Check } from "lucide-react";
import toast from "react-hot-toast";

const CreateGroupModal = ({ isOpen, onClose }) => {
  const { users, createGroup, isCreatingGroup } = useChatStore();

  const [groupName, setGroupName] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [groupPic, setGroupPic] = useState("");

  if (!isOpen) return null;

  const toggleMemberSelection = (userId) => {
    if (selectedMemberIds.includes(userId)) {
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== userId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, userId]);
    }
  };

  const handleGroupPicChange = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select a valid image");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setGroupPic(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    if (selectedMemberIds.length === 0) {
      toast.error("Please select at least 1 contact to add");
      return;
    }

    await createGroup({
      name: groupName.trim(),
      members: selectedMemberIds,
      groupPic,
    });

    setGroupName("");
    setSelectedMemberIds([]);
    setGroupPic("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-enter">
      <div className="bg-base-100 border border-base-300 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-base-300 bg-base-200/50">
          <div className="flex items-center gap-2 font-semibold text-base">
            <Users className="size-5 text-primary" /> Create New Group
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-circle btn-xs text-zinc-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Group Picture & Name */}
          <div className="flex items-center gap-4">
            <label className="relative cursor-pointer group size-14 rounded-full bg-base-200 border-2 border-dashed border-base-300 hover:border-primary flex items-center justify-center overflow-hidden flex-shrink-0">
              {groupPic ? (
                <img src={groupPic} alt="Group Pic" className="size-full object-cover" />
              ) : (
                <ImageIcon className="size-6 text-zinc-400 group-hover:text-primary transition-colors" />
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleGroupPicChange} />
            </label>

            <div className="flex-1">
              <label className="text-xs font-semibold text-zinc-400 mb-1 block">Group Name</label>
              <input
                type="text"
                placeholder="e.g. Dev Squad 🚀"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="input input-bordered input-sm w-full font-medium"
                required
              />
            </div>
          </div>

          {/* Members Checklist */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 mb-2 block">
              Select Group Members ({selectedMemberIds.length} selected)
            </label>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-base-300 rounded-xl p-2 bg-base-200/30">
              {users.map((user) => {
                const isSelected = selectedMemberIds.includes(user._id);
                return (
                  <div
                    key={user._id}
                    onClick={() => toggleMemberSelection(user._id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? "bg-primary/20 border border-primary/40" : "hover:bg-base-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={user.profilePic || "/avatar.png"}
                        alt={user.fullName}
                        className="size-8 rounded-full object-cover"
                      />
                      <span className="text-sm font-medium">{user.fullName}</span>
                    </div>

                    <div
                      className={`size-5 rounded-md flex items-center justify-center border transition-all ${
                        isSelected ? "bg-primary border-primary text-primary-content" : "border-zinc-500"
                      }`}
                    >
                      {isSelected && <Check size={14} />}
                    </div>
                  </div>
                );
              })}

              {users.length === 0 && (
                <div className="text-center text-xs text-zinc-500 py-4">No contacts found to add</div>
              )}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-base-300">
            <button type="button" onClick={onClose} className="btn btn-sm btn-ghost">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreatingGroup || !groupName.trim() || selectedMemberIds.length === 0}
              className="btn btn-sm btn-primary"
            >
              {isCreatingGroup ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
