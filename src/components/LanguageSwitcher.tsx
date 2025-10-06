import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Menu, Divider, Text } from 'react-native-paper';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

interface LanguageSwitcherProps {
  mode?: 'button' | 'menu';
  showLabel?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  mode = 'button', 
  showLabel = true 
}) => {
  const { currentLanguage, changeLanguage } = useLanguage();
  const { t } = useTranslation();
  const [visible, setVisible] = React.useState(false);

  const languages = [
    { code: 'en', name: t('settings.english'), flag: '🇺🇸' },
    { code: 'ar', name: t('settings.arabic'), flag: '🇸🇦' },
  ];

  const currentLanguageData = languages.find(lang => lang.code === currentLanguage);

  const handleLanguageChange = async (languageCode: string) => {
    await changeLanguage(languageCode);
    setVisible(false);
  };

  if (mode === 'menu') {
    return (
      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={
          <Button
            mode="outlined"
            onPress={() => setVisible(true)}
            icon="translate"
            style={styles.menuButton}
          >
            {showLabel && currentLanguageData?.name}
            {currentLanguageData?.flag}
          </Button>
        }
      >
        {languages.map((language) => (
          <Menu.Item
            key={language.code}
            onPress={() => handleLanguageChange(language.code)}
            title={`${language.flag} ${language.name}`}
            leadingIcon={currentLanguage === language.code ? 'check' : undefined}
          />
        ))}
      </Menu>
    );
  }

  return (
    <View style={styles.container}>
      {showLabel && (
        <Text variant="bodyMedium" style={styles.label}>
          {t('settings.language')}:
        </Text>
      )}
      <View style={styles.buttonContainer}>
        {languages.map((language) => (
          <Button
            key={language.code}
            mode={currentLanguage === language.code ? 'contained' : 'outlined'}
            onPress={() => handleLanguageChange(language.code)}
            style={[
              styles.languageButton,
              currentLanguage === language.code && styles.activeButton
            ]}
            compact
          >
            {language.flag} {language.name}
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
  label: {
    marginRight: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  languageButton: {
    minWidth: 80,
  },
  activeButton: {
    // Active button styling is handled by mode="contained"
  },
  menuButton: {
    // Menu button styling
  },
});
