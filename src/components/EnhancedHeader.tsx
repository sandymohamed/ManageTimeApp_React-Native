import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Appbar, Menu, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeSwitcher } from './ThemeSwitcher';

interface EnhancedHeaderProps {
  title: string;
  subtitle?: string;
  showLanguageSwitcher?: boolean;
  showThemeSwitcher?: boolean;
  showMenu?: boolean;
  onMenuPress?: () => void;
  onBackPress?: () => void;
  showBackButton?: boolean;
}

export const EnhancedHeader: React.FC<EnhancedHeaderProps> = ({
  title,
  subtitle,
  showLanguageSwitcher = true,
  showThemeSwitcher = true,
  showMenu = false,
  onMenuPress,
  onBackPress,
  showBackButton = false,
}) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = React.useState(false);

  const handleMenuPress = () => {
    if (onMenuPress) {
      onMenuPress();
    } else {
      setMenuVisible(true);
    }
  };

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    }
  };

  return (
    <Appbar.Header style={[styles.header, { backgroundColor: theme.colors.primary }]}>
      {showBackButton && (
        <Appbar.BackAction
          onPress={handleBackPress}
          iconColor={theme.colors.onPrimary}
        />
      )}
      
      <Appbar.Content
        title={title}
        subtitle={subtitle}
        titleStyle={[
          styles.title,
          { color: theme.colors.onPrimary },
          isRTL && styles.rtlTitle
        ]}
        subtitleStyle={[
          styles.subtitle,
          { color: theme.colors.onPrimary },
          isRTL && styles.rtlSubtitle
        ]}
      />

      <View style={styles.rightActions}>
        {showLanguageSwitcher && (
          <View style={styles.languageSwitcher}>
            <LanguageSwitcher mode="menu" showLabel={false} />
          </View>
        )}

        {showThemeSwitcher && (
          <View style={styles.themeSwitcher}>
            <ThemeSwitcher mode="icon" size="small" />
          </View>
        )}

        {showMenu && (
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Appbar.Action
                icon="dots-vertical"
                onPress={handleMenuPress}
                iconColor={theme.colors.onPrimary}
              />
            }
            contentStyle={[
              styles.menu,
              { backgroundColor: theme.colors.surface }
            ]}
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                // Handle settings
              }}
              title={t('profile.settings')}
              leadingIcon="cog"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                // Handle help
              }}
              title="Help & Support"
              leadingIcon="help-circle"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                // Handle about
              }}
              title={t('profile.about')}
              leadingIcon="information"
            />
          </Menu>
        )}
      </View>
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  header: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  rtlTitle: {
    textAlign: 'right',
  },
  rtlSubtitle: {
    textAlign: 'right',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageSwitcher: {
    marginRight: 4,
  },
  themeSwitcher: {
    marginRight: 4,
  },
  menu: {
    marginTop: 8,
  },
});
