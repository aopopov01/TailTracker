// DISABLED: Complex family coordination features removed to simplify family management
// Family coordination is now limited to basic view/edit permissions only
// This service is not used in the simplified app

import { format, isToday, isYesterday } from 'date-fns';
import { FamilyMember, CareTask, WellnessAlert, Permission, FamilyRole } from '../types/Wellness';

/*

interface FamilyMessage {
  id: string;
  senderId: string;
  senderName: string;
  recipientId?: string; // If undefined, it's a group message
  petId?: string;
  messageType: 'text' | 'task_update' | 'health_alert' | 'photo' | 'file';
  content: string;
  attachments?: MessageAttachment[];
  metadata?: Record<string, any>;
  timestamp: string;
  readBy: string[]; // Array of member IDs who have read the message
  reactions?: MessageReaction[];
}

interface MessageAttachment {
  id: string;
  type: 'photo' | 'document' | 'audio' | 'video';
  uri: string;
  filename: string;
  size: number;
  mimeType: string;
}

interface MessageReaction {
  emoji: string;
  userId: string;
  timestamp: string;
}

interface TaskAssignment {
  taskId: string;
  assignedBy: string;
  assignedTo: string;
  assignedAt: string;
  note?: string;
  dueDate: string;
}

interface FamilyActivity {
  id: string;
  type: 'task_completed' | 'member_joined' | 'alert_acknowledged' | 'pet_updated' | 'message_sent';
  actorId: string;
  actorName: string;
  description: string;
  petId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

class FamilyCoordinationService {
  private familyMembers: FamilyMember[] = [];
  private messages: FamilyMessage[] = [];
  private taskAssignments: TaskAssignment[] = [];
  private familyActivities: FamilyActivity[] = [];
  private currentUserId: string | null = null;

  // Storage keys
  private readonly FAMILY_MEMBERS_KEY = 'tailtracker_family_members';
  private readonly MESSAGES_KEY = 'tailtracker_family_messages';
  private readonly ASSIGNMENTS_KEY = 'tailtracker_task_assignments';
  private readonly ACTIVITIES_KEY = 'tailtracker_family_activities';
  private readonly CURRENT_USER_KEY = 'tailtracker_current_user';

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    await this.loadStoredData();
  }

  private async loadStoredData(): Promise<void> {
    try {
      const [members, messages, assignments, activities, currentUser] = await Promise.all([
        AsyncStorage.getItem(this.FAMILY_MEMBERS_KEY),
        AsyncStorage.getItem(this.MESSAGES_KEY),
        AsyncStorage.getItem(this.ASSIGNMENTS_KEY),
        AsyncStorage.getItem(this.ACTIVITIES_KEY),
        AsyncStorage.getItem(this.CURRENT_USER_KEY),
      ]);

      if (members) this.familyMembers = JSON.parse(members);
      if (messages) this.messages = JSON.parse(messages);
      if (assignments) this.taskAssignments = JSON.parse(assignments);
      if (activities) this.familyActivities = JSON.parse(activities);
      if (currentUser) this.currentUserId = JSON.parse(currentUser);

    } catch (error) {
      console.error('Error loading family coordination data:', error);
    }
  }

  private async saveData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(this.FAMILY_MEMBERS_KEY, JSON.stringify(this.familyMembers)),
        AsyncStorage.setItem(this.MESSAGES_KEY, JSON.stringify(this.messages)),
        AsyncStorage.setItem(this.ASSIGNMENTS_KEY, JSON.stringify(this.taskAssignments)),
        AsyncStorage.setItem(this.ACTIVITIES_KEY, JSON.stringify(this.familyActivities)),
      ]);
    } catch (error) {
      console.error('Error saving family coordination data:', error);
    }
  }

  // Family Member Management
  async addFamilyMember(member: Omit<FamilyMember, 'id' | 'joinedAt' | 'lastActiveAt'>): Promise<FamilyMember> {
    const now = new Date().toISOString();
    const newMember: FamilyMember = {
      ...member,
      id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      joinedAt: now,
      lastActiveAt: now,
    };

    this.familyMembers.push(newMember);
    await this.saveData();

    // Log family activity
    await this.logActivity({
      type: 'member_joined',
      actorId: newMember.id,
      actorName: newMember.name,
      description: `${newMember.name} joined the family as ${member.role}`,
    });

    return newMember;
  }

  async updateFamilyMember(memberId: string, updates: Partial<FamilyMember>): Promise<FamilyMember | null> {
    const memberIndex = this.familyMembers.findIndex(m => m.id === memberId);
    if (memberIndex === -1) return null;

    const updatedMember = {
      ...this.familyMembers[memberIndex],
      ...updates,
      lastActiveAt: new Date().toISOString(),
    };

    this.familyMembers[memberIndex] = updatedMember;
    await this.saveData();

    return updatedMember;
  }

  async removeFamilyMember(memberId: string): Promise<boolean> {
    const memberIndex = this.familyMembers.findIndex(m => m.id === memberId);
    if (memberIndex === -1) return false;

    const member = this.familyMembers[memberIndex];
    this.familyMembers.splice(memberIndex, 1);
    
    // Remove member from all assignments and messages
    this.taskAssignments = this.taskAssignments.filter(
      a => a.assignedTo !== memberId && a.assignedBy !== memberId
    );
    
    await this.saveData();

    // Log activity
    if (this.currentUserId) {
      const currentUser = this.getFamilyMember(this.currentUserId);
      if (currentUser) {
        await this.logActivity({
          type: 'member_joined',
          actorId: currentUser.id,
          actorName: currentUser.name,
          description: `Removed ${member.name} from the family`,
        });
      }
    }

    return true;
  }

  getFamilyMembers(): FamilyMember[] {
    return this.familyMembers.sort((a, b) => a.name.localeCompare(b.name));
  }

  getFamilyMember(memberId: string): FamilyMember | null {
    return this.familyMembers.find(m => m.id === memberId) || null;
  }

  // Messaging System
  async sendMessage(message: Omit<FamilyMessage, 'id' | 'timestamp' | 'readBy' | 'reactions'>): Promise<FamilyMessage> {
    const newMessage: FamilyMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      readBy: [message.senderId], // Sender has read it by default
      reactions: [],
    };

    this.messages.push(newMessage);
    await this.saveData();

    // Log activity for non-text messages
    if (message.messageType !== 'text') {
      await this.logActivity({
        type: 'message_sent',
        actorId: message.senderId,
        actorName: message.senderName,
        description: `Sent a ${message.messageType} message${message.petId ? ' about pet' : ''}`,
        petId: message.petId,
      });
    }

    return newMessage;
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<boolean> {
    const message = this.messages.find(m => m.id === messageId);
    if (!message) return false;

    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
      await this.saveData();
    }

    return true;
  }

  async addMessageReaction(messageId: string, emoji: string, userId: string): Promise<boolean> {
    const message = this.messages.find(m => m.id === messageId);
    if (!message) return false;

    // Remove existing reaction from this user for this emoji
    message.reactions = message.reactions?.filter(
      r => !(r.userId === userId && r.emoji === emoji)
    ) || [];

    // Add new reaction
    message.reactions.push({
      emoji,
      userId,
      timestamp: new Date().toISOString(),
    });

    await this.saveData();
    return true;
  }

  getMessages(petId?: string, recipientId?: string): FamilyMessage[] {
    return this.messages
      .filter(msg => {
        if (petId && msg.petId !== petId) return false;
        if (recipientId && msg.recipientId !== recipientId) return false;
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getUnreadMessages(userId: string): FamilyMessage[] {
    return this.messages.filter(msg => 
      msg.senderId !== userId && !msg.readBy.includes(userId)
    );
  }

  // Task Assignment System
  async assignTask(assignment: Omit<TaskAssignment, 'assignedAt'>): Promise<TaskAssignment> {
    const newAssignment: TaskAssignment = {
      ...assignment,
      assignedAt: new Date().toISOString(),
    };

    this.taskAssignments.push(newAssignment);
    await this.saveData();

    // Send notification message
    const assignedBy = this.getFamilyMember(assignment.assignedBy);
    const assignedTo = this.getFamilyMember(assignment.assignedTo);

    if (assignedBy && assignedTo) {
      await this.sendMessage({
        senderId: assignment.assignedBy,
        senderName: assignedBy.name,
        recipientId: assignment.assignedTo,
        messageType: 'task_update',
        content: `Task assigned: ${assignment.note || 'New care task'}`,
        metadata: {
          taskId: assignment.taskId,
          action: 'assigned',
        },
      });
    }

    return newAssignment;
  }

  async updateTaskAssignment(taskId: string, updates: Partial<TaskAssignment>): Promise<boolean> {
    const assignmentIndex = this.taskAssignments.findIndex(a => a.taskId === taskId);
    if (assignmentIndex === -1) return false;

    this.taskAssignments[assignmentIndex] = {
      ...this.taskAssignments[assignmentIndex],
      ...updates,
    };

    await this.saveData();
    return true;
  }

  getTaskAssignments(userId?: string): TaskAssignment[] {
    if (userId) {
      return this.taskAssignments.filter(
        a => a.assignedTo === userId || a.assignedBy === userId
      );
    }
    return this.taskAssignments;
  }

  // Family Activity Logging
  async logActivity(activity: Omit<FamilyActivity, 'id' | 'timestamp'>): Promise<FamilyActivity> {
    const newActivity: FamilyActivity = {
      ...activity,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    this.familyActivities.push(newActivity);
    
    // Keep only last 100 activities to manage storage
    if (this.familyActivities.length > 100) {
      this.familyActivities = this.familyActivities.slice(-100);
    }

    await this.saveData();
    return newActivity;
  }

  getFamilyActivities(days: number = 7): FamilyActivity[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.familyActivities
      .filter(activity => new Date(activity.timestamp) >= cutoffDate)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Permission Management
  hasPermission(userId: string, permission: Permission): boolean {
    const member = this.getFamilyMember(userId);
    if (!member) return false;

    // Owner has all permissions
    if (member.role === 'owner') return true;

    return member.permissions.includes(permission);
  }

  async updateMemberPermissions(memberId: string, permissions: Permission[]): Promise<boolean> {
    return !!(await this.updateFamilyMember(memberId, { permissions }));
  }

  // Notification System Integration
  async sendFamilyNotification(
    senderId: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    // This would integrate with the notification system
    const sender = this.getFamilyMember(senderId);
    if (!sender) return;

    console.log(`Family notification from ${sender.name}: ${title} - ${body}`, data);
    
    // In a real implementation, this would send push notifications
    // to all family members except the sender
  }

  // Real-time Updates (mock implementation)
  onMessagesUpdate(callback: (messages: FamilyMessage[]) => void): () => void {
    // In a real implementation, this would set up real-time listeners
    console.log('Setting up messages update listener');
    
    return () => {
      console.log('Cleaning up messages update listener');
    };
  }

  onActivitiesUpdate(callback: (activities: FamilyActivity[]) => void): () => void {
    console.log('Setting up activities update listener');
    
    return () => {
      console.log('Cleaning up activities update listener');
    };
  }

  // Utility Methods
  async setCurrentUser(userId: string): Promise<void> {
    this.currentUserId = userId;
    await AsyncStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(userId));
    
    // Update last active time
    await this.updateFamilyMember(userId, { lastActiveAt: new Date().toISOString() });
  }

  getCurrentUser(): FamilyMember | null {
    return this.currentUserId ? this.getFamilyMember(this.currentUserId) : null;
  }

  getOnlineMembers(): FamilyMember[] {
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    return this.familyMembers.filter(member => 
      new Date(member.lastActiveAt) > fiveMinutesAgo
    );
  }

  getFamilyStats(): {
    totalMembers: number;
    onlineMembers: number;
    unreadMessages: number;
    recentActivities: number;
  } {
    const currentUser = this.getCurrentUser();
    
    return {
      totalMembers: this.familyMembers.length,
      onlineMembers: this.getOnlineMembers().length,
      unreadMessages: currentUser ? this.getUnreadMessages(currentUser.id).length : 0,
      recentActivities: this.getFamilyActivities(1).length, // Today's activities
    };
  }
}
*/

