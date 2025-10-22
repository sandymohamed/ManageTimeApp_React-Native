import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { I18nManager } from 'react-native';
import i18n, { isRTL } from '../i18n';
import { getSavedLanguage, saveLanguage } from '../utils/preferences';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (language: string) => Promise<void>;
  isRTL: boolean;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [isRTLMode, setIsRTLMode] = useState(isRTL(currentLanguage));
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language preference on app start
  useEffect(() => {
    const loadLanguagePreference = async () => {
      try {
        const savedLanguage = await getSavedLanguage();
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ar')) {
          await i18n.changeLanguage(savedLanguage);
          setCurrentLanguage(savedLanguage);
          setIsRTLMode(isRTL(savedLanguage));
          
          // Update RTL layout
          I18nManager.allowRTL(isRTL(savedLanguage));
          I18nManager.forceRTL(isRTL(savedLanguage));
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguagePreference();
  }, []);

  const changeLanguage = async (language: string) => {
    try {
      await i18n.changeLanguage(language);
      setCurrentLanguage(language);
      setIsRTLMode(isRTL(language));
      
      // Save language preference to AsyncStorage
      await saveLanguage(language);
      
      // Update RTL layout
      I18nManager.allowRTL(isRTL(language));
      I18nManager.forceRTL(isRTL(language));
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  useEffect(() => {
    // Listen for language changes
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
      setIsRTLMode(isRTL(lng));
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  const value: LanguageContextType = {
    currentLanguage,
    changeLanguage,
    isRTL: isRTLMode,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
