import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

// Storage keys
export const STORAGE_KEYS = {
  SELECTED_LANGUAGE: 'selectedLanguage',
  THEME_MODE: 'themeMode',
} as const;

// Language utilities
export const getSavedLanguage = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_LANGUAGE);
  } catch (error) {
    console.error('Error getting saved language:', error);
    return null;
  }
};

export const saveLanguage = async (language: string): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_LANGUAGE, language);
    return true;
  } catch (error) {
    console.error('Error saving language:', error);
    return false;
  }
};

// Theme utilities
export const getSavedTheme = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE);
  } catch (error) {
    console.error('Error getting saved theme:', error);
    return null;
  }
};

export const saveTheme = async (theme: string): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, theme);
    return true;
  } catch (error) {
    console.error('Error saving theme:', error);
    return false;
  }
};

// Clear all preferences (for testing)
export const clearAllPreferences = async (): Promise<boolean> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.SELECTED_LANGUAGE,
      STORAGE_KEYS.THEME_MODE,
    ]);
    return true;
  } catch (error) {
    console.error('Error clearing preferences:', error);
    return false;
  }
};

// Get all preferences (for debugging)
export const getAllPreferences = async (): Promise<Record<string, string | null>> => {
  try {
    const [language, theme] = await AsyncStorage.multiGet([
      STORAGE_KEYS.SELECTED_LANGUAGE,
      STORAGE_KEYS.THEME_MODE,
    ]);
    
    return {
      language: language[1],
      theme: theme[1],
    };
  } catch (error) {
    console.error('Error getting all preferences:', error);
    return {
      language: null,
      theme: null,
    };
  }
};
