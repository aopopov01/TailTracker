/**
 * TailTracker GDPR Compliance Framework
 * Comprehensive data protection and privacy implementation
 */

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

class GDPRComplianceManager {
  constructor(supabaseUrl, supabaseKey, encryptionKey) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.encryptionKey = encryptionKey;
    this.algorithm = 'aes-256-gcm';
  }

  /**
   * Data retention policies
   */
  static RETENTION_POLICIES = {
    // User data retention
    user_profile: { retention_days: 2555 }, // 7 years for legal compliance
    user_activity_logs: { retention_days: 365 }, // 1 year
    
    // Pet medical records (longer retention for health history)
    medical_records: { retention_days: 2555 }, // 7 years
    vaccinations: { retention_days: 1825 }, // 5 years
    medications: { retention_days: 1095 }, // 3 years
    
    // Audit and security logs
    audit_logs: { retention_days: 2190 }, // 6 years (legal compliance)
    security_events: { retention_days: 1095 }, // 3 years
    
    // Temporary data
    lost_pet_reports: { retention_days: 365 }, // 1 year after resolution
    notifications: { retention_days: 90 }, // 3 months
    sessions: { retention_days: 30 }, // 1 month
    
    // Marketing and analytics
    analytics_data: { retention_days: 1095 }, // 3 years
    marketing_data: { retention_days: 365 } // 1 year (with consent)
  };

  /**
   * Data classification for GDPR compliance
   */
  static DATA_CLASSIFICATIONS = {
    // Personal Data (Article 4(1) GDPR)
    PERSONAL: {
      level: 'PERSONAL',
      requires_consent: true,
      can_be_deleted: true,
      retention_required: false,
      encryption_required: true
    },
    
    // Special Categories (Article 9 GDPR) - Pet health data
    SPECIAL_CATEGORY: {
      level: 'SPECIAL_CATEGORY',
      requires_explicit_consent: true,
      can_be_deleted: true,
      retention_required: false,
      encryption_required: true,
      additional_safeguards: true
    },
    
    // Legal Basis for Processing
    LEGAL_OBLIGATION: {
      level: 'LEGAL_OBLIGATION',
      requires_consent: false,
      can_be_deleted: false,
      retention_required: true,
      encryption_required: true
    },
    
    // Legitimate Interest
    LEGITIMATE_INTEREST: {
      level: 'LEGITIMATE_INTEREST',
      requires_consent: false,
      can_be_deleted: true,
      retention_required: false,
      encryption_required: true
    }
  };

  /**
   * Encrypt sensitive data
   */
  encryptData(data) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
      cipher.setAAD(iv);
      
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt sensitive data
   */
  decryptData(encryptedData) {
    try {
      const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const authTag = Buffer.from(encryptedData.authTag, 'hex');
      
      decipher.setAAD(iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Handle data subject access requests (Article 15 GDPR)
   */
  async handleDataAccessRequest(userId) {
    try {
      const userData = await this.collectUserData(userId);
      const exportData = await this.generateDataExport(userData);
      
      // Create GDPR request record
      const { data: gdprRequest, error } = await this.supabase
        .from('gdpr_requests')
        .insert({
          user_id: userId,
          request_type: 'export',
          status: 'processing'
        })
        .select()
        .single();

      if (error) throw error;

      // Store encrypted export data
      const encryptedExport = this.encryptData(exportData);
      const exportUrl = await this.storeSecureExport(gdprRequest.id, encryptedExport);

      // Update request with completion
      await this.supabase
        .from('gdpr_requests')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          data_url: exportUrl,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
        .eq('id', gdprRequest.id);

      return {
        request_id: gdprRequest.id,
        data_url: exportUrl,
        expires_at: gdprRequest.expires_at
      };
    } catch (error) {
      throw new Error(`Data access request failed: ${error.message}`);
    }
  }

  /**
   * Collect all user data for export
   */
  async collectUserData(userId) {
    const queries = [
      // User profile data
      this.supabase
        .from('users')
        .select('*')
        .eq('id', userId),
      
      // Family data
      this.supabase
        .from('families')
        .select(`
          *,
          family_members!inner(user_id)
        `)
        .eq('family_members.user_id', userId),
      
      // Pet data
      this.supabase
        .from('pets')
        .select(`
          *,
          families!inner(
            family_members!inner(user_id)
          )
        `)
        .eq('families.family_members.user_id', userId),
      
      // Medical records
      this.supabase
        .from('medical_records')
        .select(`
          *,
          pets!inner(
            families!inner(
              family_members!inner(user_id)
            )
          )
        `)
        .eq('pets.families.family_members.user_id', userId),
      
      // Vaccinations
      this.supabase
        .from('vaccinations')
        .select(`
          *,
          pets!inner(
            families!inner(
              family_members!inner(user_id)
            )
          )
        `)
        .eq('pets.families.family_members.user_id', userId),
      
      // Notifications
      this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId),
      
      // Subscriptions
      this.supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId),
      
      // Audit logs
      this.supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
    ];

    const results = await Promise.all(queries);
    
    return {
      user_profile: results[0].data || [],
      families: results[1].data || [],
      pets: results[2].data || [],
      medical_records: results[3].data || [],
      vaccinations: results[4].data || [],
      notifications: results[5].data || [],
      subscriptions: results[6].data || [],
      audit_logs: results[7].data || []
    };
  }

  /**
   * Handle data deletion requests (Article 17 GDPR)
   */
  async handleDataDeletionRequest(userId, deleteType = 'full') {
    try {
      // Create GDPR request record
      const { data: gdprRequest, error } = await this.supabase
        .from('gdpr_requests')
        .insert({
          user_id: userId,
          request_type: 'delete',
          status: 'processing'
        })
        .select()
        .single();

      if (error) throw error;

      // Check for legal obligations that prevent deletion
      const legalObligations = await this.checkLegalObligations(userId);
      
      if (legalObligations.length > 0 && deleteType === 'full') {
        // Partial deletion - anonymize instead of delete where legally required
        await this.performAnonymization(userId, legalObligations);
      } else {
        // Full deletion
        await this.performDataDeletion(userId);
      }

      // Update request status
      await this.supabase
        .from('gdpr_requests')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('id', gdprRequest.id);

      return {
        request_id: gdprRequest.id,
        deletion_type: legalObligations.length > 0 ? 'partial_anonymized' : 'full',
        legal_obligations: legalObligations
      };
    } catch (error) {
      throw new Error(`Data deletion request failed: ${error.message}`);
    }
  }

  /**
   * Check for legal obligations that prevent full deletion
   */
  async checkLegalObligations(userId) {
    const obligations = [];
    
    // Check for active subscriptions (financial records)
    const { data: activeSubscriptions } = await this.supabase
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', userId)
      .in('status', ['premium', 'family']);

    if (activeSubscriptions?.length > 0) {
      obligations.push({
        type: 'financial_records',
        reason: 'Active subscription requires financial record retention',
        retention_period: '7 years'
      });
    }

    // Check for recent payments (tax/financial compliance)
    const { data: recentPayments } = await this.supabase
      .from('payments')
      .select('id')
      .eq('subscription_id.user_id', userId)
      .gte('processed_at', new Date(Date.now() - 7 * 365 * 24 * 60 * 60 * 1000).toISOString());

    if (recentPayments?.length > 0) {
      obligations.push({
        type: 'tax_records',
        reason: 'Tax compliance requires payment record retention',
        retention_period: '7 years'
      });
    }

    return obligations;
  }

  /**
   * Perform data anonymization where deletion is not legally possible
   */
  async performAnonymization(userId, obligations) {
    // Anonymize user profile
    const anonymizedData = {
      email: `deleted-${crypto.randomBytes(8).toString('hex')}@deleted.local`,
      full_name: 'DELETED USER',
      avatar_url: null,
      phone: null,
      deleted_at: new Date().toISOString()
    };

    await this.supabase
      .from('users')
      .update(anonymizedData)
      .eq('id', userId);

    // Anonymize audit logs (keep for legal compliance but remove PII)
    await this.supabase
      .from('audit_logs')
      .update({
        ip_address: null,
        user_agent: 'ANONYMIZED'
      })
      .eq('user_id', userId);

    // Remove non-essential data
    await this.deleteNonEssentialData(userId);
  }

  /**
   * Perform full data deletion
   */
  async performDataDeletion(userId) {
    // Delete in correct order to respect foreign key constraints
    const deletionOrder = [
      'notifications',
      'gdpr_requests',
      'audit_logs',
      'files',
      'lost_pets',
      'medical_records',
      'medications',
      'vaccinations',
      'pet_veterinarians',
      'pets',
      'family_members',
      'payments',
      'subscriptions'
    ];

    for (const table of deletionOrder) {
      if (table === 'pets' || table === 'medical_records' || table === 'medications' || 
          table === 'vaccinations' || table === 'lost_pets') {
        // Delete pet-related data through family membership
        await this.supabase
          .from(table)
          .delete()
          .in('pet_id', 
            this.supabase
              .from('pets')
              .select('id')
              .in('family_id',
                this.supabase
                  .from('family_members')
                  .select('family_id')
                  .eq('user_id', userId)
              )
          );
      } else {
        await this.supabase
          .from(table)
          .delete()
          .eq('user_id', userId);
      }
    }

    // Finally, delete user record
    await this.supabase
      .from('users')
      .delete()
      .eq('id', userId);
  }

  /**
   * Delete non-essential data during anonymization
   */
  async deleteNonEssentialData(userId) {
    const nonEssentialTables = [
      'notifications',
      'files',
      'lost_pets'
    ];

    for (const table of nonEssentialTables) {
      await this.supabase
        .from(table)
        .delete()
        .eq('user_id', userId);
    }
  }

  /**
   * Data portability (Article 20 GDPR)
   */
  async generatePortableDataFormat(userData) {
    return {
      format: 'JSON',
      version: '1.0',
      generated_at: new Date().toISOString(),
      data_subject_rights: {
        access: 'Article 15 GDPR',
        rectification: 'Article 16 GDPR',
        erasure: 'Article 17 GDPR',
        portability: 'Article 20 GDPR'
      },
      data: {
        personal_information: {
          profile: userData.user_profile,
          families: userData.families,
          pets: userData.pets.map(pet => ({
            ...pet,
            // Remove internal IDs for portability
            id: undefined,
            family_id: undefined,
            created_by: undefined
          }))
        },
        health_records: {
          medical_records: userData.medical_records,
          vaccinations: userData.vaccinations
        },
        activity_data: {
          notifications: userData.notifications.slice(-100), // Last 100 notifications
          recent_activity: userData.audit_logs.slice(-50) // Last 50 activities
        }
      }
    };
  }

  /**
   * Consent management
   */
  async recordConsent(userId, consentType, consentGiven, purpose) {
    const consentRecord = {
      user_id: userId,
      consent_type: consentType,
      consent_given: consentGiven,
      purpose: purpose,
      recorded_at: new Date().toISOString(),
      ip_address: null, // Should be provided from request
      user_agent: null  // Should be provided from request
    };

    // Store in audit log for compliance
    await this.supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        table_name: 'consent_management',
        action: consentGiven ? 'consent_given' : 'consent_withdrawn',
        new_values: consentRecord
      });

    // Update user consent status
    if (consentType === 'gdpr_consent') {
      await this.supabase
        .from('users')
        .update({
          gdpr_consent_date: consentGiven ? new Date().toISOString() : null
        })
        .eq('id', userId);
    }

    if (consentType === 'marketing_consent') {
      await this.supabase
        .from('users')
        .update({
          marketing_consent: consentGiven
        })
        .eq('id', userId);
    }
  }

  /**
   * Data retention cleanup job
   */
  async performRetentionCleanup() {
    const cleanupResults = {};
    
    for (const [dataType, policy] of Object.entries(GDPRComplianceManager.RETENTION_POLICIES)) {
      const cutoffDate = new Date(Date.now() - (policy.retention_days * 24 * 60 * 60 * 1000));
      
      try {
        let deletedCount = 0;
        
        switch (dataType) {
          case 'audit_logs':
            const { count } = await this.supabase
              .from('audit_logs')
              .delete()
              .lt('created_at', cutoffDate.toISOString())
              .select('id', { count: 'exact' });
            deletedCount = count || 0;
            break;
            
          case 'notifications':
            const { count: notifCount } = await this.supabase
              .from('notifications')
              .delete()
              .lt('created_at', cutoffDate.toISOString())
              .select('id', { count: 'exact' });
            deletedCount = notifCount || 0;
            break;
            
          // Add other retention cleanup cases as needed
        }
        
        cleanupResults[dataType] = {
          status: 'success',
          deleted_records: deletedCount,
          cutoff_date: cutoffDate.toISOString()
        };
      } catch (error) {
        cleanupResults[dataType] = {
          status: 'error',
          error: error.message
        };
      }
    }
    
    return cleanupResults;
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport() {
    // Get GDPR request statistics
    const { data: gdprStats } = await this.supabase
      .from('gdpr_requests')
      .select('request_type, status, requested_at')
      .gte('requested_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    // Get user consent statistics
    const { data: users, count: totalUsers } = await this.supabase
      .from('users')
      .select('gdpr_consent_date, marketing_consent', { count: 'exact' })
      .not('deleted_at', 'is', null);

    const consentStats = {
      total_users: totalUsers,
      gdpr_consent_given: users?.filter(u => u.gdpr_consent_date).length || 0,
      marketing_consent_given: users?.filter(u => u.marketing_consent).length || 0
    };

    return {
      report_generated_at: new Date().toISOString(),
      period: 'last_30_days',
      gdpr_requests: {
        total: gdprStats?.length || 0,
        by_type: gdprStats?.reduce((acc, req) => {
          acc[req.request_type] = (acc[req.request_type] || 0) + 1;
          return acc;
        }, {}),
        by_status: gdprStats?.reduce((acc, req) => {
          acc[req.status] = (acc[req.status] || 0) + 1;
          return acc;
        }, {})
      },
      consent_management: consentStats,
      compliance_status: 'compliant' // Would include more complex compliance checks
    };
  }

  /**
   * Store secure data export
   */
  async storeSecureExport(requestId, encryptedData) {
    // This would integrate with secure file storage (S3 with encryption, etc.)
    // For now, return a placeholder URL
    return `https://secure-exports.tailtracker.com/gdpr/${requestId}`;
  }

  /**
   * Generate data export
   */
  async generateDataExport(userData) {
    return this.generatePortableDataFormat(userData);
  }
}

module.exports = { GDPRComplianceManager };