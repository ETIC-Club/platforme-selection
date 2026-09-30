"use client";

import React from "react";
import Link from "next/link";
import { ClockIcon, ArrowRightIcon } from "./Icons";
import styles from "./dashboard.module.css";

export interface EventItem {
  id: number;
  name: string;
  category: string;
  dateSubtitle: string;
  requiredParticipants: number;
  selectedParticipants: number;
  deadlineDate: string;
  gradientIndex?: number;
}

interface EventCardProps {
  event: EventItem;
}

export function EventCard({ event }: EventCardProps) {
  const percentage = Math.min(
    100,
    Math.round((event.selectedParticipants / (event.requiredParticipants || 1)) * 100)
  );

  const remaining = Math.max(0, event.requiredParticipants - event.selectedParticipants);

  // Derive initial abbreviation from event name
  const initials = event.name
    .split(" ")
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <article className={styles.eventCard}>
      <div className={styles.cardLeft}>
        <div
          className={`${styles.eventThumbnail} ${
            (event.gradientIndex ?? 0) % 2 === 1 ? styles.eventThumbnailAlt : ""
          }`}
        >
          {initials}
        </div>

        <div className={styles.eventInfo}>
          <h2 className={styles.eventTitle}>{event.name}</h2>
          <p className={styles.eventSubtitle}>
            {event.category.toUpperCase()} - {event.dateSubtitle}
          </p>
          <span className={styles.eventQuota}>
            {event.requiredParticipants} required
          </span>
        </div>
      </div>

      <div className={styles.cardProgress}>
        <div className={styles.progressCounts}>
          <span className={styles.selectedCount}>
            {event.selectedParticipants} Selected
          </span>
          <span className={styles.remainingCount}>{remaining} Remaining</span>
        </div>

        <div className={styles.progressBarTrack}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className={styles.percentageLabel}>{percentage}%</div>
      </div>

      <div className={styles.cardRight}>
        <div className={styles.deadlineContainer}>
          <ClockIcon className={styles.deadlineIcon} />
          <span>{event.deadlineDate}</span>
        </div>

        <Link
          href={`/events/${event.id}`}
          className={styles.arrowButton}
          aria-label={`View details for ${event.name}`}
        >
          <ArrowRightIcon />
        </Link>
      </div>
    </article>
  );
}
