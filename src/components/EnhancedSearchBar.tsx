import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Searchbar, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

interface EnhancedSearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  showClearButton?: boolean;
  autoFocus?: boolean;
  style?: any;
}

export const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({
  placeholder,
  value,
  onChangeText,
  onClear,
  onFocus,
  onBlur,
  showClearButton = true,
  autoFocus = false,
  style,
}) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View style={[styles.container, style]}>
      <Searchbar
        placeholder={placeholder || t('common.search')}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClearIconPress={showClearButton ? handleClear : undefined}
        autoFocus={autoFocus}
        style={[
          styles.searchbar,
          {
            backgroundColor: isFocused 
              ? theme.colors.surface 
              : theme.colors.surfaceVariant,
          },
          isRTL && styles.rtlSearchbar,
        ]}
        inputStyle={[
          styles.input,
          isRTL && styles.rtlInput,
        ]}
        iconColor={theme.colors.secondary}
        clearIcon="close"
        // searchIcon="magnify"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchbar: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  rtlSearchbar: {
    // RTL specific styles
  },
  input: {
    fontSize: 16,
  },
  rtlInput: {
    textAlign: 'right',
  },
});
