"use client";
import styles from "./users.module.css";
import { useEffect, useState } from "react";
import AddUserModal from "./AddUserModal";





export default function UsersPage() { 
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [users, setUsers] = useState<
  {
    id: number;
    name: string;
    email: string;
    joined: string;
    events: number;
    candidates: number;
    role: string;
    roleType: string;
  }[]
>([]);

const loadUsers = async () => {
  const response = await fetch("/api/users");
  const data = await response.json();

  setUsers(data);
};
  return (
   
    <main className={styles.page}>
      

      <div className={styles.dashboard}>
        <aside className={styles.sidebar}>
          <div className={styles.logoArea}>
            <div className={styles.logoMark}>ETIC</div>
            <div className={styles.logoText}>PLATFORM SELECTION</div>
          </div>

          <div className={styles.menuSection}>
            <span className={styles.sectionTitle}>MENU</span>

            <nav className={styles.navigation}>
              <a href="#" className={styles.disabledLink}>
                <span>▣</span>
                EVENTS
              </a>

              <a className={styles.activeLink} href="/admin/users">
                <span>♧</span>
                USERS
              </a>

              <a href="/admin/history">
                <span>◷</span>
                HISTORY
              </a>

              <a href="#" className={styles.disabledLink}>
                <span>♧</span>
                LOGS
              </a>
            </nav>
          </div>

          <div className={styles.extraSection}>
            <span className={styles.sectionTitle}>EXTRA</span>

            <a href="#" className={styles.logout}>
              <span>⇥</span>
              LOGOUT
            </a>
          </div>
        </aside>

        <section className={styles.content}>
          <header className={styles.topbar}>
            <div className={styles.search}>
              <span>⌕</span>

              <input
                type="search"
                placeholder="Search"
                aria-label="Search users"
              />
            </div>

            <div className={styles.profile}>
              <div className={styles.notification}>♧</div>

              <div className={styles.profileInfo}>
                <div className={styles.profileAvatar}>A</div>

                <div>
                  <strong>ETIC BENETIC</strong>
                  <span>etic@esi.dz</span>
                </div>
              </div>
            </div>
          </header>

          <div className={styles.mainContent}>
            <div className={styles.pageHeader}>
              <div>
                <h1>User&apos;s overview</h1>
              </div>

              <button
  type="button"
  className={styles.addButton}
  onClick={() => setIsAddUserOpen(true)}
>
  ADD USER
  <span>+</span>
</button>
            </div>

            <div className={styles.filters}>
              <button className={styles.filterActive} type="button">
                All
              </button>

              <button type="button">Selectors</button>

              <button type="button">Devs</button>
            </div>

            <div className={styles.tableWrapper}>
              <table>
                <thead>
                  <tr>
                    <th>Nom complet</th>
                    <th>joined in</th>
                    <th>events selected</th>
                    <th>candidates selected</th>
                    <th>Role</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>

                      <td>{user.joined}</td>

                      <td>{user.events}</td>

                      <td>{user.candidates}</td>

                      <td>
                        <span
                          className={`${styles.role} ${
                            user.roleType === "dev"
                              ? styles.devRole
                              : styles.selectorRole
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className={styles.pagination}>
              <div className={styles.pageSize}>
                <span>10</span>
                <span>⌄</span>
                <span>per page</span>
              </div>

              <div className={styles.pageNavigation}>
                <span className={styles.pageNumber}>1</span>
                <span>of 1 pages</span>

                <button type="button" aria-label="Previous page">
                  ‹
                </button>

                <button type="button" aria-label="Next page">
                  ›
                </button>
              </div>
            </footer>
          </div>
        </section>
       <AddUserModal
  isOpen={isAddUserOpen}
  onClose={() => setIsAddUserOpen(false)}
  onUserAdded={loadUsers}
/>
      </div>
    </main>
  );
}