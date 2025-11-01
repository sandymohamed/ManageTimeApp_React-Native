// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   Alert,
//   ActivityIndicator,
// } from 'react-native';
// import { Card, Title, Chip, Button } from 'react-native-paper';
// import { useTranslation } from 'react-i18next';
// import { theme } from '@/utils/theme';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import { projectInvitationService } from '@/services/projectInvitationService';
// import { ProjectInvitation } from '@/types/project';

// const ProjectInvitationsScreen: React.FC = () => {
//   const { t } = useTranslation();

//   const [sentInvitations, setSentInvitations] = useState<ProjectInvitation[]>([]);
//   const [receivedInvitations, setReceivedInvitations] = useState<ProjectInvitation[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     loadInvitations();
//   }, []);

//   const loadInvitations = async () => {
//     try {
//       setLoading(true);
//       const data = await projectInvitationService.getAllUserProjectInvitations();
//       setSentInvitations(data.sent || []);
//       setReceivedInvitations(data.received || []);
//     } catch (error) {
//       console.error('Error loading invitations:', error);
//       Alert.alert(t('common.error'), t('invitations.loadError'));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAccept = async (invitationId: string) => {
//     try {
//       await projectInvitationService.acceptInvitation(invitationId);
//       Alert.alert(t('common.success'), t('invitations.acceptedSuccessfully'));
//       loadInvitations();
//     } catch (error) {
//       console.error('Error accepting invitation:', error);
//       Alert.alert(t('common.error'), t('invitations.acceptError'));
//     }
//   };

//   const handleDecline = async (invitationId: string) => {
//     try {
//       await projectInvitationService.declineInvitation(invitationId);
//       Alert.alert(t('common.success'), t('invitations.declinedSuccessfully'));
//       loadInvitations();
//     } catch (error) {
//       console.error('Error declining invitation:', error);
//       Alert.alert(t('common.error'), t('invitations.declineError'));
//     }
//   };

//   const handleCancel = async (invitationId: string) => {
//     Alert.alert(
//       t('invitations.cancelInvitation'),
//       t('invitations.cancelConfirmation'),
//       [
//         { text: t('common.no'), style: 'cancel' },
//         {
//           text: t('common.yes'),
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               await projectInvitationService.cancelInvitation('', invitationId);
//               Alert.alert(t('common.success'), t('invitations.cancelledSuccessfully'));
//               loadInvitations();
//             } catch (error) {
//               console.error('Error cancelling invitation:', error);
//               Alert.alert(t('common.error'), t('invitations.cancelError'));
//             }
//           },
//         },
//       ]
//     );
//   };

//   const handleResend = async (invitationId: string) => {
//     try {
//       await projectInvitationService.resendInvitation('', invitationId);
//       Alert.alert(t('common.success'), t('invitations.resentSuccessfully'));
//       loadInvitations();
//     } catch (error) {
//       console.error('Error resending invitation:', error);
//       Alert.alert(t('common.error'), t('invitations.resendError'));
//     }
//   };

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//     });
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'PENDING': return '#FF9800';
//       case 'ACCEPTED': return '#4CAF50';
//       case 'DECLINED': return '#F44336';
//       case 'EXPIRED': return '#9E9E9E';
//       default: return '#666666';
//     }
//   };

//   const renderInvitation = (item: ProjectInvitation, type: 'sent' | 'received') => (
//     <Card style={styles.invitationCard} key={item.id}>
//       <Card.Content>
//         <View style={styles.invitationHeader}>
//           <Title style={styles.projectName}>{item.projectName}</Title>
//           <Chip
//             style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + '20' }]}
//             textStyle={{ color: getStatusColor(item.status) }}
//           >
//             {t(`invitations.status.${item.status.toLowerCase()}`)}
//           </Chip>
//         </View>
//         <View style={styles.invitationDetails}>
//           <Text style={styles.detailText}>
//             {type === 'sent' 
//               ? `${t('invitations.to')} ${item.inviteeEmail}` 
//               : `${t('invitations.from')} ${item.inviterName}`}
//           </Text>
//           <Text style={styles.detailText}>{t('projects.role')}: {t(`projects.roles.${item.role.toLowerCase()}`)}</Text>
//           <Text style={styles.detailText}>{t('invitations.sent')}: {formatDate(item.createdAt)}</Text>
//         </View>

