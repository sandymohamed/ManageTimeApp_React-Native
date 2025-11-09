// @ts-ignore - React version compatibility issue
import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform, Linking,  } from 'react-native';
import { Text, Card,  Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const AboutScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const styles = createStyles(theme);

  const handleBack = () => {
    navigation.goBack();
  };

  // const handleOpenWebsite = () => {
  //   Linking.openURL('https://your-app-url.com');
  // };

  // const handleOpenGitHub = () => {
  //   Linking.openURL('https://github.com/your-repo');
  // };

  // const handleOpenTwitter = () => {
  //   Linking.openURL('https://twitter.com/your-handle');
  // };

  const handleRateApp = () => {
    const url = Platform.OS === 'ios'
      ? 'https://apps.apple.com/app/your-app-id'
      : 'https://play.google.com/store/apps/details?id=your.package.name';
    Linking.openURL(url);
  };

  const handleShareApp = () => {
    // Implement share functionality
    const message = `Check out Manage Time App - The best productivity app! ${Platform.OS === 'ios' ? 'https://apps.apple.com/app/your-app-id' : 'https://play.google.com/store/apps/details?id=your.package.name'}`;
    // Share.share({ message });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t('profile.about')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Logo & Info */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.appInfoSection}>
            <View style={[styles.logoContainer, { backgroundColor: theme.colors.primary }]}>
              <Icon name="clock-check" size={60} color={theme.colors.onPrimary} />
            </View>
            <Text variant="headlineMedium" style={[styles.appName, { color: theme.colors.text }]}>
              Manage Time
            </Text>
            <Text variant="bodyLarge" style={[styles.appTagline, { color: theme.colors.textSecondary }]}>
              {t('about.tagline')}
            </Text>
            <Text variant="bodyMedium" style={[styles.version, { color: theme.colors.textSecondary }]}>
              {t('about.version')} 1.0.0 (Build 1)
            </Text>
          </Card.Content>
        </Card>

        {/* Description */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('about.whatIs')}
            </Text>
            <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.textSecondary }]}>
              {t('about.description')}
            </Text>
          </Card.Content>
        </Card>

        {/* Features */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('about.keyFeatures')}
            </Text>

            <View style={styles.featureRow}>
              <Icon name="check-circle" size={24} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={[styles.featureText, { color: theme.colors.text }]}>
                {t('about.feature1')}
              </Text>
            </View>
            <View style={styles.featureRow}>
              <Icon name="check-circle" size={24} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={[styles.featureText, { color: theme.colors.text }]}>
                {t('about.feature2')}
              </Text>
            </View>
            <View style={styles.featureRow}>
              <Icon name="check-circle" size={24} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={[styles.featureText, { color: theme.colors.text }]}>
                {t('about.feature3')}
              </Text>
            </View>
            <View style={styles.featureRow}>
              <Icon name="check-circle" size={24} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={[styles.featureText, { color: theme.colors.text }]}>
                {t('about.feature4')}
              </Text>
            </View>
            <View style={styles.featureRow}>
              <Icon name="check-circle" size={24} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={[styles.featureText, { color: theme.colors.text }]}>
                {t('about.feature5')}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Links */}
        {/* <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('about.connect')}
            </Text>

            <List.Item
              title={t('about.website')}
              description="https://your-app-url.com"
              left={(props) => <List.Icon {...props} icon="web" />}
              right={(props) => <List.Icon {...props} icon="open-in-new" />}
              onPress={handleOpenWebsite}
            />
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

            <List.Item
              title={t('about.github')}
              description="View source code"
              left={(props) => <List.Icon {...props} icon="github" />}
              right={(props) => <List.Icon {...props} icon="open-in-new" />}
              onPress={handleOpenGitHub}
            />
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

            <List.Item
              title={t('about.twitter')}
              description="Follow us for updates"
              left={(props) => <List.Icon {...props} icon="twitter" />}
              right={(props) => <List.Icon {...props} icon="open-in-new" />}
              onPress={handleOpenTwitter}
            />
          </Card.Content>
        </Card> */}

        {/* Actions */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('about.support')}
            </Text>

            <Button
              mode="contained"
              onPress={handleRateApp}
              icon="star"
              style={styles.actionButton}
            >
              {t('about.rateUs')}
            </Button>

            <Button
              mode="outlined"
              onPress={handleShareApp}
              icon="share-variant"
              style={styles.actionButton}
            >
              {t('about.shareApp')}
            </Button>
          </Card.Content>
        </Card>

        {/* Credits */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('about.credits')}
            </Text>
            <Text variant="bodyMedium" style={[styles.creditsText, { color: theme.colors.textSecondary }]}>
              {t('about.developedBy')}
            </Text>
            {/* <Text variant="bodySmall" style={[styles.creditsText, { color: theme.colors.textSecondary }]}>
              {t('about.madeWith')}
            </Text> */}
          </Card.Content>
        </Card>

        {/* Copyright */}
        <View style={styles.footer}>
          <Text variant="bodySmall" style={[styles.copyrightText, { color: theme.colors.textSecondary }]}>
            © {new Date().getFullYear()} Manage Time App
          </Text>
          <Text variant="bodySmall" style={[styles.copyrightText, { color: theme.colors.textSecondary }]}>
            {t('about.allRightsReserved')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      paddingTop: Platform.OS === 'ios' ? 50 : theme.spacing.md,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    backButton: {
      padding: theme.spacing.xs,
    },
    headerTitle: {
      fontWeight: '600',
    },
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
      padding: theme.spacing.md,
    },
    card: {
      marginBottom: theme.spacing.md,
      elevation: 2,
    },
    appInfoSection: {
      alignItems: 'center',
      paddingVertical: theme.spacing.lg,
    },
    logoContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    appName: {
      fontWeight: 'bold',
      marginBottom: theme.spacing.xs,
    },
    appTagline: {
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    version: {
      textAlign: 'center',
    },
    sectionTitle: {
      marginBottom: theme.spacing.md,
      fontWeight: '600',
    },
    description: {
      lineHeight: 22,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    featureText: {
      flex: 1,
      lineHeight: 20,
    },
    divider: {
      marginVertical: theme.spacing.xs,
    },
    actionButton: {
      marginBottom: theme.spacing.md,
    },
    creditsText: {
      textAlign: 'center',
      marginBottom: theme.spacing.xs,
      lineHeight: 20,
    },
    footer: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
    },
    copyrightText: {
      textAlign: 'center',
      marginBottom: theme.spacing.xs,
    },
  });

