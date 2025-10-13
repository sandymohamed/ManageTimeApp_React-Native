import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  useTheme,
  ActivityIndicator,
  Chip,
  IconButton,
  Searchbar,
  SegmentedButtons
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useGoalStore } from '@/store/goalStore';
import { GoalPriority } from '@/types/goal';

interface GoalTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: GoalPriority;
  estimatedDuration: string;
  tags: string[];
  milestones: string[];
  icon: string;
  color: string;
}

interface GoalTemplatesScreenProps {
  navigation: any;
}

export const GoalTemplatesScreen: React.FC<GoalTemplatesScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const paperTheme = useTheme();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const styles = createStyles(theme);
  const { showSuccess, showError } = useNotification();

  const { createGoal, isLoading } = useGoalStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredTemplates, setFilteredTemplates] = useState<GoalTemplate[]>([]);

  const categories = [
    'all', 'work', 'personal', 'health', 'learning', 'finance', 'relationships', 'hobbies'
  ];

  const templates: GoalTemplate[] = [
    {
      id: '1',
      title: 'Learn a New Language',
      description: 'Master a new language through daily practice and immersion',
      category: 'learning',
      priority: GoalPriority.MEDIUM,
      estimatedDuration: '6 months',
      tags: ['language', 'education', 'skill'],
      milestones: [
        'Complete basic vocabulary (1000 words)',
        'Finish beginner course',
        'Have first conversation',
        'Pass intermediate test',
        'Read first book in target language'
      ],
      icon: 'translate',
      color: '#2196F3'
    },
    {
      id: '2',
      title: 'Get in Shape',
      description: 'Achieve your fitness goals through consistent exercise and healthy eating',
      category: 'health',
      priority: GoalPriority.HIGH,
      estimatedDuration: '3 months',
      tags: ['fitness', 'health', 'wellness'],
      milestones: [
        'Establish workout routine',
        'Lose first 10 pounds',
        'Run 5K without stopping',
        'Achieve target weight',
        'Maintain for 1 month'
      ],
      icon: 'dumbbell',
      color: '#4CAF50'
    },
    {
      id: '3',
      title: 'Start a Side Business',
      description: 'Launch and grow a profitable side business',
      category: 'work',
      priority: GoalPriority.HIGH,
      estimatedDuration: '12 months',
      tags: ['business', 'entrepreneurship', 'income'],
      milestones: [
        'Research and validate idea',
        'Create business plan',
        'Launch MVP',
        'Get first 10 customers',
        'Reach $1000 monthly revenue'
      ],
      icon: 'briefcase',
      color: '#FF9800'
    },
    {
      id: '4',
      title: 'Read 24 Books This Year',
      description: 'Read 2 books per month to expand knowledge and improve focus',
      category: 'personal',
      priority: GoalPriority.MEDIUM,
      estimatedDuration: '12 months',
      tags: ['reading', 'education', 'personal-growth'],
      milestones: [
        'Read first 6 books',
        'Complete 12 books',
        'Read 18 books',
        'Finish 24 books',
        'Write book reviews'
      ],
      icon: 'book-open',
      color: '#9C27B0'
    },
    {
      id: '5',
      title: 'Save for Emergency Fund',
      description: 'Build a 6-month emergency fund for financial security',
      category: 'finance',
      priority: GoalPriority.HIGH,
      estimatedDuration: '18 months',
      tags: ['savings', 'finance', 'security'],
      milestones: [
        'Save first $1000',
        'Reach $5000',
        'Hit $10000',
        'Complete 6-month fund',
        'Maintain fund'
      ],
      icon: 'piggy-bank',
      color: '#4CAF50'
    },
    {
      id: '6',
      title: 'Learn to Play Guitar',
      description: 'Master guitar playing and perform in public',
      category: 'hobbies',
      priority: GoalPriority.LOW,
      estimatedDuration: '8 months',
      tags: ['music', 'hobby', 'creativity'],
      milestones: [
        'Learn basic chords',
        'Play first song',
        'Master fingerpicking',
        'Write original song',
        'Perform at open mic'
      ],
      icon: 'guitar',
      color: '#E91E63'
    },
    {
      id: '7',
      title: 'Improve Work-Life Balance',
      description: 'Create better boundaries between work and personal life',
      category: 'work',
      priority: GoalPriority.MEDIUM,
      estimatedDuration: '6 months',
      tags: ['work-life', 'productivity', 'wellness'],
      milestones: [
        'Set work hours',
        'Implement no-work weekends',
        'Take regular breaks',
        'Use all vacation days',
        'Maintain boundaries'
      ],
      icon: 'clock',
      color: '#607D8B'
    },
    {
      id: '8',
      title: 'Travel to 5 New Countries',
      description: 'Explore new cultures and expand your worldview',
      category: 'personal',
      priority: GoalPriority.MEDIUM,
      estimatedDuration: '24 months',
      tags: ['travel', 'culture', 'adventure'],
      milestones: [
        'Plan first trip',
        'Visit first country',
        'Complete 3 countries',
        'Reach 5 countries',
        'Document experiences'
      ],
      icon: 'airplane',
      color: '#00BCD4'
    }
  ];

  useEffect(() => {
    filterTemplates();
  }, [searchQuery, selectedCategory]);

  const filterTemplates = () => {
    let filtered = templates;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template =>
        template.title.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    setFilteredTemplates(filtered);
  };

  const handleCreateFromTemplate = async (template: GoalTemplate) => {
    try {
      await createGoal({
        title: template.title,
        description: template.description,
        priority: template.priority,
        category: template.category.charAt(0).toUpperCase() + template.category.slice(1),
      });

      showSuccess(t('goals.goalCreatedFromTemplate', { title: template.title }));
      navigation.goBack();
    } catch (error: any) {
      showError(error.message || t('goals.templateCreateError'));
    }
  };

  const getPriorityColor = (priority: GoalPriority) => {
    switch (priority) {
      case GoalPriority.URGENT:
        return '#F44336';
      case GoalPriority.HIGH:
        return '#FF9800';
      case GoalPriority.MEDIUM:
        return '#2196F3';
      case GoalPriority.LOW:
        return '#4CAF50';
      default:
        return theme.colors.primary;
    }
  };

  const renderTemplate = ({ item: template }: { item: GoalTemplate }) => (
    <Card style={[styles.templateCard, { borderLeftColor: template.color }]}>
      <Card.Content>
        <View style={styles.templateHeader}>
          <View style={styles.templateInfo}>
            <View style={styles.templateTitleRow}>
              <IconButton
                icon={template.icon}
                size={24}
                iconColor={template.color}
                style={styles.templateIcon}
              />
              <Text variant="titleMedium" style={styles.templateTitle}>
                {template.title}
              </Text>
            </View>
            <View style={styles.templateBadges}>
              <Chip
                mode="outlined"
                compact
                textStyle={[styles.priorityChipText, { color: getPriorityColor(template.priority) }]}
                style={[styles.priorityChip, { borderColor: getPriorityColor(template.priority) }]}
              >
                {t(`goals.priority.${template.priority.toLowerCase()}`)}
              </Chip>
              <Chip mode="outlined" compact style={styles.durationChip}>
                {template.estimatedDuration}
              </Chip>
            </View>
          </View>
        </View>

        <Text variant="bodyMedium" style={styles.templateDescription}>
          {template.description}
        </Text>

        <View style={styles.templateTags}>
          {template.tags.map((tag, index) => (
            <Chip
              key={index}
              mode="outlined"
              compact
              style={styles.tagChip}
              textStyle={styles.tagChipText}
            >
              {tag}
            </Chip>
          ))}
        </View>

        <View style={styles.templateMilestones}>
          <Text variant="bodySmall" style={styles.milestonesTitle}>
            {t('goals.milestones')} ({template.milestones.length}):
          </Text>
          {template.milestones.slice(0, 3).map((milestone, index) => (
            <Text key={index} variant="bodySmall" style={styles.milestoneItem}>
              • {milestone}
            </Text>
          ))}
          {template.milestones.length > 3 && (
            <Text variant="bodySmall" style={styles.moreMilestones}>
              +{template.milestones.length - 3} more...
            </Text>
          )}
        </View>

        <Button
          mode="contained"
          onPress={() => handleCreateFromTemplate(template)}
          style={[styles.createButton, { backgroundColor: template.color }]}
          icon="plus"
        >
          {t('goals.createFromTemplate')}
        </Button>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        {t('goals.noTemplates')}
      </Text>
      <Text variant="bodyMedium" style={styles.emptyMessage}>
        {t('goals.noTemplatesDescription')}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyLarge" style={styles.loadingText}>
          {t('goals.loading')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
          {t('goals.templates')}
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {t('goals.templatesDescription')}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={t('goals.searchTemplates')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchBar}
        />
      </View>

      <View style={styles.categoryContainer}>
        <SegmentedButtons
          value={selectedCategory}
          onValueChange={setSelectedCategory}
          buttons={categories.map(category => ({
            value: category,
            label: t(`goals.categories.${category}`)
          }))}
          style={styles.segmentedButtons}
        />
      </View>

      <FlatList
        data={filteredTemplates}
        renderItem={renderTemplate}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: theme.colors.text,
  },
  header: {
    padding: 16,
    elevation: 2,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: theme.colors.textSecondary,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBar: {
    elevation: 1,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  templateCard: {
    marginBottom: 16,
    borderLeftWidth: 4,
    elevation: 2,
  },
  templateHeader: {
    marginBottom: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  templateIcon: {
    margin: 0,
    marginRight: 8,
  },
  templateTitle: {
    fontWeight: '600',
    flex: 1,
  },
  templateBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityChip: {
    height: 24,
  },
  priorityChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  durationChip: {
    height: 24,
  },
  templateDescription: {
    color: theme.colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  templateTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tagChip: {
    height: 24,
  },
  tagChipText: {
    fontSize: 10,
  },
  templateMilestones: {
    marginBottom: 16,
  },
  milestonesTitle: {
    fontWeight: '600',
    marginBottom: 4,
    color: theme.colors.text,
  },
  milestoneItem: {
    color: theme.colors.textSecondary,
    marginLeft: 8,
    marginBottom: 2,
  },
  moreMilestones: {
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginLeft: 8,
  },
  createButton: {
    marginTop: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    marginBottom: 8,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  emptyMessage: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});
