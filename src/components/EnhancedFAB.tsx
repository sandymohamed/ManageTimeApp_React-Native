import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { FAB, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

interface EnhancedFABProps {
  onPress: () => void;
  icon?: string;
  label?: string;
  visible?: boolean;
  style?: any;
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'small' | 'medium' | 'large';
}

export const EnhancedFAB: React.FC<EnhancedFABProps> = ({
  onPress,
  icon = 'plus',
  label,
  visible = true,
  style,
  variant = 'primary',
  size = 'medium',
}) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const theme = useTheme();

  if (!visible) return null;

  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: theme.colors.secondary,
          color: theme.colors.onSecondary,
        };
      case 'tertiary':
        return {
          backgroundColor: theme.colors.tertiary,
          color: theme.colors.onTertiary,
        };
      default:
        return {
          backgroundColor: theme.colors.primary,
          color: theme.colors.onPrimary,
        };
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { size: 40 };
      case 'large':
        return { size: 64 };
      default:
        return { size: 56 };
    }
  };

  const variantStyle = getVariantStyle();
  const sizeStyle = getSizeStyle();

  return (
    <View style={[styles.container, isRTL && styles.rtlContainer]}>
      <FAB
        icon={icon}
        label={label}
        onPress={onPress}
        style={[
          styles.fab,
          {
            backgroundColor: variantStyle.backgroundColor,
          },
          sizeStyle,
          style,
        ]}
        color={variantStyle.color}
        customSize={sizeStyle.size}
        mode="elevated"
        elevation={6}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80, // Above tab bar
    right: 16,
    zIndex: 1000,
  },
  rtlContainer: {
    right: undefined,
    left: 16,
  },
  fab: {
    // Additional FAB styling
  },
});
