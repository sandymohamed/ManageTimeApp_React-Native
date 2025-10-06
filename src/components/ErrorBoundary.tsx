import React, {Component, ReactNode} from 'react';
import {View, StyleSheet} from 'react-native';
import {Text, Button} from 'react-native-paper';
import {theme} from '@/utils/theme';
import {logger} from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<{error: Error; resetError: () => void}>;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {hasError: false, error: null};
  }

  static getDerivedStateFromError(error: Error): State {
    return {hasError: true, error};
  }

  componentDidCatch(error: Error, errorInfo: any) {
    logger.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({hasError: false, error: null});
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
      }

      return (
        <View style={styles.container}>
          <Text variant="headlineSmall" style={styles.title}>
            Something went wrong
          </Text>
          <Text variant="bodyMedium" style={styles.message}>
            We're sorry, but something unexpected happened. Please try again.
          </Text>
          {__DEV__ && this.state.error && (
            <Text variant="bodySmall" style={styles.errorDetails}>
              {this.state.error.message}
            </Text>
          )}
          <Button mode="contained" onPress={this.resetError} style={styles.button}>
            Try Again
          </Button>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  title: {
    marginBottom: theme.spacing.md,
    textAlign: 'center',
    color: theme.colors.error,
  },
  message: {
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    color: theme.colors.textSecondary,
  },
  errorDetails: {
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    color: theme.colors.error,
    fontFamily: 'monospace',
  },
  button: {
    marginTop: theme.spacing.md,
  },
});
