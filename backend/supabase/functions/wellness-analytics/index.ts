import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface WellnessAnalyticsRequest {
  pet_id?: string
  family_id?: string
  analysis_type: 'health_trends' | 'behavioral_patterns' | 'care_insights' | 'wellness_score' | 'preventive_care'
  time_period?: 'week' | 'month' | 'quarter' | 'year'
  include_predictions?: boolean
}

interface HealthTrend {
  metric_type: string
  trend_direction: 'improving' | 'stable' | 'declining' | 'concerning'
  confidence_score: number
  data_points: Array<{
    date: string
    value: number
    unit: string
  }>
  insights: string[]
  recommendations: string[]
}

interface BehavioralPattern {
  category: string
  pattern_type: string
  frequency: number
  intensity_average: number
  trend: 'increasing' | 'stable' | 'decreasing'
  triggers: string[]
  recommendations: string[]
}

interface CareInsight {
  insight_type: string
  title: string
  description: string
  urgency_level: 'low' | 'medium' | 'high' | 'critical'
  confidence_score: number
  data_sources: string[]
  recommendations: string[]
  action_required: boolean
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from JWT token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized: Invalid or missing authentication token')
    }

    const { pet_id, family_id, analysis_type, time_period = 'month', include_predictions = false }: WellnessAnalyticsRequest = await req.json()

    // Validate request parameters
    if (!pet_id && !family_id) {
      throw new Error('Either pet_id or family_id is required')
    }

    // Verify user has access to the requested pet/family
    if (pet_id) {
      const { data: petAccess } = await supabaseClient
        .from('pets')
        .select('family_id')
        .eq('id', pet_id)
        .single()

      if (!petAccess) {
        throw new Error('Pet not found or access denied')
      }
    }

    let analyticsData: any = {}

    switch (analysis_type) {
      case 'health_trends':
        analyticsData = await generateHealthTrends(supabaseClient, pet_id, time_period)
        break
      
      case 'behavioral_patterns':
        analyticsData = await analyzeBehavioralPatterns(supabaseClient, pet_id, time_period)
        break
      
      case 'care_insights':
        analyticsData = await generateCareInsights(supabaseClient, pet_id || family_id, time_period)
        break
      
      case 'wellness_score':
        analyticsData = await calculateWellnessScore(supabaseClient, pet_id)
        break
      
      case 'preventive_care':
        analyticsData = await generatePreventiveCareRecommendations(supabaseClient, pet_id, include_predictions)
        break
      
      default:
        throw new Error('Invalid analysis_type')
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis_type,
        time_period,
        generated_at: new Date().toISOString(),
        data: analyticsData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Wellness Analytics Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

// Generate comprehensive health trends analysis
async function generateHealthTrends(supabaseClient: any, pet_id: string, time_period: string): Promise<HealthTrend[]> {
  const timeClause = getTimeClause(time_period)
  
  // Get all health metrics for the pet within time period
  const { data: metrics, error } = await supabaseClient
    .from('health_metrics')
    .select('*')
    .eq('pet_id', pet_id)
    .gte('recorded_at', timeClause)
    .order('recorded_at', { ascending: true })

  if (error) throw error

  // Group metrics by type and analyze trends
  const metricsByType = metrics.reduce((acc: any, metric: any) => {
    if (!acc[metric.metric_type]) acc[metric.metric_type] = []
    acc[metric.metric_type].push(metric)
    return acc
  }, {})

  const healthTrends: HealthTrend[] = []

  for (const [metricType, metricData] of Object.entries(metricsByType)) {
    const trend = analyzeMetricTrend(metricData as any[])
    const insights = generateMetricInsights(metricType, trend)
    const recommendations = generateMetricRecommendations(metricType, trend)

    healthTrends.push({
      metric_type: metricType,
      trend_direction: trend.direction,
      confidence_score: trend.confidence,
      data_points: (metricData as any[]).map((m: any) => ({
        date: m.recorded_at,
        value: parseFloat(m.value),
        unit: m.unit
      })),
      insights,
      recommendations
    })
  }

  return healthTrends
}

// Analyze behavioral patterns
async function analyzeBehavioralPatterns(supabaseClient: any, pet_id: string, time_period: string): Promise<BehavioralPattern[]> {
  const timeClause = getTimeClause(time_period)

  const { data: behaviors, error } = await supabaseClient
    .from('behavioral_observations')
    .select('*')
    .eq('pet_id', pet_id)
    .gte('observed_at', timeClause)
    .order('observed_at', { ascending: true })

  if (error) throw error

  // Group by category and analyze patterns
  const behaviorsByCategory = behaviors.reduce((acc: any, behavior: any) => {
    if (!acc[behavior.category]) acc[behavior.category] = []
    acc[behavior.category].push(behavior)
    return acc
  }, {})

  const patterns: BehavioralPattern[] = []

  for (const [category, behaviorData] of Object.entries(behaviorsByCategory)) {
    const data = behaviorData as any[]
    const frequency = data.length
    const intensityAverage = data.reduce((sum: number, b: any) => sum + (b.intensity_level || 0), 0) / data.length
    
    // Analyze trend over time
    const trend = analyzeBehaviorTrend(data)
    const triggers = extractCommonTriggers(data)
    const recommendations = generateBehaviorRecommendations(category, trend, intensityAverage)

    patterns.push({
      category,
      pattern_type: determineBehaviorPattern(data),
      frequency,
      intensity_average: intensityAverage,
      trend,
      triggers,
      recommendations
    })
  }

  return patterns
}

// Generate comprehensive care insights
async function generateCareInsights(supabaseClient: any, pet_id: string, time_period: string): Promise<CareInsight[]> {
  const insights: CareInsight[] = []
  const timeClause = getTimeClause(time_period)

  // Medication compliance analysis
  const medicationInsight = await analyzeMedicationCompliance(supabaseClient, pet_id, timeClause)
  if (medicationInsight) insights.push(medicationInsight)

  // Vaccination status analysis
  const vaccinationInsight = await analyzeVaccinationStatus(supabaseClient, pet_id)
  if (vaccinationInsight) insights.push(vaccinationInsight)

  // Weight trend analysis
  const weightInsight = await analyzeWeightTrends(supabaseClient, pet_id, timeClause)
  if (weightInsight) insights.push(weightInsight)

  // Care task completion analysis
  const careTaskInsight = await analyzeCareTaskCompletion(supabaseClient, pet_id, timeClause)
  if (careTaskInsight) insights.push(careTaskInsight)

  // Veterinary visit analysis
  const vetVisitInsight = await analyzeVeterinaryVisits(supabaseClient, pet_id, timeClause)
  if (vetVisitInsight) insights.push(vetVisitInsight)

  return insights
}

// Calculate comprehensive wellness score
async function calculateWellnessScore(supabaseClient: any, pet_id: string) {
  // Call the database function to calculate wellness score
  const { data, error } = await supabaseClient
    .rpc('generate_pet_wellness_score', { pet_uuid: pet_id })

  if (error) throw error

  // Get detailed breakdown
  const breakdown = await getWellnessScoreBreakdown(supabaseClient, pet_id)

  return {
    overall_score: data,
    breakdown,
    grade: getWellnessGrade(data),
    recommendations: getScoreBasedRecommendations(data, breakdown)
  }
}

// Generate preventive care recommendations
async function generatePreventiveCareRecommendations(supabaseClient: any, pet_id: string, includePredictions: boolean) {
  const recommendations: any[] = []

  // Get pet details for age-based recommendations
  const { data: pet, error: petError } = await supabaseClient
    .from('pets')
    .select('*, pet_health_summary(*)')
    .eq('id', pet_id)
    .single()

  if (petError) throw petError

  // Age-based recommendations
  const ageRecommendations = generateAgeBasedRecommendations(pet)
  recommendations.push(...ageRecommendations)

  // Breed-specific recommendations
  const breedRecommendations = generateBreedSpecificRecommendations(pet)
  recommendations.push(...breedRecommendations)

  // Health history-based recommendations
  const healthHistoryRecommendations = await generateHealthHistoryRecommendations(supabaseClient, pet_id)
  recommendations.push(...healthHistoryRecommendations)

  // Seasonal recommendations
  const seasonalRecommendations = generateSeasonalRecommendations(pet)
  recommendations.push(...seasonalRecommendations)

  if (includePredictions) {
    // AI-powered predictive recommendations (placeholder for ML model integration)
    const predictiveRecommendations = await generatePredictiveRecommendations(supabaseClient, pet_id)
    recommendations.push(...predictiveRecommendations)
  }

  return {
    total_recommendations: recommendations.length,
    recommendations: recommendations.sort((a, b) => b.priority_score - a.priority_score)
  }
}

// Helper functions
function getTimeClause(time_period: string): string {
  const now = new Date()
  switch (time_period) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    case 'month':
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString()
    case 'quarter':
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).toISOString()
    case 'year':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString()
    default:
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString()
  }
}

