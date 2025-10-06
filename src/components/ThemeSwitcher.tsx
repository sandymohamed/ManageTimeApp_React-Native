import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Menu, Text, IconButton, useTheme as usePaperTheme } from 'react-native-paper';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

interface ThemeSwitcherProps {
  mode?: 'button' | 'menu' | 'icon';
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ 
  mode = 'button', 
  showLabel = true,
  size = 'medium'
}) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { themeMode, isDark, toggleTheme, setThemeMode } = useTheme();
  const paperTheme = usePaperTheme();
  const [visible, setVisible] = React.useState(false);

  const themes = [
    { 
      mode: 'light' as const, 
      name: t('settings.lightTheme'), 
      icon: 'weather-sunny',
      description: 'Light mode'
    },
    { 
      mode: 'dark' as const, 
      name: t('settings.darkTheme'), 
      icon: 'weather-night',
      description: 'Dark mode'
    },
    { 
      mode: 'system' as const, 
      name: t('settings.systemTheme'), 
      icon: 'theme-light-dark',
      description: 'Follow system'
    },
  ];

  const currentTheme = themes.find(t => t.mode === themeMode) || themes[0];

  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    setVisible(false);
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { size: 20, padding: 8 };
      case 'large':
        return { size: 28, padding: 12 };
      default:
        return { size: 24, padding: 10 };
    }
  };

  const sizeStyle = getSizeStyle();

  if (mode === 'icon') {
    return (
      <IconButton
        icon={currentTheme.icon}
        size={sizeStyle.size}
        onPress={toggleTheme}
        iconColor={paperTheme.colors.onSurface}
        style={[styles.iconButton, { padding: sizeStyle.padding }]}
      />
    );
  }

  if (mode === 'menu') {
    return (
      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={
          <Button
            mode="outlined"
            onPress={() => setVisible(true)}
            icon={currentTheme.icon}
            style={styles.menuButton}
            contentStyle={styles.buttonContent}
          >
            {showLabel && currentTheme.name}
          </Button>
        }
        contentStyle={[
          styles.menu,
          { backgroundColor: paperTheme.colors.surface }
        ]}
      >
        {themes.map((theme) => (
          <Menu.Item
            key={theme.mode}
            onPress={() => handleThemeChange(theme.mode)}
            title={theme.name}
            leadingIcon={theme.icon}
            trailingIcon={themeMode === theme.mode ? 'check' : undefined}
            titleStyle={[
              styles.menuItemTitle,
              themeMode === theme.mode && { color: paperTheme.colors.primary }
            ]}
          />
        ))}
      </Menu>
    );
  }

  return (
    <View style={[styles.container, isRTL && styles.rtlContainer]}>
      {showLabel && (
        <Text variant="bodyMedium" style={[styles.label, { color: paperTheme.colors.onSurface }]}>
          {t('settings.theme')}:
        </Text>
      )}
      <View style={styles.buttonContainer}>
        {themes.map((theme) => (
          <Button
            key={theme.mode}
            mode={themeMode === theme.mode ? 'contained' : 'outlined'}
            onPress={() => handleThemeChange(theme.mode)}
            icon={theme.icon}
            style={[
              styles.themeButton,
              themeMode === theme.mode && styles.activeButton
            ]}
            contentStyle={styles.buttonContent}
            compact
          >
            {theme.name}
          </Button>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rtlContainer: {
    flexDirection: 'row-reverse',
  },
  label: {
    marginRight: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  themeButton: {
    minWidth: 100,
  },
  activeButton: {
    // Active button styling is handled by mode="contained"
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    // Menu button styling
  },
  menu: {
    marginTop: 8,
  },
  menuItemTitle: {
    fontSize: 14,
  },
  iconButton: {
    margin: 0,
  },
});
