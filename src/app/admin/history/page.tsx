"use client";

import { useEffect, useState } from "react";
import styles from "./history.module.css";

type DateFilterType =
  | "Day"
  | "Week"
  | "Month"
  | "Year"
  | "Custom";

type HistoryEvent = {
  id: number;
  title: string;
  subtitle: string;
  date?: string;
  required: number;
  satisfaction: number;
  category: string;
  candidatesCount?: number;
  acceptedCount?: number;
};

function formatEventDate(dateStr?: string) {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T12:00:00Z`);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

const categories = ["All", "hackathons", "workshops"];

const filterTypes: DateFilterType[] = [
  "Day",
  "Week",
  "Month",
  "Year",
  "Custom",
];

const days = Array.from({ length: 31 }, (_, index) =>
  String(index + 1),
);

const weeks = [
  "Week 1",
  "Week 2",
  "Week 3",
  "Week 4",
];

const months = [
  "September",
  "October",
  "November",
  "December",
];

const years = [
  "2023",
  "2020",
  "2016",
  "2019",
  "2015",
  "2022",
  "2018",
  "2014",
  "2021",
  "2017",
  "2013",
];

export default function HistoryPage() {
  const [events, setEvents] = useState<HistoryEvent[]>([]);

  useEffect(() => {
    async function loadHistory() {
      const response = await fetch("/api/history");
      const data = await response.json();

      setEvents(data);
    }

    loadHistory();
  }, []);

  const [activeCategory, setActiveCategory] = useState("All");

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  

  const [dateType, setDateType] =
    useState<DateFilterType>("Month");

  const [selectedDay, setSelectedDay] = useState("");

  const [selectedWeek, setSelectedWeek] = useState("");

  const [selectedMonth, setSelectedMonth] =
    useState("September");

  const [selectedYear, setSelectedYear] =
    useState("2023");

  const [startDate, setStartDate] = useState("");

  const [endDate, setEndDate] = useState("");

  const handleDateTypeChange = (type: DateFilterType) => {
    setDateType(type);
  };
  const filteredEvents =
  activeCategory === "All"
    ? events
    : events.filter((event) => event.category === activeCategory);

  const handleApplyFilter = () => {
    /*
     * Frontend only for now.
     *
     * Later, this information will be sent to the backend
     * to retrieve the real filtered history.
     */
    console.log("History filter:", {
      type: dateType,
      day: selectedDay,
      week: selectedWeek,
      month: selectedMonth,
      year: selectedYear,
      startDate,
      endDate,
    });

    setIsFilterOpen(false);
  };

  return (
    <main className={styles.page}>
      <div className={styles.dashboard}>
        {/* =========================
            SIDEBAR
        ========================= */}

        <aside className={styles.sidebar}>
          <div className={styles.logoArea}>
            <div className={styles.logoMark}>ETIC</div>

            <div className={styles.logoText}>
              PLATFORM SELECTION
            </div>
          </div>

          <div className={styles.menuSection}>
            <span className={styles.sectionTitle}>
              MENU
            </span>

            <nav className={styles.navigation}>
              <a
                href="#"
                className={styles.disabledLink}
              >
                <span className={styles.icon}>▣</span>
                EVENTS
              </a>

              <a href="/admin/users">
                <span className={styles.icon}>♧</span>
                USERS
              </a>

              <a
                href="/admin/history"
                className={styles.activeLink}
              >
                <span className={styles.icon}>◷</span>
                HISTORY
              </a>

              <a
                href="#"
                className={styles.disabledLink}
              >
                <span className={styles.icon}>♧</span>
                LOGS
              </a>
            </nav>
          </div>

          <div className={styles.extraSection}>
            <span className={styles.sectionTitle}>
              EXTRA
            </span>

            <a
              href="#"
              className={styles.logout}
            >
              <span className={styles.icon}>⇥</span>
              LOGOUT
            </a>
          </div>
        </aside>

        {/* =========================
            RIGHT SIDE
        ========================= */}

        <section className={styles.content}>
          {/* =========================
              TOPBAR
          ========================= */}

          <header className={styles.topbar}>
            <div className={styles.search}>
              <span className={styles.searchIcon}>
                ⌕
              </span>

              <input
                type="search"
                placeholder="Search"
                aria-label="Search history"
              />
            </div>

            <div className={styles.profile}>
              <button
                type="button"
                className={styles.notification}
                aria-label="Notifications"
              >
                ♧
              </button>

              <div className={styles.profileInfo}>
                <div className={styles.profileAvatar}>
                  A
                </div>

                <div>
                  <strong>ETIC BENETIC</strong>
                  <span>etic@esi.dz</span>
                </div>
              </div>
            </div>
          </header>

          {/* =========================
              HISTORY PANEL
          ========================= */}

          <div className={styles.mainContent}>
            <div className={styles.pageHeader}>
              <h1>Event&apos;s history</h1>

              <div className={styles.filterWrapper}>
                <button
                  type="button"
                  className={styles.dateFilterButton}
                  onClick={() =>
                    setIsFilterOpen(
                      (previous) => !previous,
                    )
                  }
                >
                  <span>filter by date</span>

                  <span
                    className={styles.filterArrow}
                  >
                    ⌄
                  </span>
                </button>

                {/* =========================
                    FILTER POPUP
                ========================= */}

                {isFilterOpen && (
                  <div className={styles.filterPanel}>
                    {/* FILTER HEADER */}

                    <div className={styles.filterHeader}>
                      <h2>Filter by</h2>

                      <button
                        type="button"
                        className={styles.filterClose}
                        onClick={() =>
                          setIsFilterOpen(false)
                        }
                        aria-label="Close filter"
                      >
                        ×
                      </button>
                    </div>

                    {/* DATE TYPE BUTTONS */}

                    <div className={styles.dateOptions}>
                      {filterTypes.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={
                            dateType === option
                              ? styles.dateOptionActive
                              : styles.dateOption
                          }
                          onClick={() =>
                            handleDateTypeChange(
                              option,
                            )
                          }
                        >
                          <span>✓</span>

                          {option}
                        </button>
                      ))}
                    </div>

                    {/* =========================
                        DAY
                    ========================= */}

                    {dateType === "Day" && (
                      <div
                        className={
                          styles.dayContent
                        }
                      >
                        <p
                          className={
                            styles.filterLabel
                          }
                        >
                          Select a day
                        </p>

                        <div
                          className={
                            styles.dayGrid
                          }
                        >
                          {days.map((day) => (
                            <button
                              key={day}
                              type="button"
                              className={
                                selectedDay === day
                                  ? styles.dayActive
                                  : ""
                              }
                              onClick={() =>
                                setSelectedDay(
                                  day,
                                )
                              }
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* =========================
                        WEEK
                    ========================= */}

                    {dateType === "Week" && (
                      <div
                        className={
                          styles.weekContent
                        }
                      >
                        <p
                          className={
                            styles.filterLabel
                          }
                        >
                          Select a week
                        </p>

                        <div
                          className={
                            styles.weekList
                          }
                        >
                          {weeks.map((week) => (
                            <button
                              key={week}
                              type="button"
                              className={
                                selectedWeek === week
                                  ? styles.weekActive
                                  : ""
                              }
                              onClick={() =>
                                setSelectedWeek(
                                  week,
                                )
                              }
                            >
                              {week}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* =========================
                        MONTH
                    ========================= */}

                    {dateType === "Month" && (
                      <div
                        className={
                          styles.monthContent
                        }
                      >
                        <div
                          className={
                            styles.monthList
                          }
                        >
                          {months.map((month) => (
                            <button
                              key={month}
                              type="button"
                              className={
                                selectedMonth ===
                                month
                                  ? styles.monthActive
                                  : ""
                              }
                              onClick={() =>
                                setSelectedMonth(
                                  month,
                                )
                              }
                            >
                              {month}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* =========================
                        YEAR
                    ========================= */}

                    {dateType === "Year" && (
                      <div
                        className={
                          styles.yearGrid
                        }
                      >
                        {years.map((year) => (
                          <button
                            key={year}
                            type="button"
                            className={
                              selectedYear === year
                                ? styles.yearActive
                                : ""
                            }
                            onClick={() =>
                              setSelectedYear(year)
                            }
                          >
                            {year}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* =========================
                        CUSTOM
                    ========================= */}

                    {dateType === "Custom" && (
                      <div
                        className={
                          styles.customContent
                        }
                      >
                        <label>
                          From

                          <input
                            type="date"
                            value={startDate}
                            onChange={(event) =>
                              setStartDate(
                                event.target.value,
                              )
                            }
                          />
                        </label>

                        <label>
                          To

                          <input
                            type="date"
                            value={endDate}
                            onChange={(event) =>
                              setEndDate(
                                event.target.value,
                              )
                            }
                          />
                        </label>
                      </div>
                    )}

                    {/* APPLY */}

                    <button
                      type="button"
                      className={styles.applyButton}
                      onClick={handleApplyFilter}
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* =========================
                CATEGORY FILTERS
            ========================= */}

            <div
              className={styles.categoryFilters}
            >
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={
                    activeCategory === category
                      ? styles.categoryActive
                      : styles.categoryButton
                  }
                  onClick={() =>
                    setActiveCategory(category)
                  }
                >
                  {category}
                </button>
              ))}
            </div>

            {/* =========================
                EVENTS
            ========================= */}

            <div className={styles.eventsList}>
              {filteredEvents.map((event) => (
                <article
                  key={event.id}
                  className={styles.eventCard}
                >
                  <div
                    className={
                      styles.eventImage
                    }
                  />

                  <div
                    className={
                      styles.eventInfo
                    }
                  >
                    <h2>{event.title}</h2>

                    <p>{event.subtitle}</p>

                    <span>
                      {event.required} required
                    </span>
                  </div>

                  <div className={styles.eventMetrics}>
                    <div className={styles.metricItem}>
                      <span className={styles.metricLabel}>Date</span>
                      <span className={styles.metricValue}>
                        {formatEventDate(event.date)}
                      </span>
                    </div>

                    <div className={styles.metricItem}>
                      <span className={styles.metricLabel}>Candidates</span>
                      <span className={styles.metricValue}>
                        {event.candidatesCount ?? 0} candidate
                        {(event.candidatesCount ?? 0) !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className={styles.metricItem}>
                      <span className={styles.metricLabel}>Admitted</span>
                      <span className={styles.metricValue}>
                        <span className={styles.acceptedBadge}>
                          {event.acceptedCount ?? 0}
                        </span>
                        {event.required > 0 && (
                          <span className={styles.quotaText}>
                            / {event.required}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={
                      styles.eventAction
                    }
                    aria-label={`Open ${event.title}`}
                  >
                    ↗
                  </button>
                </article>
              ))}
            </div>

            {/* =========================
                PAGINATION
            ========================= */}

            <footer
              className={styles.pagination}
            >
              <div className={styles.pageSize}>
                <span
                  className={
                    styles.pageSizeNumber
                  }
                >
                  4
                </span>

                <span>⌄</span>

                <span>per page</span>
              </div>

              <div
                className={
                  styles.pageNavigation
                }
              >
                <span
                  className={
                    styles.currentPage
                  }
                >
                  1
                </span>

                <span>⌄</span>

                <span>of 1 pages</span>

                <button
                  type="button"
                  aria-label="Previous page"
                >
                  ‹
                </button>

                <button
                  type="button"
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}