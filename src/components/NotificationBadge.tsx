import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'error' | 'warning';
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  maxCount = 99,
  size = 'small',
  variant = 'error',
}) => {
  const theme = useTheme();

  if (count <= 0) return null;

  const getVariantColor = () => {
    switch (variant) {
      case 'primary':
        return theme.colors.primary;
      case 'secondary':
        return theme.colors.secondary;
      case 'warning':
        return theme.colors.warning;
      default:
        return theme.colors.error;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'large':
        return {
          minWidth: 24,
          height: 24,
          borderRadius: 12,
          fontSize: 12,
        };
      case 'medium':
        return {
          minWidth: 20,
          height: 20,
          borderRadius: 10,
          fontSize: 10,
        };
      default:
        return {
          minWidth: 16,
          height: 16,
          borderRadius: 8,
          fontSize: 9,
        };
    }
  };

  const sizeStyle = getSizeStyle();
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  return (
    <View
      style={[
        styles.badge,
        sizeStyle,
        { backgroundColor: getVariantColor() },
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          { color: theme.colors.onError, fontSize: sizeStyle.fontSize },
        ]}
        numberOfLines={1}
      >
        {displayCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    zIndex: 1,
  },
  badgeText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