// Export singleton instance
export const familyCoordinationService = new FamilyCoordinationService();

// Helper functions
export const FamilyHelpers = {
  /**
   * Format message timestamp for display
   */
  formatMessageTime: (timestamp: string): string => {
    const date = new Date(timestamp);
    
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM dd');
    }
  },

  /**
   * Get role display name
   */
  getRoleDisplayName: (role: FamilyRole): string => {
    const names = {
      owner: 'Owner',
      caregiver: 'Caregiver',
      viewer: 'Viewer',
      vet_professional: 'Veterinarian',
    };
    return names[role];
  },

  /**
   * Get role color
   */
  getRoleColor: (role: FamilyRole): string => {
    const colors = {
      owner: '#9C27B0',
      caregiver: '#4CAF50',
      viewer: '#2196F3',
      vet_professional: '#FF9800',
    };
    return colors[role];
  },

  /**
   * Check if user can perform action
   */
  canPerformAction: (
    userId: string,
    action: 'assign_tasks' | 'manage_family' | 'view_health' | 'emergency_access'
  ): boolean => {
    const permissionMap = {
      assign_tasks: 'manage_care_tasks' as Permission,
      manage_family: 'manage_family' as Permission,
      view_health: 'view_health_records' as Permission,
      emergency_access: 'emergency_access' as Permission,
    };

    return familyCoordinationService.hasPermission(userId, permissionMap[action]);
  },

  /**
   * Get message type icon
   */
  getMessageTypeIcon: (type: FamilyMessage['messageType']): string => {
    const icons = {
      text: '💬',
      task_update: '📝',
      health_alert: '🚨',
      photo: '📸',
      file: '📎',
    };
    return icons[type];
  },

  /**
   * Format activity description
   */
  formatActivityDescription: (activity: FamilyActivity): string => {
    // Add pet name if available
    if (activity.petId && activity.metadata?.petName) {
      return activity.description.replace('pet', activity.metadata.petName);
    }
    
    return activity.description;
  },

  /**
   * Get activity icon
   */
  getActivityIcon: (type: FamilyActivity['type']): string => {
    const icons = {
      task_completed: '✅',
      member_joined: '👋',
      alert_acknowledged: '👀',
      pet_updated: '🐾',
      message_sent: '💬',
    };
    return icons[type];
  },

  /**
   * Check if message needs attention
   */
  isMessageUrgent: (message: FamilyMessage): boolean => {
    return message.messageType === 'health_alert' || 
           message.messageType === 'task_update' ||
           (message.metadata?.priority === 'high');
  },
};