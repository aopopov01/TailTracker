/**
 * Family coordination and wellness types
 */

export type FamilyRole = 'owner' | 'caregiver' | 'viewer' | 'vet_professional';

export type Permission = 
  | 'manage_care_tasks'
  | 'manage_family'
  | 'view_health_records'
  | 'emergency_access'
  | 'read'
  | 'write'
  | 'delete';

export interface PermissionSet {
  read: boolean;
  write: boolean;
  delete: boolean;
}

export interface FamilyMember {
  id: string;
  userId: string;
  petId: string;
  role: FamilyRole;
  permissions: PermissionSet;
  name: string;
  email: string;
  joinedAt: Date;
  lastActive?: Date;
}

export interface CareTask {
  id: string;
  petId: string;
  title: string;
  description: string;
  type: 'feeding' | 'walking' | 'medication' | 'grooming' | 'vet_visit' | 'other';
  status: 'pending' | 'completed' | 'overdue';
  assignedTo?: string;
  dueDate: Date;
  completedAt?: Date;
  notes?: string;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
  };
}

export interface WellnessAlert {
  id: string;
  petId: string;
  type: 'health' | 'behavior' | 'emergency' | 'reminder';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  createdAt: Date;
  acknowledgedBy?: string[];
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export interface FamilyMessage {
  id: string;
  petId: string;
  senderId: string;
  type: 'text' | 'task_update' | 'health_alert' | 'photo' | 'file';
  messageType: 'text' | 'task_update' | 'health_alert' | 'photo' | 'file';
  content: string;
  timestamp: Date;
  readBy: string[];
  metadata?: Record<string, any>;
  attachments?: {
    type: 'image' | 'document';
    url: string;
    fileName: string;
  }[];
}

export interface FamilyActivity {
  id: string;
  petId: string;
  userId: string;
  type: 'task_completed' | 'member_joined' | 'alert_acknowledged' | 'pet_updated' | 'message_sent';
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}