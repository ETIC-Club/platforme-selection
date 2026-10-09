"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import AddUserModal from "../admin/users/AddUserModal";
import EditUserModal from "./EditUserModal";
import styles from "../admin/users/users.module.css";

type User = {
  id: number;
  name: string;
  email: string;
  joined: string;
  events: number;
  candidates: number;
  role: string;
  roleType: string;
};

const USERS_PER_PAGE = 10;

export default function UsersPage() {
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const [isEditUserOpen, setIsEditUserOpen] = useState(false);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [selectedUser, setSelectedUser] =
    useState<User | null>(null);

  const [users, setUsers] = useState<User[]>([]);

  const [activeFilter, setActiveFilter] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);

  const [openMenuId, setOpenMenuId] = useState<number | null>(
    null
  );

  const refreshUsers = async () => {
    try {
      const response = await fetch("/api/users");

      if (!response.ok) {
        throw new Error("Failed to load users.");
      }

      const data = await response.json();

      setUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);
      alert("Failed to load users.");
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setOpenMenuId(null);
    setIsEditUserOpen(true);
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setOpenMenuId(null);
    setIsDetailsOpen(true);
  };

  const handleDeleteUser = async (user: User) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/users?id=${user.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();

        alert(data.error || "Failed to delete user.");
        return;
      }

      setOpenMenuId(null);

      if (selectedUser?.id === user.id) {
        setSelectedUser(null);
        setIsDetailsOpen(false);
        setIsEditUserOpen(false);
      }

      await refreshUsers();
    } catch {
      alert("An error occurred while deleting the user.");
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const getRoleBadgeClass = (user: User) => {
    const roleType = (user.roleType || "").toLowerCase();
    const role = (user.role || "").toLowerCase();

    if (roleType === "admin" || role.includes("admin")) {
      return styles.adminRole;
    }
    if (roleType === "selector_rh" || role.includes("rh")) {
      return styles.rhRole;
    }
    if (
      roleType === "selector_dev" ||
      roleType === "dev" ||
      role.includes("dev")
    ) {
      return styles.devRole;
    }
    return styles.selectorRole;
  };

  return (
    <DashboardLayout>
      {({ searchQuery }) => {
        const filteredUsers = users.filter((user) => {
          const roleType = (user.roleType || "").toLowerCase();
          const role = (user.role || "").toLowerCase();

          const matchesRole =
            activeFilter === "All" ||
            (activeFilter === "Admins" &&
              (roleType === "admin" || role.includes("admin"))) ||
            (activeFilter === "RH" &&
              (roleType === "selector_rh" || role.includes("rh"))) ||
            (activeFilter === "Devs" &&
              (roleType === "selector_dev" ||
                roleType === "dev" ||
                role.includes("dev"))) ||
            (activeFilter === "Selectors" &&
              (roleType.includes("selector") ||
                role.includes("sélecteur")));

          const search = searchQuery.trim().toLowerCase();

          const matchesSearch =
            !search ||
            user.name.toLowerCase().includes(search) ||
            user.email.toLowerCase().includes(search) ||
            user.role.toLowerCase().includes(search);

          return matchesRole && matchesSearch;
        });

        const totalPages = Math.max(
          1,
          Math.ceil(
            filteredUsers.length / USERS_PER_PAGE
          )
        );

        const safeCurrentPage = Math.min(
          currentPage,
          totalPages
        );

        const startIndex =
          (safeCurrentPage - 1) * USERS_PER_PAGE;

        const paginatedUsers = filteredUsers.slice(
          startIndex,
          startIndex + USERS_PER_PAGE
        );

        const goToPreviousPage = () => {
          setCurrentPage((page) =>
            Math.max(1, page - 1)
          );
        };

        const goToNextPage = () => {
          setCurrentPage((page) =>
            Math.min(totalPages, page + 1)
          );
        };

        return (
          <div className={styles.mainContent}>
            {/* HEADER */}
            <div className={styles.pageHeader}>
              <div>
                <h1>User&apos;s overview</h1>
              </div>

              <button
                type="button"
                className={styles.addButton}
                onClick={() =>
                  setIsAddUserOpen(true)
                }
              >
                ADD USER
                <span>+</span>
              </button>
            </div>

            {/* FILTERS */}
            <div className={styles.filters}>
              {["All", "Admins", "RH", "Devs"].map(
                (filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={
                      activeFilter === filter
                        ? styles.filterActive
                        : undefined
                    }
                    onClick={() =>
                      handleFilterChange(filter)
                    }
                  >
                    {filter}
                  </button>
                )
              )}
            </div>

            {/* TABLE */}
            <div className={styles.tableWrapper}>
              <table>
                <thead>
                  <tr>
                    <th>Nom complet</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>events selected</th>
                    <th>candidates selected</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedUsers.length > 0 ? (
                    paginatedUsers.map((user) => (
                      <tr
                        key={user.id}
                        className={styles.userRow}
                      >
                        <td>{user.name}</td>

                        <td>{user.email}</td>

                        <td className={styles.roleCell}>
                          <div
                            className={styles.roleWrapper}
                          >
                            <span
                              className={`${styles.role} ${getRoleBadgeClass(user)}`}
                            >
                              {user.role}
                            </span>
                          </div>
                        </td>

                        <td>{user.events}</td>

                        <td>{user.candidates}</td>

                        {/* ACTIONS */}
                        <td className={styles.actionCell}>
                          <div
                            className={
                              styles.actionMenuWrapper
                            }
                          >
                            <button
                              type="button"
                              className={
                                styles.moreButton
                              }
                              aria-label={`Actions for ${user.name}`}
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId ===
                                    user.id
                                    ? null
                                    : user.id
                                )
                              }
                            >
                              •••
                            </button>

                            {openMenuId === user.id && (
                              <div
                                className={
                                  styles.actionMenu
                                }
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleViewDetails(
                                      user
                                    )
                                  }
                                >
                                  Details
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEditUser(
                                      user
                                    )
                                  }
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className={
                                    styles.deleteAction
                                  }
                                  onClick={() =>
                                    handleDeleteUser(
                                      user
                                    )
                                  }
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6}>
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS VIEW */}
            <div className={styles.mobileUsersList}>
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <div key={user.id} className={styles.mobileUserCard}>
                    <div className={styles.mobileUserCardHeader}>
                      <div className={styles.mobileUserCardInfo}>
                        <span className={styles.mobileUserName}>{user.name}</span>
                        <span className={styles.mobileUserEmail}>{user.email}</span>
                      </div>

                      <div className={styles.mobileUserCardRight}>
                        <span className={`${styles.role} ${getRoleBadgeClass(user)}`}>
                          {user.role}
                        </span>

                        <div className={styles.actionMenuWrapper}>
                          <button
                            type="button"
                            className={styles.moreButton}
                            aria-label={`Actions for ${user.name}`}
                            onClick={() =>
                              setOpenMenuId(openMenuId === user.id ? null : user.id)
                            }
                          >
                            •••
                          </button>

                          {openMenuId === user.id && (
                            <div className={styles.actionMenu}>
                              <button
                                type="button"
                                onClick={() => handleViewDetails(user)}
                              >
                                Details
                              </button>

                              <button
                                type="button"
                                onClick={() => handleEditUser(user)}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className={styles.deleteAction}
                                onClick={() => handleDeleteUser(user)}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={styles.mobileUserMetaRow}>
                      <span className={styles.mobileUserMetaPill}>
                        <strong>{user.events}</strong> events
                      </span>
                      <span className={styles.mobileUserMetaPill}>
                        <strong>{user.candidates}</strong> candidates
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.mobileNoUsers}>No users found.</div>
              )}
            </div>

            {/* PAGINATION */}
            <footer className={styles.pagination}>
              <div className={styles.pageSize}>
                <span>{USERS_PER_PAGE}</span>
                <span>⌄</span>
                <span>per page</span>
              </div>

              <div className={styles.pageNavigation}>
                <span
                  className={styles.pageNumber}
                >
                  {safeCurrentPage}
                </span>

                <span>
                  of {totalPages} pages
                </span>

                <button
                  type="button"
                  aria-label="Previous page"
                  onClick={goToPreviousPage}
                  disabled={
                    safeCurrentPage === 1
                  }
                >
                  ‹
                </button>

                <button
                  type="button"
                  aria-label="Next page"
                  onClick={goToNextPage}
                  disabled={
                    safeCurrentPage === totalPages
                  }
                >
                  ›
                </button>
              </div>
            </footer>

            {/* ADD USER */}
            <AddUserModal
              isOpen={isAddUserOpen}
              onClose={() =>
                setIsAddUserOpen(false)
              }
              onUserAdded={refreshUsers}
            />

            {/* EDIT USER */}
            <EditUserModal
              isOpen={isEditUserOpen}
              user={selectedUser}
              onClose={() => {
                setIsEditUserOpen(false);
                setSelectedUser(null);
              }}
              onUserUpdated={refreshUsers}
            />

            {/* USER DETAILS */}
            {isDetailsOpen && selectedUser && (
              <div
                className={styles.detailsOverlay}
                onMouseDown={() => {
                  setIsDetailsOpen(false);
                  setSelectedUser(null);
                }}
              >
                <div
                  className={styles.detailsModal}
                  onMouseDown={(e) =>
                    e.stopPropagation()
                  }
                >
                  <button
                    type="button"
                    className={styles.detailsClose}
                    onClick={() => {
                      setIsDetailsOpen(false);
                      setSelectedUser(null);
                    }}
                    aria-label="Fermer"
                  >
                    ×
                  </button>

                  <h2>User details</h2>

                  <div
                    className={styles.detailsAvatar}
                  >
                    {selectedUser.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div
                    className={
                      styles.detailsName
                    }
                  >
                    {selectedUser.name}
                  </div>

                  <div
                    className={
                      styles.detailsRole
                    }
                  >
                    <span
                      className={`${styles.role} ${getRoleBadgeClass(selectedUser)}`}
                    >
                      {selectedUser.role}
                    </span>
                  </div>

                  <div
                    className={
                      styles.detailsGrid
                    }
                  >
                    <div
                      className={`${styles.detailsItem} ${styles.detailsItemFull}`}
                    >
                      <span>Email</span>
                      <strong>
                        {selectedUser.email}
                      </strong>
                    </div>

                    <div
                      className={
                        styles.detailsItem
                      }
                    >
                      <span>Events selected</span>
                      <strong>
                        {selectedUser.events}
                      </strong>
                    </div>

                    <div
                      className={
                        styles.detailsItem
                      }
                    >
                      <span>
                        Candidates selected
                      </span>
                      <strong>
                        {selectedUser.candidates}
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={
                      styles.detailsEditButton
                    }
                    onClick={() => {
                      setIsDetailsOpen(false);
                      setIsEditUserOpen(true);
                    }}
                  >
                    Edit user
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      }}
    </DashboardLayout>
  );
}