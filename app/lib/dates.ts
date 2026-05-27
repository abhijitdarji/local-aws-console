import type { DateRangePickerProps } from '@cloudscape-design/components';
import { tz } from '@date-fns/tz';
import { format, formatDistance } from 'date-fns';

export abstract class DateUtils {
  static readonly LOG_TIMESTAMP_FORMAT = 'yyyy-MM-dd HH:mm:ss.SSS';
  static readonly DATE_TIMESTAMP_FORMAT = 'yyyy-MM-dd HH:mm:ss';
  static readonly DATE_TIME_FORMAT = 'MM/dd/yyyy HH:mm:ss';
  static readonly UTC_TZ = 'Etc/UTC';

  static formatDate(date: number | Date): string | null {
    if (!date) return null;
    return format(date, DateUtils.DATE_TIME_FORMAT);
  }

  static formatDateAsTz(
    date: number | Date,
    formatString: string,
    timeZone: string,
  ): string | null {
    if (!date) return null;
    return format(date, formatString, { in: tz(timeZone) });
  }

  static formatDateAs(date: number | Date, formatString: string): string | null {
    if (!date) return null;
    return format(date, formatString);
  }

  static formatDateAgo(date: string | number | Date): string | null {
    if (!date) return null;
    return formatDistance(new Date(date), new Date(), { addSuffix: true });
  }

  static fomatTimestamp(timestamp: number): string | null {
    if (!timestamp) return null;
    return format(new Date(timestamp), DateUtils.DATE_TIMESTAMP_FORMAT);
  }

  static formatDateAsWords(seconds: number): string | null {
    if (!seconds) return null;
    const date = new Date(Date.now() - seconds * 1000);
    return formatDistance(date, new Date(), { addSuffix: false });
  }

  static getLocalTimeZone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  static calculateStartAndEndTimes(dateRange: DateRangePickerProps.Value): {
    startTime: number | null;
    endTime: number | null;
  } {
    const now = new Date();
    const defaultStartAndEnd = { startTime: null, endTime: null };

    if (!dateRange) return defaultStartAndEnd;

    switch (dateRange.type) {
      case 'relative': {
        const { amount, unit } = dateRange;
        const multipliers: Record<string, number> = {
          second: 1,
          minute: 60,
          hour: 60 * 60,
          day: 60 * 60 * 24,
          week: 60 * 60 * 24 * 7,
          month: 60 * 60 * 24 * 30,
          year: 60 * 60 * 24 * 365,
        };
        const multiplier = multipliers[unit] ?? 1;
        const start = new Date(now.getTime() - amount * multiplier * 1000);
        return { startTime: Number(start), endTime: Number(now) };
      }
      case 'absolute': {
        const { startDate, endDate } = dateRange;
        return {
          startTime: Number(new Date(startDate)),
          endTime: Number(new Date(endDate)),
        };
      }
      default:
        return defaultStartAndEnd;
    }
  }
}
