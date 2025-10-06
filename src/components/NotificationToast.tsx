import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Text, IconButton, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationToastProps {
  visible: boolean;
  message: string;
  type: NotificationType;
  duration?: number;
  onDismiss: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  visible,
  message,
  type,
  duration = 4000,
  onDismiss,
  action,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      handleDismiss();
    }
  }, [visible, duration]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'check-circle',
          color: theme.colors.primary,
          backgroundColor: theme.colors.primaryContainer,
        };
      case 'error':
        return {
          icon: 'alert-circle',
          color: theme.colors.error,
          backgroundColor: theme.colors.errorContainer,
        };
      case 'warning':
        return {
          icon: 'alert',
          color: theme.colors.tertiary,
          backgroundColor: theme.colors.tertiaryContainer,
        };
      case 'info':
        return {
          icon: 'information',
          color: theme.colors.secondary,
          backgroundColor: theme.colors.secondaryContainer,
        };
      default:
        return {
          icon: 'information',
          color: theme.colors.onSurface,
          backgroundColor: theme.colors.surfaceVariant,
        };
    }
  };

  const typeConfig = getTypeConfig();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim || 0 }],
          backgroundColor: typeConfig.backgroundColor,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.leftContent}>
          <IconButton
            icon={typeConfig.icon}
            size={20}
            iconColor={typeConfig.color}
            style={styles.icon}
          />
          <Text
            variant="bodyMedium"
            style={[styles.message, { color: theme.colors.onSurface }]}
            numberOfLines={2}
          >
            {message}
          </Text>
        </View>
        <View style={styles.rightContent}>
          {action && (
            <IconButton
              icon="arrow-right"
              size={16}
              iconColor={typeConfig.color}
              onPress={action.onPress}
              style={styles.actionButton}
            />
          )}
          <IconButton
            icon="close"
            size={16}
            iconColor={theme.colors.onSurfaceVariant}
            onPress={handleDismiss}
            style={styles.closeButton}
          />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    margin: 0,
    marginRight: 8,
  },
  message: {
    flex: 1,
    fontWeight: '500',
  },
  actionButton: {
    margin: 0,
    marginRight: 4,
  },
  closeButton: {
    margin: 0,
  },
});