//         {/* Action Buttons */}
//         {type === 'received' && item.status === 'PENDING' && (
//           <View style={styles.actionButtons}>
//             <Button
//               mode="contained"
//               onPress={() => handleAccept(item.id)}
//               style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
//               icon="check"
//             >
//               {t('invitations.accept')}
//             </Button>
//             <Button
//               mode="outlined"
//               onPress={() => handleDecline(item.id)}
//               textColor="#F44336"
//               icon="close"
//               style={[styles.actionButton, { borderColor: '#F44336' }]}
//             >
//               {t('invitations.decline')}
//             </Button>
//           </View>
//         )}

//         {type === 'sent' && item.status === 'PENDING' && (
//           <View style={styles.actionButtons}>
//             <Button
//               mode="outlined"
//               onPress={() => handleCancel(item.id)}
//               textColor="#F44336"
//               icon="cancel"
//               style={[styles.actionButton, { borderColor: '#F44336' }]}
//             >
//               {t('common.cancel')}
//             </Button>
//           </View>
//         )}

//         {type === 'sent' && item.status === 'EXPIRED' && (
//           <View style={styles.actionButtons}>
//             <Button
//               mode="contained"
//               onPress={() => handleResend(item.id)}
//               icon="refresh"
//               style={styles.actionButton}
//             >
//               {t('invitations.resend')}
//             </Button>
//           </View>
//         )}
//       </Card.Content>
//     </Card>
//   );

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color={theme.colors.primary} />
//       </View>
//     );
//   }

//   return (
//     <ScrollView style={styles.container}>
//       {/* Sent Invitations Section */}
//       <View style={styles.section}>
//         <View style={styles.titleRow}>
//           <Icon name="send" size={24} color={theme.colors.primary} />
//           <Title style={styles.sectionTitle}>{t('invitations.sentInvitations')}</Title>
//         </View>
//         {sentInvitations.length === 0 ? (
//           <Text style={styles.emptyText}>{t('invitations.noSentInvitations')}</Text>
//         ) : (
//           sentInvitations.map(invitation => renderInvitation(invitation, 'sent'))
//         )}
//       </View>

//       {/* Received Invitations Section */}
//       <View style={styles.section}>
//         <View style={styles.titleRow}>
//           <Icon name="email-receive" size={24} color={theme.colors.primary} />
//           <Title style={styles.sectionTitle}>{t('invitations.receivedInvitations')}</Title>
//         </View>
//         {receivedInvitations.length === 0 ? (
//           <Text style={styles.emptyText}>{t('invitations.noReceivedInvitations')}</Text>
//         ) : (
//           receivedInvitations.map(invitation => renderInvitation(invitation, 'received'))
//         )}
//     </View>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: theme.colors.background || '#F5F5F5',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: theme.colors.background || '#F5F5F5',
//   },
//   section: {
//     marginBottom: 24,
//     padding: 16,
//   },
//   titleRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//     marginBottom: 16,
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: theme.colors.text || '#333333',
//   },
//   invitationCard: {
//     marginBottom: 12,
//     elevation: 2,
//   },
//   invitationHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   projectName: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     flex: 1,
//   },
//   statusChip: {
//     borderRadius: 16,
//   },
//   invitationDetails: {
//     gap: 4,
//   },
//   detailText: {
//     fontSize: 14,
//     color: theme.colors.textSecondary || '#666666',
//   },
//   emptyText: {
//     fontSize: 16,
//     color: theme.colors.textSecondary || '#666666',
//     textAlign: 'center',
//     paddingVertical: 32,
//   },
//   actionButtons: {
//     flexDirection: 'row',
//     justifyContent: 'flex-end',
//     gap: 12,
//     marginTop: 12,
//   },
//   actionButton: {
//     flex: 1,
//   },
// });

