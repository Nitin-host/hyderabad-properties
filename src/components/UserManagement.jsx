import React, { useState, useEffect } from "react";
import TableUtil from "../util/TableUtil";
import { useAuth } from "../context/AuthContext";
import { Mail, Trash2, User, X } from "lucide-react";
import { usersAPI } from "../services/api";
import PhoneInputDropdown from "../util/PhoneNumberDropdown";
import { notifyError, notifySuccess } from "../util/Notifications";

const fieldClass =
  "w-full px-4 py-3 border border-line rounded-xl bg-page text-fg placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition";

const overlayClass =
  "fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm overflow-hidden overscroll-none";

const cardClass =
  "w-full max-w-md bg-surface text-fg rounded-2xl shadow-2xl border border-line max-h-[90vh] overflow-y-auto";

const UserManagement = () => {
  const { isSuperAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", phone: "" });
  const [creating, setCreating] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, asc: true });

  // Initial fetch only once
  useEffect(() => {
    fetchUsers(true);
  }, []);

  // Fetch on pagination, search, or sort changes
  useEffect(() => {
    fetchUsers();
  }, [page, limit, searchText, sortConfig]);

  useEffect(() => {
    const open = showAddUserModal || Boolean(selectedUser);
    if (!open) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [showAddUserModal, selectedUser]);

  // fetchUsers function updated with isInitial parameter as above
  const fetchUsers = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const param = {
        page,
        limit,
        search: searchText,
        sortKey: sortConfig.key,
        sortOrder: sortConfig.asc ? "asc" : "desc",
      };
      const response = await usersAPI.getAdmins(param); // fetch admins + super_admin
      const { users, pagination } = response.data;
      setUsers(users || []);
      setTotalPages(pagination?.pages || 1);
      setError(null);
    } catch (err) {
      console.error(err);
      notifyError("Failed to load users.");
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await usersAPI.updateUserRole(userId, newRole);
      notifySuccess("User role updated successfully");
      fetchUsers(); // refresh list
    } catch (err) {
      console.error(err);
      setError("Failed to update role.");
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await usersAPI.delete(selectedUser._id);
      notifySuccess("User deleted successfully");
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
      setError("Failed to delete user.");
    }
  };

  const handleCreateUser = async () => {
    const { name, email, phone } = newUser;
    if (!name || !email || !phone) {
      setError("Please fill all fields");
      return;
    }
    setCreating(true);
    try {
      await usersAPI.createAdmin({ name, email, phone }); // assumes API endpoint
      notifySuccess("User created successfully");
      setShowAddUserModal(false);
      setNewUser({ name: "", email: "", phone: "" });
      fetchUsers();
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to create user.");
    } finally {
      setCreating(false);
    }
  };

  if (!isSuperAdmin()) {
    return (
      <div className="p-4 rounded-xl border border-line bg-raised text-fg">
        You don't have permission to access this page.
      </div>
    );
  }

 const sortedUsers = users.slice().sort((a, b) => {
   if (a.role === "super_admin" && b.role !== "super_admin") return -1;
   if (b.role === "super_admin" && a.role !== "super_admin") return 1;
   return 0;
 });


  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
        </div>
      ) : (
        <TableUtil
          tableName="Users"
          tableData={sortedUsers}
          searchKeys={["name", "email"]}
          isServerPaginated={true} // Must be true
          currentPage={page} // Controlled current page
          rowsPerPage={limit} // controlled rows per page
          totalPages={totalPages} // total pages from server
          onPageChange={setPage} // Trigger to change page
          onRowsPerPageChange={setLimit}
          onSearchChange={setSearchText}
          onSortChange={setSortConfig}
          createBtn={[
            {
              label: "Add Admin User",
              title: "Create new user",
              onClick: () => setShowAddUserModal(true),
              icon: User,
              btnClass: "bg-brand hover:opacity-90 text-brand-fg px-3 py-2 rounded-lg",
            },
          ]}
          tableHeader={[
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone" },
            { key: "role", label: "Role" },
          ]}
          tableActions={[
            {
              btnTitle: "",
              btnClass: "text-red-500 hover:text-red-400",
              iconComponent: Trash2,
              btnAction: (user) => setSelectedUser(user),
              isVisible: (user) => user.role !== "super_admin",
            },
            {
              isVisible: (user) => user.role !== "super_admin",
              customRender: (user) => (
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user._id, e.target.value)}
                  className="px-2 py-1 rounded-md bg-raised text-fg border border-line focus:outline-none"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              ),
            },
          ]}
        />
      )}
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 p-3">
          {error}
        </div>
      )}

      {selectedUser && (
        <div className={overlayClass}>
          <div className={cardClass}>
            <div className="px-6 pt-6 pb-2 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold">Delete admin</h3>
                <p className="text-sm text-muted mt-1">
                  This cannot be undone.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setSelectedUser(null)}
                className="p-2 hover:bg-raised rounded-lg transition shrink-0"
              >
                <X size={18} className="text-muted" />
              </button>
            </div>
            <p className="px-6 py-4 text-sm">
              Delete <span className="font-semibold">{selectedUser.name}</span>?
            </p>
            <div className="px-6 pb-6 flex justify-end gap-2">
              <button
                type="button"
                aria-label="Cancel Delete User"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2.5 rounded-xl bg-raised hover:bg-line text-fg"
              >
                Cancel
              </button>
              <button
                type="button"
                aria-label="Confirm Delete User"
                onClick={handleDeleteUser}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white inline-flex items-center gap-2"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddUserModal && (
        <div className={overlayClass}>
          <div className={cardClass}>
            <div className="px-6 pt-6 pb-2 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand mb-1">
                  Super Admin
                </p>
                <h3 className="text-xl font-bold">Add admin user</h3>
                <p className="text-sm text-muted mt-1">
                  They will receive login details by email.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setShowAddUserModal(false)}
                className="p-2 hover:bg-raised rounded-lg transition shrink-0"
              >
                <X size={18} className="text-muted" />
              </button>
            </div>

            <div className="px-6 pb-6 pt-4 flex flex-col gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium">Name</label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Full name"
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, name: e.target.value })
                    }
                    className={`${fieldClass} pl-10`}
                  />
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                    size={18}
                  />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    className={`${fieldClass} pl-10`}
                  />
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">Phone</label>
                <PhoneInputDropdown
                  allowedCountries={["IN"]}
                  onChange={(data) =>
                    setNewUser((prev) => ({ ...prev, phone: data.phone }))
                  }
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  aria-label="Cancel Add User"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-raised hover:bg-line text-fg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  aria-label="Create New User"
                  onClick={handleCreateUser}
                  className="px-4 py-2.5 rounded-xl bg-brand hover:opacity-90 text-brand-fg disabled:opacity-60"
                  disabled={creating}
                >
                  {creating ? "Creating…" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