function analyzeMetricTrend(data: any[]): { direction: any, confidence: number } {
  if (data.length < 2) return { direction: 'stable', confidence: 0.5 }

  // Simple linear regression to determine trend
  const values = data.map(d => parseFloat(d.value))
  const n = values.length
  const sumX = (n * (n + 1)) / 2
  const sumY = values.reduce((sum, val) => sum + val, 0)
  const sumXY = values.reduce((sum, val, index) => sum + val * (index + 1), 0)
  const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const confidence = Math.min(Math.abs(slope) * 10, 1) // Simplified confidence calculation

  if (Math.abs(slope) < 0.1) return { direction: 'stable', confidence }
  if (slope > 0.3) return { direction: 'concerning', confidence }
  return slope > 0 ? { direction: 'improving', confidence } : { direction: 'declining', confidence }
}

function generateMetricInsights(metricType: string, trend: any): string[] {
  const insights: string[] = []
  
  switch (metricType) {
    case 'weight':
      if (trend.direction === 'improving') insights.push('Weight is trending in a healthy direction')
      if (trend.direction === 'concerning') insights.push('Significant weight changes detected - consider veterinary consultation')
      break
    case 'activity_minutes':
      if (trend.direction === 'declining') insights.push('Activity levels are decreasing - may indicate health concerns')
      break
    // Add more metric-specific insights
  }

  return insights
}

