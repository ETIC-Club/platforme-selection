'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import styles from './layout.module.css'

export default function EventLayoutClient({
  children,
  eventId,
}: {
  children: React.ReactNode
  eventId: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCandidatureOpen, setIsCandidatureOpen] = useState(true)
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchValue(val)
    const newParams = new URLSearchParams(searchParams.toString())
    if (val) {
      newParams.set('search', val)
    } else {
      newParams.delete('search')
    }
    router.push(`${pathname}?${newParams.toString()}`)
  }

  return (
    <div className={styles.container}>
      <div className={styles.appWrapper}>
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className={styles.sidebarOverlay} onClick={() => setIsSidebarOpen(false)} />
        )}

        <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
          <div className={styles.logoArea}>
            <div className={styles.logoWrapper}>
              <div className={`${styles.logoDot} ${styles.logoDotOrange}`}></div>
              <div className={`${styles.logoDot} ${styles.logoDotRed}`}></div>
              <div className={`${styles.logoDot} ${styles.logoDotGreen}`}></div>
              <div className={`${styles.logoDot} ${styles.logoDotYellow}`}></div>
              <div className={styles.logoMain}>ETIC</div>
            </div>
            <span className={styles.logoText}>PLATFORM SELECTION</span>
          </div>

          <div className={styles.eventTitle}>
            <span className={styles.backArrow}>←</span> TRAINING CAMP XIII
          </div>

          <div className={styles.menuSection}>
            <div className={styles.menuLabel}>MENU</div>
            <nav className={styles.nav}>
              <Link href={`/events/${eventId}`} className={styles.navItem}>
                <span className={styles.navIcon}>📁</span> Dashboard
              </Link>
              <Link href={`/events/${eventId}/selectors`} className={styles.navItem}>
                <span className={styles.navIcon}>👥</span> Selectors
              </Link>
              <div 
                className={`${styles.navItem} ${styles.navItemActive}`}
                onClick={() => setIsCandidatureOpen(!isCandidatureOpen)}
              >
                <div className={styles.activeIndicator} />
                <span className={styles.navIcon}>👥</span> Candidature
                <span className={styles.dropdownArrow} style={{ transform: isCandidatureOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
              </div>
              {isCandidatureOpen && (
                <div className={styles.subMenu}>
                  <Link 
                    href={`/events/${eventId}/candidatures/to-review`} 
                    className={`${styles.subMenuItem} ${pathname.includes('/to-review') ? styles.subMenuItemActive : ''}`}
                  >
                    To be reviewed
                  </Link>
                  <Link 
                    href={`/events/${eventId}/candidatures/decisions`} 
                    className={`${styles.subMenuItem} ${pathname.includes('/decisions') ? styles.subMenuItemActive : ''}`}
                  >
                    Decisions
                  </Link>
                </div>
              )}
            </nav>
          </div>

          <div className={styles.extraSection}>
            <div className={styles.menuLabel}>EXTRA</div>
            <Link href="#" className={styles.navItem}>
              <span className={styles.navIcon}>↪</span> LOGOUT
            </Link>
          </div>
        </aside>

        <main className={styles.mainContent}>
          <header className={styles.header}>
            <div className={styles.mobileHeaderLeft}>
              <button className={styles.menuBtn} onClick={() => setIsSidebarOpen(true)}>☰</button>
            </div>
            <div className={styles.searchBar}>
              <span className={styles.searchIcon}>🔍</span>
              <input 
                type="text" 
                placeholder="Search" 
                className={styles.searchInput} 
                value={searchValue}
                onChange={handleSearchChange}
              />
            </div>
            <div className={styles.headerRight}>
              <button className={styles.bellBtn}>🔔</button>
              <div className={styles.profile}>
                <div className={styles.profileAvatar}></div>
                <div className={styles.profileInfo}>
                  <div className={styles.profileName}>ETIC BENETIC</div>
                  <div className={styles.profileEmail}>etic@esi.dz</div>
                </div>
              </div>
            </div>
          </header>

          <div className={styles.pageContent}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
