import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Card, Title, Chip, Button } from 'react-native-paper';
import { theme } from '@/utils/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { projectInvitationService } from '@/services/projectInvitationService';
import { ProjectInvitation } from '@/types/project';

const ProjectInvitationsScreen: React.FC = () => {

  const [sentInvitations, setSentInvitations] = useState<ProjectInvitation[]>([]);
  const [receivedInvitations, setReceivedInvitations] = useState<ProjectInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const data = await projectInvitationService.getAllUserProjectInvitations();
      setSentInvitations(data.sent || []);
      setReceivedInvitations(data.received || []);
    } catch (error) {
      console.error('Error loading invitations:', error);
      Alert.alert('Error', 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId: string) => {
    try {
      await projectInvitationService.acceptInvitation(invitationId);
      Alert.alert('Success', 'Invitation accepted');
      loadInvitations();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      Alert.alert('Error', 'Failed to accept invitation');
    }
  };

  const handleDecline = async (invitationId: string) => {
    try {
      await projectInvitationService.declineInvitation(invitationId);
      Alert.alert('Success', 'Invitation declined');
      loadInvitations();
    } catch (error) {
      console.error('Error declining invitation:', error);
      Alert.alert('Error', 'Failed to decline invitation');
    }
  };

  const handleCancel = async (invitationId: string) => {
    Alert.alert(
      'Cancel Invitation',
      'Are you sure you want to cancel this invitation?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await projectInvitationService.cancelInvitation('', invitationId);
              Alert.alert('Success', 'Invitation cancelled');
              loadInvitations();
            } catch (error) {
              console.error('Error cancelling invitation:', error);
              Alert.alert('Error', 'Failed to cancel invitation');
            }
          },
        },
      ]
    );
  };

  const handleResend = async (invitationId: string) => {
    try {
      await projectInvitationService.resendInvitation('', invitationId);
      Alert.alert('Success', 'Invitation resent');
      loadInvitations();
    } catch (error) {
      console.error('Error resending invitation:', error);
      Alert.alert('Error', 'Failed to resend invitation');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#FF9800';
      case 'ACCEPTED': return '#4CAF50';
      case 'DECLINED': return '#F44336';
      case 'EXPIRED': return '#9E9E9E';
      default: return '#666666';
    }
  };

  const renderInvitation = (item: ProjectInvitation, type: 'sent' | 'received') => (
    <Card style={styles.invitationCard} key={item.id}>
      <Card.Content>
        <View style={styles.invitationHeader}>
          <Title style={styles.projectName}>{item.projectName}</Title>
          <Chip
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + '20' }]}
            textStyle={{ color: getStatusColor(item.status) }}
          >
            {item.status}
          </Chip>
        </View>
        <View style={styles.invitationDetails}>
          <Text style={styles.detailText}>
            {type === 'sent' ? `To: ${item.inviteeEmail}` : `From: ${item.inviterName}`}
          </Text>
          <Text style={styles.detailText}>Role: {item.role}</Text>
          <Text style={styles.detailText}>Sent: {formatDate(item.createdAt)}</Text>
        </View>

        {/* Action Buttons */}
        {type === 'received' && item.status === 'PENDING' && (
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={() => handleAccept(item.id)}
              style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
              icon="check"
            >
              Accept
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleDecline(item.id)}
              textColor="#F44336"
              icon="close"
              style={[styles.actionButton, { borderColor: '#F44336' }]}
            >
              Decline
            </Button>
          </View>
        )}

        {type === 'sent' && item.status === 'PENDING' && (
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={() => handleCancel(item.id)}
              textColor="#F44336"
              icon="cancel"
              style={[styles.actionButton, { borderColor: '#F44336' }]}
            >
              Cancel
            </Button>
          </View>
        )}

        {type === 'sent' && item.status === 'EXPIRED' && (
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={() => handleResend(item.id)}
              icon="refresh"
              style={styles.actionButton}
            >
              Resend
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Sent Invitations Section */}
      <View style={styles.section}>
        <View style={styles.titleRow}>
          <Icon name="send" size={24} color={theme.colors.primary} />
          <Title style={styles.sectionTitle}>Sent Invitations</Title>
        </View>
        {sentInvitations.length === 0 ? (
          <Text style={styles.emptyText}>No sent invitations</Text>
        ) : (
          sentInvitations.map(invitation => renderInvitation(invitation, 'sent'))
        )}
      </View>

      {/* Received Invitations Section */}
      <View style={styles.section}>
        <View style={styles.titleRow}>
          <Icon name="email-receive" size={24} color={theme.colors.primary} />
          <Title style={styles.sectionTitle}>Received Invitations</Title>
        </View>
        {receivedInvitations.length === 0 ? (
          <Text style={styles.emptyText}>No received invitations</Text>
        ) : (
          receivedInvitations.map(invitation => renderInvitation(invitation, 'received'))
        )}
    </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background || '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background || '#F5F5F5',
  },
  section: {
    marginBottom: 24,
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text || '#333333',
  },
  invitationCard: {
    marginBottom: 12,
    elevation: 2,
  },
  invitationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statusChip: {
    borderRadius: 16,
  },
  invitationDetails: {
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.textSecondary || '#666666',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary || '#666666',
    textAlign: 'center',
    paddingVertical: 32,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
  },
});

export { ProjectInvitationsScreen };