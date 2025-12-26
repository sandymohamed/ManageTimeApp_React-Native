import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TextInput, Button, Card, Title, Paragraph } from 'react-native-paper';
import { theme } from '@/utils/theme';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '@/store/projectStore';
import { ProjectStatus } from '@/types/project';

type ProjectEditScreenRouteProp = RouteProp<{ ProjectEdit: { projectId: string } }, 'ProjectEdit'>;
type ProjectEditScreenNavigationProp = StackNavigationProp<any, 'ProjectEdit'>;

interface ProjectData {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  color: string;
}

const ProjectEditScreen: React.FC = () => {
  const navigation = useNavigation<ProjectEditScreenNavigationProp>();
  const route = useRoute<ProjectEditScreenRouteProp>();
  const { t } = useTranslation();
  const { projectId } = route.params;
  const { currentProject, fetchProject, updateProject, deleteProject, isLoading } = useProjectStore();

  const [projectData, setProjectData] = useState<ProjectData>({
    id: projectId,
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: ProjectStatus.PLANNING,
    color: '#1976D2',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load project data when component mounts or projectId changes
    const loadProjectData = async () => {
      try {
        setLoading(true);
        await fetchProject(projectId);
      } catch (error) {
        console.error('Error loading project:', error);
        Alert.alert(t('common.error'), t('projects.loadError'));
      } finally {
        setLoading(false);
      }
    };
    
    loadProjectData();
  }, [projectId, fetchProject]);

  useEffect(() => {
    // Update form when currentProject is loaded
    if (currentProject && currentProject.id === projectId) {
      setProjectData({
        id: currentProject.id,
        name: currentProject.name || '',
        description: currentProject.description || '',
        startDate: currentProject.startDate || '',
        endDate: currentProject.endDate || '',
        status: currentProject.status || ProjectStatus.PLANNING,
        color: currentProject.color || '#1976D2',
      });
    }
  }, [currentProject, projectId]);

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateProject(projectId, {
        name: projectData.name,
        description: projectData.description,
        startDate: projectData.startDate || undefined,
        endDate: projectData.endDate || undefined,
        status: projectData.status,
        color: projectData.color,
      });
      
      Alert.alert(t('common.success'), t('projects.projectUpdated'), [
        {
          text: t('common.ok'),
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error updating project:', error);
      Alert.alert(t('common.error'), t('projects.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t('projects.deleteProject'),
      t('projects.deleteConfirmation'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteProject(projectId);
              
              Alert.alert(t('common.success'), t('projects.projectDeleted'), [
                {
                  text: t('common.ok'),
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error) {
              console.error('Error deleting project:', error);
              Alert.alert(t('common.error'), t('projects.deleteError'));
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Edit Project</Title>
            <Paragraph style={styles.subtitle}>
              Update project details and settings
            </Paragraph>

            <TextInput
              label="Project Name"
              value={projectData.name}
              onChangeText={(text) => setProjectData({ ...projectData, name: text })}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Description"
              value={projectData.description}
              onChangeText={(text) => setProjectData({ ...projectData, description: text })}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
            />

            <View style={styles.row}>
              <TextInput
                label="Start Date"
                value={projectData.startDate}
                onChangeText={(text) => setProjectData({ ...projectData, startDate: text })}
                style={[styles.input, styles.halfInput]}
                mode="outlined"
                placeholder="YYYY-MM-DD"
              />
              <TextInput
                label="End Date"
                value={projectData.endDate}
                onChangeText={(text) => setProjectData({ ...projectData, endDate: text })}
                style={[styles.input, styles.halfInput]}
                mode="outlined"
                placeholder="YYYY-MM-DD"
              />
            </View>

            <TextInput
              label="Status"
              value={projectData.status}
              onChangeText={(text) => setProjectData({ ...projectData, status: text as ProjectStatus })}
              style={styles.input}
              mode="outlined"
              placeholder="PLANNING, ACTIVE, ON_HOLD, DONE, CANCELLED, ARCHIVED"
            />

            <TextInput
              label="Color"
              value={projectData.color}
              onChangeText={(text) => setProjectData({ ...projectData, color: text })}
              style={styles.input}
              mode="outlined"
              placeholder="#1976D2"
            />
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading || isLoading}
            disabled={loading || isLoading}
            style={styles.saveButton}
          >
            Save Changes
          </Button>

          <Button
            mode="outlined"
            onPress={handleDelete}
            loading={loading || isLoading}
            disabled={loading || isLoading}
            style={styles.deleteButton}
            buttonColor="transparent"
            textColor="#D32F2F"
          >
            Delete Project
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background || '#F5F5F5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary || '#1976D2',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary || '#666666',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  buttonContainer: {
    marginTop: 24,
    gap: 12,
  },
  saveButton: {
    paddingVertical: 8,
  },
  deleteButton: {
    paddingVertical: 8,
    borderColor: '#D32F2F',
  },
});

export { ProjectEditScreen };
