import React, { useEffect, useState } from "react";
import { authAPI } from "../services/api"; // adjust path

export default function Profile() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    avatar: null, // File object
  });
  const [preview, setPreview] = useState(null); // For image preview
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authAPI.getProfile();
        const profile = res.data; // your API wraps in { success, data }
        setUser(profile);
        setFormData({
          name: profile.name,
          phone: profile.phone || "",
          avatar: null,
        });
        // Existing avatar
        setPreview(
          profile.avatar
            ? `http://localhost:5000/uploads/${profile.avatar}`
            : null
        );
      } catch (err) {
        console.error("Error fetching profile:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle avatar change
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, avatar: file }); // File to upload
      setPreview(URL.createObjectURL(file)); // Live preview
    }
  };

  // Submit updated profile
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const data = new FormData();
    data.append("name", formData.name);
    data.append("phone", formData.phone);
    if (formData.avatar) {
      data.append("avatar", formData.avatar); // send actual file
    }

    try {
      const updated = await authAPI.updateProfile(data);
      const updatedData = updated.data || updated;

      setUser(updatedData);
      setFormData({
        name: updatedData.name,
        phone: updatedData.phone || "",
        avatar: null,
      });

      // Update preview to final saved URL
      setPreview(
        updatedData.avatar
          ? `http://localhost:5000/uploads/${updatedData.avatar}`
          : null
      );

      setEditMode(false);
    } catch (err) {
      console.error("Profile update failed:", err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <p className="text-gray-300 text-center mt-10">Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-gray-800 rounded-2xl shadow-lg p-8">
        <div className="flex flex-col items-center">
          {/* Avatar */}
          <div className="relative">
            <img
              src={preview || "/default-avatar.jpg"}
              alt="Avatar"
              className="w-28 h-28 rounded-full object-cover border-2 border-gray-600"
            />
            {editMode && (
              <label className="absolute bottom-0 right-0 bg-indigo-600 p-2 rounded-full cursor-pointer hover:bg-indigo-700">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <span className="text-xs">📷</span>
              </label>
            )}
          </div>

          <h2 className="text-2xl font-bold mt-4">{user.name}</h2>
          <p className="text-gray-400">{user.email}</p>
          <p className="text-sm text-gray-500 mt-1">Role: {user.role}</p>
          <p className="text-sm text-gray-500">
            Member since {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="mt-6">
          {editMode ? (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditMode(false);
                    setFormData({
                      name: user.name,
                      phone: user.phone || "",
                      avatar: null,
                    });
                    setPreview(
                      user.avatar
                        ? `http://localhost:5000/uploads/${user.avatar}`
                        : null
                    );
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Phone</h3>
                <p className="text-gray-400">
                  {user.phone || "No phone number"}
                </p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
