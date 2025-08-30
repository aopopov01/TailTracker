import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { format, subDays, differenceInDays } from 'date-fns';
import { WellnessInsight, WellnessReport, DataPoint } from '../../types/Wellness';

interface WellnessAnalyticsProps {
  petId: string;
  insights: WellnessInsight[];
  reports: WellnessReport[];
  onViewReport: (reportId: string) => void;
  onViewInsight: (insightId: string) => void;
}

export const WellnessAnalytics: React.FC<WellnessAnalyticsProps> = ({
  petId,
  insights,
  reports,
  onViewReport,
  onViewInsight,
}) => {
  const getInsightIcon = (type: string) => {
    const icons = {
      trend_analysis: '📈',
      pattern_detection: '🔍',
      health_prediction: '🔮',
      care_optimization: '⚡',
      behavioral_insight: '🧠',
      nutrition_recommendation: '🥗',
    };
    return icons[type as keyof typeof icons] || '💡';
  };

  const getInsightPriorityColor = (confidence: number, isActionable: boolean) => {
    if (isActionable && confidence > 0.8) return '#F44336';
    if (isActionable && confidence > 0.6) return '#FF9800';
    if (confidence > 0.7) return '#2196F3';
    return '#4CAF50';
  };

  const getReportTypeIcon = (type: string) => {
    const icons = {
      weekly_summary: '📅',
      monthly_summary: '🗓️',
      health_overview: '🏥',
      care_compliance: '✅',
      progress_report: '📊',
      custom: '📋',
    };
    return icons[type as keyof typeof icons] || '📄';
  };

  return (
    <ScrollView style={styles.container}>
      {/* Key Insights Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Insights</Text>
        {insights.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No insights available yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add more wellness data to generate insights
            </Text>
          </View>
        ) : (
          insights.slice(0, 3).map((insight) => (
            <TouchableOpacity
              key={insight.id}
              style={[
                styles.insightCard,
                { borderLeftColor: getInsightPriorityColor(insight.confidence, insight.isActionable) }
              ]}
              onPress={() => onViewInsight(insight.id)}
            >
              <View style={styles.insightHeader}>
                <View style={styles.insightTitleRow}>
                  <Text style={styles.insightIcon}>
                    {getInsightIcon(insight.type)}
                  </Text>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                </View>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>
                    {Math.round(insight.confidence * 100)}%
                  </Text>
                </View>
              </View>
              
              <Text style={styles.insightDescription} numberOfLines={2}>
                {insight.description}
              </Text>
              
              <View style={styles.insightFooter}>
                <Text style={styles.insightDate}>
                  {format(new Date(insight.generatedAt), 'MMM dd, yyyy')}
                </Text>
                {insight.isActionable && (
                  <View style={styles.actionableBadge}>
                    <Text style={styles.actionableText}>Action Recommended</Text>
                  </View>
                )}
              </View>
              
              {insight.suggestedActions && insight.suggestedActions.length > 0 && (
                <View style={styles.actionsPreview}>
                  <Text style={styles.actionTitle}>
                    💡 {insight.suggestedActions[0]}
                  </Text>
                  {insight.suggestedActions.length > 1 && (
                    <Text style={styles.moreActions}>
                      +{insight.suggestedActions.length - 1} more actions
                    </Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
        
        {insights.length > 3 && (
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>
              View All Insights ({insights.length - 3} more)
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Recent Reports Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Reports</Text>
        {reports.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No reports generated yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Reports will be automatically generated as you track wellness data
            </Text>
          </View>
        ) : (
          reports.slice(0, 4).map((report) => (
            <TouchableOpacity
              key={report.id}
              style={styles.reportCard}
              onPress={() => onViewReport(report.id)}
            >
              <View style={styles.reportHeader}>
                <Text style={styles.reportIcon}>
                  {getReportTypeIcon(report.reportType)}
                </Text>
                <View style={styles.reportInfo}>
                  <Text style={styles.reportTitle}>{report.title}</Text>
                  <Text style={styles.reportPeriod}>
                    {format(new Date(report.period.startDate), 'MMM dd')} - {format(new Date(report.period.endDate), 'MMM dd')}
                  </Text>
                </View>
              </View>
              
              <View style={styles.reportMetrics}>
                <View style={styles.reportMetric}>
                  <Text style={styles.metricValue}>
                    {report.data.summary.healthScore}
                  </Text>
                  <Text style={styles.metricLabel}>Health Score</Text>
                </View>
                <View style={styles.reportMetric}>
                  <Text style={styles.metricValue}>
                    {report.data.summary.complianceRate}%
                  </Text>
                  <Text style={styles.metricLabel}>Compliance</Text>
                </View>
                <View style={styles.reportMetric}>
                  <Text style={styles.metricValue}>
                    {report.data.summary.completedTasks}
                  </Text>
                  <Text style={styles.metricLabel}>Tasks Done</Text>
                </View>
              </View>
              
              <Text style={styles.reportDate}>
                Generated {format(new Date(report.generatedAt), 'MMM dd, h:mm a')}
              </Text>
            </TouchableOpacity>
          ))
        )}
        
        {reports.length > 4 && (
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>
              View All Reports ({reports.length - 4} more)
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

interface TrendAnalysisProps {
  data: DataPoint[];
  metric: string;
  timeframe: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercent: number;
}

export const TrendAnalysis: React.FC<TrendAnalysisProps> = ({
  data,
  metric,
  timeframe,
  trend,
  changePercent,
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      case 'stable': return '➡️';
    }
  };

  const getTrendColor = () => {
    if (Math.abs(changePercent) < 2) return '#4CAF50'; // Stable is good
    
    // Context-specific colors based on metric
    if (metric.toLowerCase().includes('weight')) {
      return trend === 'increasing' ? '#FF9800' : '#F44336';
    }
    if (metric.toLowerCase().includes('mood') || metric.toLowerCase().includes('activity')) {
      return trend === 'increasing' ? '#4CAF50' : '#F44336';
    }
    
    return trend === 'increasing' ? '#4CAF50' : '#F44336';
  };

  const formatChange = () => {
    const absChange = Math.abs(changePercent);
    if (absChange < 0.1) return 'No significant change';
    
    const direction = changePercent > 0 ? 'increase' : 'decrease';
    return `${absChange.toFixed(1)}% ${direction}`;
  };

  return (
    <View style={styles.trendContainer}>
      <View style={styles.trendHeader}>
        <Text style={styles.trendMetric}>{metric}</Text>
        <View style={[styles.trendBadge, { backgroundColor: getTrendColor() }]}>
          <Text style={styles.trendIcon}>{getTrendIcon()}</Text>
          <Text style={styles.trendText}>{formatChange()}</Text>
        </View>
      </View>
      
      <Text style={styles.trendTimeframe}>Over the past {timeframe}</Text>
      
      <View style={styles.sparklineContainer}>
        {/* Simplified sparkline representation */}
        <View style={styles.sparkline}>
          {data.slice(-10).map((point, index) => {
            const maxValue = Math.max(...data.map(d => d.value));
            const minValue = Math.min(...data.map(d => d.value));
            const normalizedHeight = maxValue === minValue ? 
              50 : ((point.value - minValue) / (maxValue - minValue)) * 40 + 10;
            
            return (
              <View
                key={index}
                style={[
                  styles.sparklineBar,
                  { 
                    height: normalizedHeight,
                    backgroundColor: getTrendColor(),
                  }
                ]}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
};

interface PatternDetectionProps {
  patterns: {
    type: string;
    description: string;
    confidence: number;
    occurrences: number;
    lastDetected: string;
  }[];
}

export const PatternDetection: React.FC<PatternDetectionProps> = ({ patterns }) => {
  return (
    <View style={styles.patternsContainer}>
      <Text style={styles.sectionTitle}>Detected Patterns</Text>
      
      {patterns.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No patterns detected yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Patterns will appear as we collect more data
          </Text>
        </View>
      ) : (
        patterns.map((pattern, index) => (
          <View key={index} style={styles.patternCard}>
            <View style={styles.patternHeader}>
              <Text style={styles.patternType}>{pattern.type}</Text>
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>
                  {Math.round(pattern.confidence * 100)}%
                </Text>
              </View>
            </View>
            
            <Text style={styles.patternDescription}>{pattern.description}</Text>
            
            <View style={styles.patternFooter}>
              <Text style={styles.patternOccurrences}>
                Detected {pattern.occurrences} times
              </Text>
              <Text style={styles.patternDate}>
                Last: {format(new Date(pattern.lastDetected), 'MMM dd')}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  insightCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  insightTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  insightIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2196F3',
  },
  insightDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  insightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightDate: {
    fontSize: 12,
    color: '#999',
  },
  actionableBadge: {
    backgroundColor: '#fff3e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  actionableText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FF9800',
  },
  actionsPreview: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  actionTitle: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
  },
  moreActions: {
    fontSize: 10,
    color: '#666',
    fontStyle: 'italic',
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  reportPeriod: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  reportMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reportMetric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  metricLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  reportDate: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 20,
  },
  viewAllText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  trendContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendMetric: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  trendTimeframe: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  sparklineContainer: {
    alignItems: 'center',
  },
  sparkline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 50,
  },
  sparklineBar: {
    width: 4,
    marginHorizontal: 1,
    borderRadius: 2,
  },
  patternsContainer: {
    marginVertical: 16,
  },
  patternCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patternType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  patternDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  patternFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patternOccurrences: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  patternDate: {
    fontSize: 12,
    color: '#999',
  },
});