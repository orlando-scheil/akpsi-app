// EventsCalendarView — Monthly calendar grid with event indicators and day detail panel.
// Used by EventsFeed on /events when the calendar view is active.
"use client";

import { useState, useMemo, type JSX } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventCard } from "./EventCard";
import { toLocalDateKey } from "@/lib/events";
import { theme } from "@/lib/theme";
import type { Event } from "@/types/event";

interface EventsCalendarViewProps {
  events: Event[];
  currentUserUid: string | null;
  isAdmin: boolean;
  onEdit: (event: Event) => void;
  onDelete: (id: string) => Promise<void>;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export function EventsCalendarView({
  events,
  currentUserUid,
  isAdmin,
  onEdit,
  onDelete,
}: EventsCalendarViewProps): JSX.Element {
  const today = new Date();

  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  // Store the selected Date directly to avoid string round-tripping for the label
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const selectedKey = selectedDate ? toLocalDateKey(selectedDate) : null;

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Map events to their local date keys
  const eventsByDate = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const ev of events) {
      const key = toLocalDateKey(ev.startDate);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    }
    return map;
  }, [events]);

  // Build grid cells: null = empty leading cell, number = day of month
  const cells = useMemo(() => {
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
    return Array.from({ length: totalCells }, (_, i) => {
      const d = i - firstWeekday + 1;
      return d >= 1 && d <= daysInMonth ? d : null;
    });
  }, [year, month]);

  function prevMonth(): void {
    setCurrentMonth(new Date(year, month - 1, 1));
    setSelectedDate(null);
  }

  function nextMonth(): void {
    setCurrentMonth(new Date(year, month + 1, 1));
    setSelectedDate(null);
  }

  function handleDayClick(day: number): void {
    const clicked = new Date(year, month, day);
    const clickedKey = toLocalDateKey(clicked);
    setSelectedDate((prev) =>
      prev && toLocalDateKey(prev) === clickedKey ? null : clicked
    );
  }

  const todayKey = toLocalDateKey(today);
  const selectedEvents = selectedKey ? (eventsByDate.get(selectedKey) ?? []) : [];

  const selectedLabel = selectedDate
    ? selectedDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          aria-label="Previous month"
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5"
          style={{ color: theme.textSecondary }}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <h2
          className="text-lg font-bold"
          style={{
            fontFamily: "var(--font-display, serif)",
            color: theme.textHeading,
          }}
        >
          {MONTHS[month]} {year}
        </h2>

        <button
          onClick={nextMonth}
          aria-label="Next month"
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5"
          style={{ color: theme.textSecondary }}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Calendar grid */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: `1px solid ${theme.border}` }}
      >
        {/* Weekday header */}
        <div className="grid grid-cols-7">
          {WEEKDAYS.map((wd) => (
            <div
              key={wd}
              className="py-2 text-center text-[10px] font-bold tracking-[0.14em] uppercase"
              style={{
                color: theme.textDim,
                borderBottom: `1px solid ${theme.border}`,
              }}
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${i}`}
                  className="min-h-[60px]"
                  style={{
                    background: theme.bgPage,
                    borderRight: (i + 1) % 7 !== 0 ? `1px solid ${theme.border}` : undefined,
                    borderBottom: i < cells.length - 7 ? `1px solid ${theme.border}` : undefined,
                  }}
                />
              );
            }

            const key = toLocalDateKey(new Date(year, month, day));
            const dayEvents = eventsByDate.get(key) ?? [];
            const isToday = key === todayKey;
            const isSelected = key === selectedKey;
            const hasDot = dayEvents.length > 0;
            const MAX_DOTS = 3;
            const dotCount = Math.min(dayEvents.length, MAX_DOTS);
            const overflow = dayEvents.length - MAX_DOTS;

            return (
              <button
                key={key}
                onClick={() => handleDayClick(day)}
                aria-label={`${day} ${MONTHS[month]}, ${dayEvents.length} event${dayEvents.length !== 1 ? "s" : ""}`}
                aria-current={isToday ? "date" : undefined}
                className="flex flex-col items-center pt-2 pb-1.5 gap-1 min-h-[60px] transition-colors focus-visible:outline-none"
                style={{
                  background: isSelected
                    ? theme.primary
                    : isToday
                    ? `${theme.primary}10`
                    : "transparent",
                  borderRight: (i + 1) % 7 !== 0 ? `1px solid ${theme.border}` : undefined,
                  borderBottom: i < cells.length - 7 ? `1px solid ${theme.border}` : undefined,
                  cursor: hasDot ? "pointer" : "default",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected)
                    (e.currentTarget as HTMLButtonElement).style.background = `${theme.primary}08`;
                }}
                onMouseLeave={(e) => {
                  if (!isSelected)
                    (e.currentTarget as HTMLButtonElement).style.background = isToday
                      ? `${theme.primary}10`
                      : "transparent";
                }}
              >
                <span
                  className="text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full"
                  style={{
                    color: isSelected ? "white" : isToday ? theme.primary : theme.textPrimary,
                    fontWeight: isToday ? 700 : 500,
                    background: isToday && !isSelected ? `${theme.primary}15` : "transparent",
                  }}
                >
                  {day}
                </span>

                {hasDot && (
                  <div className="flex items-center gap-0.5 flex-wrap justify-center px-1">
                    {Array.from({ length: dotCount }).map((_, di) => (
                      <span
                        key={di}
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{
                          background: isSelected ? "white" : theme.gold,
                        }}
                      />
                    ))}
                    {overflow > 0 && (
                      <span
                        className="text-[9px] leading-none"
                        style={{ color: isSelected ? "white" : theme.textDim }}
                      >
                        +{overflow}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day events */}
      {selectedKey && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <p
              className="text-[10px] font-bold tracking-[0.2em] uppercase"
              style={{ color: theme.primaryMuted }}
            >
              {selectedLabel}
            </p>
            <div className="flex-1 h-px" style={{ background: theme.border }} />
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              style={{ color: theme.textDim }}
              onClick={() => setSelectedDate(null)}
            >
              Close
            </Button>
          </div>

          {selectedEvents.length > 0 ? (
            <div className="flex flex-col gap-2">
              {selectedEvents.map((ev) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  currentUserUid={currentUserUid}
                  isAdmin={isAdmin}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  compact
                />
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: theme.textSecondary }}>
              No events on this day.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