// export { ProjectInvitationsScreen };


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Card, Title, Chip, Button, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { theme } from '@/utils/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { projectInvitationService } from '@/services/projectInvitationService';
import { ProjectInvitation } from '@/types/project';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';


const ProjectInvitationsScreen: React.FC = () => {
  const { t } = useTranslation();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const styles = createStyles(theme);

  const [sentInvitations, setSentInvitations] = useState<ProjectInvitation[]>([]);
  const [receivedInvitations, setReceivedInvitations] = useState<ProjectInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      Alert.alert(t('common.error'), t('invitations.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadInvitations();
  };

  const handleAccept = async (invitationId: string) => {
    try {
      await projectInvitationService.acceptInvitation(invitationId);
      Alert.alert(t('common.success'), t('invitations.acceptedSuccessfully'));
      loadInvitations();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      Alert.alert(t('common.error'), t('invitations.acceptError'));
    }
  };

  const handleDecline = async (invitationId: string) => {
    Alert.alert(
      t('invitations.declineInvitation'),
      t('invitations.declineConfirmation'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.decline'),
          style: 'destructive',
          onPress: async () => {
            try {
              await projectInvitationService.declineInvitation(invitationId);
              Alert.alert(t('common.success'), t('invitations.declinedSuccessfully'));
              loadInvitations();
            } catch (error) {
              console.error('Error declining invitation:', error);
              Alert.alert(t('common.error'), t('invitations.declineError'));
            }
          },
        },
      ]
    );
  };

  const handleCancel = async (invitationId: string) => {
    Alert.alert(
      t('invitations.cancelInvitation'),
      t('invitations.cancelConfirmation'),
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('common.yes'),
          style: 'destructive',
          onPress: async () => {
            try {
              await projectInvitationService.cancelInvitation('', invitationId);
              Alert.alert(t('common.success'), t('invitations.cancelledSuccessfully'));
              loadInvitations();
            } catch (error) {
              console.error('Error cancelling invitation:', error);
              Alert.alert(t('common.error'), t('invitations.cancelError'));
            }
          },
        },
      ]
    );
  };

  const handleResend = async (invitationId: string) => {
    try {
      await projectInvitationService.resendInvitation('', invitationId);
      Alert.alert(t('common.success'), t('invitations.resentSuccessfully'));
      loadInvitations();
    } catch (error) {
      console.error('Error resending invitation:', error);
      Alert.alert(t('common.error'), t('invitations.resendError'));
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
      case 'PENDING': return theme.colors.warning;
      case 'ACCEPTED': return theme.colors.success;
      case 'DECLINED': return theme.colors.error;
      case 'EXPIRED': return theme.colors.disabled;
      default: return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return 'clock-outline';
      case 'ACCEPTED': return 'check-circle-outline';
      case 'DECLINED': return 'close-circle-outline';
      case 'EXPIRED': return 'timer-off-outline';
      default: return 'help-circle-outline';
    }
  };

  const renderInvitation = (item: ProjectInvitation, type: 'sent' | 'received') => (
    <Card
      style={[
        styles.invitationCard,
        {
          backgroundColor: theme.colors.surface,
          borderLeftWidth: 4,
          borderLeftColor: getStatusColor(item.status),
        }
      ]}
      key={item.id}
      elevation={2}
    >
      <Card.Content style={styles.cardContent}>
        <View style={styles.invitationHeader}>
          <View style={styles.projectInfo}>
            <Icon
              name="folder-outline"
              size={20}
              color={theme.colors.primary}
              style={styles.projectIcon}
            />
            <Title style={[styles.projectName, { color: theme.colors.text }]}>
              {item.projectName}
            </Title>
          </View>
          <Chip
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + '20' }]}
            textStyle={{ color: getStatusColor(item.status), fontSize: 12 }}
            icon={getStatusIcon(item.status)}
          >
            {t(`invitations.status.${item.status.toLowerCase()}`)}
          </Chip>
        </View>

        <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

        <View style={styles.invitationDetails}>
          <View style={styles.detailRow}>
            <Icon
              name={type === 'sent' ? "email-send-outline" : "email-receive-outline"}
              size={16}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.detailText}>
              {type === 'sent'
                ? `${t('invitations.to')} ${item.inviteeEmail}`
                : `${t('invitations.from')} ${item.inviterName}`}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="account-cog-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>
              {t('projects.role')}: <Text style={styles.roleText}>{t(`projects.roles.${item.role.toLowerCase()}`)}</Text>
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="calendar-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>{t('invitations.sent')}: {formatDate(item.createdAt)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        {type === 'received' && item.status === 'PENDING' && (
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={() => handleAccept(item.id)}
              style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
              icon="check"
              contentStyle={styles.buttonContent}
            >
              {t('invitations.accept')}
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleDecline(item.id)}
              textColor={theme.colors.error}
              icon="close"
              style={[styles.actionButton, { borderColor: theme.colors.error }]}
              contentStyle={styles.buttonContent}
            >
              {t('invitations.decline')}
            </Button>
          </View>
        )}

        {type === 'sent' && item.status === 'PENDING' && (
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={() => handleCancel(item.id)}
              textColor={theme.colors.error}
              icon="cancel"
              style={[styles.actionButton, { borderColor: theme.colors.error }]}
              contentStyle={styles.buttonContent}
            >
              {t('common.cancel')}
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
              contentStyle={styles.buttonContent}
            >
              {t('invitations.resend')}
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          {t('invitations.loading')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Sent Invitations Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.titleRow}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
              <Icon name="send" size={20} color={theme.colors.primary} />
            </View>
            <Title style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('invitations.sentInvitations')}
            </Title>
          </View>
          <View style={[styles.countBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.countText}>{sentInvitations.length}</Text>
          </View>
        </View>

        {sentInvitations.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="email-remove-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {t('invitations.noSentInvitations')}
            </Text>
          </View>
        ) : (
          sentInvitations.map(invitation => renderInvitation(invitation, 'sent'))
        )}
      </View>

      <Divider style={[styles.sectionDivider, { backgroundColor: theme.colors.outline }]} />

      {/* Received Invitations Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.titleRow}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.secondary + '20' }]}>
              <Icon name="email-receive" size={20} color={theme.colors.secondary} />
            </View>
            <Title style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('invitations.receivedInvitations')}
            </Title>
          </View>
          <View style={[styles.countBadge, { backgroundColor: theme.colors.secondary }]}>
            <Text style={styles.countText}>{receivedInvitations.length}</Text>
          </View>
        </View>

        {receivedInvitations.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="email-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {t('invitations.noReceivedInvitations')}
            </Text>
          </View>
        ) : (
          receivedInvitations.map(invitation => renderInvitation(invitation, 'received'))
        )}
      </View>
    </ScrollView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  section: {
    marginBottom: 8,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionDivider: {
    marginHorizontal: 16,
    height: 1,
  },
  invitationCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardContent: {
    paddingVertical: 8,
  },
  invitationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  projectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  projectIcon: {
    marginRight: 8,
  },
  projectName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  statusChip: {
    borderRadius: 12,
    height: 28,
  },
  divider: {
    marginVertical: 12,
    height: 1,
  },
  invitationDetails: {
    gap: 8,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  roleText: {
    fontWeight: '600',
    color: theme.colors.text,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
  },
  buttonContent: {
    height: 36,
  },
});

export { ProjectInvitationsScreen };