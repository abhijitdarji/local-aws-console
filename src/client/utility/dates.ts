
import { DateRangePickerProps } from '@cloudscape-design/components';
import { format, formatDistance } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export abstract class DateUtils {

    static LOG_TIMESTAMP_FORMAT = 'yyyy-MM-dd HH:mm:ss.SSS';
    static DATE_TIMESTAMP_FORMAT = 'yyyy-MM-dd HH:mm:ss';
    static DATE_TIME_FORMAT = 'MM/dd/yyyy HH:mm:ss';
    static UTC_TZ = 'Etc/UTC';

    static formatDate(date: number | Date) {
        if (!date) return null;
        return format(date, DateUtils.DATE_TIME_FORMAT);
    }

    /**
     * Format a date as a string in the time zone with the given format string
    */
    static formatDateAsTz(date: number | Date, formatString: string, timeZone: string) {
        if (!date) return null;
        return formatInTimeZone(date, timeZone, formatString);
    }

    /**
     * Format a date as a string in local time zone with the given format string
    */
    static formatDateAs(date: number | Date, formatString: string) {
        if (!date) return null;
        return format(date, formatString);
    }

    static formatDateAgo(date: string | number | Date) {
        if (!date) return null;
        return formatDistance(new Date(date), new Date(), { addSuffix: true });
    }

    static fomatTimestamp(timestamp: number) {
        if (!timestamp) return null;
        return format(new Date(timestamp), DateUtils.DATE_TIMESTAMP_FORMAT);
    }

    static formatDateAsWords(seconds: number) {
        if (!seconds) return null;
        const date = new Date(Date.now() - seconds * 1000);
        return formatDistance(date, new Date(), { addSuffix: false });
    }

    static getLocalTimeZone() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    static calculateStartAndEndTimes(dateRange: DateRangePickerProps.Value) {
        const now = new Date();
        const defaultStartAndEnd = { startTime: null, endTime: null };

        if (!dateRange) {
            return defaultStartAndEnd;
        }

        switch (dateRange.type) {
            case 'relative':
                const { amount, unit } = dateRange;
                const multiplers: { [key: string]: number } = {
                    second: 1,
                    minute: 60,
                    hour: 60 * 60,
                    day: 60 * 60 * 24,
                    week: 60 * 60 * 24 * 7,
                    month: 60 * 60 * 24 * 30,
                    year: 60 * 60 * 24 * 365
                }
                const currentMultiplier: number = multiplers[unit];
                const start = new Date(now.getTime() - amount * currentMultiplier * 1000);
                return { startTime: Number(start), endTime: Number(now) };
            case 'absolute':
                const { startDate, endDate } = dateRange;
                return { startTime: Number(new Date(startDate)), endTime: Number(new Date(endDate)) };
            default:
                return defaultStartAndEnd;
        }
    }
}