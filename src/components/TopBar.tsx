"use client";

import React from "react";
import Link from "next/link";
import { SearchIcon, BellIcon } from "./Icons";
import styles from "./dashboard.module.css";

export type RolePreview = "SUPER_ADMIN" | "SELECTOR_RH" | "SELECTOR_TECHNIQUE" | "STANDARD_USER";

interface TopBarProps {
  currentRole: RolePreview;
  onRoleChange?: (role: RolePreview) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  userName?: string;
  userEmail?: string;
}

export function TopBar({
  currentRole,
  searchQuery,
  onSearchChange,
  userName = "Admin ETIC",
  userEmail = "admin@etic-club.net",
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
        return "Admin";
      case "SELECTOR_RH":
        return "Sélecteur RH";
      case "SELECTOR_TECHNIQUE":
        return "Sélecteur Dev";
      case "STANDARD_USER":
        return "Membre";
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
        <button
          type="button"
          aria-label="Notifications"
          className={styles.iconButton}
        >
          <BellIcon />
        </button>

        <Link href="/login" className={styles.profileSection} title="Cliquer pour changer de rôle">
          <div className={styles.avatar}>
            {getInitials(userName)}
          </div>
          <div className={styles.profileMeta}>
            <span className={styles.profileName}>{userName}</span>
            <span className={styles.profileRoleBadge}>
              {userEmail} • {getRoleDisplayName(currentRole)}
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
}
