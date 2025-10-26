import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Card, Title, Paragraph, Button, Chip } from 'react-native-paper';
import { theme } from '@/utils/theme';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type InvitationAcceptScreenRouteProp = RouteProp<{ InvitationAccept: { token: string } }, 'InvitationAccept'>;
type InvitationAcceptScreenNavigationProp = StackNavigationProp<any, 'InvitationAccept'>;

interface InvitationData {
  id: string;
  projectId: string;
  projectName: string;
  inviterName: string;
  inviterEmail: string;
  role: 'member' | 'admin' | 'viewer';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  expiresAt: string;
}

const InvitationAcceptScreen: React.FC = () => {
  const navigation = useNavigation<InvitationAcceptScreenNavigationProp>();
  const route = useRoute<InvitationAcceptScreenRouteProp>();
  const { t } = useTranslation();
  const { token } = route.params;

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    try {
      setLoading(true);
      const invitationData = await invitationService.getInvitationByToken(token);
      setInvitation(invitationData);
    } catch (error) {
      console.error('Error loading invitation:', error);
      Alert.alert('Error', 'Failed to load invitation details');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      setProcessing(true);
      await invitationService.acceptInvitation(token);
      
      Alert.alert(
        'Invitation Accepted',
        `You have successfully joined "${invitation?.projectName}" project!`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('MainTabs'),
          },
        ]
      );
    } catch (error) {
      console.error('Error accepting invitation:', error);
      Alert.alert('Error', 'Failed to accept invitation');
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    try {
      setProcessing(true);
      await invitationService.declineInvitation(token);
      
      Alert.alert(
        'Invitation Declined',
        'You have declined the invitation.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error declining invitation:', error);
      Alert.alert('Error', 'Failed to decline invitation');
    } finally {
      setProcessing(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#D32F2F';
      case 'member': return '#1976D2';
      case 'viewer': return '#388E3C';
      default: return '#666666';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'accepted': return '#4CAF50';
      case 'declined': return '#F44336';
      case 'expired': return '#9E9E9E';
      default: return '#666666';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading invitation...</Text>
      </View>
    );
  }

  if (!invitation) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={64} color="#F44336" />
        <Text style={styles.errorTitle}>Invitation Not Found</Text>
        <Text style={styles.errorText}>
          The invitation you're looking for doesn't exist or has expired.
        </Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Icon name="account-group" size={48} color={theme.colors.primary} />
            <View style={styles.headerText}>
              <Title style={styles.title}>Project Invitation</Title>
              <Paragraph style={styles.subtitle}>
                You've been invited to join a project
              </Paragraph>
            </View>
          </View>

          <View style={styles.invitationDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Project Name:</Text>
              <Text style={styles.value}>{invitation.projectName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Invited by:</Text>
              <Text style={styles.value}>{invitation.inviterName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{invitation.inviterEmail}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Role:</Text>
              <Chip
                style={[styles.chip, { backgroundColor: getRoleColor(invitation.role) + '20' }]}
                textStyle={{ color: getRoleColor(invitation.role) }}
              >
                {invitation.role.toUpperCase()}
              </Chip>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Status:</Text>
              <Chip
                style={[styles.chip, { backgroundColor: getStatusColor(invitation.status) + '20' }]}
                textStyle={{ color: getStatusColor(invitation.status) }}
              >
                {invitation.status.toUpperCase()}
              </Chip>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Expires:</Text>
              <Text style={styles.value}>
                {new Date(invitation.expiresAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleAccept}
          loading={processing}
          disabled={processing || invitation.status !== 'pending'}
          style={styles.acceptButton}
        >
          Accept Invitation
        </Button>

        <Button
          mode="outlined"
          onPress={handleDecline}
          loading={processing}
          disabled={processing || invitation.status !== 'pending'}
          style={styles.declineButton}
        >
          Decline Invitation
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background || '#F5F5F5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background || '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary || '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background || '#F5F5F5',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F44336',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.textSecondary || '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerText: {
    marginLeft: 16,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary || '#1976D2',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary || '#666666',
    marginTop: 4,
  },
  invitationDetails: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text || '#333333',
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: theme.colors.textSecondary || '#666666',
    flex: 2,
    textAlign: 'right',
  },
  chip: {
    borderRadius: 16,
  },
  buttonContainer: {
    gap: 12,
  },
  acceptButton: {
    paddingVertical: 8,
  },
  declineButton: {
    paddingVertical: 8,
  },
});

export { InvitationAcceptScreen };