function generateMetricRecommendations(metricType: string, trend: any): string[] {
  const recommendations: string[] = []
  
  switch (metricType) {
    case 'weight':
      if (trend.direction === 'concerning') {
        recommendations.push('Schedule veterinary check-up to assess weight changes')
        recommendations.push('Review diet and exercise routine with veterinarian')
      }
      break
    // Add more recommendations
  }

  return recommendations
}

// Additional helper functions would be implemented here for:
// - analyzeBehaviorTrend
// - extractCommonTriggers
// - generateBehaviorRecommendations
// - analyzeMedicationCompliance
// - analyzeVaccinationStatus
// - etc.

// Placeholder implementations for complex analysis functions
function analyzeBehaviorTrend(data: any[]): 'increasing' | 'stable' | 'decreasing' {
  return 'stable' // Simplified implementation
}

function extractCommonTriggers(data: any[]): string[] {
  return data.map(d => d.trigger_factors).filter(Boolean).slice(0, 3)
}

function generateBehaviorRecommendations(category: string, trend: any, intensity: number): string[] {
  return [`Monitor ${category} behavior patterns`, 'Consider behavioral training if needed']
}

function determineBehaviorPattern(data: any[]): string {
  return 'regular' // Simplified implementation
}

async function analyzeMedicationCompliance(supabaseClient: any, pet_id: string, timeClause: string): Promise<CareInsight | null> {
  // Implementation for medication compliance analysis
  return null // Placeholder
}

async function analyzeVaccinationStatus(supabaseClient: any, pet_id: string): Promise<CareInsight | null> {
  // Implementation for vaccination analysis
  return null // Placeholder
}

async function analyzeWeightTrends(supabaseClient: any, pet_id: string, timeClause: string): Promise<CareInsight | null> {
  // Implementation for weight trend analysis
  return null // Placeholder
}

async function analyzeCareTaskCompletion(supabaseClient: any, pet_id: string, timeClause: string): Promise<CareInsight | null> {
  // Implementation for care task analysis
  return null // Placeholder
}

async function analyzeVeterinaryVisits(supabaseClient: any, pet_id: string, timeClause: string): Promise<CareInsight | null> {
  // Implementation for vet visit analysis
  return null // Placeholder
}

async function getWellnessScoreBreakdown(supabaseClient: any, pet_id: string) {
  return {
    weight_health: 85,
    vaccination_status: 90,
    vet_visit_recency: 75,
    medication_compliance: 95,
    activity_level: 80
  }
}

function getWellnessGrade(score: number): string {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

function getScoreBasedRecommendations(score: number, breakdown: any): string[] {
  const recommendations: string[] = []
  
  if (score < 70) recommendations.push('Schedule comprehensive veterinary examination')
  if (breakdown.weight_health < 70) recommendations.push('Review diet and exercise plan')
  if (breakdown.vaccination_status < 80) recommendations.push('Update vaccination schedule')
  
  return recommendations
}

function generateAgeBasedRecommendations(pet: any): any[] {
  return [] // Placeholder implementation
}

function generateBreedSpecificRecommendations(pet: any): any[] {
  return [] // Placeholder implementation
}

async function generateHealthHistoryRecommendations(supabaseClient: any, pet_id: string): Promise<any[]> {
  return [] // Placeholder implementation
}

function generateSeasonalRecommendations(pet: any): any[] {
  return [] // Placeholder implementation
}

async function generatePredictiveRecommendations(supabaseClient: any, pet_id: string): Promise<any[]> {
  return [] // Placeholder implementation
}