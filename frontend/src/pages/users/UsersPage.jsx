import { useState } from "react";
import {
  useUsers,
  useCreateUser,
  useResetPassword,
  useDeactivateUser,
  useDeleteUser,
} from "../../hooks/useUsers.js";
import { PageHeader } from "../../components/shared/PageHeader.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import ConfirmDialog from "../../components/shared/ConfirmDialog.jsx";
import ExportMenu from "../../components/shared/ExportMenu";
import {
  Plus,
  UserCog,
  Key,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import UserForm from "./UserForm.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export default function UsersPage() {
  const { data: users = [], isLoading } = useUsers();
  const { user: currentUser } = useAuth();

  const resetPasswordMutation = useResetPassword();
  const deactivateMutation = useDeactivateUser();
  const deleteMutation = useDeleteUser();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Confirmation dialog state
  const [confirmAction, setConfirmAction] = useState(null);
  // { type: 'delete-user' | 'deactivate-user' | 'reset-password', data: userObject }

  const isAdmin = currentUser?.role === "admin";

  const handleConfirm = () => {
    if (!confirmAction) return;

    const { type, data: u } = confirmAction;

    if (type === "delete-user") {
      deleteMutation.mutate(u.id);
    } else if (type === "deactivate-user") {
      deactivateMutation.mutate(u.id);
    }

    setConfirmAction(null);
  };

  const getConfirmProps = () => {
    if (!confirmAction) return null;

    const { type, data: u } = confirmAction;

    if (type === "delete-user") {
      return {
        title: "Delete User",
        message: `Delete user "${u.username}"? This action cannot be undone.`,
        confirmText: "Delete User",
        variant: "danger",
      };
    }

    if (type === "deactivate-user") {
      const action = u.is_active ? "deactivate" : "activate";
      return {
        title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
        message: `Are you sure you want to ${action} "${u.username}"?`,
        confirmText: action.charAt(0).toUpperCase() + action.slice(1),
        variant: "warning",
      };
    }

    return null;
  };

  const confirmProps = getConfirmProps();

  if (isLoading)
    return <div className="text-sm text-gray-500">Loading users...</div>;

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Manage system users and their access"
        action={
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                onClick={() => {
                  setEditingUser(null);
                  setModalOpen(true);
                }}
              >
                <Plus size={16} className="mr-1" /> Add User
              </Button>
            )}
            <ExportMenu
              data={users}
              filename="users_export"
              title="System Users"
            />
          </div>
        }
      />

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Created
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Last Login
                </th>
                {isAdmin && (
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {u.username}
                        {currentUser?.id === u.id && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      color={
                        u.role === "admin"
                          ? "red"
                          : u.role === "manager"
                            ? "blue"
                            : "gray"
                      }
                    >
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={u.is_active ? "green" : "gray"}>
                      {u.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {u.last_login_at
                      ? new Date(u.last_login_at).toLocaleString()
                      : "Never"}
                  </td>

                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit */}
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setModalOpen(true);
                          }}
                          className="text-gray-400 hover:text-amber-500 p-1"
                          title="Edit user"
                        >
                          <UserCog size={15} />
                        </button>

                        {/* Reset Password */}
                        <button
                          onClick={() => {
                            const newPass = prompt(
                              `Enter new password for ${u.username}:`,
                            );
                            if (newPass && newPass.length >= 6) {
                              resetPasswordMutation.mutate({
                                id: u.id,
                                data: { new_password: newPass },
                              });
                            } else if (newPass) {
                              alert("Password must be at least 6 characters.");
                            }
                          }}
                          className="text-gray-400 hover:text-blue-500 p-1"
                          title="Reset Password"
                        >
                          <Key size={15} />
                        </button>

                        {/* Deactivate / Activate */}
                        <button
                          onClick={() => {
                            setConfirmAction({
                              type: "deactivate-user",
                              data: u,
                            });
                          }}
                          className="text-gray-400 hover:text-amber-500 p-1"
                          title={
                            u.is_active ? "Deactivate user" : "Activate user"
                          }
                        >
                          {u.is_active ? (
                            <ToggleRight size={15} />
                          ) : (
                            <ToggleLeft size={15} />
                          )}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => {
                            setConfirmAction({ type: "delete-user", data: u });
                          }}
                          className="text-gray-400 hover:text-red-500 p-1"
                          title="Delete user"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-10">
            No users found.
          </p>
        )}
      </div>

      {/* User Form Modal (Create / Edit) */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingUser(null);
        }}
        title={editingUser ? "Edit User" : "Create New User"}
      >
        <UserForm
          initialData={editingUser}
          onSuccess={() => {
            setModalOpen(false);
            setEditingUser(null);
          }}
        />
      </Modal>

      {/* Reusable Confirmation Dialog */}
      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        loading={deleteMutation.isPending || deactivateMutation.isPending}
        {...(confirmProps || {})}
      />
    </div>
  );
}
