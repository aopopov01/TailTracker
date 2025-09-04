// Wellness and Care Management Types for TailTracker

export interface WellnessMetrics {
  id: string;
  petId: string;
  date: string;
  weight: number; // in kg
  temperature?: number; // in celsius
  heartRate?: number; // bpm
  activityLevel: ActivityLevel;
  moodScore: number; // 1-10 scale
  appetiteScore: number; // 1-10 scale
  energyLevel: number; // 1-10 scale
  sleepHours: number;
  hydrationLevel: number; // 1-10 scale
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ActivityLevel = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';

export interface CareTask {
  id: string;
  petId: string;
  type: CareTaskType;
  title: string;
  description: string;
  dueDate: string;
  completedAt?: string;
  priority: TaskPriority;
  recurring: RecurrencePattern | null;
  assignedTo?: string; // family member ID
  reminderSettings: ReminderSettings;
  attachments?: TaskAttachment[];
  completionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CareTaskType = 
  | 'feeding'
  | 'medication'
  | 'grooming'
  | 'exercise'
  | 'vet_appointment'
  | 'vaccination'
  | 'dental_care'
  | 'flea_tick_prevention'
  | 'weight_check'
  | 'training'
  | 'socialization'
  | 'other';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'custom';
  interval: number; // e.g., every 2 weeks
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  endDate?: string;
  maxOccurrences?: number;
}

export interface ReminderSettings {
  enabled: boolean;
  advanceNotice: number; // minutes before due time
  repeatInterval?: number; // minutes between repeat notifications
  maxRepeats?: number;
  notificationChannels: NotificationChannel[];
}

export type NotificationChannel = 'push' | 'email' | 'sms';

export interface TaskAttachment {
  id: string;
  type: 'photo' | 'document' | 'video';
  uri: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

export interface HealthRecord {
  id: string;
  petId: string;
  type: HealthRecordType;
  title: string;
  description: string;
  date: string;
  veterinarian?: VeterinarianInfo;
  diagnosis?: string;
  treatment?: string;
  medications?: Medication[];
  followUpDate?: string;
  attachments?: HealthAttachment[];
  cost?: number;
  insuranceClaim?: InsuranceClaim;
  createdAt: string;
  updatedAt: string;
}

export type HealthRecordType = 
  | 'checkup'
  | 'vaccination'
  | 'illness'
  | 'injury'
  | 'surgery'
  | 'dental'
  | 'emergency'
  | 'lab_results'
  | 'medication'
  | 'other';

export interface VeterinarianInfo {
  id: string;
  name: string;
  clinic: string;
  phone: string;
  email?: string;
  address?: string;
  specialty?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  instructions: string;
  sideEffects?: string[];
  cost?: number;
}

export interface HealthAttachment {
  id: string;
  type: 'medical_report' | 'xray' | 'lab_result' | 'prescription' | 'photo' | 'document';
  uri: string;
  filename: string;
  description?: string;
  uploadedAt: string;
}

export interface InsuranceClaim {
  id: string;
  provider: string;
  claimNumber: string;
  status: ClaimStatus;
  submittedDate: string;
  processedDate?: string;
  coverageAmount: number;
  deductible: number;
  reimbursedAmount?: number;
}

export type ClaimStatus = 'pending' | 'processing' | 'approved' | 'denied' | 'paid';


export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: FamilyRole;
  permissions: Permission[];
  profilePicture?: string;
  phone?: string;
  preferredNotifications: NotificationChannel[];
  joinedAt: string;
  lastActiveAt: string;
}

export type FamilyRole = 'owner' | 'caregiver' | 'viewer' | 'vet_professional';

export type Permission = 
  | 'view_all_pets'
  | 'edit_pet_info'
  | 'manage_care_tasks'
  | 'view_health_records'
  | 'edit_health_records'
  | 'manage_family'
  | 'emergency_access'
  | 'schedule_appointments'
  | 'manage_medications';

export interface CareRoutine {
  id: string;
  petId: string;
  name: string;
  description: string;
  tasks: RoutineTask[];
  schedule: RoutineSchedule;
  isActive: boolean;
  assignedTo?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RoutineTask {
  id: string;
  title: string;
  description: string;
  estimatedDuration: number; // minutes
  order: number;
  isOptional: boolean;
  checklistItems?: string[];
}

export interface RoutineSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  times: string[]; // HH:MM format
  daysOfWeek?: number[]; // for weekly routines
  daysOfMonth?: number[]; // for monthly routines
}

export interface WellnessAlert {
  id: string;
  petId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  triggeredBy: AlertTrigger;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  actionRequired?: boolean;
  suggestedActions?: string[];
}

export type AlertType = 
  | 'health_concern'
  | 'medication_overdue'
  | 'appointment_reminder'
  | 'weight_change'
  | 'behavioral_change'
  | 'routine_missed'
  | 'emergency'
  | 'general';

export type AlertSeverity = 'info' | 'warning' | 'critical' | 'emergency';

export type AlertTrigger = 
  | 'manual'
  | 'scheduled'
  | 'threshold'
  | 'pattern_detection'
  | 'family_member'
  | 'system';


// Analytics and Reporting Types
export interface WellnessReport {
  id: string;
  petId: string;
  reportType: ReportType;
  title: string;
  period: ReportPeriod;
  generatedAt: string;
  data: ReportData;
}

export type ReportType = 
  | 'weekly_summary'
  | 'monthly_summary'
  | 'health_overview'
  | 'care_compliance'
  | 'progress_report'
  | 'custom';

export interface ReportPeriod {
  startDate: string;
  endDate: string;
  label: string;
}

export interface ReportData {
  summary: ReportSummary;
  metrics: ReportMetric[];
  achievements: string[];
  concerns: string[];
  recommendations: string[];
}

export interface ReportSummary {
  totalTasks: number;
  completedTasks: number;
  overdueItems: number;
  healthScore: number; // 0-100
  complianceRate: number; // 0-100
}

export interface ReportMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changeFromPrevious: number;
  status: 'good' | 'warning' | 'concern';
}