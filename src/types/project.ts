export enum ProjectRole {
  OWNER = 'OWNER',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  color: string;
  ownerId: string;
  members: ProjectMember[];
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  isDeleted: boolean;
}

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export interface ProjectMember {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: ProjectRole;
  joinedAt: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  color?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  color?: string;
  startDate?: string;
  endDate?: string;
}

export interface AddMemberData {
  userId: string;
  role: ProjectRole;
}

export interface UpdateMemberRoleData {
  role: ProjectRole;
}
