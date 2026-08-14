import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import PhoneInputDropdown from "../util/PhoneNumberDropdown";

export default function Profile() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setUser(null);
      setFormData({ name: "", phone: "" });
      setEditMode(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await authAPI.getProfile();
        const profile = res.data;
        if (cancelled) return;
        setUser(profile);
        setFormData({
          name: profile.name,
          phone: profile.phone || "",
        });
      } catch (err) {
        console.error("Error fetching profile:", err.message);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, authLoading]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updated = await authAPI.updateProfile(formData);
      const updatedData = updated.data || updated;

      setUser(updatedData);
      setFormData({
        name: updatedData.name,
        phone: updatedData.phone || "",
      });

      setEditMode(false);
    } catch (err) {
      console.error("Profile update failed:", err.message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || (isAuthenticated && loading)) {
    return <p className="text-muted text-center mt-10">Loading...</p>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  const avatarLetter = user?.name?.charAt(0).toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-page text-fg flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-surface border border-line rounded-2xl shadow-lg p-8">
        <div className="flex flex-col items-center">
          <div className="w-28 h-28 rounded-full bg-brand flex items-center justify-center text-4xl font-bold text-brand-fg border-2 border-line">
            {avatarLetter}
          </div>

          <h2 className="text-2xl font-bold mt-4">{user.name}</h2>
          <p className="text-muted">{user.email}</p>
          <p className="text-sm text-muted mt-1">Role: {user.role}</p>
          <p className="text-sm text-muted">
            Member since {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="mt-6">
          {editMode ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg bg-raised border border-line text-fg focus:ring-2 focus:ring-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <PhoneInputDropdown
                  allowedCountries={["IN"]}
                  value={user.phone}
                  onChange={(data) =>
                    setFormData((prev) => ({ ...prev, phone: data.phone }))
                  }
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  aria-label="Cancel to update the profile"
                  onClick={() => {
                    setEditMode(false);
                    setFormData({
                      name: user.name,
                      phone: user.phone || "",
                    });
                  }}
                  className="px-4 py-2 rounded-lg bg-raised hover:bg-line text-fg"
                >
                  Cancel
                </button>
                <button
                  aria-label="Submit"
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-brand hover:opacity-90 text-brand-fg disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Phone</h3>
                <p className="text-muted">
                  {user.phone || "No phone number"}
                </p>
              </div>
              <div className="flex justify-end">
                <button
                  aria-label="Edit Profile"
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 rounded-lg bg-brand hover:opacity-90 text-brand-fg"
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
