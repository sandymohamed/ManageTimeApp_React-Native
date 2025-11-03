// @ts-ignore - React version compatibility issue
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform, Linking, Alert } from 'react-native';
import { Text, Card, List, Divider, TextInput, Button, Searchbar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiClient } from '@/services/apiClient';
import { logger } from '@/utils/logger';
import { ApiResponse } from '@/types';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export const HelpSupportScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const styles = createStyles(theme);

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  // const [supportMessage, setSupportMessage] = useState('');
  // const [sending, setSending] = useState(false);

  const faqs: FAQItem[] = [
    {
      id: '1',
      question: t('help.faq.howToCreateTask'),
      answer: t('help.faq.howToCreateTaskAnswer'),
      category: 'tasks',
    },
    {
      id: '2',
      question: t('help.faq.howToSetGoal'),
      answer: t('help.faq.howToSetGoalAnswer'),
      category: 'goals',
    },
    {
      id: '3',
      question: t('help.faq.howToInviteMembers'),
      answer: t('help.faq.howToInviteMembersAnswer'),
      category: 'projects',
    },
    {
      id: '4',
      question: t('help.faq.howToSetReminder'),
      answer: t('help.faq.howToSetReminderAnswer'),
      category: 'reminders',
    },
    {
      id: '5',
      question: t('help.faq.howToChangeTheme'),
      answer: t('help.faq.howToChangeThemeAnswer'),
      category: 'settings',
    },
    {
      id: '6',
      question: t('help.faq.howToExportData'),
      answer: t('help.faq.howToExportDataAnswer'),
      category: 'data',
    },
  ];

  const filteredFAQs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBack = () => {
    navigation.goBack();
  };

  // const handleSendSupport = async () => {
  //   if (!supportMessage.trim()) {
  //     Alert.alert(t('common.error'), t('help.pleaseEnterMessage'));
  //     return;
  //   }

  //   try {
  //     setSending(true);
  //     const response = await apiClient.post<ApiResponse<void>>('/support/message', {
  //       message: supportMessage,
  //     });

  //     if (response.success) {
  //       Alert.alert(t('common.success'), t('help.messageSent'));
  //       setSupportMessage('');
  //     }
  //   } catch (error) {
  //     logger.error('Send support message error:', error);
  //     Alert.alert(t('common.error'), t('help.messageSendError'));
  //   } finally {
  //     setSending(false);
  //   }
  // };

  const handleOpenDocs = () => {
    Linking.openURL('https://your-app-url.com/docs');
  };

  const handleOpenEmail = () => {
    Linking.openURL('mailto:support@your-app-url.com');
  };

  const handleOpenWebsite = () => {
    Linking.openURL('https://your-app-url.com');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t('profile.helpSupport')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* FAQ Section */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('help.faq.title')}
            </Text>

            <Searchbar
              placeholder={t('help.searchFAQ')}
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
              icon="magnify"
            />

            {filteredFAQs.map((faq, index) => (
              <View key={faq.id}>
                {index > 0 && <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />}
                <TouchableOpacity
                  style={styles.faqItem}
                  onPress={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                >
                  <View style={styles.faqHeader}>
                    <Icon
                      name={expandedFAQ === faq.id ? 'chevron-down' : 'chevron-right'}
                      size={24}
                      color={theme.colors.primary}
                    />
                    <Text variant="bodyLarge" style={[styles.faqQuestion, { color: theme.colors.text }]}>
                      {faq.question}
                    </Text>
                  </View>
                  {expandedFAQ === faq.id && (
                    <Text variant="bodyMedium" style={[styles.faqAnswer, { color: theme.colors.textSecondary }]}>
                      {faq.answer}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ))}

            {filteredFAQs.length === 0 && (
              <View style={styles.emptyState}>
                <Icon name="help-circle-outline" size={48} color={theme.colors.textSecondary} />
                <Text variant="bodyLarge" style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  {t('help.noFAQFound')}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Contact Support */}
        {/* <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('help.contactSupport')}
            </Text>
            <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.textSecondary }]}>
              {t('help.contactSupportDesc')}
            </Text>

            <TextInput
              label={t('help.yourMessage')}
              value={supportMessage}
              onChangeText={setSupportMessage}
              mode="outlined"
              multiline
              numberOfLines={6}
              placeholder={t('help.messagePlaceholder')}
              style={styles.messageInput}
              theme={{ colors: { background: theme.colors.surface } }}
            />

            <Button
              mode="contained"
              onPress={handleSendSupport}
              loading={sending}
              disabled={sending}
              icon="send"
              style={styles.sendButton}
            >
              {t('help.sendMessage')}
            </Button>
          </Card.Content>
        </Card> */}

        {/* App Info */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('help.appInfo')}
            </Text>

            <View style={styles.infoRow}>
              <Icon name="information" size={20} color={theme.colors.textSecondary} />
              <Text variant="bodyMedium" style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                {t('help.version')}: 1.0.0
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="update" size={20} color={theme.colors.textSecondary} />
              <Text variant="bodyMedium" style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                {t('help.lastUpdate')}: {new Date().toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="cellphone" size={20} color={theme.colors.textSecondary} />
              <Text variant="bodyMedium" style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                {t('help.platform')}: {Platform.OS === 'ios' ? 'iOS' : 'Android'}
              </Text>
            </View>
          </Card.Content>
        </Card>
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
    sectionTitle: {
      marginBottom: theme.spacing.md,
      fontWeight: '600',
    },
    description: {
      marginBottom: theme.spacing.md,
      lineHeight: 20,
    },
    divider: {
      marginVertical: theme.spacing.xs,
    },
    searchBar: {
      marginBottom: theme.spacing.md,
      elevation: 0,
    },
    faqItem: {
      paddingVertical: theme.spacing.sm,
    },
    faqHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    faqQuestion: {
      flex: 1,
      fontWeight: '500',
    },
    faqAnswer: {
      marginTop: theme.spacing.sm,
      marginLeft: 32,
      lineHeight: 20,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
    },
    emptyText: {
      marginTop: theme.spacing.sm,
    },
    messageInput: {
      marginBottom: theme.spacing.md,
      textAlignVertical: 'top',
    },
    sendButton: {
      marginTop: theme.spacing.sm,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    infoText: {
      flex: 1,
    },
  });

