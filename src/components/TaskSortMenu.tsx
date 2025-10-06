import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Menu, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { theme } from '@/utils/theme';

interface TaskSortMenuProps {
  sortBy: 'createdAt' | 'dueDate' | 'priority' | 'title';
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: 'createdAt' | 'dueDate' | 'priority' | 'title') => void;
  onOrderChange: (sortOrder: 'asc' | 'desc') => void;
}

export const TaskSortMenu: React.FC<TaskSortMenuProps> = ({
  sortBy,
  sortOrder,
  onSortChange,
  onOrderChange,
}) => {
  const { t } = useTranslation();
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [orderMenuVisible, setOrderMenuVisible] = useState(false);

  const getSortLabel = (sort: string) => {
    switch (sort) {
      case 'createdAt':
        return t('tasks.sort.createdAt');
      case 'dueDate':
        return t('tasks.sort.dueDate');
      case 'priority':
        return t('tasks.sort.priority');
      case 'title':
        return t('tasks.sort.title');
      default:
        return sort;
    }
  };

  const getOrderLabel = (order: string) => {
    switch (order) {
      case 'asc':
        return t('tasks.sort.ascending');
      case 'desc':
        return t('tasks.sort.descending');
      default:
        return order;
    }
  };

  return (
    <View style={styles.container}>
      <Menu
        visible={sortMenuVisible}
        onDismiss={() => setSortMenuVisible(false)}
        anchor={
          <Button
            mode="outlined"
            onPress={() => setSortMenuVisible(true)}
            style={styles.button}
            icon="sort">
            {getSortLabel(sortBy)}
          </Button>
        }>
        <Menu.Item
          onPress={() => {
            onSortChange('createdAt');
            setSortMenuVisible(false);
          }}
          title={t('tasks.sort.createdAt')}
        />
        <Menu.Item
          onPress={() => {
            onSortChange('dueDate');
            setSortMenuVisible(false);
          }}
          title={t('tasks.sort.dueDate')}
        />
        <Menu.Item
          onPress={() => {
            onSortChange('priority');
            setSortMenuVisible(false);
          }}
          title={t('tasks.sort.priority')}
        />
        <Menu.Item
          onPress={() => {
            onSortChange('title');
            setSortMenuVisible(false);
          }}
          title={t('tasks.sort.title')}
        />
      </Menu>

      <Menu
        visible={orderMenuVisible}
        onDismiss={() => setOrderMenuVisible(false)}
        anchor={
          <Button
            mode="outlined"
            onPress={() => setOrderMenuVisible(true)}
            style={styles.button}
            icon={sortOrder === 'asc' ? 'sort-ascending' : 'sort-descending'}>
            {getOrderLabel(sortOrder)}
          </Button>
        }>
        <Menu.Item
          onPress={() => {
            onOrderChange('asc');
            setOrderMenuVisible(false);
          }}
          title={t('tasks.sort.ascending')}
        />
        <Menu.Item
          onPress={() => {
            onOrderChange('desc');
            setOrderMenuVisible(false);
          }}
          title={t('tasks.sort.descending')}
        />
      </Menu>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    marginHorizontal: theme.spacing.xs,
  },
});
