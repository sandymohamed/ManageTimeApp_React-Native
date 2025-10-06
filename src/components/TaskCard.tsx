// import React from 'react';
// import { View, StyleSheet, TouchableOpacity } from 'react-native';
// import { Card, Text, Chip, IconButton, Badge, useTheme } from 'react-native-paper';
// import { Task, TaskStatus, TaskPriority } from '@/types/task';
// import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
// import { formatDate, isOverdue, isToday, isTomorrow } from '@/utils/dateUtils';

// interface TaskCardProps {
//   task: Task;
//   onPress?: (task: Task) => void;
//   onComplete?: (task: Task) => void;
//   onDelete?: (task: Task) => void;
//   onEdit?: (task: Task) => void;
//   showProject?: boolean;
//   showAssignee?: boolean;
// }

// export const TaskCard: React.FC<TaskCardProps> = ({
//   task,
//   onPress,
//   onComplete,
//   onDelete,
//   onEdit,
//   showProject = true,
//   showAssignee = true,
// }) => {
//   const paperTheme = useTheme();
//   const customTheme = useCustomTheme();
//   const theme = customTheme.theme;
//   const styles = createStyles(theme);

//   const getPriorityColor = (priority: TaskPriority) => {
//     switch (priority) {
//       case TaskPriority.URGENT:
//         return theme.colors.urgent;
//       case TaskPriority.HIGH:
//         return theme.colors.high;
//       case TaskPriority.MEDIUM:
//         return theme.colors.medium;
//       case TaskPriority.LOW:
//         return theme.colors.low;
//       default:
//         return theme.colors.textSecondary;
//     }
//   };

//   const getStatusColor = (status: TaskStatus) => {
//     switch (status) {
//       case TaskStatus.DONE:
//         return theme.colors.completed;
//       case TaskStatus.IN_PROGRESS:
//         return theme.colors.inProgress;
//       case TaskStatus.CANCELLED:
//         return theme.colors.cancelled;
//       default:
//         return theme.colors.pending;
//     }
//   };

//   const getDueDateText = () => {
//     if (!task.dueDate) return null;

//     const dueDate = new Date(task.dueDate);

//     if (isToday(dueDate)) {
//       return 'Due today';
//     } else if (isTomorrow(dueDate)) {
//       return 'Due tomorrow';
//     } else {
//       return `Due ${formatDate(dueDate, 'MMM dd')}`;
//     }
//   };

//   const isTaskOverdue = isOverdue(task.dueDate || new Date()) && task.status !== TaskStatus.DONE;

//   return (
//     <TouchableOpacity onPress={() => onPress?.(task)}>
//       <Card style={[styles.card, isTaskOverdue && styles.overdueCard]}>
//         <Card.Content>
//           <View style={styles.header}>
//             <View style={styles.titleContainer}>
//               <Text variant="titleMedium" style={styles.title} numberOfLines={2}>
//                 {task.title}
//               </Text>
//               {isTaskOverdue && (
//                 <Badge style={styles.overdueBadge} size={8}>
//                   !
//                 </Badge>
//               )}
//             </View>
//             <View style={styles.actions}>
//               {task.status !== TaskStatus.DONE && (
//                 <IconButton
//                   icon="check"
//                   size={20}
//                   onPress={() => onComplete?.(task)}
//                   iconColor={theme.colors.success}
//                 />
//               )}
//               <IconButton
//                 icon="pencil"
//                 size={20}
//                 onPress={() => onEdit?.(task)}
//                 iconColor={theme.colors.primary}
//               />
//               <IconButton
//                 icon="delete"
//                 size={20}
//                 onPress={() => onDelete?.(task)}
//                 iconColor={theme.colors.error}
//               />
//             </View>
//           </View>

//           {task.description && (
//             <Text variant="bodyMedium" style={styles.description} numberOfLines={3}>
//               {task.description}
//             </Text>
//           )}

