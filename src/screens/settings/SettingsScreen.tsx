import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, List, Switch, Divider, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

export const SettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const paperTheme = useTheme();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* Appearance Section */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('settings.appearance')}
            </Text>

            <List.Item
              title={t('settings.theme')}
              description={customTheme.isDark ? t('settings.darkTheme') : t('settings.lightTheme')}
              left={props => <List.Icon {...props} icon="palette" />}
              right={() => (
                <ThemeSwitcher mode="menu" showLabel={false} size="small" />
              )}
              style={styles.listItem}
            />

            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

            <List.Item
              title={t('settings.language')}
              description={isRTL ? t('settings.arabic') : t('settings.english')}
              left={props => <List.Icon {...props} icon="translate" />}
              right={() => (
                <LanguageSwitcher mode="menu" showLabel={false} />
              )}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>


        {/* About Section */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('settings.about')}
            </Text>

            <List.Item
              title="App Version"
              description="1.0.0"
              left={props => <List.Icon {...props} icon="information" />}
              style={styles.listItem}
            />

            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

            <List.Item
              title="Terms of Service"
              description="Read our terms and conditions"
              left={props => <List.Icon {...props} icon="file-document" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => console.log('Terms of Service')}
              style={styles.listItem}
            />

            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

            <List.Item
              title="Privacy Policy"
              description="Learn how we protect your data"
              left={props => <List.Icon {...props} icon="shield-account" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => console.log('Privacy Policy')}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        {/* Theme Preview */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Theme Preview
            </Text>

            <View style={[styles.themePreview, { backgroundColor: theme.colors.background }]}>
              <View style={[styles.previewCard, { backgroundColor: theme.colors.surface }]}>
                <Text variant="titleSmall" style={{ color: theme.colors.text }}>
                  Sample Task
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
                  This is how your tasks will look
                </Text>
                <View style={styles.previewChips}>
                  <View style={[styles.previewChip, { backgroundColor: theme.colors.primary }]}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onPrimary }}>
                      High Priority
                    </Text>
                  </View>
                  <View style={[styles.previewChip, { backgroundColor: theme.colors.secondary }]}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSecondary }}>
                      In Progress
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  listItem: {
    paddingVertical: 4,
  },
  divider: {
    marginVertical: 8,
  },
  themePreview: {
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  previewCard: {
    padding: 12,
    borderRadius: 8,
    elevation: 1,
  },
  previewChips: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  previewChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});