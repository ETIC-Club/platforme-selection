"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { SearchIcon, BellIcon, FilterSlidersIcon } from "./Icons";
import { ASSETS } from "@/lib/theme";
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
      {/* Desktop TopBar */}
      <div className={styles.desktopTopBar}>
        <div className={styles.searchContainer}>
          <SearchIcon className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.topbarActions}>
          <div className={styles.roleSelector}>
            <label htmlFor="role-select" style={{ fontSize: "11px", color: "#6B7280" }}>
              Rôle:
            </label>
            <select
              id="role-select"
              value={currentRole}
              onChange={(e) => {
                const newRole = e.target.value as "SUPER_ADMIN" | "SELECTOR_RH" | "SELECTOR_TECHNIQUE";
                if (typeof window !== "undefined") {
                  try {
                    localStorage.setItem("etic_platform_role", newRole);
                    window.location.reload();
                  } catch {}
                }
              }}
              className={styles.roleSelectDropdown}
            >
              <option value="SUPER_ADMIN">Admin</option>
              <option value="SELECTOR_TECHNIQUE">Sélecteur Dev</option>
              <option value="SELECTOR_RH">Sélecteur RH</option>
            </select>
          </div>

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
                {userEmail}
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* Mobile TopBar (Image 2) */}
      <div className={styles.mobileTopBar}>
        <div className={styles.mobileHeaderRow}>
          <div className={styles.mobileBrand}>
            <Image
              src={ASSETS.logo}
              alt="ETIC Logo"
              width={34}
              height={30}
              style={{ objectFit: "contain" }}
            />
            <div className={styles.mobileBrandText}>
              <span className={styles.mobileBrandTitle}>PLATFORM</span>
              <span className={styles.mobileBrandSub}>SELECTION</span>
            </div>
          </div>

          <div className={styles.mobileActions}>
            <button
              type="button"
              aria-label="Notifications"
              className={styles.mobileIconButton}
            >
              <BellIcon width={18} height={18} />
            </button>
            <div className={styles.mobileAvatar}>
              {getInitials(userName)}
            </div>
          </div>
        </div>

        <div className={styles.mobileSearchContainer}>
          <SearchIcon className={styles.searchIcon} width={16} height={16} />
          <input
            type="text"
            placeholder="Search events"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={styles.mobileSearchInput}
          />
          <FilterSlidersIcon className={styles.mobileFilterIcon} width={16} height={16} />
        </div>
      </div>
    </header>
  );
}