//           <View style={styles.footer}>
//             <View style={styles.chips}>
//               <Chip
//                 mode="outlined"
//                 textStyle={[styles.chipText, { color: getPriorityColor(task.priority) }]}
//                 style={[styles.chip, { borderColor: getPriorityColor(task.priority) }]}>
//                 {task.priority}
//               </Chip>
//               <Chip
//                 mode="outlined"
//                 textStyle={[styles.chipText, { color: getStatusColor(task.status) }]}
//                 style={[styles.chip, { borderColor: getStatusColor(task.status) }]}>
//                 {task.status.replace('_', ' ')}
//               </Chip>
//             </View>

//             {task?.dueDate && (
//               <Text
//                 variant="bodySmall"
//                 style={[
//                   styles.dueDate,
//                   isTaskOverdue && styles.overdueText,
//                 ]}>
//                 {getDueDateText()}
//               </Text>
//             )}
//           </View>

//           {task?.tags?.length > 0 && (
//             <View style={styles.tags}>
//               {task?.tags?.slice(0, 3).map((tag, index) => (
//                 <Chip
//                   key={index}
//                   mode="outlined"
//                   compact
//                   textStyle={styles.tagText}
//                   style={styles.tag}>
//                   {tag}
//                 </Chip>
//               ))}
//               {task?.tags?.length > 3 && (
//                 <Text variant="bodySmall" style={styles?.moreTags}>
//                   +{task?.tags?.length - 3} more
//                 </Text>
//               )}
//             </View>
//           )}

//           {(showProject || showAssignee) && (
//             <View style={styles.meta}>
//               {showProject && task?.projectId && (
//                 <Text variant="bodySmall" style={styles?.metaText}>
//                   Project: {task?.projectId}
//                 </Text>
//               )}
//               {/* {showAssignee && task?.assignedTo && ( */}
//               {showAssignee && task?.assigneeId && (
//                 <Text variant="bodySmall" style={styles?.metaText}>
//                   Assigned to: {task?.assigneeId}
//                 </Text>
//               )}
//             </View>
//           )}
//         </Card.Content>
//       </Card>
//     </TouchableOpacity>
//   );
// };

