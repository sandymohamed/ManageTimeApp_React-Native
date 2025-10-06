// import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import { useColorScheme, Appearance } from 'react-native';
// import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { getRTLStyle } from '@/utils/rtl';

// export type ThemeMode = 'light' | 'dark' | 'system';

// interface ThemeContextType {
//   themeMode: ThemeMode;
//   isDark: boolean;
//   theme: any;
//   toggleTheme: () => void;
//   setThemeMode: (mode: ThemeMode) => void;
// }

// const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// interface ThemeProviderProps {
//   children: ReactNode;
// }

// // Custom font configuration
// const fontConfig = {
//   fontFamily: 'System',
//   fontWeight: '400' as const,
//   fontSize: 16,
//   lineHeight: 24,
//   letterSpacing: 0.5,
// };

// // Light Theme Colors
// const lightColors = {
//   primary: '#6750A4',
//   onPrimary: '#FFFFFF',
//   primaryContainer: '#EADDFF',
//   onPrimaryContainer: '#21005D',
//   secondary: '#625B71',
//   onSecondary: '#FFFFFF',
//   secondaryContainer: '#E8DEF8',
//   onSecondaryContainer: '#1D192B',
//   tertiary: '#7D5260',
//   onTertiary: '#FFFFFF',
//   tertiaryContainer: '#FFD8E4',
//   onTertiaryContainer: '#31111D',
//   error: '#BA1A1A',
//   onError: '#FFFFFF',
//   errorContainer: '#FFDAD6',
//   onErrorContainer: '#410002',
//   background: '#FFFBFE',
//   onBackground: '#1C1B1F',
//   surface: '#FFFBFE',
//   onSurface: '#1C1B1F',
//   surfaceVariant: '#E7E0EC',
//   onSurfaceVariant: '#49454F',
//   outline: '#79747E',
//   outlineVariant: '#CAC4D0',
//   shadow: '#000000',
//   scrim: '#000000',
//   inverseSurface: '#313033',
//   onInverseSurface: '#F4EFF4',
//   inversePrimary: '#D0BCFF',
//   surfaceDisabled: '#1C1B1F1F',
//   onSurfaceDisabled: '#1C1B1F61',
//   backdrop: '#79747E80',
//   // Custom colors
//   success: '#4CAF50',
//   onSuccess: '#FFFFFF',
//   successContainer: '#C8E6C9',
//   onSuccessContainer: '#1B5E20',
//   warning: '#FF9800',
//   onWarning: '#FFFFFF',
//   warningContainer: '#FFE0B2',
//   onWarningContainer: '#E65100',
//   info: '#2196F3',
//   onInfo: '#FFFFFF',
//   infoContainer: '#BBDEFB',
//   onInfoContainer: '#0D47A1',
//   // Text colors
//   text: '#1C1B1F',
//   textSecondary: '#49454F',
//   textDisabled: '#79747E',
//   textInverse: '#F4EFF4',
//   // Border colors
//   border: '#E7E0EC',
//   borderLight: '#F3F0F4',
//   borderDark: '#CAC4D0',
//   // Status colors
//   pending: '#FF9800',
//   completed: '#4CAF50',
//   cancelled: '#F44336',
//   inProgress: '#2196F3',
//   // Priority colors
//   low: '#4CAF50',
//   medium: '#FF9800',
//   high: '#FF5722',
//   urgent: '#F44336',
// };

