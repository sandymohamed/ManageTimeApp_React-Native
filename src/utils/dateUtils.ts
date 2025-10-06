import {format, parseISO, isValid, addDays, subDays, startOfDay, endOfDay} from 'date-fns';

export const formatDate = (date: string | Date, formatStr: string = 'MMM dd, yyyy'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return 'Invalid Date';
    }
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

export const formatTime = (date: string | Date, formatStr: string = 'HH:mm'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return 'Invalid Time';
    }
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid Time';
  }
};

export const formatDateTime = (date: string | Date, formatStr: string = 'MMM dd, yyyy HH:mm'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return 'Invalid Date';
    }
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'Invalid Date';
  }
};

export const isToday = (date: string | Date): boolean => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return false;
    }
    const today = new Date();
    return startOfDay(dateObj).getTime() === startOfDay(today).getTime();
  } catch (error) {
    console.error('Error checking if date is today:', error);
    return false;
  }
};

export const isTomorrow = (date: string | Date): boolean => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return false;
    }
    const tomorrow = addDays(new Date(), 1);
    return startOfDay(dateObj).getTime() === startOfDay(tomorrow).getTime();
  } catch (error) {
    console.error('Error checking if date is tomorrow:', error);
    return false;
  }
};

export const isOverdue = (date: string | Date): boolean => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return false;
    }
    return dateObj < new Date();
  } catch (error) {
    console.error('Error checking if date is overdue:', error);
    return false;
  }
};

export const getRelativeTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return 'Invalid Date';
    }

    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else if (diffInMinutes < 10080) {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d ago`;
    } else {
      return formatDate(dateObj);
    }
  } catch (error) {
    console.error('Error getting relative time:', error);
    return 'Invalid Date';
  }
};

export const getTimeUntil = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return 'Invalid Date';
    }

    const now = new Date();
    const diffInMinutes = Math.floor((dateObj.getTime() - now.getTime()) / (1000 * 60));

    if (diffInMinutes < 0) {
      return 'Overdue';
    } else if (diffInMinutes < 1) {
      return 'Due now';
    } else if (diffInMinutes < 60) {
      return `In ${diffInMinutes}m`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `In ${hours}h`;
    } else if (diffInMinutes < 10080) {
      const days = Math.floor(diffInMinutes / 1440);
      return `In ${days}d`;
    } else {
      return formatDate(dateObj);
    }
  } catch (error) {
    console.error('Error getting time until:', error);
    return 'Invalid Date';
  }
};

export const getDateRange = (startDate: string | Date, endDate: string | Date): string => {
  try {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;

    if (!isValid(start) || !isValid(end)) {
      return 'Invalid Date Range';
    }

    const startFormatted = format(start, 'MMM dd');
    const endFormatted = format(end, 'MMM dd, yyyy');

    if (start.getFullYear() === end.getFullYear()) {
      return `${startFormatted} - ${endFormatted}`;
    } else {
      return `${format(start, 'MMM dd, yyyy')} - ${endFormatted}`;
    }
  } catch (error) {
    console.error('Error formatting date range:', error);
    return 'Invalid Date Range';
  }
};
