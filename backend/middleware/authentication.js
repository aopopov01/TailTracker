/**
 * TailTracker Authentication Middleware
 * JWT-based authentication with Supabase integration
 */

const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

class AuthenticationMiddleware {
  constructor(supabaseUrl, supabaseKey, jwtSecret) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.jwtSecret = jwtSecret;
  }

  /**
   * Verify JWT token and extract user information
   */
  async verifyToken(token) {
    try {
      // First try Supabase JWT verification
      const { data: { user }, error } = await this.supabase.auth.getUser(token);
      
      if (error || !user) {
        throw new Error('Invalid token');
      }

      // Get additional user data from our users table
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .select(`
          id,
          auth_user_id,
          email,
          full_name,
          subscription_status,
          subscription_expires_at,
          trial_ends_at,
          last_seen_at
        `)
        .eq('auth_user_id', user.id)
        .single();

      if (userError) {
        throw new Error('User not found in database');
      }

      // Update last seen timestamp
      await this.supabase
        .from('users')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('auth_user_id', user.id);

      return {
        auth_user: user,
        user_data: userData,
        subscription_active: this.isSubscriptionActive(userData)
      };
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  /**
   * Check if user subscription is active
   */
  isSubscriptionActive(userData) {
    if (userData.subscription_status === 'free') return true;
    
    const now = new Date();
    const expiresAt = new Date(userData.subscription_expires_at);
    const trialEndsAt = userData.trial_ends_at ? new Date(userData.trial_ends_at) : null;
    
    // Check if subscription is active or in trial
    return (userData.subscription_status === 'premium' || userData.subscription_status === 'family') &&
           (expiresAt > now || (trialEndsAt && trialEndsAt > now));
  }

  /**
   * Extract token from request headers
   */
  extractToken(req) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    
    return parts[1];
  }

  /**
   * Main authentication middleware
   */
  authenticate() {
    return async (req, res, next) => {
      try {
        const token = this.extractToken(req);
        
        if (!token) {
          return res.status(401).json({
            error: {
              code: 'MISSING_TOKEN',
              message: 'Authentication token is required'
            }
          });
        }

        const authResult = await this.verifyToken(token);
        
        // Attach user information to request
        req.user = authResult.user_data;
        req.auth_user = authResult.auth_user;
        req.subscription_active = authResult.subscription_active;
        
        next();
      } catch (error) {
        return res.status(401).json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired authentication token',
            details: error.message
          }
        });
      }
    };
  }

  /**
   * Optional authentication middleware (allows anonymous access)
   */
  optionalAuthenticate() {
    return async (req, res, next) => {
      try {
        const token = this.extractToken(req);
        
        if (token) {
          const authResult = await this.verifyToken(token);
          req.user = authResult.user_data;
          req.auth_user = authResult.auth_user;
          req.subscription_active = authResult.subscription_active;
        }
        
        next();
      } catch (error) {
        // Continue without authentication for optional routes
        req.user = null;
        req.auth_user = null;
        req.subscription_active = false;
        next();
      }
    };
  }

  /**
   * Subscription requirement middleware
   */
  requireSubscription(requiredTiers = ['premium', 'family']) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required'
          }
        });
      }

      if (!requiredTiers.includes(req.user.subscription_status)) {
        return res.status(403).json({
          error: {
            code: 'SUBSCRIPTION_REQUIRED',
            message: 'This feature requires a premium subscription',
            required_tiers: requiredTiers,
            current_tier: req.user.subscription_status
          }
        });
      }

      if (!req.subscription_active) {
        return res.status(403).json({
          error: {
            code: 'SUBSCRIPTION_EXPIRED',
            message: 'Your subscription has expired',
            expires_at: req.user.subscription_expires_at
          }
        });
      }

      next();
    };
  }

  /**
   * Role-based access control middleware
   */
  requireRole(requiredRoles) {
    return async (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required'
          }
        });
      }

      // Check if user has required role in family context
      const familyId = req.params.family_id || req.body.family_id;
      
      if (familyId) {
        const { data: memberData, error } = await this.supabase
          .from('family_members')
          .select('role')
          .eq('family_id', familyId)
          .eq('user_id', req.user.id)
          .single();

        if (error || !memberData) {
          return res.status(403).json({
            error: {
              code: 'FAMILY_ACCESS_DENIED',
              message: 'You do not have access to this family'
            }
          });
        }

        if (!requiredRoles.includes(memberData.role)) {
          return res.status(403).json({
            error: {
              code: 'INSUFFICIENT_ROLE',
              message: 'Insufficient permissions for this action',
              required_roles: requiredRoles,
              current_role: memberData.role
            }
          });
        }
      }

      next();
    };
  }

  /**
   * API key authentication for service-to-service communication
   */
  authenticateApiKey() {
    return (req, res, next) => {
      const apiKey = req.headers['x-api-key'];
      
      if (!apiKey) {
        return res.status(401).json({
          error: {
            code: 'MISSING_API_KEY',
            message: 'API key is required'
          }
        });
      }

      // Validate API key (implement your key validation logic)
      if (!this.validateApiKey(apiKey)) {
        return res.status(401).json({
          error: {
            code: 'INVALID_API_KEY',
            message: 'Invalid API key'
          }
        });
      }

      req.api_authenticated = true;
      next();
    };
  }

  /**
   * Validate API key (implement based on your key management system)
   */
  validateApiKey(apiKey) {
    // Implement your API key validation logic here
    // This could involve checking against a database, Redis, or encrypted validation
    const validKeys = process.env.VALID_API_KEYS?.split(',') || [];
    return validKeys.includes(apiKey);
  }

  /**
   * GDPR consent check middleware
   */
  requireGdprConsent() {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required'
          }
        });
      }

      if (!req.user.gdpr_consent_date) {
        return res.status(403).json({
          error: {
            code: 'GDPR_CONSENT_REQUIRED',
            message: 'GDPR consent is required to use this service'
          }
        });
      }

      next();
    };
  }

  /**
   * Request logging middleware for audit trails
   */
  logRequest() {
    return async (req, res, next) => {
      const logData = {
        user_id: req.user?.id,
        method: req.method,
        path: req.path,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      };

      // Log sensitive operations to audit table
      const sensitiveOperations = ['POST', 'PUT', 'PATCH', 'DELETE'];
      
      if (sensitiveOperations.includes(req.method) && req.user) {
        try {
          await this.supabase
            .from('audit_logs')
            .insert({
              user_id: req.user.id,
              table_name: 'api_requests',
              action: req.method.toLowerCase(),
              new_values: {
                path: req.path,
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
              },
              ip_address: req.ip,
              user_agent: req.get('User-Agent')
            });
        } catch (error) {
          console.error('Audit logging failed:', error);
        }
      }

      next();
    };
  }
}

module.exports = { AuthenticationMiddleware };