// // Dark Theme Colors
// const darkColors = {
//   primary: '#D0BCFF',
//   onPrimary: '#381E72',
//   primaryContainer: '#4F378B',
//   onPrimaryContainer: '#EADDFF',
//   secondary: '#CCC2DC',
//   onSecondary: '#332D41',
//   secondaryContainer: '#4A4458',
//   onSecondaryContainer: '#E8DEF8',
//   tertiary: '#EFB8C8',
//   onTertiary: '#492532',
//   tertiaryContainer: '#633B48',
//   onTertiaryContainer: '#FFD8E4',
//   error: '#FFB4AB',
//   onError: '#690005',
//   errorContainer: '#93000A',
//   onErrorContainer: '#FFDAD6',
//   background: '#1C1B1F',
//   onBackground: '#E6E1E5',
//   surface: '#1C1B1F',
//   onSurface: '#E6E1E5',
//   surfaceVariant: '#49454F',
//   onSurfaceVariant: '#CAC4D0',
//   outline: '#938F99',
//   outlineVariant: '#49454F',
//   shadow: '#000000',
//   scrim: '#000000',
//   inverseSurface: '#E6E1E5',
//   onInverseSurface: '#313033',
//   inversePrimary: '#6750A4',
//   surfaceDisabled: '#E6E1E51F',
//   onSurfaceDisabled: '#E6E1E561',
//   backdrop: '#79747E80',
//   // Custom colors
//   success: '#81C784',
//   onSuccess: '#1B5E20',
//   successContainer: '#2E7D32',
//   onSuccessContainer: '#C8E6C9',
//   warning: '#FFB74D',
//   onWarning: '#E65100',
//   warningContainer: '#F57C00',
//   onWarningContainer: '#FFE0B2',
//   info: '#64B5F6',
//   onInfo: '#0D47A1',
//   infoContainer: '#1976D2',
//   onInfoContainer: '#BBDEFB',
//   // Text colors
//   text: '#E6E1E5',
//   textSecondary: '#CAC4D0',
//   textDisabled: '#938F99',
//   textInverse: '#1C1B1F',
//   // Border colors
//   border: '#49454F',
//   borderLight: '#3A3A3A',
//   borderDark: '#5A5A5A',
//   // Status colors
//   pending: '#FFB74D',
//   completed: '#81C784',
//   cancelled: '#EF5350',
//   inProgress: '#64B5F6',
//   // Priority colors
//   low: '#81C784',
//   medium: '#FFB74D',
//   high: '#FF7043',
//   urgent: '#EF5350',
// };

// // Create theme objects
// const createTheme = (colors: any) => ({
//   ...MD3LightTheme,
//   colors: {
//     ...MD3LightTheme.colors,
//     ...colors,
//   },
//   fonts: configureFonts({ config: fontConfig }),
//   roundness: 12,
//   // Custom properties
//   spacing: {
//     xs: 4,
//     sm: 8,
//     md: 16,
//     lg: 24,
//     xl: 32,
//     xxl: 40,
//   },
//   borderRadius: {
//     xs: 4,
//     sm: 8,
//     md: 12,
//     lg: 16,
//     xl: 20,
//     round: 50,
//   },
//   shadows: {
//     small: {
//       shadowColor: colors.shadow,
//       shadowOffset: { width: 0, height: 1 },
//       shadowOpacity: 0.22,
//       shadowRadius: 2.22,
//       elevation: 3,
//     },
//     medium: {
//       shadowColor: colors.shadow,
//       shadowOffset: { width: 0, height: 2 },
//       shadowOpacity: 0.25,
//       shadowRadius: 3.84,
//       elevation: 5,
//     },
//     large: {
//       shadowColor: colors.shadow,
//       shadowOffset: { width: 0, height: 4 },
//       shadowOpacity: 0.30,
//       shadowRadius: 4.65,
//       elevation: 8,
//     },
//   },
//   typography: {
//     h1: {
//       fontSize: 32,
//       fontWeight: 'bold' as const,
//       lineHeight: 40,
//       color: colors.text,
//     },
//     h2: {
//       fontSize: 24,
//       fontWeight: 'bold' as const,
//       lineHeight: 32,
//       color: colors.text,
//     },
//     h3: {
//       fontSize: 20,
//       fontWeight: '600' as const,
//       lineHeight: 28,
//       color: colors.text,
//     },
//     h4: {
//       fontSize: 18,
//       fontWeight: '600' as const,
//       lineHeight: 24,
//       color: colors.text,
//     },
//     body1: {
//       fontSize: 16,
//       fontWeight: 'normal' as const,
//       lineHeight: 24,
//       color: colors.text,
//     },
//     body2: {
//       fontSize: 14,
//       fontWeight: 'normal' as const,
//       lineHeight: 20,
//       color: colors.textSecondary,
//     },
//     caption: {
//       fontSize: 12,
//       fontWeight: 'normal' as const,
//       lineHeight: 16,
//       color: colors.textSecondary,
//     },
//     button: {
//       fontSize: 16,
//       fontWeight: '600' as const,
//       lineHeight: 24,
//       color: colors.text,
//     },
//   },
// });

