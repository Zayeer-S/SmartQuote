import { SMARTQUOTE_CONFIG_KEYS } from '../../../shared/constants/lookup-values.js';
import type { SmartQuoteConfigsDAO } from '../../daos/children/smartquote-configs-domain.dao.js';
import type { SpecialWorkingDaysDAO } from '../../daos/children/smartquote-configs-domain.dao.js';

/** Parsed working-hours window for a single calendar day. */
interface DayWindow {
  /** Inclusive start, minutes from midnight. e.g. 09:00 = 540 */
  startMinutes: number;
  /** Exclusive end, minutes from midnight. e.g. 17:00 = 1020 */
  endMinutes: number;
  /** True when the entire day is a non-working holiday. */
  isHoliday: boolean;
}

const MINUTES_PER_HOUR = 60;

/** Parse "HH:MM" string to minutes from midnight. */
function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return (h ?? 0) * MINUTES_PER_HOUR + (m ?? 0);
}

/** Zero-pad number to 2 digits. */
function pad2(n: number): string {
  return n < 10 ? `0${String(n)}` : String(n);
}

/** Format a Date to a YYYY-MM-DD string in local time. */
function toDateString(d: Date): string {
  return `${String(d.getFullYear())}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * Business-hours-aware SLA deadline calculator.
 *
 * Advances a start timestamp by a given number of working hours, respecting:
 *   - Configurable day start/end times (DEFAULT_DAY_START_TIME / DEFAULT_DAY_END_TIME)
 *   - SpecialWorkingDays overrides (holidays skip the entire day; custom windows
 *     override the default start/end for that date)
 *   - Weekends (Saturday = 6, Sunday = 0) are always non-working
 *
 * Working hours are walked in minute-resolution increments to keep the
 * implementation straightforward and correct across DST boundaries.
 */
export class SlaBreachService {
  private configsDAO: SmartQuoteConfigsDAO;
  private specialDaysDAO: SpecialWorkingDaysDAO;

  constructor(configsDAO: SmartQuoteConfigsDAO, specialDaysDAO: SpecialWorkingDaysDAO) {
    this.configsDAO = configsDAO;
    this.specialDaysDAO = specialDaysDAO;
  }

  /**
   * Compute the SLA response deadline from a given start time.
   *
   * @param from Ticket creation timestamp (UTC Date)
   * @param responseTimeHours SLA response time in hours (from the matched severity target)
   * @param options Optional transaction context
   * @returns Date representing the end of the SLA response window
   */
  async computeDeadline(from: Date, responseTimeHours: number): Promise<Date> {
    const defaultStart = await this.configsDAO.getValue(
      SMARTQUOTE_CONFIG_KEYS.DEFAULT_DAY_START_TIME
    );
    const defaultEnd = await this.configsDAO.getValue(SMARTQUOTE_CONFIG_KEYS.DEFAULT_DAY_END_TIME);

    // Fall back to constants if config rows are absent
    const defaultStartMinutes = parseTime(defaultStart ?? '09:00');
    const defaultEndMinutes = parseTime(defaultEnd ?? '17:00');

    // Pre-fetch special working days for a generous window (from to from + 30 days)
    // to avoid per-day DB queries inside the walk loop.
    const windowEnd = new Date(from.getTime() + 30 * 24 * 60 * 60 * 1000);
    const specialDays = await this.specialDaysDAO.findInRange(
      toDateString(from),
      toDateString(windowEnd)
    );

    const specialDayMap = new Map(specialDays.map((d) => [d.date, d]));

    let remaining = responseTimeHours * MINUTES_PER_HOUR;
    let cursor = new Date(from.getTime());

    // Cap the walk at 365 days of wall-clock time to prevent an infinite loop
    // if config is misconfigured (e.g. 0-length working day).
    const hardStop = new Date(from.getTime() + 365 * 24 * 60 * 60 * 1000);

    while (remaining > 0 && cursor < hardStop) {
      const window = this.getDayWindow(
        cursor,
        specialDayMap,
        defaultStartMinutes,
        defaultEndMinutes
      );

      if (window.isHoliday || window.startMinutes >= window.endMinutes) {
        // Non-working day -- skip to start of next calendar day
        cursor = this.advanceToNextDay(cursor);
        continue;
      }

      const cursorMinutes = cursor.getHours() * MINUTES_PER_HOUR + cursor.getMinutes();

      if (cursorMinutes >= window.endMinutes) {
        // Already past end of working day -- skip to start of next day
        cursor = this.advanceToNextDay(cursor);
        continue;
      }

      // Snap cursor forward to day start if before working hours
      const effectiveStart = Math.max(cursorMinutes, window.startMinutes);
      if (effectiveStart > cursorMinutes) {
        cursor = new Date(cursor.getTime() + (effectiveStart - cursorMinutes) * 60 * 1000);
      }

      // Working minutes available in the rest of this day
      const availableToday = window.endMinutes - effectiveStart;

      if (remaining <= availableToday) {
        // Deadline falls within this working day
        cursor = new Date(cursor.getTime() + remaining * 60 * 1000);
        remaining = 0;
      } else {
        // Consume the rest of today and continue
        remaining -= availableToday;
        cursor = this.advanceToNextDay(cursor);
      }
    }

    return cursor;
  }

  /** Build the working-hours window for the calendar day containing `d`. */
  private getDayWindow(
    d: Date,
    specialDayMap: Map<
      string,
      { date: string; start_time: string | null; end_time: string | null; is_holiday: boolean }
    >,
    defaultStart: number,
    defaultEnd: number
  ): DayWindow {
    const dateStr = toDateString(d);
    const dayOfWeek = d.getDay(); // 0 = Sunday, 6 = Saturday

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { startMinutes: defaultStart, endMinutes: defaultEnd, isHoliday: true };
    }

    const special = specialDayMap.get(dateStr);
    if (!special) {
      return { startMinutes: defaultStart, endMinutes: defaultEnd, isHoliday: false };
    }

    if (special.is_holiday) {
      return { startMinutes: defaultStart, endMinutes: defaultEnd, isHoliday: true };
    }

    return {
      startMinutes: special.start_time ? parseTime(special.start_time) : defaultStart,
      endMinutes: special.end_time ? parseTime(special.end_time) : defaultEnd,
      isHoliday: false,
    };
  }

  /** Advance cursor to midnight of the next calendar day, then return. */
  private advanceToNextDay(d: Date): Date {
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
    return next;
  }
}
