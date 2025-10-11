import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { NotificationBadge } from './NotificationBadge';

interface TabItem {
  name: string;
  icon: string;
  label: string;
  badge?: number;
}

interface EnhancedTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export const EnhancedTabBar: React.FC<EnhancedTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const theme = useTheme();

  const tabs: TabItem[] = [
    {
      name: 'Dashboard',
      icon: 'home',
      label: t('navigation.dashboard'),
      badge: 3, 
    },
    {
      name: 'Tasks',
      icon: 'assignment',
      label: t('navigation.tasks'),
      badge: 3, 
    },
    {
      name: 'Calendar',
      icon: 'calendar',
      label: t('navigation.calendar'),
    },
    {
      name: 'Projects',
      icon: 'folder',
      label: t('navigation.projects'),
    },
    {
      name: 'Routines',
      icon: 'repeat',
      label:  t('navigation.routines'),
      badge: 1, 
    },
    {
      name: 'Goals',
      icon: 'flag',
      label: t('navigation.goals'),
      badge: 1, // Demo: 1 goal due today
    },
    {
      name: 'Alarms',
      icon: 'alarm',
      label: t('navigation.alarms'),
    },
    {
      name: 'Analytics',
      icon: 'analytics',
      label: t('navigation.analytics'),
    },
    {
      name: 'Profile',
      icon: 'person',
      label: t('navigation.profile'),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.tabBar, { borderTopColor: theme.colors.outline }]}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const tab = tabs.find(t => t.name === route.name);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          if (!tab) return null;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[
                styles.tab,
                isFocused && styles.activeTab,
                isFocused && { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <View style={styles.tabContent}>
                <View style={styles.iconContainer}>
                  {/* <MaterialIcons
                    name={tab.icon as any}
                    size={24}
                    color={isFocused ? theme.colors.primary : theme.colors.textSecondary}
                  /> */}
                  {tab.badge && tab.badge > 0 && (
                    <NotificationBadge
                      count={tab.badge}
                      size="small"
                      variant="error"
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.label,
                    {
                      color: isFocused ? theme.colors.primary : theme.colors.onSecondary,
                      fontSize: isFocused ? 12 : 11,
                      fontWeight: isFocused ? '600' : '400',
                    },
                    isRTL && styles.rtlLabel,
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  activeTab: {
    // Active tab styling is handled by backgroundColor
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  label: {
    textAlign: 'center',
  },
  rtlLabel: {
    textAlign: 'center',
  },
});