// const lightTheme = createTheme(lightColors);
// const darkTheme = createTheme(darkColors);

// // Export theme utilities for backward compatibility
// export const theme = lightTheme; // Default theme for legacy components
// export { lightColors, darkColors, createTheme };

// export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
//   const systemColorScheme = useColorScheme();
//   const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
//   const [isDark, setIsDark] = useState(false);

//   // Load saved theme preference
//   useEffect(() => {
//     const loadThemePreference = async () => {
//       try {
//         const savedTheme = await AsyncStorage.getItem('themeMode');
//         if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
//           setThemeModeState(savedTheme as ThemeMode);
//         }
//       } catch (error) {
//         console.log('Error loading theme preference:', error);
//       }
//     };
//     loadThemePreference();
//   }, []);

//   // Update dark mode based on theme mode
//   useEffect(() => {
//     if (themeMode === 'system') {
//       setIsDark(systemColorScheme === 'dark');
//     } else {
//       setIsDark(themeMode === 'dark');
//     }
//   }, [themeMode, systemColorScheme]);

//   // Listen to system theme changes
//   useEffect(() => {
//     const subscription = Appearance.addChangeListener(({ colorScheme }) => {
//       if (themeMode === 'system') {
//         setIsDark(colorScheme === 'dark');
//       }
//     });

//     return () => subscription?.remove();
//   }, [themeMode]);

//   const setThemeMode = async (mode: ThemeMode) => {
//     try {
//       setThemeModeState(mode);
//       await AsyncStorage.setItem('themeMode', mode);
//     } catch (error) {
//       console.log('Error saving theme preference:', error);
//     }
//   };

//   const toggleTheme = () => {
//     const newMode = isDark ? 'light' : 'dark';
//     setThemeMode(newMode);
//   };

//   const theme = isDark ? darkTheme : lightTheme;

//   const value: ThemeContextType = {
//     themeMode,
//     isDark,
//     theme,
//     toggleTheme,
//     setThemeMode,
//   };

//   return (
//     <ThemeContext.Provider value={value}>
//       {children}
//     </ThemeContext.Provider>
//   );
// };

// export const useTheme = (): ThemeContextType => {
//   const context = useContext(ThemeContext);
//   if (context === undefined) {
//     throw new Error('useTheme must be used within a ThemeProvider');
//   }
//   return context;
// };


import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  theme: any;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

// Custom font configuration
const fontConfig = {
  fontFamily: 'System',
  fontWeight: '400' as const,
  fontSize: 16,
  lineHeight: 24,
  letterSpacing: 0.5,
};

