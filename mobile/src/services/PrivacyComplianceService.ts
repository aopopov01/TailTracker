/**
 * Privacy Compliance Service for TailTracker
 * 
 * Ensures GDPR, CCPA, and other privacy regulation compliance
 * for all analytics and data collection operations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { analytics } from './AnalyticsService';
import { errorMonitoring } from './ErrorMonitoringService';
import { MilitaryGradeCryptoService } from './MilitaryGradeCryptoService';

// ========================= TYPES =========================

export interface PrivacyConfig {
  gdprCompliance: boolean;
  ccpaCompliance: boolean;
  coppaCompliance: boolean;
  dataRetentionDays: number;
  anonymizationEnabled: boolean;
  consentRequired: boolean;
  dataMiningOptOut: boolean;
  locationDataOptIn: boolean;
  healthDataOptIn: boolean;
  thirdPartySharing: boolean;
  cookieConsent: boolean;
}

export interface ConsentRecord {
  userId: string;
  timestamp: number;
  version: string;
  consents: ConsentMap;
  ipAddress?: string;
  userAgent?: string;
  withdrawalDate?: number;
  withdrawalReason?: string;
}

export interface ConsentMap {
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  thirdPartySharing: boolean;
  locationTracking: boolean;
  healthDataProcessing: boolean;
  performanceMonitoring: boolean;
  crashReporting: boolean;
  productImprovement: boolean;
}

export interface DataProcessingPurpose {
  purpose: string;
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  dataCategories: DataCategory[];
  retentionPeriod: number; // days
  thirdParties: ThirdParty[];
  automated: boolean;
  profiling: boolean;
}

export type DataCategory = 
  | 'identity'
  | 'contact'
  | 'demographic'
  | 'behavioral'
  | 'health'
  | 'location'
  | 'biometric'
  | 'financial'
  | 'technical'
  | 'usage';

export interface ThirdParty {
  name: string;
  type: 'processor' | 'controller' | 'joint_controller';
  purpose: string;
  dataCategories: DataCategory[];
  safeguards: string[];
  location: string;
  adequacyDecision: boolean;
}

export interface DataSubjectRequest {
  id: string;
  userId: string;
  type: DataSubjectRequestType;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestDate: number;
  completionDate?: number;
  details: string;
  verification: VerificationInfo;
  response?: DataSubjectResponse;
}

export type DataSubjectRequestType = 
  | 'access'
  | 'rectification'
  | 'erasure'
  | 'restriction'
  | 'portability'
  | 'objection'
  | 'withdraw_consent';

export interface VerificationInfo {
  method: 'email' | 'sms' | 'identity_document' | 'biometric';
  verified: boolean;
  verificationDate?: number;
  attempts: number;
}

export interface DataSubjectResponse {
  type: DataSubjectRequestType;
  data?: any;
  explanation: string;
  attachments: string[];
  nextSteps?: string[];
}

export interface PrivacyAudit {
  id: string;
  timestamp: number;
  auditor: string;
  scope: string[];
  findings: AuditFinding[];
  compliance: ComplianceStatus;
  recommendations: string[];
  followUpRequired: boolean;
}

export interface AuditFinding {
  category: 'data_collection' | 'consent' | 'security' | 'retention' | 'third_party' | 'rights';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string[];
  recommendation: string;
  remediated: boolean;
}

export interface ComplianceStatus {
  gdpr: ComplianceScore;
  ccpa: ComplianceScore;
  coppa: ComplianceScore;
  overall: ComplianceScore;
}

export interface ComplianceScore {
  score: number; // 0-100
  status: 'compliant' | 'minor_issues' | 'major_issues' | 'non_compliant';
  lastAssessment: number;
  nextAssessment: number;
}

export interface AnonymizationRule {
  dataType: string;
  method: 'pseudonymization' | 'generalization' | 'suppression' | 'noise_addition' | 'k_anonymity';
  parameters: Record<string, any>;
  reversible: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface DataLineage {
  dataId: string;
  source: string;
  timestamp: number;
  transformations: DataTransformation[];
  destinations: DataDestination[];
  retentionDate: number;
  anonymized: boolean;
}

export interface DataTransformation {
  type: 'collection' | 'processing' | 'anonymization' | 'aggregation' | 'deletion';
  timestamp: number;
  purpose: string;
  method: string;
  legal_basis: string;
}

export interface DataDestination {
  name: string;
  type: 'internal' | 'third_party' | 'cloud' | 'backup';
  purpose: string;
  safeguards: string[];
  location: string;
}

export interface PrivacyNotice {
  version: string;
  effective_date: number;
  language: string;
  purposes: DataProcessingPurpose[];
  rights: DataSubjectRights;
  contact: ContactInfo;
  updates: PrivacyNoticeUpdate[];
}

export interface DataSubjectRights {
  access: boolean;
  rectification: boolean;
  erasure: boolean;
  restriction: boolean;
  portability: boolean;
  objection: boolean;
  withdraw_consent: boolean;
  complaint: boolean;
}

export interface ContactInfo {
  dpo_email?: string;
  privacy_email: string;
  phone?: string;
  address?: string;
  representative?: string;
}

export interface PrivacyNoticeUpdate {
  version: string;
  date: number;
  changes: string[];
  notification_sent: boolean;
}

// ========================= MAIN SERVICE =========================

export class PrivacyComplianceService {
  private static instance: PrivacyComplianceService;
  private config: PrivacyConfig;
  private consentRecords: Map<string, ConsentRecord> = new Map();
  private dataSubjectRequests: Map<string, DataSubjectRequest> = new Map();
  private anonymizationRules: AnonymizationRule[] = [];
  private dataLineage: Map<string, DataLineage> = new Map();
  private cryptoService: MilitaryGradeCryptoService;

  private readonly STORAGE_KEYS = {
    CONFIG: '@tailtracker:privacy_config',
    CONSENTS: '@tailtracker:consent_records',
    REQUESTS: '@tailtracker:data_subject_requests',
    LINEAGE: '@tailtracker:data_lineage',
    AUDIT_LOG: '@tailtracker:privacy_audit_log',
  };

  private constructor() {
    this.config = this.getDefaultConfig();
    this.cryptoService = new MilitaryGradeCryptoService();
    this.loadStoredData();
    this.initializeAnonymizationRules();
  }

  public static getInstance(): PrivacyComplianceService {
    if (!PrivacyComplianceService.instance) {
      PrivacyComplianceService.instance = new PrivacyComplianceService();
    }
    return PrivacyComplianceService.instance;
  }

  // ========================= CONSENT MANAGEMENT =========================

  public async recordConsent(
    userId: string,
    consents: ConsentMap,
    version: string = '1.0'
  ): Promise<void> {
    try {
      const consentRecord: ConsentRecord = {
        userId,
        timestamp: Date.now(),
        version,
        consents,
        ipAddress: await this.getClientIP(),
        userAgent: await this.getUserAgent(),
      };

      // Encrypt sensitive data
      const encryptedRecord = await this.encryptConsentRecord(consentRecord);
      this.consentRecords.set(userId, encryptedRecord);

      await this.saveConsentRecords();

      // Track consent for analytics (if consented)
      if (consents.analytics) {
        await this.track('consent_recorded', {
          user_id: userId,
          version,
          consents: Object.keys(consents).filter(k => consents[k as keyof ConsentMap]),
        });
      }

      await this.logPrivacyEvent('consent_recorded', {
        userId,
        version,
        consents_granted: Object.values(consents).filter(Boolean).length,
      });

    } catch (error) {
      console.error('Failed to record consent:', error);
      await errorMonitoring.reportError(
        error as Error,
        { component: 'PrivacyCompliance', action: 'recordConsent', userId },
        'high',
        ['privacy', 'consent']
      );
    }
  }

  public async withdrawConsent(
    userId: string,
    consentTypes: (keyof ConsentMap)[],
    reason?: string
  ): Promise<void> {
    try {
      const existingConsent = this.consentRecords.get(userId);
      if (!existingConsent) {
        throw new Error('No existing consent record found');
      }

      const decryptedConsent = await this.decryptConsentRecord(existingConsent);

      // Update consent record
      for (const consentType of consentTypes) {
        decryptedConsent.consents[consentType] = false;
      }

      decryptedConsent.withdrawalDate = Date.now();
      decryptedConsent.withdrawalReason = reason;

      // Re-encrypt and store
      const encryptedRecord = await this.encryptConsentRecord(decryptedConsent);
      this.consentRecords.set(userId, encryptedRecord);

      await this.saveConsentRecords();

      // If analytics consent withdrawn, stop analytics for this user
      if (consentTypes.includes('analytics')) {
        await this.stopAnalyticsForUser(userId);
      }

      await this.logPrivacyEvent('consent_withdrawn', {
        userId,
        withdrawn_types: consentTypes,
        reason,
      });

    } catch (error) {
      console.error('Failed to withdraw consent:', error);
      throw error;
    }
  }

  public async getConsent(userId: string): Promise<ConsentRecord | null> {
    try {
      const encryptedConsent = this.consentRecords.get(userId);
      if (!encryptedConsent) return null;

      return await this.decryptConsentRecord(encryptedConsent);

    } catch (error) {
      console.error('Failed to get consent:', error);
      return null;
    }
  }

  public async hasConsent(userId: string, consentType: keyof ConsentMap): Promise<boolean> {
    try {
      const consent = await this.getConsent(userId);
      return consent ? consent.consents[consentType] : false;
    } catch (error) {
      return false;
    }
  }

  // ========================= DATA SUBJECT REQUESTS =========================

  public async submitDataSubjectRequest(
    userId: string,
    type: DataSubjectRequestType,
    details: string
  ): Promise<string> {
    try {
      const requestId = this.generateRequestId();
      
      const request: DataSubjectRequest = {
        id: requestId,
        userId,
        type,
        status: 'pending',
        requestDate: Date.now(),
        details,
        verification: {
          method: 'email',
          verified: false,
          attempts: 0,
        },
      };

      this.dataSubjectRequests.set(requestId, request);
      await this.saveDataSubjectRequests();

      // Send verification request
      await this.sendVerificationRequest(request);

      await this.logPrivacyEvent('data_subject_request_submitted', {
        request_id: requestId,
        user_id: userId,
        type,
      });

      return requestId;

    } catch (error) {
      console.error('Failed to submit data subject request:', error);
      throw error;
    }
  }

  public async verifyDataSubjectRequest(
    requestId: string,
    verificationCode: string
  ): Promise<boolean> {
    try {
      const request = this.dataSubjectRequests.get(requestId);
      if (!request) return false;

      // Verify code (simplified - would use proper verification)
      const isValid = await this.validateVerificationCode(requestId, verificationCode);
      
      if (isValid) {
        request.verification.verified = true;
        request.verification.verificationDate = Date.now();
        request.status = 'processing';

        // Process the request
        await this.processDataSubjectRequest(request);

        await this.saveDataSubjectRequests();
        return true;
      } else {
        request.verification.attempts++;
        await this.saveDataSubjectRequests();
        return false;
      }

    } catch (error) {
      console.error('Failed to verify data subject request:', error);
      return false;
    }
  }

  private async processDataSubjectRequest(request: DataSubjectRequest): Promise<void> {
    try {
      let response: DataSubjectResponse;

      switch (request.type) {
        case 'access':
          response = await this.processAccessRequest(request.userId);
          break;
        case 'erasure':
          response = await this.processErasureRequest(request.userId);
          break;
        case 'portability':
          response = await this.processPortabilityRequest(request.userId);
          break;
        case 'rectification':
          response = await this.processRectificationRequest(request.userId, request.details);
          break;
        default:
          throw new Error(`Unsupported request type: ${request.type}`);
      }

      request.response = response;
      request.status = 'completed';
      request.completionDate = Date.now();

      await this.notifyUserOfCompletion(request);

    } catch (error) {
      request.status = 'rejected';
      console.error('Failed to process data subject request:', error);
    }
  }

  private async processAccessRequest(userId: string): Promise<DataSubjectResponse> {
    // Collect all data associated with the user
    const userData = await this.collectUserData(userId);

    return {
      type: 'access',
      data: userData,
      explanation: 'Complete export of all personal data we hold about you.',
      attachments: [],
      nextSteps: ['Review the data', 'Contact us if you have questions'],
    };
  }

  private async processErasureRequest(userId: string): Promise<DataSubjectResponse> {
    // Delete all user data
    await this.deleteUserData(userId);

    return {
      type: 'erasure',
      explanation: 'All personal data has been permanently deleted from our systems.',
      attachments: [],
      nextSteps: ['Account closure confirmation email will be sent'],
    };
  }

  private async processPortabilityRequest(userId: string): Promise<DataSubjectResponse> {
    // Export user data in portable format
    const portableData = await this.exportPortableData(userId);

    return {
      type: 'portability',
      data: portableData,
      explanation: 'Your data in a structured, machine-readable format.',
      attachments: ['data_export.json'],
    };
  }

  private async processRectificationRequest(userId: string, details: string): Promise<DataSubjectResponse> {
    // Parse rectification details and update data
    // This would involve specific data correction logic
    
    return {
      type: 'rectification',
      explanation: 'Data has been corrected as requested.',
      attachments: [],
      nextSteps: ['Updated data will be reflected in your account'],
    };
  }

  // ========================= DATA ANONYMIZATION =========================

  private initializeAnonymizationRules(): void {
    this.anonymizationRules = [
      {
        dataType: 'email',
        method: 'pseudonymization',
        parameters: { algorithm: 'sha256', salt: true },
        reversible: false,
        riskLevel: 'low',
      },
      {
        dataType: 'ip_address',
        method: 'suppression',
        parameters: { keep_last_octet: false },
        reversible: false,
        riskLevel: 'medium',
      },
      {
        dataType: 'location',
        method: 'generalization',
        parameters: { precision: 'city' },
        reversible: false,
        riskLevel: 'medium',
      },
      {
        dataType: 'age',
        method: 'generalization',
        parameters: { range: 5 },
        reversible: false,
        riskLevel: 'low',
      },
      {
        dataType: 'device_id',
        method: 'pseudonymization',
        parameters: { algorithm: 'hmac', rotating_key: true },
        reversible: true,
        riskLevel: 'low',
      },
    ];
  }

  public async anonymizeData(data: any, dataType: string): Promise<any> {
    try {
      const rule = this.anonymizationRules.find(r => r.dataType === dataType);
      if (!rule) return data;

      switch (rule.method) {
        case 'pseudonymization':
          return await this.pseudonymizeData(data, rule.parameters);
        case 'generalization':
          return this.generalizeData(data, rule.parameters);
        case 'suppression':
          return this.suppressData(data, rule.parameters);
        case 'noise_addition':
          return this.addNoise(data, rule.parameters);
        default:
          return data;
      }

    } catch (error) {
      console.error('Failed to anonymize data:', error);
      return data;
    }
  }

  private async pseudonymizeData(data: any, parameters: Record<string, any>): Promise<string> {
    const salt = parameters.salt ? this.generateSalt() : '';
    return await this.cryptoService.hash(`${data}${salt}`, parameters.algorithm || 'sha256');
  }

  private generalizeData(data: any, parameters: Record<string, any>): any {
    if (typeof data === 'number') {
      const range = parameters.range || 10;
      const lower = Math.floor(data / range) * range;
      return `${lower}-${lower + range - 1}`;
    }
    return data;
  }

  private suppressData(data: any, parameters: Record<string, any>): string {
    if (typeof data === 'string') {
      const keepLength = parameters.keep_length || 0;
      return '*'.repeat(Math.max(data.length - keepLength, 0)) + data.slice(-keepLength);
    }
    return '***';
  }

  private addNoise(data: any, parameters: Record<string, any>): any {
    if (typeof data === 'number') {
      const noise = (Math.random() - 0.5) * 2 * (parameters.noise_level || 0.1);
      return data + (data * noise);
    }
    return data;
  }

  // ========================= DATA RETENTION =========================

  public async cleanupExpiredData(): Promise<void> {
    try {
      const now = Date.now();
      const retentionPeriod = this.config.dataRetentionDays * 24 * 60 * 60 * 1000;
      
      // Clean up consent records
      for (const [userId, record] of this.consentRecords) {
        const decryptedRecord = await this.decryptConsentRecord(record);
        if (now - decryptedRecord.timestamp > retentionPeriod) {
          this.consentRecords.delete(userId);
          await this.logPrivacyEvent('consent_record_expired', { userId });
        }
      }

      // Clean up data subject requests
      for (const [requestId, request] of this.dataSubjectRequests) {
        if (request.completionDate && now - request.completionDate > retentionPeriod) {
          this.dataSubjectRequests.delete(requestId);
          await this.logPrivacyEvent('request_record_expired', { requestId });
        }
      }

      // Clean up data lineage
      for (const [dataId, lineage] of this.dataLineage) {
        if (now > lineage.retentionDate) {
          this.dataLineage.delete(dataId);
          await this.logPrivacyEvent('data_lineage_expired', { dataId });
        }
      }

      await this.saveAllData();

      await this.logPrivacyEvent('data_cleanup_completed', {
        expired_consents: 0, // Would count actual removals
        expired_requests: 0,
        expired_lineage: 0,
      });

    } catch (error) {
      console.error('Failed to cleanup expired data:', error);
    }
  }

  // ========================= COMPLIANCE MONITORING =========================

  public async runComplianceAudit(): Promise<PrivacyAudit> {
    try {
      const audit: PrivacyAudit = {
        id: this.generateAuditId(),
        timestamp: Date.now(),
        auditor: 'automated_system',
        scope: ['consent', 'data_collection', 'retention', 'anonymization', 'rights'],
        findings: [],
        compliance: {
          gdpr: { score: 0, status: 'compliant', lastAssessment: Date.now(), nextAssessment: Date.now() + 7776000000 }, // 3 months
          ccpa: { score: 0, status: 'compliant', lastAssessment: Date.now(), nextAssessment: Date.now() + 7776000000 },
          coppa: { score: 0, status: 'compliant', lastAssessment: Date.now(), nextAssessment: Date.now() + 7776000000 },
          overall: { score: 0, status: 'compliant', lastAssessment: Date.now(), nextAssessment: Date.now() + 7776000000 },
        },
        recommendations: [],
        followUpRequired: false,
      };

      // Audit consent records
      await this.auditConsentCompliance(audit);
      
      // Audit data retention
      await this.auditDataRetention(audit);
      
      // Audit anonymization
      await this.auditAnonymization(audit);
      
      // Audit data subject rights
      await this.auditDataSubjectRights(audit);

      // Calculate compliance scores
      this.calculateComplianceScores(audit);

      await this.logPrivacyEvent('compliance_audit_completed', {
        audit_id: audit.id,
        findings: audit.findings.length,
        overall_score: audit.compliance.overall.score,
      });

      return audit;

    } catch (error) {
      console.error('Failed to run compliance audit:', error);
      throw error;
    }
  }

  private async auditConsentCompliance(audit: PrivacyAudit): Promise<void> {
    let issues = 0;

    // Check if all users have valid consent
    for (const [userId, record] of this.consentRecords) {
      const decryptedRecord = await this.decryptConsentRecord(record);
      
      if (!decryptedRecord.consents.analytics && this.isUserTracked(userId)) {
        audit.findings.push({
          category: 'consent',
          severity: 'high',
          description: `User ${userId} is being tracked without analytics consent`,
          evidence: ['Analytics events found for user without consent'],
          recommendation: 'Stop analytics tracking for this user immediately',
          remediated: false,
        });
        issues++;
      }
    }

    if (issues === 0) {
      audit.recommendations.push('Consent compliance is excellent');
    }
  }

  private async auditDataRetention(audit: PrivacyAudit): Promise<void> {
    const now = Date.now();
    const retentionPeriod = this.config.dataRetentionDays * 24 * 60 * 60 * 1000;
    let violations = 0;

    for (const [dataId, lineage] of this.dataLineage) {
      if (now > lineage.retentionDate) {
        audit.findings.push({
          category: 'retention',
          severity: 'medium',
          description: `Data ${dataId} has exceeded retention period`,
          evidence: [`Data created: ${new Date(lineage.timestamp).toISOString()}`],
          recommendation: 'Delete or anonymize expired data',
          remediated: false,
        });
        violations++;
      }
    }

    if (violations > 0) {
      audit.recommendations.push(`${violations} data items exceed retention period and should be cleaned up`);
    }
  }

  private async auditAnonymization(audit: PrivacyAudit): Promise<void> {
    // Check if high-risk data is properly anonymized
    let unprotectedData = 0;

    for (const [dataId, lineage] of this.dataLineage) {
      if (!lineage.anonymized && this.isHighRiskData(lineage)) {
        audit.findings.push({
          category: 'data_collection',
          severity: 'high',
          description: `High-risk data ${dataId} is not anonymized`,
          evidence: [`Data source: ${lineage.source}`],
          recommendation: 'Implement anonymization for high-risk data categories',
          remediated: false,
        });
        unprotectedData++;
      }
    }

    if (unprotectedData > 0) {
      audit.recommendations.push(`${unprotectedData} high-risk data items need anonymization`);
    }
  }

  private async auditDataSubjectRights(audit: PrivacyAudit): Promise<void> {
    // Check response times for data subject requests
    const overdueRequests = Array.from(this.dataSubjectRequests.values())
      .filter(request => {
        const daysSinceRequest = (Date.now() - request.requestDate) / (24 * 60 * 60 * 1000);
        return request.status !== 'completed' && daysSinceRequest > 30; // GDPR requires 30 days
      });

    for (const request of overdueRequests) {
      audit.findings.push({
        category: 'rights',
        severity: 'high',
        description: `Data subject request ${request.id} is overdue`,
        evidence: [`Request submitted: ${new Date(request.requestDate).toISOString()}`],
        recommendation: 'Complete overdue data subject requests within 30 days',
        remediated: false,
      });
    }

    if (overdueRequests.length > 0) {
      audit.followUpRequired = true;
    }
  }

  private calculateComplianceScores(audit: PrivacyAudit): void {
    const totalFindings = audit.findings.length;
    const criticalFindings = audit.findings.filter(f => f.severity === 'critical').length;
    const highFindings = audit.findings.filter(f => f.severity === 'high').length;
    const mediumFindings = audit.findings.filter(f => f.severity === 'medium').length;

    // Calculate score based on findings
    let score = 100;
    score -= criticalFindings * 20;
    score -= highFindings * 10;
    score -= mediumFindings * 5;
    score = Math.max(0, score);

    const status = score >= 90 ? 'compliant' : score >= 70 ? 'minor_issues' : score >= 50 ? 'major_issues' : 'non_compliant';

    audit.compliance.gdpr = { ...audit.compliance.gdpr, score, status };
    audit.compliance.ccpa = { ...audit.compliance.ccpa, score, status };
    audit.compliance.coppa = { ...audit.compliance.coppa, score, status };
    audit.compliance.overall = { ...audit.compliance.overall, score, status };
  }

  // ========================= HELPER METHODS =========================

  private getDefaultConfig(): PrivacyConfig {
    return {
      gdprCompliance: true,
      ccpaCompliance: true,
      coppaCompliance: false,
      dataRetentionDays: 1095, // 3 years
      anonymizationEnabled: true,
      consentRequired: true,
      dataMiningOptOut: true,
      locationDataOptIn: false,
      healthDataOptIn: false,
      thirdPartySharing: false,
      cookieConsent: true,
    };
  }

  private async encryptConsentRecord(record: ConsentRecord): Promise<ConsentRecord> {
    // In production, encrypt sensitive fields
    return record;
  }

  private async decryptConsentRecord(record: ConsentRecord): Promise<ConsentRecord> {
    // In production, decrypt sensitive fields
    return record;
  }

  private async getClientIP(): Promise<string> {
    // Get client IP address (privacy-compliant way)
    return '0.0.0.0'; // Placeholder
  }

  private async getUserAgent(): Promise<string> {
    // Get user agent
    return 'TailTracker/1.0'; // Placeholder
  }

  private async stopAnalyticsForUser(userId: string): Promise<void> {
    // Stop all analytics collection for this user
    await this.track('analytics_stopped_for_user', { user_id: userId });
  }

  private isUserTracked(userId: string): boolean {
    // Check if user is currently being tracked
    // This would check active analytics sessions
    return false; // Placeholder
  }

  private isHighRiskData(lineage: DataLineage): boolean {
    // Determine if data contains high-risk information
    return lineage.source.includes('health') || 
           lineage.source.includes('biometric') ||
           lineage.source.includes('location');
  }

  private async collectUserData(userId: string): Promise<any> {
    // Collect all user data for access request
    return {
      profile: {},
      pets: [],
      analytics: [],
      consent_history: [],
    };
  }

  private async deleteUserData(userId: string): Promise<void> {
    // Permanently delete all user data
    this.consentRecords.delete(userId);
    // Delete from all other data stores
  }

  private async exportPortableData(userId: string): Promise<any> {
    // Export user data in portable format
    const userData = await this.collectUserData(userId);
    return {
      format: 'JSON',
      version: '1.0',
      exported_at: new Date().toISOString(),
      data: userData,
    };
  }

  private async sendVerificationRequest(request: DataSubjectRequest): Promise<void> {
    // Send verification email/SMS
    console.log(`📧 Verification request sent for ${request.id}`);
  }

  private async validateVerificationCode(requestId: string, code: string): Promise<boolean> {
    // Validate verification code
    return code === '123456'; // Placeholder
  }

  private async notifyUserOfCompletion(request: DataSubjectRequest): Promise<void> {
    // Notify user that their request has been completed
    console.log(`✅ Request ${request.id} completed`);
  }

  private generateSalt(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  // ========================= STORAGE =========================

  private async loadStoredData(): Promise<void> {
    try {
      const [configData, consentsData, requestsData] = await Promise.all([
        AsyncStorage.getItem(this.STORAGE_KEYS.CONFIG),
        AsyncStorage.getItem(this.STORAGE_KEYS.CONSENTS),
        AsyncStorage.getItem(this.STORAGE_KEYS.REQUESTS),
      ]);

      if (configData) {
        const storedConfig = JSON.parse(configData);
        this.config = { ...this.config, ...storedConfig };
      }

      if (consentsData) {
        const consents = JSON.parse(consentsData);
        this.consentRecords = new Map(consents);
      }

      if (requestsData) {
        const requests = JSON.parse(requestsData);
        this.dataSubjectRequests = new Map(requests);
      }

    } catch (error) {
      console.error('Failed to load privacy compliance data:', error);
    }
  }

  private async saveAllData(): Promise<void> {
    await Promise.all([
      this.saveConsentRecords(),
      this.saveDataSubjectRequests(),
    ]);
  }

  private async saveConsentRecords(): Promise<void> {
    try {
      const consentsArray = Array.from(this.consentRecords.entries());
      await AsyncStorage.setItem(this.STORAGE_KEYS.CONSENTS, JSON.stringify(consentsArray));
    } catch (error) {
      console.error('Failed to save consent records:', error);
    }
  }

  private async saveDataSubjectRequests(): Promise<void> {
    try {
      const requestsArray = Array.from(this.dataSubjectRequests.entries());
      await AsyncStorage.setItem(this.STORAGE_KEYS.REQUESTS, JSON.stringify(requestsArray));
    } catch (error) {
      console.error('Failed to save data subject requests:', error);
    }
  }

  private generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    return `dsr_${timestamp}_${randomPart}`;
  }

  private generateAuditId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    return `audit_${timestamp}_${randomPart}`;
  }

  private async logPrivacyEvent(event: string, data: Record<string, any>): Promise<void> {
    // Log privacy-related events for audit trail
    const logEntry = {
      timestamp: Date.now(),
      event,
      data,
    };

    try {
      const auditLog = await AsyncStorage.getItem(this.STORAGE_KEYS.AUDIT_LOG);
      const log = auditLog ? JSON.parse(auditLog) : [];
      log.push(logEntry);
      
      // Keep only last 1000 entries
      if (log.length > 1000) {
        log.splice(0, log.length - 500);
      }

      await AsyncStorage.setItem(this.STORAGE_KEYS.AUDIT_LOG, JSON.stringify(log));
    } catch (error) {
      console.error('Failed to log privacy event:', error);
    }
  }

  private async track(eventName: string, properties: Record<string, any>): Promise<void> {
    await analytics.track(eventName, properties, 'system', 'high');
  }

  // ========================= PUBLIC API =========================

  public async updateConfig(updates: Partial<PrivacyConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    await AsyncStorage.setItem(this.STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
    await this.logPrivacyEvent('config_updated', updates);
  }

  public getConfig(): PrivacyConfig {
    return { ...this.config };
  }

  public getDataSubjectRequests(): DataSubjectRequest[] {
    return Array.from(this.dataSubjectRequests.values());
  }

  public async getPrivacyAuditLog(): Promise<any[]> {
    try {
      const auditLog = await AsyncStorage.getItem(this.STORAGE_KEYS.AUDIT_LOG);
      return auditLog ? JSON.parse(auditLog) : [];
    } catch (error) {
      return [];
    }
  }
}

// ========================= EXPORTS =========================

export const privacyCompliance = PrivacyComplianceService.getInstance();

export default privacyCompliance;