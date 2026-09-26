"use client";

import React from "react";
import { SearchIcon, BellIcon } from "./Icons";
import styles from "./dashboard.module.css";

export type RolePreview = "SUPER_ADMIN" | "SELECTOR_RH" | "SELECTOR_TECHNIQUE" | "STANDARD_USER";

interface TopBarProps {
  currentRole: RolePreview;
  onRoleChange: (role: RolePreview) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  userName?: string;
  userEmail?: string;
}

export function TopBar({
  currentRole,
  onRoleChange,
  searchQuery,
  onSearchChange,
  userName = "ETIC BENETIC",
  userEmail = "etic@esi.dz",
}: TopBarProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const getRoleDisplayName = (role: RolePreview) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "Super Admin";
      case "SELECTOR_RH":
        return "Selector RH";
      case "SELECTOR_TECHNIQUE":
        return "Selector Technique";
      case "STANDARD_USER":
        return "Member";
    }
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.searchContainer}>
        <SearchIcon className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search events, candidates, or tags..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.topbarActions}>
        <div className={styles.roleSelector}>
          <span>View as:</span>
          <select
            value={currentRole}
            onChange={(e) => onRoleChange(e.target.value as RolePreview)}
            className={styles.roleSelectDropdown}
            aria-label="Role preview switch"
          >
            <option value="SUPER_ADMIN">Super Admin (Can see LOGS)</option>
            <option value="SELECTOR_RH">Selector RH</option>
            <option value="SELECTOR_TECHNIQUE">Selector Technique</option>
            <option value="STANDARD_USER">Standard User</option>
          </select>
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className={styles.iconButton}
        >
          <BellIcon />
        </button>

        <div className={styles.profileSection}>
          <div className={styles.avatar}>
            {getInitials(userName)}
          </div>
          <div className={styles.profileMeta}>
            <span className={styles.profileName}>{userName}</span>
            <span className={styles.profileRoleBadge}>{userEmail} • {getRoleDisplayName(currentRole)}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
