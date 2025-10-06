import React from 'react';
import {View, StyleSheet, ActivityIndicator} from 'react-native';
import {Text} from 'react-native-paper';
import {theme} from '@/utils/theme';

interface LoadingScreenProps {
  message?: string;
  showProgress?: boolean;
  progress?: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
  showProgress = false,
  progress = 0,
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text variant="bodyLarge" style={styles.message}>
        {message}
      </Text>
      {showProgress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, {width: `${progress}%`}]} />
          </View>
          <Text variant="bodySmall" style={styles.progressText}>
            {Math.round(progress)}%
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  message: {
    marginTop: theme.spacing.md,
    textAlign: 'center',
    color: theme.colors.textSecondary,
  },
  progressContainer: {
    marginTop: theme.spacing.lg,
    width: '100%',
    maxWidth: 200,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.outline,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  progressText: {
    marginTop: theme.spacing.sm,
    textAlign: 'center',
    color: theme.colors.textSecondary,
  },
});