// **ENHANCED: Modern Light Theme Colors - Professional Blue/Purple Scheme**
const lightColors = {
  // Primary brand colors
  primary: '#4361EE',        // Vibrant blue
  onPrimary: '#FFFFFF',
  primaryContainer: '#E6ECFF',
  onPrimaryContainer: '#0A2463',
  
  // Secondary colors
  secondary: '#7209B7',      // Rich purple
  onSecondary: '#FFFFFF',
  secondaryContainer: '#F3E5F5',
  onSecondaryContainer: '#4A148C',
  
  // Tertiary colors
  tertiary: '#3A86FF',       // Bright blue accent
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#D6E4FF',
  onTertiaryContainer: '#003785',
  
  // Neutral colors
  background: '#F8FAFC',     // Soft off-white
  onBackground: '#1E293B',
  surface: '#FFFFFF',
  onSurface: '#1E293B',
  surfaceVariant: '#F1F5F9',
  onSurfaceVariant: '#475569',
  
  // UI element colors
  outline: '#CBD5E1',
  outlineVariant: '#E2E8F0',
  shadow: '#000000',
  scrim: '#000000',
  
  // State colors
  error: '#DC2626',          // Red for errors
  onError: '#FFFFFF',
  errorContainer: '#FEE2E2',
  onErrorContainer: '#7F1D1D',
  
  // **ENHANCED: Success colors - Better green palette**
  success: '#059669',        // Emerald green
  onSuccess: '#FFFFFF',
  successContainer: '#D1FAE5',
  onSuccessContainer: '#065F46',
  
  // **ENHANCED: Warning colors - Warm amber**
  warning: '#D97706',        // Amber
  onWarning: '#FFFFFF',
  warningContainer: '#FEF3C7',
  onWarningContainer: '#92400E',
  
  // **ENHANCED: Info colors - Sky blue**
  info: '#0284C7',           // Sky blue
  onInfo: '#FFFFFF',
  infoContainer: '#E0F2FE',
  onInfoContainer: '#075985',
  
  // **ENHANCED: Text colors - Better contrast**
  text: '#1E293B',           // Slate 800
  textSecondary: '#475569',  // Slate 600
  textDisabled: '#94A3B8',   // Slate 400
  textInverse: '#F1F5F9',
  
  // **ENHANCED: Border colors - Softer grays**
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderDark: '#CBD5E1',
  
  // **ENHANCED: Task status colors - More harmonious**
  pending: '#F59E0B',        // Amber-500
  completed: '#10B981',      // Emerald-500
  cancelled: '#EF4444',      // Red-500
  inProgress: '#3B82F6',     // Blue-500
  
  // **ENHANCED: Priority colors - Better visual hierarchy**
  low: '#10B981',            // Green
  medium: '#F59E0B',         // Amber
  high: '#F97316',           // Orange
  urgent: '#DC2626',         // Red
  
  // **NEW: Additional UI colors**
  card: '#FFFFFF',
  cardElevated: '#F8FAFC',
  inputBackground: '#FFFFFF',
  chip: '#F1F5F9',
};