// const createStyles = (theme: any) => StyleSheet.create({
//   card: {
//     marginVertical: theme.spacing.xs,
//     marginHorizontal: theme.spacing.sm,
//   },
//   overdueCard: {
//     borderLeftWidth: 4,
//     borderLeftColor: theme.colors.error,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: theme.spacing.xs,
//   },
//   titleContainer: {
//     flex: 1,
//     marginRight: theme.spacing.sm,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   title: {
//     flex: 1,
//   },
//   overdueBadge: {
//     backgroundColor: theme.colors.error,
//     marginLeft: theme.spacing.xs,
//   },
//   actions: {
//     flexDirection: 'row',
//   },
//   description: {
//     color: theme.colors.textSecondary,
//     marginBottom: theme.spacing.sm,
//   },
//   footer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginTop: theme.spacing.sm,
//   },
//   chips: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     flex: 1,
//   },
//   chip: {
//     marginRight: theme.spacing.xs,
//     marginBottom: theme.spacing.xs,
//   },
//   chipText: {
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   dueDate: {
//     color: theme.colors.textSecondary,
//     marginLeft: theme.spacing.sm,
//   },
//   overdueText: {
//     color: theme.colors.error,
//     fontWeight: '600',
//   },
//   tags: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     marginTop: theme.spacing.sm,
//     alignItems: 'center',
//   },
//   tag: {
//     marginRight: theme.spacing.xs,
//     marginBottom: theme.spacing.xs,
//   },
//   tagText: {
//     fontSize: 10,
//   },
//   moreTags: {
//     color: theme.colors.textSecondary,
//     marginLeft: theme.spacing.xs,
//   },
//   meta: {
//     marginTop: theme.spacing.sm,
//     paddingTop: theme.spacing.sm,
//     borderTopWidth: 1,
//     borderTopColor: theme.colors.outline,
//   },
//   metaText: {
//     color: theme.colors.textSecondary,
//     marginBottom: theme.spacing.xs,
//   },
// });



import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Chip, IconButton, Badge, useTheme, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { useTheme as useCustomTheme } from '@/contexts/ThemeContext';
import { formatDate, isOverdue, isToday, isTomorrow } from '@/utils/dateUtils';

interface TaskCardProps {
  task: Task;
  onPress?: (task: Task) => void;
  onComplete?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  showProject?: boolean;
  showAssignee?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onPress,
  onComplete,
  onDelete,
  onEdit,
  showProject = true,
  showAssignee = true,
}) => {
  const paperTheme = useTheme();
  const customTheme = useCustomTheme();
  const theme = customTheme.theme;
  const styles = createStyles(theme);

  // Enhanced color system with better contrast
  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT:
        return theme.colors.urgent || '#dc2626';
      case TaskPriority.HIGH:
        return theme.colors.high || '#ea580c';
      case TaskPriority.MEDIUM:
        return theme.colors.medium || '#d97706';
      case TaskPriority.LOW:
        return theme.colors.low || '#16a34a';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.DONE:
        return theme.colors.completed || '#16a34a';
      case TaskStatus.IN_PROGRESS:
        return theme.colors.inProgress || '#2563eb';
      case TaskStatus.ARCHIVED:
        return theme.colors.archived || '#6b7280';
      default:
        return theme.colors.pending || '#d97706';
    }
  };

  const getDueDateText = () => {
    if (!task.dueDate) return null;

    const dueDate = new Date(task.dueDate);

    if (isToday(dueDate)) {
      return 'Due today';
    } else if (isTomorrow(dueDate)) {
      return 'Due tomorrow';
    } else {
      return `Due ${formatDate(dueDate, 'MMM dd')}`;
    }
  };

  const isTaskOverdue = isOverdue(task.dueDate || new Date()) && task.status !== TaskStatus.DONE;


  // In your TaskCard component, update the icon names:
  const getIconName = (iconType: string) => {
    const iconMap: { [key: string]: string } = {
      'check': 'check-circle-outline',
      'pencil': 'pencil-outline',
      'delete': 'delete-outline',
      // Alternative solid icons:
      // 'check': 'check-circle',
      // 'pencil': 'pencil',
      // 'delete': 'delete',
    };
    return iconMap[iconType] || iconType;
  };

  return (
    <TouchableOpacity
      onPress={() => onPress?.(task)}
      activeOpacity={0.7}
    >
      <Card style={[styles.card, isTaskOverdue && styles.overdueCard]}>
        <Card.Content style={styles.cardContent}>
          {/* Header with title and actions */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text variant="titleMedium" style={styles.title} numberOfLines={2}>
                {task.title}
              </Text>
              {isTaskOverdue && (
                <Badge style={styles.overdueBadge} size={16}>
                  !
                </Badge>
              )}
            </View>
            <View style={styles.actions}>
              {task.status !== TaskStatus.DONE && (
                <IconButton
                  icon={getIconName('check')}
                  size={20}
                  onPress={() => onComplete?.(task)}
                  iconColor={theme.colors.success || '#16a34a'}
                  style={styles.iconButton}
                />
          
          
              )}
              <IconButton
                icon={getIconName('pencil')}
                size={20}
                onPress={() => onEdit?.(task)}
                iconColor={theme.colors.primary || '#2563eb'}
                style={styles.iconButton}
              />
              <IconButton
                icon={getIconName('delete')}
                size={20}
                onPress={() => onDelete?.(task)}
                iconColor={theme.colors.error || '#dc2626'}
                style={styles.iconButton}
              />
            </View>
          </View>

          {/* Description */}
          {task.description && (
            <Text variant="bodyMedium" style={styles.description} numberOfLines={3}>
              {task.description}
            </Text>
          )}

          {/* Priority and Status Chips */}
          <View style={styles.chipContainer}>
            <Chip
              mode="outlined"
              textStyle={[styles.chipText, { color: getPriorityColor(task.priority) }]}
              style={[styles.chip, {
                borderColor: getPriorityColor(task.priority),
                backgroundColor: `${getPriorityColor(task.priority)}15` // 15 = ~8% opacity
              }]}>
              {task.priority.toLowerCase()} cccccccccccc
            </Chip>
            <Chip
              mode="outlined"
              textStyle={[styles.chipText, { color: getStatusColor(task.status) }]}
              style={[styles.chip, {
                borderColor: getStatusColor(task.status),
                backgroundColor: `${getStatusColor(task.status)}15`
              }]}>
              {task.status.replace('_', ' ').toLowerCase()} sssssssssssss
            </Chip>
          </View>

          {/* Due Date */}
          {task?.dueDate && (
            <View style={styles.dueDateContainer}>
              <Text
                variant="bodySmall"
                style={[
                  styles.dueDate,
                  isTaskOverdue && styles.overdueText,
                ]}>
                {getDueDateText()} ddddddddddd
              </Text>
            </View>
          )}

          {/* Tags */}
          {task?.tags?.length > 0 && (
            <View style={styles.tags}>
              {task?.tags?.slice(0, 3).map((tag, index) => (
                <Chip
                  key={index}
                  mode="outlined"
                  compact
                  textStyle={styles.tagText}
                  style={styles.tag}>
                  {tag} tttt
                </Chip>
              ))}
              {task?.tags?.length > 3 && (
                <Text variant="bodySmall" style={styles.moreTags}>
                  +{task?.tags?.length - 3} more
                </Text>
              )}
            </View>
          )}

          {/* Project and Assignee Info */}
          {(showProject || showAssignee) && (
            <View style={styles.meta}>
              {showProject && task?.projectId && (
                <View style={styles.metaItem}>
                  <Text variant="bodySmall" style={styles.metaLabel}>
                    Project:
                  </Text>
                  <Text variant="bodySmall" style={styles.metaValue}>
                    {task?.projectId}
                  </Text>
                </View>
              )}
              {showAssignee && task?.assigneeId && (
                <View style={styles.metaItem}>
                  <Text variant="bodySmall" style={styles.metaLabel}>
                    Assignee:
                  </Text>
                  <Text variant="bodySmall" style={styles.metaValue}>
                    {task?.assigneeId}
                  </Text>
                </View>
              )}
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  card: {
    marginVertical: theme.spacing.xs,
    marginHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.surface, // Use surface color for better theme compatibility
    elevation: 2,
    shadowColor: theme.colors.shadow || '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardContent: {
    paddingVertical: theme.spacing.md,
  },
  overdueCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error || '#dc2626',
    backgroundColor: `${theme.colors.error || '#dc2626'}08`, // Subtle background tint for overdue
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  titleContainer: {
    flex: 1,
    marginRight: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    color: theme.colors.onPrimary,
    fontWeight: '600',
    lineHeight: 22,
  },
  overdueBadge: {
    backgroundColor: theme.colors.error || '#dc2626',
    marginLeft: theme.spacing.xs,
    color: theme.colors.onError || '#fff',
  },
  actions: {
    flexDirection: 'row',
  },
  iconButton: {
    margin: -4, // Reduce default padding for tighter layout
  },
  description: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.sm,
  },
  chip: {
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    borderWidth: 1.5,
    height: 28,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '400',
    textTransform: 'capitalize',
    lineHeight: 8,
  },
  dueDateContainer: {
    marginBottom: theme.spacing.sm,
  },
  dueDate: {
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  overdueText: {
    color: theme.colors.error || '#dc2626',
    fontWeight: '600',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
  },
  tag: {
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    backgroundColor: `${theme.colors.primary || '#2563eb'}08`,
    borderColor: theme.colors.outline,
  },
  tagText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  moreTags: {
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
    fontStyle: 'italic',
  },
  meta: {
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline || '#e5e7eb',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  metaLabel: {
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginRight: theme.spacing.xs,
  },
  metaValue: {
    color: theme.colors.textPrimary,
    fontWeight: '400',
  },
});