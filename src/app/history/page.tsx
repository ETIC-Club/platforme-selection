"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import styles from "../admin/history/history.module.css";

type HistoryEvent = {
  id: number;
  title: string;
  subtitle: string;
  date: string;
  required: number;
  satisfaction: number;
  category: string;
  candidatesCount: number;
  evaluationsCount: number;
  acceptedCount: number;
  rejectedCount: number;
};

type EventComment = {
  id: number;
  eventId: number;
  userId: number | null;
  comment: string;
  createdAt: string;
  user: {
    id: number;
    fullName: string | null;
    email: string;
  } | null;
};

type DateFilter =
  | "All dates"
  | "Day"
  | "Week"
  | "Month"
  | "Year"
  | "Custom";

const EVENTS_PER_PAGE = 4;
const COMMENTS_PREVIEW_LIMIT = 5;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const currentYear = new Date().getFullYear();

const YEARS = Array.from(
  { length: currentYear - 2023 + 1 },
  (_, index) => currentYear - index
);

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

function HistoryContent({
  searchQuery,
}: {
  searchQuery: string;
}) {
  const { user } = useAuth();
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [dateFilter, setDateFilter] =
    useState<DateFilter>("All dates");

  const [selectedDay, setSelectedDay] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Selected event
  const [selectedEvent, setSelectedEvent] =
    useState<HistoryEvent | null>(null);

  // Event details modal
  const [isDetailsModalOpen, setIsDetailsModalOpen] =
    useState(false);

  // Comment state
  const [comments, setComments] = useState<EventComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isCommentModalOpen, setIsCommentModalOpen] =
    useState(false);
  const [isLoadingComments, setIsLoadingComments] =
    useState(false);
  const [isSubmittingComment, setIsSubmittingComment] =
    useState(false);
  const [commentError, setCommentError] = useState("");
  const [showAllComments, setShowAllComments] = useState(false);

  const now = new Date();

  /*
   * =========================
   * LOAD HISTORY
   * =========================
   */

  useEffect(() => {
    async function loadHistory() {
      const params = new URLSearchParams();

      const search = searchQuery.trim();

      if (search) {
        params.set("search", search);
      }

      if (activeCategory !== "All") {
        params.set("category", activeCategory);
      }

      if (dateFilter === "Day" && selectedDay) {
        params.set("startDate", selectedDay);
        params.set("endDate", selectedDay);
      }

      if (dateFilter === "Week" && selectedWeek) {
        const selectedDate = new Date(
          `${selectedWeek}T00:00:00`
        );

        const startOfWeek = new Date(selectedDate);
        const day = startOfWeek.getDay();

        startOfWeek.setDate(
          startOfWeek.getDate() -
            (day === 0 ? 6 : day - 1)
        );

        const endOfWeek = new Date(startOfWeek);

        endOfWeek.setDate(
          endOfWeek.getDate() + 6
        );

        params.set(
          "startDate",
          startOfWeek.toISOString().split("T")[0]
        );

        params.set(
          "endDate",
          endOfWeek.toISOString().split("T")[0]
        );
      }

      if (dateFilter === "Month" && selectedMonth) {
        const year = Number(
          selectedYear || now.getFullYear()
        );

        const monthIndex =
          MONTHS.indexOf(selectedMonth);

        const startDate = new Date(
          year,
          monthIndex,
          1
        );

        const endDate = new Date(
          year,
          monthIndex + 1,
          0
        );

        params.set(
          "startDate",
          startDate.toISOString().split("T")[0]
        );

        params.set(
          "endDate",
          endDate.toISOString().split("T")[0]
        );
      }

      if (dateFilter === "Year" && selectedYear) {
        params.set(
          "startDate",
          `${selectedYear}-01-01`
        );

        params.set(
          "endDate",
          `${selectedYear}-12-31`
        );
      }

      if (dateFilter === "Custom") {
        if (customStartDate) {
          params.set(
            "startDate",
            customStartDate
          );
        }

        if (customEndDate) {
          params.set(
            "endDate",
            customEndDate
          );
        }
      }

      try {
        const queryString = params.toString();

        const response = await fetch(
          queryString
            ? `/api/history?${queryString}`
            : "/api/history"
        );

        if (!response.ok) {
          setEvents([]);
          return;
        }

        const data = await response.json();

        setEvents(data);
        setCurrentPage(1);
      } catch (error) {
        console.error(
          "Failed to load history:",
          error
        );

        setEvents([]);
      }
    }

    loadHistory();
  }, [
    searchQuery,
    activeCategory,
    dateFilter,
    selectedDay,
    selectedWeek,
    selectedMonth,
    selectedYear,
    customStartDate,
    customEndDate,
  ]);

  /*
   * =========================
   * EVENT DETAILS
   * =========================
   */

  const openDetailsModal = (
    event: HistoryEvent
  ) => {
    setSelectedEvent(event);
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedEvent(null);
  };

  /*
   * =========================
   * COMMENT HANDLERS
   * =========================
   */

  const openCommentModal = async (
    event?: HistoryEvent | null
  ) => {
    const targetEvent = event || selectedEvent;
    if (!targetEvent) return;

    setIsDetailsModalOpen(false);
    setSelectedEvent(targetEvent);
    setIsCommentModalOpen(true);

    setComments([]);
    setNewComment("");
    setCommentError("");
    setShowAllComments(false);
    setIsLoadingComments(true);

    try {
      const response = await fetch(
        `/api/event-comments?eventId=${targetEvent.id}`
      );

      const data = await response.json().catch(() => null);

      if (!response.ok || !data) {
        setCommentError(
          (data && (data.error || data.details)) ||
            "Unable to load comments."
        );
        setComments([]);
        return;
      }

      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
      setCommentError(
        error instanceof Error
          ? error.message
          : "Unable to load comments."
      );
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const closeCommentModal = () => {
    if (isSubmittingComment) {
      return;
    }

    setIsCommentModalOpen(false);
    setSelectedEvent(null);
    setComments([]);
    setNewComment("");
    setCommentError("");
    setShowAllComments(false);
  };

  const handleSubmitComment = async () => {
    if (!selectedEvent) {
      return;
    }

    const trimmedComment =
      newComment.trim();

    if (!trimmedComment) {
      setCommentError(
        "Please write a comment before submitting."
      );
      return;
    }

    setIsSubmittingComment(true);
    setCommentError("");

    try {
      const response = await fetch(
        "/api/event-comments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            eventId: selectedEvent.id,
            comment: trimmedComment,
            userEmail: user?.email,
            userId:
              user?.id && !isNaN(Number(user.id))
                ? Number(user.id)
                : undefined,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok || !data || !data.comment) {
        setCommentError(
          (data && (data.details || data.error)) ||
            "Unable to add comment."
        );
        return;
      }

      setComments((currentComments) => [
        {
          ...data.comment,
          createdAt:
            data.comment.createdAt ||
            new Date().toISOString(),
          user:
            data.comment.user ||
            (user
              ? {
                  id: 0,
                  fullName: user.name,
                  email: user.email,
                }
              : null),
        },
        ...currentComments,
      ]);

      setNewComment("");
    } catch (error) {
      setCommentError(
        error instanceof Error
          ? error.message
          : "Unable to add comment."
      );
    } finally {
      setIsSubmittingComment(false);
    }
  };

  /*
   * =========================
   * DATE FILTER DATA
   * =========================
   */

  const years = YEARS;

  const daysInMonth = selectedMonth
    ? new Date(
        Number(
          selectedYear ||
            now.getFullYear()
        ),
        MONTHS.indexOf(
          selectedMonth
        ) + 1,
        0
      ).getDate()
    : 31;

  const days = Array.from(
    { length: daysInMonth },
    (_, index) => index + 1
  );

  /*
   * =========================
   * FILTERING
   * =========================
   */

  const searchFilteredEvents = events;

  const dateFilteredEvents =
    searchFilteredEvents;

  const filteredEvents =
    activeCategory === "All"
      ? dateFilteredEvents
      : dateFilteredEvents.filter(
          (event) =>
            event.category ===
            activeCategory
        );

  /*
   * =========================
   * PAGINATION
   * =========================
   */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredEvents.length /
        EVENTS_PER_PAGE
    )
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safeCurrentPage - 1) *
    EVENTS_PER_PAGE;

  const paginatedEvents =
    filteredEvents.slice(
      startIndex,
      startIndex +
        EVENTS_PER_PAGE
    );

  /*
   * =========================
   * FILTER HANDLERS
   * =========================
   */

  const handleCategoryChange = (
    category: string
  ) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  const handleDateFilterChange = (
    filter: DateFilter
  ) => {
    setDateFilter(filter);
    setCurrentPage(1);

    if (filter === "All dates") {
      setIsDateFilterOpen(false);
    }
  };

  const handleApplyFilter = () => {
    setCurrentPage(1);
    setIsDateFilterOpen(false);
  };

  const handlePreviousPage = () => {
    setCurrentPage((page) =>
      Math.max(
        1,
        Math.min(
          page,
          totalPages
        ) - 1
      )
    );
  };

  const handleNextPage = () => {
    setCurrentPage((page) =>
      Math.min(
        totalPages,
        Math.min(
          page,
          totalPages
        ) + 1
      )
    );
  };

  const visibleComments =
    showAllComments
      ? comments
      : comments.slice(
          0,
          COMMENTS_PREVIEW_LIMIT
        );

  return (
    <div className={styles.mainContent}>
      {/* =========================
          HEADER
      ========================= */}

      <div className={styles.pageHeader}>
        <h1>History</h1>

        <div className={styles.filterWrapper}>
          <button
            type="button"
            className={
              styles.dateFilterButton
            }
            onClick={() =>
              setIsDateFilterOpen(
                (open) => !open
              )
            }
          >
            {dateFilter}

            <span
              className={
                styles.filterArrow
              }
            >
              ⌄
            </span>
          </button>

          {isDateFilterOpen && (
            <div
              className={
                styles.filterPanel
              }
            >
              <div
                className={
                  styles.filterHeader
                }
              >
                <h2>
                  Filter by date
                </h2>

                <button
                  type="button"
                  className={
                    styles.filterClose
                  }
                  onClick={() =>
                    setIsDateFilterOpen(
                      false
                    )
                  }
                >
                  ×
                </button>
              </div>

              <div
                className={
                  styles.dateOptions
                }
              >
                {[
                  "All dates",
                  "Day",
                  "Week",
                  "Month",
                  "Year",
                  "Custom",
                ].map(
                  (option) => (
                    <button
                      key={option}
                      type="button"
                      className={
                        dateFilter ===
                        option
                          ? styles.dateOptionActive
                          : styles.dateOption
                      }
                      onClick={() =>
                        handleDateFilterChange(
                          option as DateFilter
                        )
                      }
                    >
                      {option}
                    </button>
                  )
                )}
              </div>

              {/* DAY */}

              {dateFilter ===
                "Day" && (
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
                    {days.map(
                      (day) => {
                        const year =
                          Number(
                            selectedYear ||
                              now.getFullYear()
                          );

                        const monthIndex =
                          selectedMonth !==
                          ""
                            ? MONTHS.indexOf(
                                selectedMonth
                              )
                            : now.getMonth();

                        const value =
                          `${year}-${String(
                            monthIndex +
                              1
                          ).padStart(
                            2,
                            "0"
                          )}-${String(
                            day
                          ).padStart(
                            2,
                            "0"
                          )}`;

                        return (
                          <button
                            key={day}
                            type="button"
                            className={
                              selectedDay ===
                              value
                                ? styles.dayActive
                                : undefined
                            }
                            onClick={() =>
                              setSelectedDay(
                                value
                              )
                            }
                          >
                            {day}
                          </button>
                        );
                      }
                    )}
                  </div>

                  <button
                    type="button"
                    className={
                      styles.applyButton
                    }
                    onClick={
                      handleApplyFilter
                    }
                  >
                    APPLY
                  </button>
                </div>
              )}

              {/* WEEK */}

              {dateFilter ===
                "Week" && (
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
                    {(() => {
                      const year =
                        Number(
                          selectedYear ||
                            now.getFullYear()
                        );

                      const month =
                        selectedMonth !==
                        ""
                          ? MONTHS.indexOf(
                              selectedMonth
                            )
                          : now.getMonth();

                      const daysInMonth =
                        new Date(
                          year,
                          month + 1,
                          0
                        ).getDate();

                      const firstDay =
                        new Date(
                          year,
                          month,
                          1
                        ).getDay();

                      const daysBeforeFirstMonday =
                        firstDay ===
                        0
                          ? 6
                          : firstDay -
                            1;

                      const weekCount =
                        Math.ceil(
                          (daysInMonth +
                            daysBeforeFirstMonday) /
                            7
                        );

                      return Array.from(
                        {
                          length:
                            weekCount,
                        },
                        (
                          _,
                          index
                        ) => {
                          const weekNumber =
                            index +
                            1;

                          const weekStart =
                            new Date(
                              year,
                              month,
                              1 +
                                index *
                                  7 -
                                daysBeforeFirstMonday
                            );

                          const value =
                            weekStart
                              .toISOString()
                              .split(
                                "T"
                              )[0];

                          return (
                            <button
                              key={
                                value
                              }
                              type="button"
                              className={
                                selectedWeek ===
                                value
                                  ? styles.weekActive
                                  : undefined
                              }
                              onClick={() =>
                                setSelectedWeek(
                                  value
                                )
                              }
                            >
                              Week{" "}
                              {
                                weekNumber
                              }
                            </button>
                          );
                        }
                      );
                    })()}
                  </div>

                  <button
                    type="button"
                    className={
                      styles.applyButton
                    }
                    onClick={
                      handleApplyFilter
                    }
                  >
                    APPLY
                  </button>
                </div>
              )}

              {/* MONTH */}

              {dateFilter ===
                "Month" && (
                <div
                  className={
                    styles.monthContent
                  }
                >
                  <div
                    className={
                      styles.monthYearRow
                    }
                  >
                    <p
                      className={
                        styles.filterLabel
                      }
                    >
                      Select month
                    </p>

                    <select
                      className={
                        styles.yearSelect
                      }
                      value={
                        selectedYear ||
                        String(
                          currentYear
                        )
                      }
                      onChange={(
                        event
                      ) =>
                        setSelectedYear(
                          event.target
                            .value
                        )
                      }
                    >
                      {years.map(
                        (year) => (
                          <option
                            key={year}
                            value={
                              year
                            }
                          >
                            {year}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div
                    className={
                      styles.monthList
                    }
                  >
                    {MONTHS.map(
                      (month) => (
                        <button
                          key={month}
                          type="button"
                          className={
                            selectedMonth ===
                            month
                              ? styles.monthActive
                              : undefined
                          }
                          onClick={() =>
                            setSelectedMonth(
                              month
                            )
                          }
                        >
                          {month}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    type="button"
                    className={
                      styles.applyButton
                    }
                    onClick={
                      handleApplyFilter
                    }
                  >
                    APPLY
                  </button>
                </div>
              )}

              {/* YEAR */}

              {dateFilter ===
                "Year" && (
                <div
                  className={
                    styles.yearContent
                  }
                >
                  <div
                    className={
                      styles.yearGrid
                    }
                  >
                    {years.map(
                      (year) => (
                        <button
                          key={year}
                          type="button"
                          className={
                            selectedYear ===
                            String(
                              year
                            )
                              ? styles.yearActive
                              : undefined
                          }
                          onClick={() =>
                            setSelectedYear(
                              String(
                                year
                              )
                            )
                          }
                        >
                          {year}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    type="button"
                    className={
                      styles.applyButton
                    }
                    onClick={
                      handleApplyFilter
                    }
                  >
                    APPLY
                  </button>
                </div>
              )}

              {/* CUSTOM */}

              {dateFilter ===
                "Custom" && (
                <div
                  className={
                    styles.customContent
                  }
                >
                  <div
                    className={
                      styles.customDateRow
                    }
                  >
                    <label>
                      From

                      <input
                        type="date"
                        value={
                          customStartDate
                        }
                        onChange={(
                          event
                        ) =>
                          setCustomStartDate(
                            event.target
                              .value
                          )
                        }
                      />
                    </label>

                    <span
                      className={
                        styles.dateRangeArrow
                      }
                    >
                      →
                    </span>

                    <label>
                      To

                      <input
                        type="date"
                        min={
                          customStartDate ||
                          undefined
                        }
                        value={
                          customEndDate
                        }
                        onChange={(
                          event
                        ) =>
                          setCustomEndDate(
                            event.target
                              .value
                          )
                        }
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    className={
                      styles.applyButton
                    }
                    onClick={
                      handleApplyFilter
                    }
                    disabled={
                      !!customStartDate &&
                      !!customEndDate &&
                      customEndDate <
                        customStartDate
                    }
                  >
                    APPLY
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* =========================
          CATEGORY FILTERS
      ========================= */}

      <div
        className={
          styles.categoryFilters
        }
      >
        {[
          "All",
          "hackathons",
          "workshops",
        ].map((category) => (
          <button
            key={category}
            type="button"
            className={
              activeCategory ===
              category
                ? styles.categoryActive
                : styles.categoryButton
            }
            onClick={() =>
              handleCategoryChange(
                category
              )
            }
          >
            {category ===
            "All"
              ? "All"
              : category
                  .charAt(0)
                  .toUpperCase() +
                category.slice(1)}
          </button>
        ))}
      </div>

      {/* =========================
          EVENTS
      ========================= */}

      <div
        className={
          styles.eventsList
        }
      >
        {paginatedEvents.length ===
        0 ? (
          <div>
            No history events
            found.
          </div>
        ) : (
          paginatedEvents.map(
            (event) => (
              <div
                className={
                  styles.eventCard
                }
                key={event.id}
              >
                <div
                  className={
                    styles.eventInfo
                  }
                >
                  <h2>
                    {event.title}
                  </h2>

                  <p>
                    {event.subtitle}
                  </p>
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
                      {event.candidatesCount} candidate
                      {event.candidatesCount !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className={styles.metricItem}>
                    <span className={styles.metricLabel}>Admitted</span>
                    <span className={styles.metricValue}>
                      <span className={styles.acceptedBadge}>
                        {event.acceptedCount}
                      </span>
                      {event.required > 0 && (
                        <span className={styles.quotaText}>
                          / {event.required}
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div
                  className={
                    styles.eventActions
                  }
                >
                  <button
                    type="button"
                    className={
                      styles.commentAction
                    }
                    onClick={() =>
                      openCommentModal(
                        event
                      )
                    }
                    aria-label={`Comment on ${event.title}`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <span>
                      Comment
                    </span>
                  </button>

                  <button
                    type="button"
                    className={
                      styles.eventAction
                    }
                    aria-label={`View ${event.title}`}
                    onClick={() =>
                      openDetailsModal(
                        event
                      )
                    }
                  >
                    →
                  </button>
                </div>
              </div>
            )
          )
        )}
      </div>

      {/* =========================
          PAGINATION
      ========================= */}

      <div
        className={
          styles.pagination
        }
      >
        <div
          className={
            styles.pageSize
          }
        >
          <span
            className={
              styles.pageSizeNumber
            }
          >
            {EVENTS_PER_PAGE}
          </span>

          <span>
            per page
          </span>
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
            {safeCurrentPage}
          </span>

          <span>
            of {totalPages} pages
          </span>

          <button
            type="button"
            onClick={
              handlePreviousPage
            }
            disabled={
              safeCurrentPage ===
              1
            }
            aria-label="Previous page"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={
              handleNextPage
            }
            disabled={
              safeCurrentPage ===
              totalPages
            }
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      </div>

      {/* =========================
          EVENT DETAILS MODAL
      ========================= */}

      {isDetailsModalOpen &&
        selectedEvent && (
          <div
            className={
              styles.detailsOverlay
            }
            onClick={
              closeDetailsModal
            }
          >
            <div
              className={
                styles.detailsModal
              }
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div
                className={
                  styles.detailsHeader
                }
              >
                <div>
                  <h2>
                    {
                      selectedEvent.title
                    }
                  </h2>

                  <p>
                    {
                      selectedEvent.subtitle
                    }
                  </p>
                </div>

                <button
                  type="button"
                  className={
                    styles.detailsClose
                  }
                  onClick={
                    closeDetailsModal
                  }
                  aria-label="Close event details"
                >
                  ×
                </button>
              </div>

              <div
                className={
                  styles.detailsGrid
                }
              >
                <div
                  className={
                    styles.detailsItem
                  }
                >
                  <span>
                    Category
                  </span>

                  <strong>
                    {selectedEvent.category ===
                    "hackathons"
                      ? "Hackathon"
                      : "Workshop"}
                  </strong>
                </div>

                <div
                  className={
                    styles.detailsItem
                  }
                >
                  <span>
                    Date
                  </span>

                  <strong>
                    {
                      selectedEvent.date
                    }
                  </strong>
                </div>

                <div
                  className={
                    styles.detailsItem
                  }
                >
                  <span>
                    Required participants
                  </span>

                  <strong>
                    {
                      selectedEvent.required
                    }
                  </strong>
                </div>

                <div
                  className={
                    styles.detailsItem
                  }
                >
                  <span>
                    Candidates
                  </span>

                  <strong>
                    {
                      selectedEvent.candidatesCount
                    }
                  </strong>
                </div>

                <div
                  className={
                    styles.detailsItem
                  }
                >
                  <span>
                    Evaluations
                  </span>

                  <strong>
                    {
                      selectedEvent.evaluationsCount
                    }
                  </strong>
                </div>

                <div
                  className={
                    styles.detailsItem
                  }
                >
                  <span>
                    Accepted
                  </span>

                  <strong>
                    {
                      selectedEvent.acceptedCount
                    }
                  </strong>
                </div>

                <div
                  className={
                    styles.detailsItem
                  }
                >
                  <span>
                    Rejected
                  </span>

                  <strong>
                    {
                      selectedEvent.rejectedCount
                    }
                  </strong>
                </div>

                <div
                  className={
                    styles.detailsItem
                  }
                >
                  <span>
                    Selection Rate
                  </span>

                  <strong>
                    {selectedEvent.candidatesCount > 0
                      ? Math.round(
                          (selectedEvent.acceptedCount /
                            selectedEvent.candidatesCount) *
                            100
                        )
                      : selectedEvent.satisfaction}
                    %
                  </strong>
                </div>
              </div>

              <div
                className={
                  styles.detailsSatisfaction
                }
              >
                <div
                  className={
                    styles.detailsSatisfactionHeader
                  }
                >
                  <span>
                    Selection Rate (Accepted / Total)
                  </span>

                  <strong>
                    {selectedEvent.candidatesCount > 0
                      ? Math.round(
                          (selectedEvent.acceptedCount /
                            selectedEvent.candidatesCount) *
                            100
                        )
                      : selectedEvent.satisfaction}
                    %
                  </strong>
                </div>

                <div
                  className={
                    styles.detailsProgress
                  }
                >
                  <div
                    style={{
                      width: `${
                        selectedEvent.candidatesCount > 0
                          ? Math.round(
                              (selectedEvent.acceptedCount /
                                selectedEvent.candidatesCount) *
                                100
                            )
                          : selectedEvent.satisfaction
                      }%`,
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                className={
                  styles.detailsCommentButton
                }
                onClick={() => {
                  const eventToOpen = selectedEvent;
                  setIsDetailsModalOpen(false);
                  if (eventToOpen) {
                    openCommentModal(eventToOpen);
                  }
                }}
              >
                View comments
              </button>
            </div>
          </div>
        )}

      {/* =========================
          COMMENTS MODAL
      ========================= */}

      {isCommentModalOpen &&
        selectedEvent && (
          <div
            className={
              styles.commentOverlay
            }
            onClick={
              closeCommentModal
            }
          >
            <div
              className={
                styles.commentModal
              }
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div
                className={
                  styles.commentHeader
                }
              >
                <div>
                  <h2>
                    Event comments
                  </h2>

                  <p>
                    {
                      selectedEvent.title
                    }
                  </p>
                </div>

                <button
                  type="button"
                  className={
                    styles.commentClose
                  }
                  onClick={
                    closeCommentModal
                  }
                  disabled={
                    isSubmittingComment
                  }
                  aria-label="Close comments"
                >
                  ×
                </button>
              </div>

              <div
                className={
                  styles.commentsList
                }
              >
                {isLoadingComments ? (
                  <div
                    className={
                      styles.commentsEmpty
                    }
                  >
                    Loading comments...
                  </div>
                ) : comments.length ===
                  0 ? (
                  <div
                    className={
                      styles.commentsEmpty
                    }
                  >
                    No comments yet.
                  </div>
                ) : (
                  <>
                    {visibleComments.map(
                      (comment) => (
                        <div
                          className={
                            styles.commentItem
                          }
                          key={
                            comment.id
                          }
                        >
                          <div
                            className={
                              styles.commentItemHeader
                            }
                          >
                            <strong>
                              {comment
                                .user
                                ?.fullName ||
                                comment
                                  .user
                                  ?.email ||
                                "User"}
                            </strong>

                            <span>
                              {new Date(
                                comment.createdAt
                              ).toLocaleDateString()}
                            </span>
                          </div>

                          <p>
                            {
                              comment.comment
                            }
                          </p>
                        </div>
                      )
                    )}

                    {comments.length >
                      COMMENTS_PREVIEW_LIMIT && (
                      <button
                        type="button"
                        className={
                          styles.viewAllComments
                        }
                        onClick={() =>
                          setShowAllComments(
                            (
                              current
                            ) =>
                              !current
                          )
                        }
                      >
                        {showAllComments
                          ? "Show fewer comments"
                          : `View all ${comments.length} comments`}
                      </button>
                    )}
                  </>
                )}
              </div>

              <div
                className={
                  styles.commentForm
                }
              >
                <textarea
                  value={newComment}
                  onChange={(
                    event
                  ) =>
                    setNewComment(
                      event.target
                        .value
                    )
                  }
                  placeholder="Write your feedback..."
                  maxLength={1000}
                  disabled={
                    isSubmittingComment
                  }
                />

                {commentError && (
                  <p
                    className={
                      styles.commentError
                    }
                  >
                    {commentError}
                  </p>
                )}

                <div
                  className={
                    styles.commentFormFooter
                  }
                >
                  <span>
                    {
                      newComment.length
                    }
                    /1000
                  </span>

                  <button
                    type="button"
                    className={
                      styles.commentSubmit
                    }
                    onClick={
                      handleSubmitComment
                    }
                    disabled={
                      isSubmittingComment ||
                      !newComment.trim()
                    }
                  >
                    {isSubmittingComment
                      ? "Sending..."
                      : "Add comment"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <DashboardLayout>
      {({ searchQuery }) => (
        <HistoryContent
          searchQuery={searchQuery}
        />
      )}
    </DashboardLayout>
  );
}