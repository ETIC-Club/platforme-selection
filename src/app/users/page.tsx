"use client";

import React from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PlusIcon } from "@/components/Icons";
import styles from "@/components/dashboard.module.css";

export default function UsersPage() {
  return (
    <DashboardLayout>
      {() => {
        return (
          <div className={styles.mainCard}>
            <div className={styles.mainHeader}>
              <h1 className={styles.pageTitle}>USERS</h1>

              <button
                type="button"
                className={styles.addEventBtn}
                onClick={() => alert("Add User")}
              >
                <PlusIcon />
                <span>ADD USER</span>
              </button>
            </div>

            <div className={styles.eventsList}>
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#8C8F8E" }}>
                <p style={{ fontSize: "16px", fontWeight: "600" }}>No users registered yet</p>
                <p style={{ fontSize: "13px", marginTop: "6px" }}>
                  Click &quot;ADD USER&quot; to invite or register team members.
                </p>
              </div>
            </div>
          </div>
        );
      }}
    </DashboardLayout>
  );
}
