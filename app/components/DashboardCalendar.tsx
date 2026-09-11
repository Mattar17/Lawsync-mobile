import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Task } from "../api/tasks";
import { CaseT } from "../types";

export const ARABIC_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export const ARABIC_DAYS_SHORT = [
  "أحد",
  "إثنين",
  "ثلاثاء",
  "أربعاء",
  "خميس",
  "جمعة",
  "سبت",
];

const WEEKDAYS = [
  "السبت",
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
];

interface DashboardCalendarProps {
  tasks?: Task[];
  cases?: CaseT[];
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
}

export const isSameDay = (
  dateStr: string | null | undefined,
  target: Date,
): boolean => {
  if (!dateStr) return false;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    return (
      target.getFullYear() === year &&
      target.getMonth() === month &&
      target.getDate() === day
    );
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === target.getFullYear() &&
    d.getMonth() === target.getMonth() &&
    d.getDate() === target.getDate()
  );
};

export const parseEventDate = (
  dateStr: string | null | undefined,
): Date | null => {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    return new Date(year, month, day);
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

export const formatSelectedDateText = (date: Date) => {
  const weekday = ARABIC_DAYS_SHORT[date.getDay()];
  const day = date.getDate();
  const monthName = ARABIC_MONTHS[date.getMonth()];
  return `جدول أعمال ${weekday}، ${day} ${monthName}`;
};

export const formatDueDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "";
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const date = new Date(year, month, day);
    return date.toLocaleDateString("ar-EG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};


export default function DashboardCalendar({
  tasks = [],
  cases = [],
  selectedDate,
  onSelectDate,
}: DashboardCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [dismissedEventId, setDismissedEventId] = useState<string | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  // Find nearest upcoming event (task due_date or case next_court_session_date)
  const nearestEvent = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();

    const events: {
      id: string;
      type: "task" | "case";
      title: string;
      date: Date;
      time: number;
      rawDateStr: string;
    }[] = [];

    // Tasks
    tasks.forEach((task) => {
      if (!task.due_date) return;
      const d = parseEventDate(task.due_date);
      if (d) {
        events.push({
          id: `task-${task.id}`,
          type: "task",
          title: task.title,
          date: d,
          time: d.getTime(),
          rawDateStr: task.due_date,
        });
      }
    });

    // Cases (next court session)
    cases.forEach((c) => {
      if (!c.next_court_session_date) return;
      const d = parseEventDate(c.next_court_session_date);
      if (d) {
        events.push({
          id: `case-${c.id || c.case_number}`,
          type: "case",
          title: c.title || `جلسة قضية ${c.case_number}`,
          date: d,
          time: d.getTime(),
          rawDateStr: c.next_court_session_date,
        });
      }
    });

    if (events.length === 0) return null;

    // Filter to events that are today or in the future
    const upcoming = events.filter((e) => e.time >= startOfToday);
    if (upcoming.length > 0) {
      upcoming.sort((a, b) => a.time - b.time);
      return upcoming[0];
    }

    // Fallback: closest past event if none in the future
    events.sort(
      (a, b) =>
        Math.abs(a.time - startOfToday) - Math.abs(b.time - startOfToday),
    );
    return events[0];
  }, [tasks, cases]);

  const isTooltipVisible =
    nearestEvent !== null && dismissedEventId !== nearestEvent.id;

  // Build 7-column grid starting with Saturday (السبت)
  const weeks = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // JS getDay(): 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
    // Saturday index = (getDay() + 1) % 7
    const firstDayIndex = (firstDayOfMonth.getDay() + 1) % 7;

    const rows: (number | null)[][] = [];
    let currentRow: (number | null)[] = [];

    // Empty cells before day 1
    for (let i = 0; i < firstDayIndex; i++) {
      currentRow.push(null);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      currentRow.push(day);
      if (currentRow.length === 7) {
        rows.push(currentRow);
        currentRow = [];
      }
    }

    // Empty cells after last day
    if (currentRow.length > 0) {
      while (currentRow.length < 7) {
        currentRow.push(null);
      }
      rows.push(currentRow);
    }

    return rows;
  }, [year, month]);

  return (
    <View style={styles.card}>
      {/* Header: Nav arrows on left, Month/Year badge on right */}
      <View style={styles.header}>
        <View style={styles.navGroup}>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={goToPrevMonth}
            accessibilityLabel="الشهر السابق"
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={17} color="#0e2038" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={goToNextMonth}
            accessibilityLabel="الشهر التالي"
            activeOpacity={0.7}
          >
            <Feather name="chevron-right" size={17} color="#0e2038" />
          </TouchableOpacity>
        </View>

        <View style={styles.monthBadge}>
          <Feather name="calendar" size={15} color="#ffffff" />
          <Text style={styles.monthBadgeText}>
            {ARABIC_MONTHS[month]} {year}
          </Text>
        </View>
      </View>

      {/* Weekdays Row */}
      <View style={styles.weekdaysRow}>
        {WEEKDAYS.map((name) => (
          <View key={name} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{name}</Text>
          </View>
        ))}
      </View>

      {/* Days Grid */}
      <View style={styles.grid}>
        {weeks.map((week, wIdx) => {
          // Check if this week contains the nearest event tooltip to boost its zIndex
          const weekHasNearestEvent =
            isTooltipVisible &&
            nearestEvent &&
            week.some((day) => {
              if (day === null) return false;
              const cellDate = new Date(year, month, day);
              return isSameDay(nearestEvent.rawDateStr, cellDate);
            });

          return (
            <View
              key={wIdx}
              style={[
                styles.weekRow,
                weekHasNearestEvent && styles.weekRowActive,
              ]}
            >
              {week.map((day, dIdx) => {
                if (day === null) {
                  return <View key={dIdx} style={styles.dayCell} />;
                }

                const cellDate = new Date(year, month, day);

                const isSelectedCell =
                  selectedDate !== null &&
                  selectedDate.getFullYear() === year &&
                  selectedDate.getMonth() === month &&
                  selectedDate.getDate() === day;

                const isNearest =
                  isTooltipVisible &&
                  nearestEvent !== null &&
                  isSameDay(nearestEvent.rawDateStr, cellDate);

                // Any coming task or court session
                const hasTask = tasks.some((t) =>
                  isSameDay(t.due_date, cellDate),
                );
                const hasCourtSession = cases.some((c) =>
                  isSameDay(c.next_court_session_date, cellDate),
                );
                const hasEvent = hasTask || hasCourtSession;

                return (
                  <TouchableOpacity
                    key={dIdx}
                    style={[styles.dayCell, isNearest && styles.nearestDayCell]}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (isSelectedCell) {
                        onSelectDate(null);
                      } else {
                        onSelectDate(cellDate);
                      }
                    }}
                  >
                    {/* Tooltip for the nearest due date / court session */}
                    {isNearest && (
                      <View
                        style={[
                          styles.tooltipContainer,
                          dIdx === 0
                            ? styles.tooltipAlignRight
                            : dIdx === 1
                              ? styles.tooltipAlignRightNear
                              : dIdx === 5
                                ? styles.tooltipAlignLeftNear
                                : dIdx === 6
                                  ? styles.tooltipAlignLeft
                                  : styles.tooltipAlignCenter,
                        ]}
                      >
                        <View style={styles.tooltipBubble}>
                          {/* Header: Close button & Tag */}
                          <View style={styles.tooltipHeader}>
                            <TouchableOpacity
                              style={styles.tooltipCloseBtn}
                              onPress={(e) => {
                                e.stopPropagation?.();
                                setDismissedEventId(nearestEvent.id);
                              }}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              activeOpacity={0.7}
                              accessibilityLabel="إغلاق التلميح"
                            >
                              <Feather name="x" size={11} color="#94a3b8" />
                            </TouchableOpacity>

                            <View style={styles.tooltipTypeRow}>
                              <Feather
                                name={
                                  nearestEvent.type === "case"
                                    ? "briefcase"
                                    : "check-square"
                                }
                                size={11}
                                color="#b89355"
                              />
                            </View>
                          </View>

                          {/* Full Title without truncation */}
                          <Text style={styles.tooltipTitleText}>
                            {nearestEvent.title}
                          </Text>
                        </View>

                        {/* Downward pointer arrow */}
                        <View
                          style={[
                            styles.tooltipArrow,
                            dIdx === 0
                              ? styles.tooltipArrowRight
                              : dIdx === 1
                                ? styles.tooltipArrowRightNear
                                : dIdx === 5
                                  ? styles.tooltipArrowLeftNear
                                  : dIdx === 6
                                    ? styles.tooltipArrowLeft
                                    : null,
                          ]}
                        />
                      </View>
                    )}

                    <View
                      style={[
                        styles.dayCircle,
                        isSelectedCell && styles.selectedCircle,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayNumber,
                          isSelectedCell && styles.selectedText,
                        ]}
                      >
                        {day}
                      </Text>
                    </View>

                    {/* Keep current style of dots under date for other coming court sessions & tasks */}
                    {!isNearest && hasEvent && !isSelectedCell && (
                      <View style={styles.taskDot} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    shadowColor: "#0d1b2a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#eef1f5",
    overflow: "visible",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  navGroup: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  navBtn: {
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  monthBadge: {
    alignItems: "center",
    backgroundColor: "#b89355",
    borderRadius: 8,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  monthBadgeText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  weekdaysRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  weekdayCell: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  weekdayText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "500",
  },
  grid: {
    gap: 12,
    overflow: "visible",
  },
  weekRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    overflow: "visible",
    position: "relative",
    zIndex: 1,
  },
  weekRowActive: {
    zIndex: 100,
  },
  dayCell: {
    alignItems: "center",
    flex: 1,
    height: 36,
    justifyContent: "center",
    position: "relative",
    overflow: "visible",
  },
  nearestDayCell: {
    zIndex: 101,
  },
  dayCircle: {
    alignItems: "center",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  selectedCircle: {
    backgroundColor: "#b89355",
  },
  dayNumber: {
    color: "#1e293b",
    fontSize: 14,
    fontWeight: "500",
  },
  selectedText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  taskDot: {
    backgroundColor: "#b89355",
    borderRadius: 2,
    bottom: 2,
    height: 4,
    position: "absolute",
    width: 4,
  },
  /* Tooltip styles */
  tooltipContainer: {
    bottom: 40,
    maxWidth: 220,
    minWidth: 150,
    position: "absolute",
    zIndex: 999,
  },
  tooltipAlignCenter: {
    alignItems: "center",
    alignSelf: "center",
  },
  tooltipAlignRight: {
    alignItems: "flex-end",
    right: -8,
  },
  tooltipAlignRightNear: {
    alignItems: "flex-end",
    right: -32,
  },
  tooltipAlignLeftNear: {
    alignItems: "flex-start",
    left: -32,
  },
  tooltipAlignLeft: {
    alignItems: "flex-start",
    left: -8,
  },
  tooltipBubble: {
    backgroundColor: "#0d1b2a",
    borderColor: "#203a5c",
    borderRadius: 12,
    borderWidth: 1,
    elevation: 10,
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    width: "100%",
  },
  tooltipHeader: {
    alignItems: "center",
    borderBottomColor: "#1d2e45",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 5,
  },
  tooltipCloseBtn: {
    alignItems: "center",
    backgroundColor: "#162840",
    borderRadius: 10,
    height: 20,
    justifyContent: "center",
    width: 20,
  },
  tooltipTypeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },
  tooltipTypeTag: {
    color: "#b89355",
    fontSize: 11,
    fontWeight: "700",
  },
  tooltipTitleText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    textAlign: "right",
  },
  tooltipArrow: {
    alignSelf: "center",
    backgroundColor: "transparent",
    borderLeftColor: "transparent",
    borderLeftWidth: 5,
    borderRightColor: "transparent",
    borderRightWidth: 5,
    borderStyle: "solid",
    borderTopColor: "#0d1b2a",
    borderTopWidth: 6,
    height: 0,
    marginTop: -1,
    width: 0,
  },
  tooltipArrowRight: {
    alignSelf: "flex-end",
    marginRight: 18,
  },
  tooltipArrowRightNear: {
    alignSelf: "flex-end",
    marginRight: 42,
  },
  tooltipArrowLeftNear: {
    alignSelf: "flex-start",
    marginLeft: 42,
  },
  tooltipArrowLeft: {
    alignSelf: "flex-start",
    marginLeft: 18,
  },
});
