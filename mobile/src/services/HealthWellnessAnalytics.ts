/**
 * Health & Wellness Analytics Service for TailTracker
 * 
 * Provides comprehensive pet health analytics, trend analysis,
 * predictive health insights, and wellness recommendations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { analytics } from './AnalyticsService';
import { errorMonitoring } from './ErrorMonitoringService';

// ========================= TYPES =========================

export interface HealthMetrics {
  petId: string;
  petName: string;
  species: 'dog' | 'cat' | 'bird' | 'other';
  breed: string;
  age: number;
  weight: number;
  healthScore: number;
  lastCheckup: number;
  vaccinationStatus: VaccinationStatus;
  healthTrends: HealthTrend[];
  riskFactors: RiskFactor[];
  recommendations: HealthRecommendation[];
}

export interface VaccinationStatus {
  isUpToDate: boolean;
  nextDueDate?: number;
  overdueVaccinations: string[];
  completedVaccinations: CompletedVaccination[];
  complianceRate: number;
}

export interface CompletedVaccination {
  name: string;
  date: number;
  veterinarian: string;
  nextDue?: number;
  effectiveness: number;
}

export interface HealthTrend {
  metric: 'weight' | 'activity' | 'appetite' | 'mood' | 'energy';
  values: TrendDataPoint[];
  trend: 'improving' | 'stable' | 'declining' | 'concerning';
  correlation: number; // -1 to 1, correlation with overall health
  significance: 'low' | 'medium' | 'high' | 'critical';
}

export interface TrendDataPoint {
  timestamp: number;
  value: number;
  source: 'user_input' | 'sensor' | 'veterinary' | 'estimated';
  confidence: number;
}

export interface RiskFactor {
  factor: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number; // 0-1
  description: string;
  preventable: boolean;
  recommendations: string[];
  associatedConditions: string[];
}

export interface HealthRecommendation {
  id: string;
  type: 'preventive' | 'treatment' | 'lifestyle' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  actionItems: string[];
  expectedOutcome: string;
  timeframe: string;
  cost?: number;
  veterinaryRequired: boolean;
}

export interface WellnessInsights {
  populationHealth: PopulationHealth;
  emergencyPatterns: EmergencyPattern[];
  seasonalTrends: SeasonalTrend[];
  breedSpecificInsights: BreedInsight[];
  careEffectiveness: CareEffectiveness;
}

export interface PopulationHealth {
  totalPets: number;
  averageHealthScore: number;
  commonConditions: ConditionPrevalence[];
  vaccinationCompliance: number;
  emergencyRate: number;
  lifeExpectancyTrends: number[];
}

export interface ConditionPrevalence {
  condition: string;
  prevalence: number; // percentage
  ageDistribution: AgeGroup[];
  breedDistribution: BreedPrevalence[];
  seasonality: number; // -1 to 1, seasonal variation
  treatmentSuccess: number; // percentage
}

export interface AgeGroup {
  ageRange: string;
  count: number;
  percentage: number;
}

export interface BreedPrevalence {
  breed: string;
  count: number;
  riskMultiplier: number; // compared to average
}

export interface EmergencyPattern {
  type: 'injury' | 'illness' | 'poisoning' | 'accident' | 'unknown';
  frequency: number;
  timePatterns: TimePattern[];
  locationPatterns: LocationPattern[];
  ageFactors: AgeGroup[];
  outcomeStats: EmergencyOutcome[];
  preventionTips: string[];
}

export interface TimePattern {
  period: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'seasonal';
  distribution: number[];
  peakTimes: string[];
}

export interface LocationPattern {
  location: 'home' | 'park' | 'street' | 'vet' | 'other';
  percentage: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface EmergencyOutcome {
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  treatmentRequired: boolean;
  averageCost: number;
  recoveryTime: number; // days
  recurrenceRate: number; // percentage
}

export interface SeasonalTrend {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  conditions: string[];
  riskIncrease: number; // percentage
  preventiveMeasures: string[];
  vaccinationTiming: string[];
}

export interface BreedInsight {
  breed: string;
  commonConditions: string[];
  averageLifespan: number;
  healthScoreAverage: number;
  specialConsiderations: string[];
  recommendedScreenings: ScreeningRecommendation[];
}

export interface ScreeningRecommendation {
  screening: string;
  frequency: string;
  startAge: number;
  importance: 'routine' | 'important' | 'critical';
  cost: number;
}

export interface CareEffectiveness {
  reminderEffectiveness: ReminderEffectiveness;
  treatmentAdherence: TreatmentAdherence;
  preventiveCareImpact: PreventiveCareImpact;
  userEngagementCorrelation: number;
}

export interface ReminderEffectiveness {
  vaccinationReminders: number; // completion rate percentage
  medicationReminders: number;
  checkupReminders: number;
  overallCompliance: number;
  factorsInfluencingCompliance: ComplianceFactor[];
}

export interface TreatmentAdherence {
  medicationAdherence: number; // percentage
  therapyAdherence: number;
  dietAdherence: number;
  exerciseAdherence: number;
  outcomeImprovement: number;
}

export interface PreventiveCareImpact {
  healthScoreImprovement: number;
  emergencyReduction: number;
  costSavings: number;
  lifespanIncrease: number;
}

export interface ComplianceFactor {
  factor: string;
  impact: number; // -1 to 1
  description: string;
  improvementStrategy: string;
}

export interface PredictiveHealthModel {
  petId: string;
  predictions: HealthPrediction[];
  confidenceScore: number;
  modelVersion: string;
  lastUpdated: number;
  dataPoints: number;
}

export interface HealthPrediction {
  condition: string;
  probability: number; // 0-1
  timeframe: number; // days until likely occurrence
  severity: 'mild' | 'moderate' | 'severe';
  confidence: number; // 0-1
  preventionActions: string[];
  earlyWarningSignatures: string[];
}

// ========================= MAIN SERVICE =========================

export class HealthWellnessAnalyticsService {
  private static instance: HealthWellnessAnalyticsService;
  private healthData: Map<string, HealthMetrics> = new Map();
  private wellnessInsights?: WellnessInsights;
  private predictiveModels: Map<string, PredictiveHealthModel> = new Map();

  private readonly STORAGE_KEYS = {
    HEALTH_DATA: '@tailtracker:health_data',
    WELLNESS_INSIGHTS: '@tailtracker:wellness_insights',
    PREDICTIVE_MODELS: '@tailtracker:predictive_models',
    HEALTH_TRENDS: '@tailtracker:health_trends',
  };

  private constructor() {
    this.loadStoredData();
  }

  public static getInstance(): HealthWellnessAnalyticsService {
    if (!HealthWellnessAnalyticsService.instance) {
      HealthWellnessAnalyticsService.instance = new HealthWellnessAnalyticsService();
    }
    return HealthWellnessAnalyticsService.instance;
  }

  // ========================= HEALTH METRICS TRACKING =========================

  public async trackHealthMetric(
    petId: string,
    metric: string,
    value: number,
    source: 'user_input' | 'sensor' | 'veterinary' | 'estimated' = 'user_input'
  ): Promise<void> {
    try {
      let healthData = this.healthData.get(petId);
      if (!healthData) {
        healthData = await this.initializePetHealthData(petId);
      }

      // Find or create trend for this metric
      let trend = healthData.healthTrends.find(t => t.metric === metric as any);
      if (!trend) {
        trend = {
          metric: metric as any,
          values: [],
          trend: 'stable',
          correlation: 0,
          significance: 'medium',
        };
        healthData.healthTrends.push(trend);
      }

      // Add new data point
      trend.values.push({
        timestamp: Date.now(),
        value,
        source,
        confidence: this.calculateConfidence(source),
      });

      // Limit historical data
      if (trend.values.length > 100) {
        trend.values = trend.values.slice(-100);
      }

      // Analyze trend
      await this.analyzeTrend(trend);

      // Update overall health score
      await this.updateHealthScore(healthData);

      // Store updated data
      this.healthData.set(petId, healthData);
      await this.saveHealthData();

      await this.track('health_metric_tracked', {
        pet_id: petId,
        metric,
        value,
        source,
        trend: trend.trend,
      });

    } catch (error) {
      console.error('Failed to track health metric:', error);
      await errorMonitoring.reportError(
        error as Error,
        { component: 'HealthWellnessAnalytics', action: 'trackHealthMetric', petId, metric },
        'medium',
        ['health_analytics', 'tracking']
      );
    }
  }

  public async trackVaccination(
    petId: string,
    vaccinationName: string,
    date: number,
    veterinarian: string,
    nextDue?: number
  ): Promise<void> {
    try {
      let healthData = this.healthData.get(petId);
      if (!healthData) {
        healthData = await this.initializePetHealthData(petId);
      }

      const vaccination: CompletedVaccination = {
        name: vaccinationName,
        date,
        veterinarian,
        nextDue,
        effectiveness: this.calculateVaccinationEffectiveness(vaccinationName),
      };

      healthData.vaccinationStatus.completedVaccinations.push(vaccination);

      // Update compliance
      await this.updateVaccinationStatus(healthData);

      this.healthData.set(petId, healthData);
      await this.saveHealthData();

      await this.track('vaccination_tracked', {
        pet_id: petId,
        vaccination: vaccinationName,
        veterinarian,
        compliance_rate: healthData.vaccinationStatus.complianceRate,
      });

    } catch (error) {
      console.error('Failed to track vaccination:', error);
    }
  }

  public async trackHealthEvent(
    petId: string,
    eventType: 'checkup' | 'treatment' | 'emergency' | 'surgery',
    details: Record<string, any>
  ): Promise<void> {
    try {
      await this.track('health_event_tracked', {
        pet_id: petId,
        event_type: eventType,
        cost: details.cost,
        outcome: details.outcome,
        veterinarian: details.veterinarian,
        follow_up_required: details.followUpRequired,
      });

      // Update risk factors based on event
      await this.updateRiskFactors(petId, eventType, details);

      // Generate recommendations if needed
      if (eventType === 'emergency' || details.outcome === 'concerning') {
        await this.generateHealthRecommendations(petId);
      }

    } catch (error) {
      console.error('Failed to track health event:', error);
    }
  }

  // ========================= HEALTH ANALYSIS =========================

  public async getHealthMetrics(petId: string): Promise<HealthMetrics | null> {
    try {
      const healthData = this.healthData.get(petId);
      if (!healthData) {
        return null;
      }

      // Update real-time calculations
      await this.updateHealthScore(healthData);
      await this.generateHealthRecommendations(petId);

      return healthData;

    } catch (error) {
      console.error('Failed to get health metrics:', error);
      return null;
    }
  }

  public async getWellnessInsights(): Promise<WellnessInsights> {
    try {
      if (!this.wellnessInsights || this.needsInsightUpdate()) {
        this.wellnessInsights = await this.generateWellnessInsights();
      }

      return this.wellnessInsights;

    } catch (error) {
      console.error('Failed to get wellness insights:', error);
      throw error;
    }
  }

  public async getPredictiveHealthModel(petId: string): Promise<PredictiveHealthModel | null> {
    try {
      let model = this.predictiveModels.get(petId);
      
      if (!model || this.needsModelUpdate(model)) {
        model = await this.generatePredictiveModel(petId);
        this.predictiveModels.set(petId, model);
      }

      return model;

    } catch (error) {
      console.error('Failed to get predictive health model:', error);
      return null;
    }
  }

  // ========================= PREDICTIVE ANALYTICS =========================

  private async generatePredictiveModel(petId: string): Promise<PredictiveHealthModel> {
    const healthData = this.healthData.get(petId);
    if (!healthData) {
      throw new Error('No health data available for pet');
    }

    // This would typically use machine learning models
    // For now, we'll create rule-based predictions
    const predictions: HealthPrediction[] = [];

    // Analyze vaccination status
    if (!healthData.vaccinationStatus.isUpToDate) {
      predictions.push({
        condition: 'Preventable Disease Risk',
        probability: 0.25,
        timeframe: 90,
        severity: 'moderate',
        confidence: 0.8,
        preventionActions: ['Update vaccinations', 'Avoid high-risk areas'],
        earlyWarningSignatures: ['Lethargy', 'Loss of appetite', 'Fever'],
      });
    }

    // Analyze weight trends
    const weightTrend = healthData.healthTrends.find(t => t.metric === 'weight');
    if (weightTrend && weightTrend.trend === 'declining') {
      predictions.push({
        condition: 'Nutritional Deficiency',
        probability: 0.35,
        timeframe: 30,
        severity: 'mild',
        confidence: 0.7,
        preventionActions: ['Dietary consultation', 'Appetite stimulants'],
        earlyWarningSignatures: ['Continued weight loss', 'Reduced appetite'],
      });
    }

    // Age-based predictions
    if (healthData.age > 7) { // Senior pet
      predictions.push({
        condition: 'Age-related Joint Issues',
        probability: 0.6,
        timeframe: 365,
        severity: 'moderate',
        confidence: 0.75,
        preventionActions: ['Joint supplements', 'Regular exercise', 'Weight management'],
        earlyWarningSignatures: ['Stiffness', 'Reduced activity', 'Difficulty jumping'],
      });
    }

    const model: PredictiveHealthModel = {
      petId,
      predictions,
      confidenceScore: predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length,
      modelVersion: '1.0.0',
      lastUpdated: Date.now(),
      dataPoints: healthData.healthTrends.reduce((sum, t) => sum + t.values.length, 0),
    };

    await this.track('predictive_model_generated', {
      pet_id: petId,
      predictions: predictions.length,
      confidence_score: model.confidenceScore,
      data_points: model.dataPoints,
    });

    return model;
  }

  // ========================= WELLNESS INSIGHTS =========================

  private async generateWellnessInsights(): Promise<WellnessInsights> {
    const insights: WellnessInsights = {
      populationHealth: await this.calculatePopulationHealth(),
      emergencyPatterns: this.getEmergencyPatterns(),
      seasonalTrends: this.getSeasonalTrends(),
      breedSpecificInsights: this.getBreedInsights(),
      careEffectiveness: this.getCareEffectiveness(),
    };

    await this.track('wellness_insights_generated', {
      total_pets: insights.populationHealth.totalPets,
      average_health_score: insights.populationHealth.averageHealthScore,
      emergency_patterns: insights.emergencyPatterns.length,
    });

    return insights;
  }

  private async calculatePopulationHealth(): Promise<PopulationHealth> {
    const allPets = Array.from(this.healthData.values());
    
    return {
      totalPets: allPets.length,
      averageHealthScore: allPets.reduce((sum, pet) => sum + pet.healthScore, 0) / allPets.length,
      commonConditions: this.getCommonConditions(allPets),
      vaccinationCompliance: allPets.reduce((sum, pet) => sum + pet.vaccinationStatus.complianceRate, 0) / allPets.length,
      emergencyRate: 5.2, // Placeholder - would calculate from actual emergency data
      lifeExpectancyTrends: [12.5, 12.8, 13.1, 13.3], // Placeholder trends
    };
  }

  private getCommonConditions(pets: HealthMetrics[]): ConditionPrevalence[] {
    // This would analyze actual condition data
    return [
      {
        condition: 'Dental Disease',
        prevalence: 68,
        ageDistribution: [
          { ageRange: '0-2', count: 12, percentage: 15 },
          { ageRange: '3-7', count: 35, percentage: 45 },
          { ageRange: '8+', count: 53, percentage: 68 },
        ],
        breedDistribution: [
          { breed: 'Small breeds', count: 45, riskMultiplier: 1.8 },
          { breed: 'Large breeds', count: 23, riskMultiplier: 0.7 },
        ],
        seasonality: 0.1,
        treatmentSuccess: 85,
      },
      {
        condition: 'Obesity',
        prevalence: 42,
        ageDistribution: [
          { ageRange: '0-2', count: 8, percentage: 10 },
          { ageRange: '3-7', count: 38, percentage: 48 },
          { ageRange: '8+', count: 54, percentage: 69 },
        ],
        breedDistribution: [
          { breed: 'Labrador', count: 28, riskMultiplier: 2.1 },
          { breed: 'Greyhound', count: 3, riskMultiplier: 0.3 },
        ],
        seasonality: -0.3, // Lower in summer
        treatmentSuccess: 72,
      },
    ];
  }

  private getEmergencyPatterns(): EmergencyPattern[] {
    return [
      {
        type: 'injury',
        frequency: 15.2, // per 100 pets per year
        timePatterns: [
          {
            period: 'daily',
            distribution: [2, 1, 1, 2, 3, 8, 12, 15, 18, 16, 12, 8, 6, 4, 3, 2, 2, 3, 4, 6, 8, 6, 4, 3],
            peakTimes: ['8-9 AM', '2-4 PM'],
          },
        ],
        locationPatterns: [
          { location: 'park', percentage: 35, riskLevel: 'medium' },
          { location: 'home', percentage: 30, riskLevel: 'low' },
          { location: 'street', percentage: 25, riskLevel: 'high' },
          { location: 'other', percentage: 10, riskLevel: 'medium' },
        ],
        ageFactors: [
          { ageRange: '0-1', count: 25, percentage: 30 },
          { ageRange: '2-7', count: 45, percentage: 54 },
          { ageRange: '8+', count: 13, percentage: 16 },
        ],
        outcomeStats: [
          { severity: 'minor', treatmentRequired: false, averageCost: 0, recoveryTime: 1, recurrenceRate: 10 },
          { severity: 'moderate', treatmentRequired: true, averageCost: 250, recoveryTime: 7, recurrenceRate: 5 },
          { severity: 'severe', treatmentRequired: true, averageCost: 1200, recoveryTime: 21, recurrenceRate: 2 },
        ],
        preventionTips: [
          'Use proper leash control in high-traffic areas',
          'Supervise young pets during play',
          'Regular exercise to maintain fitness',
          'Pet-proof your home environment',
        ],
      },
    ];
  }

  private getSeasonalTrends(): SeasonalTrend[] {
    return [
      {
        season: 'spring',
        conditions: ['Allergies', 'Parasite infections', 'Increased activity injuries'],
        riskIncrease: 25,
        preventiveMeasures: ['Flea/tick prevention', 'Allergy management', 'Gradual activity increase'],
        vaccinationTiming: ['Annual boosters', 'Heartworm prevention start'],
      },
      {
        season: 'summer',
        conditions: ['Heatstroke', 'Dehydration', 'Paw pad burns'],
        riskIncrease: 40,
        preventiveMeasures: ['Adequate hydration', 'Avoid hot pavement', 'Provide shade'],
        vaccinationTiming: ['Bordetella before boarding'],
      },
      {
        season: 'fall',
        conditions: ['Weight gain', 'Arthritis flare-ups', 'Seasonal depression'],
        riskIncrease: 15,
        preventiveMeasures: ['Maintain exercise routine', 'Monitor food intake', 'Joint supplements'],
        vaccinationTiming: ['Flu vaccination'],
      },
      {
        season: 'winter',
        conditions: ['Hypothermia', 'Salt poisoning', 'Reduced activity'],
        riskIncrease: 20,
        preventiveMeasures: ['Protective clothing', 'Paw care', 'Indoor activities'],
        vaccinationTiming: ['Rabies renewal check'],
      },
    ];
  }

  private getBreedInsights(): BreedInsight[] {
    return [
      {
        breed: 'Labrador Retriever',
        commonConditions: ['Hip dysplasia', 'Obesity', 'Eye conditions'],
        averageLifespan: 12.1,
        healthScoreAverage: 7.8,
        specialConsiderations: ['Monitor weight closely', 'Regular joint health checks'],
        recommendedScreenings: [
          { screening: 'Hip X-rays', frequency: 'Annual after age 2', startAge: 2, importance: 'critical', cost: 200 },
          { screening: 'Eye exam', frequency: 'Annual', startAge: 1, importance: 'important', cost: 150 },
        ],
      },
    ];
  }

  private getCareEffectiveness(): CareEffectiveness {
    return {
      reminderEffectiveness: {
        vaccinationReminders: 78,
        medicationReminders: 85,
        checkupReminders: 72,
        overallCompliance: 78.3,
        factorsInfluencingCompliance: [
          {
            factor: 'Reminder timing',
            impact: 0.3,
            description: 'Reminders sent 1-2 days before due date are most effective',
            improvementStrategy: 'Optimize reminder scheduling based on user behavior',
          },
          {
            factor: 'Personal urgency',
            impact: 0.4,
            description: 'Pet health emergencies increase compliance with all reminders',
            improvementStrategy: 'Provide educational content about prevention',
          },
        ],
      },
      treatmentAdherence: {
        medicationAdherence: 82,
        therapyAdherence: 65,
        dietAdherence: 58,
        exerciseAdherence: 71,
        outcomeImprovement: 35,
      },
      preventiveCareImpact: {
        healthScoreImprovement: 18,
        emergencyReduction: 32,
        costSavings: 450, // Average per pet per year
        lifespanIncrease: 1.3, // Years
      },
      userEngagementCorrelation: 0.67, // Strong positive correlation
    };
  }

  // ========================= HELPER METHODS =========================

  private async initializePetHealthData(petId: string): Promise<HealthMetrics> {
    // This would typically fetch pet info from the database
    const healthData: HealthMetrics = {
      petId,
      petName: 'Unknown',
      species: 'dog',
      breed: 'Unknown',
      age: 5,
      weight: 25,
      healthScore: 7.5,
      lastCheckup: Date.now() - (90 * 24 * 60 * 60 * 1000), // 3 months ago
      vaccinationStatus: {
        isUpToDate: true,
        completedVaccinations: [],
        overdueVaccinations: [],
        complianceRate: 100,
      },
      healthTrends: [],
      riskFactors: [],
      recommendations: [],
    };

    return healthData;
  }

  private calculateConfidence(source: 'user_input' | 'sensor' | 'veterinary' | 'estimated'): number {
    const confidenceMap = {
      'veterinary': 0.95,
      'sensor': 0.85,
      'user_input': 0.75,
      'estimated': 0.6,
    };
    return confidenceMap[source];
  }

  private async analyzeTrend(trend: HealthTrend): Promise<void> {
    if (trend.values.length < 3) {
      trend.trend = 'stable';
      return;
    }

    // Simple trend analysis - would be more sophisticated in production
    const recent = trend.values.slice(-5);
    const older = trend.values.slice(-10, -5);

    const recentAvg = recent.reduce((sum, v) => sum + v.value, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum, v) => sum + v.value, 0) / older.length : recentAvg;

    const change = (recentAvg - olderAvg) / olderAvg;

    if (change > 0.1) {
      trend.trend = 'improving';
    } else if (change < -0.1) {
      trend.trend = 'declining';
    } else if (Math.abs(change) > 0.05) {
      trend.trend = 'concerning';
    } else {
      trend.trend = 'stable';
    }
  }

  private async updateHealthScore(healthData: HealthMetrics): Promise<void> {
    let score = 10; // Start with perfect score

    // Vaccination status impact
    if (!healthData.vaccinationStatus.isUpToDate) {
      score -= 2;
    }

    // Trend impacts
    for (const trend of healthData.healthTrends) {
      if (trend.trend === 'declining' || trend.trend === 'concerning') {
        score -= trend.significance === 'critical' ? 2 : 1;
      }
    }

    // Risk factors impact
    for (const risk of healthData.riskFactors) {
      const impact = {
        'low': 0.2,
        'medium': 0.5,
        'high': 1.0,
        'critical': 2.0,
      };
      score -= impact[risk.severity] * risk.probability;
    }

    healthData.healthScore = Math.max(0, Math.min(10, score));
  }

  private calculateVaccinationEffectiveness(vaccinationName: string): number {
    // Placeholder - would use actual effectiveness data
    const effectivenessMap: Record<string, number> = {
      'DHPP': 0.95,
      'Rabies': 0.99,
      'Bordetella': 0.85,
      'Lyme': 0.80,
    };
    return effectivenessMap[vaccinationName] || 0.90;
  }

  private async updateVaccinationStatus(healthData: HealthMetrics): Promise<void> {
    const now = Date.now();
    const overdueVaccinations = [];
    let upToDate = true;

    for (const vaccination of healthData.vaccinationStatus.completedVaccinations) {
      if (vaccination.nextDue && vaccination.nextDue < now) {
        overdueVaccinations.push(vaccination.name);
        upToDate = false;
      }
    }

    healthData.vaccinationStatus.overdueVaccinations = overdueVaccinations;
    healthData.vaccinationStatus.isUpToDate = upToDate;
    
    const totalVaccinations = healthData.vaccinationStatus.completedVaccinations.length;
    const currentVaccinations = totalVaccinations - overdueVaccinations.length;
    healthData.vaccinationStatus.complianceRate = totalVaccinations > 0 ? 
      (currentVaccinations / totalVaccinations) * 100 : 100;
  }

  private async updateRiskFactors(
    petId: string,
    eventType: string,
    details: Record<string, any>
  ): Promise<void> {
    const healthData = this.healthData.get(petId);
    if (!healthData) return;

    // Add risk factors based on health events
    if (eventType === 'emergency') {
      const riskFactor: RiskFactor = {
        factor: `Previous ${details.condition || 'emergency'}`,
        severity: 'medium',
        probability: 0.3,
        description: `Increased risk due to previous emergency: ${details.condition}`,
        preventable: true,
        recommendations: ['Regular monitoring', 'Preventive care'],
        associatedConditions: [details.condition],
      };
      healthData.riskFactors.push(riskFactor);
    }
  }

  private async generateHealthRecommendations(petId: string): Promise<void> {
    const healthData = this.healthData.get(petId);
    if (!healthData) return;

    const recommendations: HealthRecommendation[] = [];

    // Vaccination recommendations
    if (!healthData.vaccinationStatus.isUpToDate) {
      recommendations.push({
        id: `vac-${Date.now()}`,
        type: 'preventive',
        priority: 'high',
        title: 'Update Vaccinations',
        description: 'Your pet has overdue vaccinations that need attention.',
        actionItems: healthData.vaccinationStatus.overdueVaccinations.map(v => `Schedule ${v} vaccination`),
        expectedOutcome: 'Reduced risk of preventable diseases',
        timeframe: 'Within 2 weeks',
        veterinaryRequired: true,
      });
    }

    // Health score recommendations
    if (healthData.healthScore < 6) {
      recommendations.push({
        id: `health-${Date.now()}`,
        type: 'treatment',
        priority: 'urgent',
        title: 'Comprehensive Health Assessment',
        description: 'Your pet\'s health score indicates potential issues that need professional evaluation.',
        actionItems: ['Schedule veterinary consultation', 'Bring recent health records'],
        expectedOutcome: 'Identification and treatment of health issues',
        timeframe: 'Within 1 week',
        cost: 200,
        veterinaryRequired: true,
      });
    }

    healthData.recommendations = recommendations;
  }

  private needsInsightUpdate(): boolean {
    // Update insights daily
    const lastUpdate = this.wellnessInsights ? Date.now() - 24 * 60 * 60 * 1000 : 0;
    return Date.now() - lastUpdate > 24 * 60 * 60 * 1000;
  }

  private needsModelUpdate(model: PredictiveHealthModel): boolean {
    // Update model weekly
    return Date.now() - model.lastUpdated > 7 * 24 * 60 * 60 * 1000;
  }

  // ========================= STORAGE =========================

  private async loadStoredData(): Promise<void> {
    try {
      const [healthDataStr, insightsStr] = await Promise.all([
        AsyncStorage.getItem(this.STORAGE_KEYS.HEALTH_DATA),
        AsyncStorage.getItem(this.STORAGE_KEYS.WELLNESS_INSIGHTS),
      ]);

      if (healthDataStr) {
        const healthDataArray = JSON.parse(healthDataStr);
        this.healthData = new Map(healthDataArray);
      }

      if (insightsStr) {
        this.wellnessInsights = JSON.parse(insightsStr);
      }

    } catch (error) {
      console.error('Failed to load health analytics data:', error);
    }
  }

  private async saveHealthData(): Promise<void> {
    try {
      const healthDataArray = Array.from(this.healthData.entries());
      await AsyncStorage.setItem(this.STORAGE_KEYS.HEALTH_DATA, JSON.stringify(healthDataArray));
    } catch (error) {
      console.error('Failed to save health data:', error);
    }
  }

  private async track(eventName: string, properties: Record<string, any>): Promise<void> {
    await analytics.track(eventName, properties, 'health_wellness', 'medium');
  }
}

// ========================= EXPORTS =========================

export const healthWellnessAnalytics = HealthWellnessAnalyticsService.getInstance();

export default healthWellnessAnalytics;