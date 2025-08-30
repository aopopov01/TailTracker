import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, isToday, isPast, addDays, differenceInDays } from 'date-fns';
import {
  WellnessMetrics,
  CareTask,
  HealthRecord,
  WellnessGoal,
  CareRoutine,
  WellnessAlert,
  WellnessInsight,
  FamilyMember,
  TaskPriority,
  AlertSeverity,
  GoalStatus,
  CareTaskType,
} from '../types/Wellness';
import { Pet } from '../types/Pet';

class WellnessService {
  private wellnessData: Map<string, WellnessMetrics[]> = new Map();
  private careTasks: Map<string, CareTask[]> = new Map();
  private healthRecords: Map<string, HealthRecord[]> = new Map();
  private wellnessGoals: Map<string, WellnessGoal[]> = new Map();
  private careRoutines: Map<string, CareRoutine[]> = new Map();
  private wellnessAlerts: WellnessAlert[] = [];
  private familyMembers: FamilyMember[] = [];

  // Storage keys
  private readonly WELLNESS_STORAGE_KEY = 'tailtracker_wellness_data';
  private readonly CARE_TASKS_STORAGE_KEY = 'tailtracker_care_tasks';
  private readonly HEALTH_RECORDS_STORAGE_KEY = 'tailtracker_health_records';
  private readonly GOALS_STORAGE_KEY = 'tailtracker_wellness_goals';
  private readonly ROUTINES_STORAGE_KEY = 'tailtracker_care_routines';
  private readonly ALERTS_STORAGE_KEY = 'tailtracker_wellness_alerts';
  private readonly FAMILY_STORAGE_KEY = 'tailtracker_family_members';

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    await this.loadStoredData();
    this.setupPeriodicTasks();
  }

  private async loadStoredData(): Promise<void> {
    try {
      const [wellness, tasks, health, goals, routines, alerts, family] = await Promise.all([
        AsyncStorage.getItem(this.WELLNESS_STORAGE_KEY),
        AsyncStorage.getItem(this.CARE_TASKS_STORAGE_KEY),
        AsyncStorage.getItem(this.HEALTH_RECORDS_STORAGE_KEY),
        AsyncStorage.getItem(this.GOALS_STORAGE_KEY),
        AsyncStorage.getItem(this.ROUTINES_STORAGE_KEY),
        AsyncStorage.getItem(this.ALERTS_STORAGE_KEY),
        AsyncStorage.getItem(this.FAMILY_STORAGE_KEY),
      ]);

      if (wellness) {
        const parsed = JSON.parse(wellness);
        this.wellnessData = new Map(Object.entries(parsed));
      }

      if (tasks) {
        const parsed = JSON.parse(tasks);
        this.careTasks = new Map(Object.entries(parsed));
      }

      if (health) {
        const parsed = JSON.parse(health);
        this.healthRecords = new Map(Object.entries(parsed));
      }

      if (goals) {
        const parsed = JSON.parse(goals);
        this.wellnessGoals = new Map(Object.entries(parsed));
      }

      if (routines) {
        const parsed = JSON.parse(routines);
        this.careRoutines = new Map(Object.entries(routines));
      }

      if (alerts) {
        this.wellnessAlerts = JSON.parse(alerts);
      }

      if (family) {
        this.familyMembers = JSON.parse(family);
      }

    } catch (error) {
      console.error('Error loading wellness data:', error);
    }
  }

  private async saveData(): Promise<void> {
    try {
      const data = {
        wellness: Object.fromEntries(this.wellnessData),
        tasks: Object.fromEntries(this.careTasks),
        health: Object.fromEntries(this.healthRecords),
        goals: Object.fromEntries(this.wellnessGoals),
        routines: Object.fromEntries(this.careRoutines),
        alerts: this.wellnessAlerts,
        family: this.familyMembers,
      };

      await Promise.all([
        AsyncStorage.setItem(this.WELLNESS_STORAGE_KEY, JSON.stringify(data.wellness)),
        AsyncStorage.setItem(this.CARE_TASKS_STORAGE_KEY, JSON.stringify(data.tasks)),
        AsyncStorage.setItem(this.HEALTH_RECORDS_STORAGE_KEY, JSON.stringify(data.health)),
        AsyncStorage.setItem(this.GOALS_STORAGE_KEY, JSON.stringify(data.goals)),
        AsyncStorage.setItem(this.ROUTINES_STORAGE_KEY, JSON.stringify(data.routines)),
        AsyncStorage.setItem(this.ALERTS_STORAGE_KEY, JSON.stringify(data.alerts)),
        AsyncStorage.setItem(this.FAMILY_STORAGE_KEY, JSON.stringify(data.family)),
      ]);
    } catch (error) {
      console.error('Error saving wellness data:', error);
    }
  }

  private setupPeriodicTasks(): void {
    // Check for overdue tasks every hour
    setInterval(() => {
      this.checkOverdueTasks();
      this.generateRoutineAlerts();
    }, 3600000); // 1 hour

    // Generate daily insights at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    setTimeout(() => {
      this.generateDailyInsights();
      // Then repeat every 24 hours
      setInterval(() => {
        this.generateDailyInsights();
      }, 86400000); // 24 hours
    }, msUntilMidnight);
  }

  // Wellness Metrics Methods
  async addWellnessMetrics(petId: string, metrics: Omit<WellnessMetrics, 'id' | 'createdAt' | 'updatedAt'>): Promise<WellnessMetrics> {
    const now = new Date().toISOString();
    const newMetrics: WellnessMetrics = {
      ...metrics,
      id: `wellness_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };

    const petMetrics = this.wellnessData.get(petId) || [];
    petMetrics.push(newMetrics);
    this.wellnessData.set(petId, petMetrics);

    await this.saveData();
    await this.analyzeWellnessTrends(petId);
    
    return newMetrics;
  }

  getWellnessMetrics(petId: string, days: number = 30): WellnessMetrics[] {
    const petMetrics = this.wellnessData.get(petId) || [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return petMetrics
      .filter(metrics => new Date(metrics.date) >= cutoffDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getLatestWellnessMetrics(petId: string): WellnessMetrics | null {
    const metrics = this.getWellnessMetrics(petId, 1);
    return metrics.length > 0 ? metrics[0] : null;
  }

  // Care Tasks Methods
  async addCareTask(task: Omit<CareTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<CareTask> {
    const now = new Date().toISOString();
    const newTask: CareTask = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };

    const petTasks = this.careTasks.get(task.petId) || [];
    petTasks.push(newTask);
    this.careTasks.set(task.petId, petTasks);

    await this.saveData();
    await this.scheduleTaskReminder(newTask);
    
    return newTask;
  }

  async updateCareTask(taskId: string, updates: Partial<CareTask>): Promise<CareTask | null> {
    for (const [petId, tasks] of this.careTasks) {
      const taskIndex = tasks.findIndex(task => task.id === taskId);
      if (taskIndex !== -1) {
        const updatedTask = {
          ...tasks[taskIndex],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        
        tasks[taskIndex] = updatedTask;
        this.careTasks.set(petId, tasks);
        
        await this.saveData();
        return updatedTask;
      }
    }
    return null;
  }

  async completeCareTask(taskId: string, completionNotes?: string): Promise<boolean> {
    const updates = {
      completedAt: new Date().toISOString(),
      completionNotes,
    };

    const updatedTask = await this.updateCareTask(taskId, updates);
    
    if (updatedTask && updatedTask.recurring) {
      // Create next occurrence for recurring tasks
      await this.createNextRecurringTask(updatedTask);
    }

    return !!updatedTask;
  }

  getCareTasks(petId: string, includeCompleted: boolean = false): CareTask[] {
    const petTasks = this.careTasks.get(petId) || [];
    
    if (includeCompleted) {
      return petTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }

    return petTasks
      .filter(task => !task.completedAt)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  getTodaysTasks(petId?: string): CareTask[] {
    const allTasks: CareTask[] = [];
    
    const petsToCheck = petId ? [petId] : Array.from(this.careTasks.keys());
    
    for (const id of petsToCheck) {
      const petTasks = this.getCareTasks(id);
      allTasks.push(...petTasks.filter(task => 
        isToday(new Date(task.dueDate)) && !task.completedAt
      ));
    }

    return allTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  getOverdueTasks(petId?: string): CareTask[] {
    const allTasks: CareTask[] = [];
    
    const petsToCheck = petId ? [petId] : Array.from(this.careTasks.keys());
    
    for (const id of petsToCheck) {
      const petTasks = this.getCareTasks(id);
      allTasks.push(...petTasks.filter(task => 
        isPast(new Date(task.dueDate)) && !task.completedAt
      ));
    }

    return allTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  // Health Records Methods
  async addHealthRecord(record: Omit<HealthRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<HealthRecord> {
    const now = new Date().toISOString();
    const newRecord: HealthRecord = {
      ...record,
      id: `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };

    const petRecords = this.healthRecords.get(record.petId) || [];
    petRecords.push(newRecord);
    this.healthRecords.set(record.petId, petRecords);

    await this.saveData();
    
    // Create follow-up task if needed
    if (newRecord.followUpDate) {
      await this.createFollowUpTask(newRecord);
    }
    
    return newRecord;
  }

  getHealthRecords(petId: string): HealthRecord[] {
    const petRecords = this.healthRecords.get(petId) || [];
    return petRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Wellness Goals Methods
  async addWellnessGoal(goal: Omit<WellnessGoal, 'id' | 'createdAt' | 'updatedAt'>): Promise<WellnessGoal> {
    const now = new Date().toISOString();
    const newGoal: WellnessGoal = {
      ...goal,
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };

    const petGoals = this.wellnessGoals.get(goal.petId) || [];
    petGoals.push(newGoal);
    this.wellnessGoals.set(goal.petId, petGoals);

    await this.saveData();
    return newGoal;
  }

  async updateWellnessGoal(goalId: string, updates: Partial<WellnessGoal>): Promise<WellnessGoal | null> {
    for (const [petId, goals] of this.wellnessGoals) {
      const goalIndex = goals.findIndex(goal => goal.id === goalId);
      if (goalIndex !== -1) {
        const updatedGoal = {
          ...goals[goalIndex],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        
        goals[goalIndex] = updatedGoal;
        this.wellnessGoals.set(petId, goals);
        
        await this.saveData();
        return updatedGoal;
      }
    }
    return null;
  }

  getWellnessGoals(petId: string): WellnessGoal[] {
    return this.wellnessGoals.get(petId) || [];
  }

  getActiveGoals(petId: string): WellnessGoal[] {
    return this.getWellnessGoals(petId).filter(goal => goal.status === 'active');
  }

  // Analytics and Insights Methods
  private async analyzeWellnessTrends(petId: string): Promise<void> {
    const metrics = this.getWellnessMetrics(petId, 30);
    if (metrics.length < 7) return; // Need at least a week of data

    // Analyze weight trends
    const weightTrend = this.analyzeTrend(metrics.map(m => ({ date: m.date, value: m.weight })));
    if (Math.abs(weightTrend.changePercent) > 5) {
      await this.createWeightAlert(petId, weightTrend);
    }

    // Analyze activity trends
    const activityScores = metrics.map(m => ({ 
      date: m.date, 
      value: this.activityLevelToScore(m.activityLevel) 
    }));
    const activityTrend = this.analyzeTrend(activityScores);
    if (activityTrend.changePercent < -20) {
      await this.createActivityAlert(petId, activityTrend);
    }

    // Generate insights
    await this.generateWellnessInsights(petId, metrics);
  }

  private analyzeTrend(data: { date: string; value: number }[]): {
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercent: number;
    currentValue: number;
    previousValue: number;
  } {
    if (data.length < 2) {
      return { trend: 'stable', changePercent: 0, currentValue: data[0]?.value || 0, previousValue: data[0]?.value || 0 };
    }

    const sortedData = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const currentValue = sortedData[sortedData.length - 1].value;
    const previousValue = sortedData[0].value;
    
    const changePercent = previousValue === 0 ? 0 : ((currentValue - previousValue) / previousValue) * 100;
    
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (Math.abs(changePercent) > 2) {
      trend = changePercent > 0 ? 'increasing' : 'decreasing';
    }

    return { trend, changePercent, currentValue, previousValue };
  }

  private activityLevelToScore(level: string): number {
    const scores = { very_low: 1, low: 2, moderate: 3, high: 4, very_high: 5 };
    return scores[level as keyof typeof scores] || 3;
  }

  // Alert Management
  private async createWeightAlert(petId: string, trend: any): Promise<void> {
    const alert: WellnessAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      petId,
      type: 'health_concern',
      severity: Math.abs(trend.changePercent) > 10 ? 'warning' : 'info',
      title: 'Weight Change Detected',
      message: `Your pet's weight has ${trend.trend === 'increasing' ? 'increased' : 'decreased'} by ${Math.abs(trend.changePercent).toFixed(1)}% over the past month.`,
      triggeredBy: 'pattern_detection',
      createdAt: new Date().toISOString(),
      actionRequired: Math.abs(trend.changePercent) > 10,
      suggestedActions: this.getWeightChangeActions(trend),
    };

    this.wellnessAlerts.push(alert);
    await this.saveData();
  }

  private async createActivityAlert(petId: string, trend: any): Promise<void> {
    const alert: WellnessAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      petId,
      type: 'behavioral_change',
      severity: 'warning',
      title: 'Activity Level Decrease',
      message: `Your pet's activity level has decreased significantly over the past month.`,
      triggeredBy: 'pattern_detection',
      createdAt: new Date().toISOString(),
      actionRequired: true,
      suggestedActions: [
        'Schedule a veterinary checkup to rule out health issues',
        'Increase exercise activities and playtime',
        'Monitor for other symptoms or behavioral changes',
        'Consider environmental factors that might affect activity'
      ],
    };

    this.wellnessAlerts.push(alert);
    await this.saveData();
  }

  private getWeightChangeActions(trend: any): string[] {
    if (trend.trend === 'increasing') {
      return [
        'Review feeding portions and schedule',
        'Increase exercise activities',
        'Consult with veterinarian about diet plan',
        'Monitor treats and table scraps'
      ];
    } else {
      return [
        'Schedule veterinary examination',
        'Review appetite and eating habits',
        'Check for underlying health conditions',
        'Consider nutritional supplements if recommended by vet'
      ];
    }
  }

  // Utility Methods
  private async scheduleTaskReminder(task: CareTask): Promise<void> {
    // This would integrate with the notification system
    // For now, we'll just log it
    console.log(`Reminder scheduled for task: ${task.title} at ${task.dueDate}`);
  }

  private async createNextRecurringTask(completedTask: CareTask): Promise<void> {
    if (!completedTask.recurring) return;

    const nextDueDate = this.calculateNextOccurrence(
      new Date(completedTask.dueDate),
      completedTask.recurring
    );

    if (nextDueDate) {
      const nextTask = {
        ...completedTask,
        dueDate: nextDueDate.toISOString(),
        completedAt: undefined,
        completionNotes: undefined,
      };

      delete (nextTask as any).id;
      delete (nextTask as any).createdAt;
      delete (nextTask as any).updatedAt;

      await this.addCareTask(nextTask);
    }
  }

  private calculateNextOccurrence(currentDate: Date, pattern: any): Date | null {
    const nextDate = new Date(currentDate);

    switch (pattern.frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + pattern.interval);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + (pattern.interval * 7));
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + pattern.interval);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + (pattern.interval * 3));
        break;
      case 'annually':
        nextDate.setFullYear(nextDate.getFullYear() + pattern.interval);
        break;
      default:
        return null;
    }

    // Check if we've reached the end date or max occurrences
    if (pattern.endDate && nextDate > new Date(pattern.endDate)) {
      return null;
    }

    return nextDate;
  }

  private async createFollowUpTask(record: HealthRecord): Promise<void> {
    if (!record.followUpDate) return;

    const followUpTask: Omit<CareTask, 'id' | 'createdAt' | 'updatedAt'> = {
      petId: record.petId,
      type: 'vet_appointment',
      title: `Follow-up for ${record.title}`,
      description: `Follow-up appointment related to: ${record.description}`,
      dueDate: record.followUpDate,
      priority: 'medium',
      recurring: null,
      reminderSettings: {
        enabled: true,
        advanceNotice: 1440, // 1 day
        notificationChannels: ['push'],
      },
    };

    await this.addCareTask(followUpTask);
  }

  private async checkOverdueTasks(): Promise<void> {
    const overdueTasks = this.getOverdueTasks();
    
    for (const task of overdueTasks) {
      if (task.priority === 'urgent' || task.priority === 'high') {
        const alert: WellnessAlert = {
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          petId: task.petId,
          type: task.type === 'medication' ? 'medication_overdue' : 'routine_missed',
          severity: task.priority === 'urgent' ? 'critical' : 'warning',
          title: 'Overdue Task',
          message: `${task.title} was due on ${format(new Date(task.dueDate), 'MMM dd, yyyy')}`,
          triggeredBy: 'scheduled',
          createdAt: new Date().toISOString(),
          actionRequired: true,
          suggestedActions: ['Complete the task immediately', 'Reschedule if needed', 'Contact veterinarian if medical'],
        };

        this.wellnessAlerts.push(alert);
      }
    }

    if (overdueTasks.length > 0) {
      await this.saveData();
    }
  }

  private async generateRoutineAlerts(): Promise<void> {
    // Implementation for routine-based alerts
    console.log('Checking routine alerts...');
  }

  private async generateDailyInsights(): Promise<void> {
    // Implementation for daily insight generation
    console.log('Generating daily insights...');
  }

  private async generateWellnessInsights(petId: string, metrics: WellnessMetrics[]): Promise<void> {
    // Implementation for wellness insights generation
    console.log(`Generating wellness insights for pet ${petId}...`);
  }

  // Public utility methods
  getWellnessScore(petId: string): number {
    const recentMetrics = this.getWellnessMetrics(petId, 7);
    if (recentMetrics.length === 0) return 0;

    const latestMetrics = recentMetrics[0];
    const scores = [
      latestMetrics.moodScore,
      latestMetrics.appetiteScore,
      latestMetrics.energyLevel,
      this.activityLevelToScore(latestMetrics.activityLevel) * 2, // Scale to 10
      latestMetrics.hydrationLevel,
    ];

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  getComplianceRate(petId: string, days: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const allTasks = this.careTasks.get(petId) || [];
    const tasksInPeriod = allTasks.filter(task => 
      new Date(task.createdAt) >= cutoffDate
    );

    if (tasksInPeriod.length === 0) return 100;

    const completedTasks = tasksInPeriod.filter(task => task.completedAt).length;
    return Math.round((completedTasks / tasksInPeriod.length) * 100);
  }

  // Family Management (simplified for now)
  getFamilyMembers(): FamilyMember[] {
    return this.familyMembers;
  }

  async addFamilyMember(member: Omit<FamilyMember, 'id' | 'joinedAt' | 'lastActiveAt'>): Promise<FamilyMember> {
    const now = new Date().toISOString();
    const newMember: FamilyMember = {
      ...member,
      id: `family_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      joinedAt: now,
      lastActiveAt: now,
    };

    this.familyMembers.push(newMember);
    await this.saveData();
    
    return newMember;
  }

  // Get wellness alerts
  getWellnessAlerts(petId?: string): WellnessAlert[] {
    if (petId) {
      return this.wellnessAlerts.filter(alert => alert.petId === petId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    return this.wellnessAlerts.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async acknowledgeAlert(alertId: string): Promise<boolean> {
    const alertIndex = this.wellnessAlerts.findIndex(alert => alert.id === alertId);
    if (alertIndex !== -1) {
      this.wellnessAlerts[alertIndex].acknowledgedAt = new Date().toISOString();
      await this.saveData();
      return true;
    }
    return false;
  }

  async resolveAlert(alertId: string): Promise<boolean> {
    const alertIndex = this.wellnessAlerts.findIndex(alert => alert.id === alertId);
    if (alertIndex !== -1) {
      this.wellnessAlerts[alertIndex].resolvedAt = new Date().toISOString();
      await this.saveData();
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const wellnessService = new WellnessService();

// Wellness-specific helper functions
export const WellnessHelpers = {
  /**
   * Get priority color for UI display
   */
  getPriorityColor(priority: TaskPriority): string {
    const colors = {
      low: '#4CAF50',
      medium: '#FF9800',
      high: '#F44336',
      urgent: '#9C27B0',
    };
    return colors[priority];
  },

  /**
   * Get severity color for alerts
   */
  getSeverityColor(severity: AlertSeverity): string {
    const colors = {
      info: '#2196F3',
      warning: '#FF9800',
      critical: '#F44336',
      emergency: '#9C27B0',
    };
    return colors[severity];
  },

  /**
   * Format task type for display
   */
  formatTaskType(type: CareTaskType): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  },

  /**
   * Get task type icon
   */
  getTaskTypeIcon(type: CareTaskType): string {
    const icons = {
      feeding: '🍽️',
      medication: '💊',
      grooming: '✂️',
      exercise: '🏃',
      vet_appointment: '🏥',
      vaccination: '💉',
      dental_care: '🦷',
      flea_tick_prevention: '🛡️',
      weight_check: '⚖️',
      training: '🎯',
      socialization: '🐕',
      other: '📝',
    };
    return icons[type] || '📝';
  },

  /**
   * Calculate days until due date
   */
  getDaysUntilDue(dueDate: string): number {
    return differenceInDays(new Date(dueDate), new Date());
  },

  /**
   * Check if task is overdue
   */
  isTaskOverdue(task: CareTask): boolean {
    return !task.completedAt && isPast(new Date(task.dueDate));
  },

  /**
   * Check if task is due today
   */
  isTaskDueToday(task: CareTask): boolean {
    return !task.completedAt && isToday(new Date(task.dueDate));
  },

  /**
   * Get wellness score description
   */
  getWellnessScoreDescription(score: number): string {
    if (score >= 9) return 'Excellent';
    if (score >= 8) return 'Very Good';
    if (score >= 7) return 'Good';
    if (score >= 6) return 'Fair';
    if (score >= 5) return 'Below Average';
    return 'Concerning';
  },

  /**
   * Get wellness score color
   */
  getWellnessScoreColor(score: number): string {
    if (score >= 8) return '#4CAF50';
    if (score >= 6) return '#FF9800';
    return '#F44336';
  },
};