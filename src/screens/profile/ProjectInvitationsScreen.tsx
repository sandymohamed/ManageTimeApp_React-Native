// @ts-ignore - React version compatibility issue
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Card, Title, Paragraph, Button, Chip, Searchbar, Menu, Divider } from 'react-native-paper';
import { theme } from '@/utils/theme';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { projectInvitationService } from '@/services/projectInvitationService';
import { ProjectInvitation as ApiProjectInvitation, ProjectRole } from '@/types/project';

type ProjectInvitationsScreenNavigationProp = StackNavigationProp<any, 'ProjectInvitations'>;

// Use the API interface directly
type ProjectInvitation = ApiProjectInvitation & {
  respondedAt?: string;
};

const ProjectInvitationsScreen: React.FC = () => {
  const navigation = useNavigation<ProjectInvitationsScreenNavigationProp>();
  const { t } = useTranslation();

  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [filteredInvitations, setFilteredInvitations] = useState<ProjectInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'project'>('date');
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    loadInvitations();
  }, []);

  useEffect(() => {
    filterAndSortInvitations();
  }, [invitations, searchQuery, statusFilter, sortBy]);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const invitationsData = await projectInvitationService.getSentInvitations();
      
      // Map API data to our local format
      const mappedInvitations: ProjectInvitation[] = invitationsData.map(invitation => ({
        ...invitation,
        respondedAt: invitation.acceptedAt || (invitation.status !== 'PENDING' ? invitation.createdAt : undefined),
      }));
      
      setInvitations(mappedInvitations);
    } catch (error) {
      console.error('Error loading invitations:', error);
      Alert.alert('Error', 'Failed to load project invitations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInvitations();
        setRefreshing(false);
  }, []);

  const filterAndSortInvitations = useCallback(() => {
    let filtered = [...invitations];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(invitation =>
        invitation.projectName.toLowerCase().includes(query) ||
        invitation.inviteeEmail.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invitation => invitation.status === statusFilter.toUpperCase());
    }

    // Sort invitations
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        case 'project':
          return a.projectName.localeCompare(b.projectName);
        default:
          return 0;
      }
    });

    setFilteredInvitations(filtered);
  }, [invitations, searchQuery, statusFilter, sortBy]);

  const handleResendInvitation = async (invitationId: string) => {
    try {
      // Find the invitation to get the projectId
      const invitation = invitations.find((inv: ProjectInvitation) => inv.id === invitationId);
      if (!invitation) {
        Alert.alert('Error', 'Invitation not found');
        return;
      }

      await projectInvitationService.resendInvitation(invitation.projectId, invitationId);
      
      Alert.alert('Success', 'Invitation resent successfully');
      loadInvitations(); // Refresh the list
    } catch (error) {
      console.error('Error resending invitation:', error);
      Alert.alert('Error', 'Failed to resend invitation. Please try again.');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    Alert.alert(
      'Cancel Invitation',
      'Are you sure you want to cancel this invitation? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Cancel Invitation',
          style: 'destructive',
          onPress: async () => {
            try {
              // Find the invitation to get the projectId
              const invitation = invitations.find((inv: ProjectInvitation) => inv.id === invitationId);
              if (!invitation) {
                Alert.alert('Error', 'Invitation not found');
                return;
              }

              await projectInvitationService.cancelInvitation(invitation.projectId, invitationId);
              
              Alert.alert('Success', 'Invitation cancelled successfully');
              loadInvitations(); // Refresh the list
            } catch (error) {
              console.error('Error cancelling invitation:', error);
              Alert.alert('Error', 'Failed to cancel invitation. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleViewProject = (projectId: string) => {
    // Navigate to project details
    navigation.navigate('ProjectDetail', { projectId });
  };

  const getRoleColor = (role: ProjectRole) => {
    switch (role) {
      case ProjectRole.OWNER: return '#D32F2F';
      case ProjectRole.EDITOR: return '#1976D2';
      case ProjectRole.VIEWER: return '#388E3C';
      default: return '#666666';
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return 'clock-outline';
      case 'ACCEPTED': return 'check-circle';
      case 'DECLINED': return 'close-circle';
      case 'EXPIRED': return 'clock-alert';
      default: return 'help-circle';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;
    return 'Expires soon';
  };

  const renderInvitation = ({ item }: { item: ProjectInvitation }) => (
    <Card style={styles.invitationCard}>
        <Card.Content>
          <View style={styles.invitationHeader}>
          <View style={styles.projectInfo}>
            <TouchableOpacity onPress={() => handleViewProject(item.projectId)}>
              <Title style={styles.projectName}>{item.projectName}</Title>
            </TouchableOpacity>
            {/* @ts-ignore - React Native Paper Paragraph component type issue */}
            <Paragraph style={styles.inviteeEmail}>
              {item.inviteeEmail}
            </Paragraph>
          </View>
          <View style={styles.statusContainer}>
            {/* @ts-ignore - React Native Paper Chip component type issue */}
            <Chip
              style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + '20' }]}
              textStyle={{ color: getStatusColor(item.status) }}
              icon={() => <Icon name={getStatusIcon(item.status)} size={16} color={getStatusColor(item.status)} />}
            >
              {item.status.toUpperCase()}
            </Chip>
          </View>
            </View>

        <View style={styles.invitationDetails}>
          <View style={styles.detailRow}>
            <Icon name="account" size={16} color={theme.colors.textSecondary} />
            {/* @ts-ignore - React Native Paper Chip component type issue */}
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
              Sent: {formatDate(item.createdAt)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="clock" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>
              Expires: {formatDate(item.expiresAt)}
            </Text>
          </View>

          {item.respondedAt && (
            <View style={styles.detailRow}>
              <Icon name="check" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.detailText}>
                Responded: {formatDate(item.respondedAt)}
              </Text>
            </View>
          )}

          {item.status === 'PENDING' && (
            <View style={styles.detailRow}>
              <Icon name="timer" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.detailText, { color: getStatusColor('PENDING') }]}>
                {getTimeRemaining(item.expiresAt)}
              </Text>
            </View>
          )}
        </View>

        {item.status === 'PENDING' && (
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={() => handleCancelInvitation(item.id)}
              style={styles.cancelButton}
              textColor="#F44336"
              icon="close"
            >
              Cancel
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleResendInvitation(item.id)}
              style={styles.resendButton}
              icon="send"
            >
              Resend
            </Button>
          </View>
        )}

        {item.status === 'EXPIRED' && (
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={() => handleResendInvitation(item.id)}
              style={styles.resendButton}
              icon="refresh"
            >
              Resend
            </Button>
          </View>
        )}
        </Card.Content>
      </Card>
    );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="account-group" size={64} color={theme.colors.textSecondary} />
      <Title style={styles.emptyTitle}>No Project Invitations</Title>
      {/* @ts-ignore - React Native Paper Paragraph component type issue */}
      <Paragraph style={styles.emptyText}>
        {searchQuery || statusFilter !== 'all' 
          ? 'No invitations match your current filters.'
          : 'You haven\'t sent any project invitations yet.'
        }
      </Paragraph>
      {(searchQuery || statusFilter !== 'all') && (
        <Button
          mode="outlined"
          onPress={() => {
            setSearchQuery('');
            setStatusFilter('all');
          }}
          style={styles.clearFiltersButton}
        >
          Clear Filters
        </Button>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Searchbar
        placeholder="Search invitations..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      <View style={styles.filterRow}>
        {/* @ts-ignore - React Native Paper Menu component type issue */}
        <Menu
          visible={showStatusMenu}
          onDismiss={() => setShowStatusMenu(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setShowStatusMenu(true)}
              icon="filter"
              style={styles.filterButton}
            >
              {statusFilter === 'all' ? 'All Status' : statusFilter.toUpperCase()}
            </Button>
          }
        >
          <Menu.Item onPress={() => { setStatusFilter('all'); setShowStatusMenu(false); }} title="All Status" />
          <Menu.Item onPress={() => { setStatusFilter('PENDING'); setShowStatusMenu(false); }} title="Pending" />
          <Menu.Item onPress={() => { setStatusFilter('ACCEPTED'); setShowStatusMenu(false); }} title="Accepted" />
          <Menu.Item onPress={() => { setStatusFilter('DECLINED'); setShowStatusMenu(false); }} title="Declined" />
          <Menu.Item onPress={() => { setStatusFilter('EXPIRED'); setShowStatusMenu(false); }} title="Expired" />
        </Menu>

        {/* @ts-ignore - React Native Paper Menu component type issue */}
        <Menu
          visible={showSortMenu}
          onDismiss={() => setShowSortMenu(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setShowSortMenu(true)}
              icon="sort"
              style={styles.sortButton}
            >
              Sort
            </Button>
          }
        >
          <Menu.Item onPress={() => { setSortBy('date'); setShowSortMenu(false); }} title="By Date" />
          <Menu.Item onPress={() => { setSortBy('status'); setShowSortMenu(false); }} title="By Status" />
          <Menu.Item onPress={() => { setSortBy('project'); setShowSortMenu(false); }} title="By Project" />
        </Menu>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {filteredInvitations.length} invitation{filteredInvitations.length !== 1 ? 's' : ''}
        </Text>
        {statusFilter !== 'all' && (
          <Text style={styles.statsSubtext}>
            (filtered from {invitations.length} total)
          </Text>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading invitations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredInvitations}
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
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary || '#666666',
  },
  listContainer: {
    paddingBottom: 20,
  },
  header: {
    padding: 16,
    backgroundColor: theme.colors.surface || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline || '#E0E0E0',
  },
  searchBar: {
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  filterButton: {
    flex: 1,
  },
  sortButton: {
    flex: 1,
  },
  statsContainer: {
    alignItems: 'center',
  },
  statsText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text || '#333333',
  },
  statsSubtext: {
    fontSize: 12,
    color: theme.colors.textSecondary || '#666666',
    marginTop: 2,
  },
  invitationCard: {
    margin: 16,
    marginTop: 0,
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
    color: theme.colors.primary || '#1976D2',
    marginBottom: 4,
  },
  inviteeEmail: {
    fontSize: 14,
    color: theme.colors.textSecondary || '#666666',
  },
  statusContainer: {
    alignItems: 'flex-end',
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
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
    marginBottom: 16,
  },
  clearFiltersButton: {
    marginTop: 8,
  },
});

export { ProjectInvitationsScreen };