// **ENHANCED: Modern Dark Theme Colors - Deep Blue/Purple Scheme**
const darkColors = {
  // Primary brand colors
  primary: '#6366F1',        // Indigo for better dark mode visibility
  onPrimary: '#FFFFFF',
  primaryContainer: '#3730A3',
  onPrimaryContainer: '#E0E7FF',
  
  // Secondary colors
  secondary: '#A855F7',      // Bright purple
  onSecondary: '#FFFFFF',
  secondaryContainer: '#6B21A8',
  onSecondaryContainer: '#FAE8FF',
  
  // Tertiary colors
  tertiary: '#60A5FA',       // Light blue
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#1E40AF',
  onTertiaryContainer: '#DBEAFE',
  
  // Neutral colors
  background: '#0F172A',     // Deep blue-gray
  onBackground: '#F1F5F9',
  surface: '#1E293B',
  onSurface: '#F1F5F9',
  surfaceVariant: '#334155',
  onSurfaceVariant: '#CBD5E1',
  
  // UI element colors
  outline: '#475569',
  outlineVariant: '#334155',
  shadow: '#000000',
  scrim: '#000000',
  
  // State colors
  error: '#EF4444',
  onError: '#FFFFFF',
  errorContainer: '#7F1D1D',
  onErrorContainer: '#FECACA',
  
  // **ENHANCED: Success colors**
  success: '#10B981',
  onSuccess: '#FFFFFF',
  successContainer: '#065F46',
  onSuccessContainer: '#A7F3D0',
  
  // **ENHANCED: Warning colors**
  warning: '#F59E0B',
  onWarning: '#FFFFFF',
  warningContainer: '#92400E',
  onWarningContainer: '#FDE68A',
  
  // **ENHANCED: Info colors**
  info: '#0EA5E9',
  onInfo: '#FFFFFF',
  infoContainer: '#075985',
  onInfoContainer: '#BAE6FD',
  
  // **ENHANCED: Text colors**
  text: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textDisabled: '#64748B',
  textInverse: '#0F172A',
  
  // **ENHANCED: Border colors**
  border: '#334155',
  borderLight: '#475569',
  borderDark: '#1E293B',
  
  // **ENHANCED: Task status colors**
  pending: '#F59E0B',
  completed: '#10B981',
  cancelled: '#EF4444',
  inProgress: '#60A5FA',
  
  // **ENHANCED: Priority colors**
  low: '#10B981',
  medium: '#F59E0B',
  high: '#FB923C',
  urgent: '#EF4444',
  
  // **NEW: Additional UI colors**
  card: '#1E293B',
  cardElevated: '#334155',
  inputBackground: '#1E293B',
  chip: '#334155',
};

// Create theme objects with enhanced design tokens
const createTheme = (colors: any) => ({
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...colors,
  },
  fonts: configureFonts({ config: fontConfig }),
  roundness: 16, // **ENHANCED: More rounded corners for modern look**
  
  // **ENHANCED: Better spacing system**
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // **ENHANCED: Consistent border radius**
  borderRadius: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    round: 50,
  },
  
  // **ENHANCED: Improved shadows**
  shadows: {
    small: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    medium: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    large: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 12,
    },
  },
  
  // **ENHANCED: Better typography scale**
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '800' as const,
      lineHeight: 40,
      color: colors.text,
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 32,
      color: colors.text,
      letterSpacing: -0.25,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
      color: colors.text,
    },
    h4: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 24,
      color: colors.text,
    },
    body1: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
      color: colors.text,
    },
    body2: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
      color: colors.textSecondary,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
      color: colors.textSecondary,
    },
    button: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 24,
      color: colors.onPrimary,
    },
    label: {
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 16,
      color: colors.textSecondary,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
    },
  },
  
  // **NEW: Component-specific styles**
  components: {
    card: {
      elevation: 2,
      borderRadius: 16,
      backgroundColor: colors.card,
    },
    button: {
      borderRadius: 12,
      minHeight: 48,
    },
    input: {
      borderRadius: 12,
      backgroundColor: colors.inputBackground,
      borderColor: colors.outline,
    },
    chip: {
      borderRadius: 20,
      backgroundColor: colors.chip,
    },
  },
});

const lightTheme = createTheme(lightColors);
const darkTheme = createTheme(darkColors);
// // Export theme utilities for backward compatibility
export const theme = lightTheme; // Default theme for legacy components
export { lightColors, darkColors, createTheme };

// **Keep the rest of your ThemeProvider code the same**
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themeMode');
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeModeState(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.log('Error loading theme preference:', error);
      }
    };
    loadThemePreference();
  }, []);

  useEffect(() => {
    if (themeMode === 'system') {
      setIsDark(systemColorScheme === 'dark');
    } else {
      setIsDark(themeMode === 'dark');
    }
  }, [themeMode, systemColorScheme]);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (themeMode === 'system') {
        setIsDark(colorScheme === 'dark');
      }
    });

    return () => subscription?.remove();
  }, [themeMode]);

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.log('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  const theme = isDark ? darkTheme : lightTheme;

  const value: ThemeContextType = {
    themeMode,
    isDark,
    theme,
    toggleTheme,
    setThemeMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};