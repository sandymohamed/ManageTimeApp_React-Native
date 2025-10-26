import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Card, Title, Paragraph, Button, Chip, FAB } from 'react-native-paper';
import { theme } from '@/utils/theme';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type PendingInvitationsScreenNavigationProp = StackNavigationProp<any, 'PendingInvitations'>;

interface PendingInvitation {
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

const PendingInvitationsScreen: React.FC = () => {
  const navigation = useNavigation<PendingInvitationsScreenNavigationProp>();
  const { t } = useTranslation();

  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      // Call API to get pending invitations
      const invitationsData = await invitationService.getPendingInvitations();
      setInvitations(invitationsData);
    } catch (error) {
      console.error('Error loading invitations:', error);
      Alert.alert('Error', 'Failed to load pending invitations');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInvitations();
    setRefreshing(false);
  };

  const handleAccept = async (invitationId: string) => {
    try {
      await invitationService.acceptInvitation(invitationId);
      
      Alert.alert('Success', 'Invitation accepted successfully');
      loadInvitations(); // Refresh the list
    } catch (error) {
      console.error('Error accepting invitation:', error);
      Alert.alert('Error', 'Failed to accept invitation');
    }
  };

  const handleDecline = async (invitationId: string) => {
    try {
      await invitationService.declineInvitation(invitationId);
      
      Alert.alert('Success', 'Invitation declined successfully');
      loadInvitations(); // Refresh the list
    } catch (error) {
      console.error('Error declining invitation:', error);
      Alert.alert('Error', 'Failed to decline invitation');
    }
  };

  const handleViewDetails = (invitation: PendingInvitation) => {
    // Navigate to invitation details or accept screen
    navigation.navigate('InvitationAccept', { token: invitation.id });
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

  const renderInvitation = ({ item }: { item: PendingInvitation }) => (
    <Card style={styles.invitationCard}>
        <Card.Content>
          <View style={styles.invitationHeader}>
            <View style={styles.projectInfo}>
            <Title style={styles.projectName}>{item.projectName}</Title>
            <Paragraph style={styles.inviterName}>
              Invited by {item.inviterName}
            </Paragraph>
          </View>
          <Chip
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + '20' }]}
            textStyle={{ color: getStatusColor(item.status) }}
          >
            {item.status.toUpperCase()}
          </Chip>
        </View>

        <View style={styles.invitationDetails}>
          <View style={styles.detailRow}>
            <Icon name="email" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>{item.inviterEmail}</Text>
            </View>

          <View style={styles.detailRow}>
            <Icon name="account" size={16} color={theme.colors.textSecondary} />
            <Chip
              style={[styles.roleChip, { backgroundColor: getRoleColor(item.role) + '20' }]}
              textStyle={{ color: getRoleColor(item.role) }}
            >
              {item.role.toUpperCase()}
            </Chip>
          </View>

          <View style={styles.detailRow}>
            <Icon name="calendar" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>
              Expires: {new Date(item.expiresAt).toLocaleDateString()}
            </Text>
          </View>
          </View>

        {item.status === 'pending' && (
            <View style={styles.actionButtons}>
              <Button
                mode="outlined"
              onPress={() => handleDecline(item.id)}
              style={styles.declineButton}
              textColor="#F44336"
            >
              Decline
              </Button>
              <Button
                mode="contained"
              onPress={() => handleAccept(item.id)}
              style={styles.acceptButton}
              >
              Accept
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="inbox" size={64} color={theme.colors.textSecondary} />
      <Title style={styles.emptyTitle}>No Pending Invitations</Title>
      <Paragraph style={styles.emptyText}>
        You don't have any pending project invitations at the moment.
      </Paragraph>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={invitations}
        renderItem={renderInvitation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary || '#1976D2']}
            tintColor={theme.colors.primary || '#1976D2'}
          />
        }
        ListEmptyComponent={!loading ? renderEmptyState : null}
        showsVerticalScrollIndicator={false}
      />

      <FAB
        icon="refresh"
        style={styles.fab}
        onPress={onRefresh}
        label="Refresh"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background || '#F5F5F5',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  invitationCard: {
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  invitationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  projectInfo: {
    flex: 1,
    marginRight: 16,
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text || '#333333',
    marginBottom: 4,
  },
  inviterName: {
    fontSize: 14,
    color: theme.colors.textSecondary || '#666666',
  },
  statusChip: {
    borderRadius: 16,
  },
  invitationDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.textSecondary || '#666666',
    flex: 1,
  },
  roleChip: {
    borderRadius: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  declineButton: {
    borderColor: '#F44336',
  },
  acceptButton: {
    minWidth: 80,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text || '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary || '#666666',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary || '#1976D2',
  },
});

export { PendingInvitationsScreen };