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
import { Card, Title, Paragraph, Button, Chip, FAB, TextInput } from 'react-native-paper';
import { theme } from '@/utils/theme';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type ProjectInvitationsScreenNavigationProp = StackNavigationProp<any, 'ProjectInvitations'>;

interface ProjectInvitation {
  id: string;
  projectId: string;
  projectName: string;
  inviteeEmail: string;
  inviteeName?: string;
  role: 'member' | 'admin' | 'viewer';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  expiresAt: string;
}

const ProjectInvitationsScreen: React.FC = () => {
  const navigation = useNavigation<ProjectInvitationsScreenNavigationProp>();
  const { t } = useTranslation();

  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin' | 'viewer'>('member');

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const invitationsData = await invitationService.getProjectInvitations();
      // setInvitations(invitationsData);
      
      // Mock data for now
      setInvitations([
        {
          id: '1',
          projectId: 'project-1',
          projectName: 'Sample Project 1',
          inviteeEmail: 'user1@example.com',
          inviteeName: 'User One',
          role: 'member',
          status: 'pending',
          createdAt: '2024-01-01T00:00:00Z',
          expiresAt: '2024-12-31T23:59:59Z',
        },
        {
          id: '2',
          projectId: 'project-2',
          projectName: 'Sample Project 2',
          inviteeEmail: 'user2@example.com',
          inviteeName: 'User Two',
          role: 'admin',
          status: 'accepted',
          createdAt: '2024-01-02T00:00:00Z',
          expiresAt: '2024-12-31T23:59:59Z',
        },
      ]);
    } catch (error) {
      console.error('Error loading invitations:', error);
      Alert.alert('Error', 'Failed to load project invitations');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInvitations();
    setRefreshing(false);
  };


  const handleResendInvitation = async (invitationId: string) => {
    try {
      // TODO: Replace with actual API call
      // await invitationService.resendInvitation(invitationId);
      
      Alert.alert('Success', 'Invitation resent successfully');
      loadInvitations(); // Refresh the list
    } catch (error) {
      console.error('Error resending invitation:', error);
      Alert.alert('Error', 'Failed to resend invitation');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
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
              // TODO: Replace with actual API call
              // await invitationService.cancelInvitation(invitationId);
              
              Alert.alert('Success', 'Invitation cancelled successfully');
              loadInvitations(); // Refresh the list
            } catch (error) {
              console.error('Error cancelling invitation:', error);
              Alert.alert('Error', 'Failed to cancel invitation');
            }
          },
        },
      ]
    );
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

  const renderInvitation = ({ item }: { item: ProjectInvitation }) => (
    <Card style={styles.invitationCard}>
        <Card.Content>
          <View style={styles.invitationHeader}>
          <View style={styles.projectInfo}>
            <Title style={styles.projectName}>{item.projectName}</Title>
            <Paragraph style={styles.inviteeEmail}>
              {item.inviteeName ? `${item.inviteeName} (${item.inviteeEmail})` : item.inviteeEmail}
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
              Sent: {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="clock" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>
              Expires: {new Date(item.expiresAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {item.status === 'pending' && (
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={() => handleCancelInvitation(item.id)}
              style={styles.cancelButton}
              textColor="#F44336"
            >
              Cancel
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleResendInvitation(item.id)}
              style={styles.resendButton}
            >
              Resend
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderInviteForm = () => (
    <Card style={styles.inviteFormCard}>
      <Card.Content>
        <Title style={styles.formTitle}>Send New Invitation</Title>
        
        <TextInput
          label="Email Address"
          value={inviteEmail}
          onChangeText={setInviteEmail}
          style={styles.input}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={styles.roleSelector}>
          <Text style={styles.roleLabel}>Role:</Text>
          <View style={styles.roleButtons}>
            {(['member', 'admin', 'viewer'] as const).map((role) => (
              <Button
                key={role}
                mode={inviteRole === role ? 'contained' : 'outlined'}
                onPress={() => setInviteRole(role)}
                style={styles.roleButton}
                compact
              >
                {role.toUpperCase()}
              </Button>
            ))}
          </View>
        </View>

        <View style={styles.formButtons}>
          <Button
            mode="outlined"
            onPress={() => setShowInviteForm(false)}
            style={styles.cancelFormButton}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSendInvitation}
            style={styles.sendButton}
          >
            Send Invitation
            </Button>
          </View>
        </Card.Content>
      </Card>
    );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="account-group-plus" size={64} color={theme.colors.textSecondary} />
      <Title style={styles.emptyTitle}>No Project Invitations</Title>
      <Paragraph style={styles.emptyText}>
        You haven't sent any project invitations yet. Tap the + button to invite someone.
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
        ListHeaderComponent={showInviteForm ? renderInviteForm : null}
      />

      <FAB
        icon={showInviteForm ? "close" : "plus"}
        style={styles.fab}
        onPress={() => setShowInviteForm(!showInviteForm)}
        label={showInviteForm ? "Cancel" : "Invite"}
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
  inviteeEmail: {
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
  cancelButton: {
    borderColor: '#F44336',
  },
  resendButton: {
    borderColor: theme.colors.primary || '#1976D2',
  },
  inviteFormCard: {
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary || '#1976D2',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  roleSelector: {
    marginBottom: 16,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text || '#333333',
    marginBottom: 8,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  roleButton: {
    flex: 1,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelFormButton: {
    borderColor: theme.colors.textSecondary || '#666666',
  },
  sendButton: {
    minWidth: 120,
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

export { ProjectInvitationsScreen };