import { useTranslation } from 'react-i18next';

// Day of week mapping (0 = Sunday, 1 = Monday, etc.)
const DAY_OF_WEEK_MAP = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
} as const;

// Hook to get translated day names
export const useDayTranslations = () => {
  const { t } = useTranslation();

  const getDayName = (date: Date, format: 'short' | 'full' = 'short'): string => {
    const dayOfWeek = date.getDay();
    const dayKey = DAY_OF_WEEK_MAP[dayOfWeek as keyof typeof DAY_OF_WEEK_MAP];
    const translationKey = format === 'full' ? `${dayKey}Full` : dayKey;
    return t(`days.${translationKey}`);
  };

  const getWeekDayNames = (format: 'short' | 'full' = 'short'): string[] => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.map(day => {
      const translationKey = format === 'full' ? `${day}Full` : day;
      return t(`days.${translationKey}`);
    });
  };

  return {
    getDayName,
    getWeekDayNames,
  };
};

// Utility function for getting day name without hook (for use outside components)
export const getTranslatedDayName = (date: Date, t: (key: string) => string, format: 'short' | 'full' = 'short'): string => {
  const dayOfWeek = date.getDay();
  const dayKey = DAY_OF_WEEK_MAP[dayOfWeek as keyof typeof DAY_OF_WEEK_MAP];
  const translationKey = format === 'full' ? `${dayKey}Full` : dayKey;
  return t(`days.${translationKey}`);
};
