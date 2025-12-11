import React, { useState, useEffect } from "react";
import TableUtil from "../util/TableUtil";
import { useAuth } from "../context/AuthContext";
import { Trash2, User } from "lucide-react";
import { usersAPI } from "../services/api";
import PhoneInputDropdown from "../util/PhoneNumberDropdown";
import { notifyError, notifySuccess } from "../util/Notifications";

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
      <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md">
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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
              btnClass: "bg-blue-600 hover:bg-blue-700",
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
                  className="px-2 py-1 rounded-md bg-gray-700 text-white border border-gray-500 focus:outline-none"
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
        <div className="p-4 bg-red-100 text-red-800 rounded-md">{error}</div>
      )}

      {/* Delete Confirmation Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Confirm Delete</h3>
              <button
                aria-label="Close Delete Confirmation Modal"
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-200"
              >
                X
              </button>
            </div>
            <p className="mb-6">
              Are you sure you want to delete{" "}
              <strong>{selectedUser.name}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                aria-label="Cancel Delete User"
                onClick={() => setSelectedUser(null)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                aria-label="Confirm Delete User"
                onClick={handleDeleteUser}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
              >
                <Trash2 size={18} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add Admin User</h3>
              <button
                aria-label="Close Add User Modal"
                onClick={() => setShowAddUserModal(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                X
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Name"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
                className="px-3 py-2 rounded-md bg-gray-700 border border-gray-500 text-white"
              />
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                className="px-3 py-2 rounded-md bg-gray-700 border border-gray-500 text-white"
              />

              <PhoneInputDropdown
                allowedCountries={["IN"]}
                onChange={(data) =>
                  setNewUser((prev) => ({ ...prev, phone: data.phone }))
                }
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                aria-label="Cancel Add User"
                onClick={() => setShowAddUserModal(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                aria-label="Create New User"
                onClick={handleCreateUser}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                disabled={creating}
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
