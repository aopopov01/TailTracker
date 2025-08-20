/**
 * TailTracker Comprehensive Security Framework
 * Enterprise-grade security for 150K+ users
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

class SecurityFramework {
  constructor() {
    this.saltRounds = 12;
    this.tokenLength = 32;
    this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Security headers middleware using Helmet
   */
  getSecurityHeaders() {
    return helmet({
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", "https://api.tailtracker.com", "wss:"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'", "blob:"],
          workerSrc: ["'self'", "blob:"]
        }
      },
      
      // HTTP Strict Transport Security
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      },
      
      // X-Frame-Options
      frameguard: {
        action: 'deny'
      },
      
      // X-Content-Type-Options
      noSniff: true,
      
      // Referrer Policy
      referrerPolicy: {
        policy: "strict-origin-when-cross-origin"
      },
      
      // Permission Policy
      permittedCrossDomainPolicies: false,
      
      // X-DNS-Prefetch-Control
      dnsPrefetchControl: true,
      
      // X-Download-Options
      ieNoOpen: true,
      
      // X-XSS-Protection
      xssFilter: true
    });
  }

  /**
   * Input validation and sanitization
   */
  static getValidationRules() {
    return {
      // User registration validation
      userRegistration: [
        body('email')
          .isEmail()
          .normalizeEmail()
          .isLength({ min: 5, max: 255 })
          .custom(async (email) => {
            // Check for disposable email domains
            const disposableDomains = [
              '10minutemail.com', 'tempmail.org', 'guerrillamail.com'
            ];
            const domain = email.split('@')[1];
            if (disposableDomains.includes(domain)) {
              throw new Error('Disposable email addresses are not allowed');
            }
            return true;
          }),
        
        body('password')
          .isLength({ min: 8, max: 128 })
          .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
          .withMessage('Password must contain at least 8 characters including uppercase, lowercase, number, and special character'),
        
        body('full_name')
          .trim()
          .isLength({ min: 2, max: 255 })
          .matches(/^[a-zA-Z\s'-]+$/)
          .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),
        
        body('gdpr_consent')
          .isBoolean()
          .custom((value) => {
            if (!value) {
              throw new Error('GDPR consent is required');
            }
            return true;
          })
      ],

      // Pet profile validation
      petProfile: [
        body('name')
          .trim()
          .isLength({ min: 1, max: 255 })
          .matches(/^[a-zA-Z0-9\s'-]+$/)
          .withMessage('Pet name contains invalid characters'),
        
        body('species')
          .isIn(['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other'])
          .withMessage('Invalid species'),
        
        body('breed')
          .optional()
          .trim()
          .isLength({ max: 100 })
          .matches(/^[a-zA-Z0-9\s'-]+$/)
          .withMessage('Breed contains invalid characters'),
        
        body('weight_kg')
          .optional()
          .isFloat({ min: 0.01, max: 200 })
          .withMessage('Weight must be between 0.01 and 200 kg'),
        
        body('date_of_birth')
          .optional()
          .isISO8601()
          .custom((value) => {
            const birthDate = new Date(value);
            const now = new Date();
            if (birthDate > now) {
              throw new Error('Birth date cannot be in the future');
            }
            return true;
          }),
        
        body('microchip_number')
          .optional()
          .matches(/^[A-Za-z0-9]{15}$/)
          .withMessage('Microchip number must be 15 alphanumeric characters')
      ],

      // Medical record validation
      medicalRecord: [
        body('title')
          .trim()
          .isLength({ min: 1, max: 255 })
          .escape(),
        
        body('description')
          .optional()
          .trim()
          .isLength({ max: 2000 })
          .escape(),
        
        body('date_of_record')
          .isISO8601()
          .custom((value) => {
            const recordDate = new Date(value);
            const now = new Date();
            if (recordDate > now) {
              throw new Error('Medical record date cannot be in the future');
            }
            return true;
          }),
        
        body('cost')
          .optional()
          .isFloat({ min: 0, max: 999999.99 })
          .withMessage('Cost must be between 0 and 999,999.99'),
        
        body('diagnosis')
          .optional()
          .trim()
          .isLength({ max: 1000 })
          .escape(),
        
        body('treatment')
          .optional()
          .trim()
          .isLength({ max: 1000 })
          .escape()
      ]
    };
  }

  /**
   * SQL Injection prevention
   */
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // Remove potential SQL injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
      /(\b(UNION|OR|AND)\s+(SELECT|INSERT|UPDATE|DELETE)\b)/gi,
      /(--|\*\/|\*)/g,
      /(\b(SCRIPT|JAVASCRIPT|VBSCRIPT)\b)/gi
    ];
    
    let sanitized = input;
    sqlPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    return sanitized.trim();
  }

  /**
   * XSS Protection
   */
  static sanitizeHTML(input) {
    if (typeof input !== 'string') return input;
    
    // Remove HTML tags and encode special characters
    return input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * CSRF Protection
   */
  generateCSRFToken() {
    return crypto.randomBytes(this.tokenLength).toString('hex');
  }

  validateCSRFToken(token, sessionToken) {
    if (!token || !sessionToken) return false;
    return crypto.timingSafeEqual(
      Buffer.from(token, 'hex'),
      Buffer.from(sessionToken, 'hex')
    );
  }

  /**
   * Password security
   */
  async hashPassword(password) {
    // Check password strength
    const strengthScore = this.calculatePasswordStrength(password);
    if (strengthScore < 3) {
      throw new Error('Password does not meet minimum strength requirements');
    }
    
    return await bcrypt.hash(password, this.saltRounds);
  }

  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  calculatePasswordStrength(password) {
    let score = 0;
    
    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    
    // Character variety
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    // Common patterns (reduce score)
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /abc123/i,
      /(.)\1{3,}/ // Repeated characters
    ];
    
    commonPatterns.forEach(pattern => {
      if (pattern.test(password)) score--;
    });
    
    return Math.max(0, Math.min(5, score));
  }

  /**
   * Session management
   */
  generateSecureSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Two-Factor Authentication
   */
  generateTOTPSecret() {
    return crypto.randomBytes(20).toString('base32');
  }

  /**
   * API Key management
   */
  generateAPIKey() {
    const prefix = 'tk_live_'; // TailTracker live key
    const key = crypto.randomBytes(24).toString('hex');
    const checksum = crypto.createHash('sha256')
      .update(prefix + key)
      .digest('hex')
      .substring(0, 8);
    
    return `${prefix}${key}_${checksum}`;
  }

  validateAPIKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') return false;
    
    const parts = apiKey.split('_');
    if (parts.length !== 4 || parts[0] !== 'tk' || parts[1] !== 'live') {
      return false;
    }
    
    const prefix = `${parts[0]}_${parts[1]}_`;
    const key = parts[2];
    const providedChecksum = parts[3];
    
    const expectedChecksum = crypto.createHash('sha256')
      .update(prefix + key)
      .digest('hex')
      .substring(0, 8);
    
    return crypto.timingSafeEqual(
      Buffer.from(providedChecksum, 'hex'),
      Buffer.from(expectedChecksum, 'hex')
    );
  }

  /**
   * File upload security
   */
  validateFileUpload(file, allowedTypes, maxSize = 10 * 1024 * 1024) { // 10MB default
    const errors = [];
    
    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
    }
    
    // Check file type
    if (!allowedTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} not allowed`);
    }
    
    // Check file extension
    const allowedExtensions = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt']
    };
    
    const fileExtension = file.originalname.toLowerCase().split('.').pop();
    const mimeExtensions = allowedExtensions[file.mimetype];
    
    if (mimeExtensions && !mimeExtensions.includes(`.${fileExtension}`)) {
      errors.push('File extension does not match file type');
    }
    
    // Basic malware check (file header validation)
    if (!this.validateFileHeader(file.buffer, file.mimetype)) {
      errors.push('Invalid file format or potentially malicious file');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateFileHeader(buffer, mimetype) {
    if (!buffer || buffer.length < 4) return false;
    
    const signatures = {
      'image/jpeg': [[0xFF, 0xD8, 0xFF]],
      'image/png': [[0x89, 0x50, 0x4E, 0x47]],
      'image/gif': [[0x47, 0x49, 0x46, 0x38]],
      'application/pdf': [[0x25, 0x50, 0x44, 0x46]]
    };
    
    const fileSignatures = signatures[mimetype];
    if (!fileSignatures) return true; // Allow unknown types for now
    
    return fileSignatures.some(signature => {
      return signature.every((byte, index) => buffer[index] === byte);
    });
  }

  /**
   * IP-based security
   */
  isIPBlacklisted(ip) {
    // This would integrate with threat intelligence feeds
    const blacklistedRanges = [
      // Example: known malicious IP ranges
      '192.168.1.0/24', // Example - don't use in production
    ];
    
    // Implement CIDR matching logic here
    return false; // Placeholder
  }

  /**
   * Security event logging
   */
  async logSecurityEvent(eventType, details, request) {
    const securityEvent = {
      event_type: eventType,
      timestamp: new Date().toISOString(),
      ip_address: request.ip,
      user_agent: request.get('User-Agent'),
      user_id: request.user?.id,
      details: details,
      severity: this.getEventSeverity(eventType)
    };

    // Log to security monitoring system
    console.log('SECURITY_EVENT:', JSON.stringify(securityEvent));
    
    // Store in database for analysis
    // This would integrate with your logging system
    return securityEvent;
  }

  getEventSeverity(eventType) {
    const severityMap = {
      'login_attempt': 'low',
      'login_failure': 'medium',
      'multiple_login_failures': 'high',
      'password_change': 'medium',
      'account_locked': 'high',
      'suspicious_activity': 'high',
      'data_export_request': 'medium',
      'data_deletion_request': 'high',
      'admin_access': 'high',
      'api_abuse': 'high',
      'sql_injection_attempt': 'critical',
      'xss_attempt': 'high',
      'file_upload_malware': 'critical'
    };
    
    return severityMap[eventType] || 'medium';
  }

  /**
   * Security monitoring middleware
   */
  securityMonitoring() {
    return async (req, res, next) => {
      // Monitor for suspicious patterns
      const suspiciousPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP)\b.*\b(FROM|INTO|SET|WHERE)\b)/i,
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/i,
        /vbscript:/i,
        /on\w+\s*=/i
      ];

      // Check request parameters and body
      const requestData = JSON.stringify({
        query: req.query,
        body: req.body,
        params: req.params
      });

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(requestData)) {
          await this.logSecurityEvent(
            pattern.toString().includes('SELECT|INSERT') ? 'sql_injection_attempt' : 'xss_attempt',
            { pattern: pattern.toString(), data: requestData },
            req
          );
          
          return res.status(400).json({
            error: {
              code: 'SUSPICIOUS_REQUEST',
              message: 'Request blocked for security reasons'
            }
          });
        }
      }

      next();
    };
  }

  /**
   * Brute force protection
   */
  getBruteForceProtection() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // Limit each IP to 5 requests per windowMs
      message: {
        error: {
          code: 'TOO_MANY_ATTEMPTS',
          message: 'Too many failed login attempts. Please try again later.'
        }
      },
      standardHeaders: true,
      legacyHeaders: false,
      // Increment attempts on failed logins only
      skip: (req, res) => res.statusCode < 400,
      keyGenerator: (req) => {
        // Use combination of IP and email for more targeted limiting
        return `${req.ip}:${req.body?.email || 'unknown'}`;
      }
    });
  }
}

/**
 * Security middleware factory
 */
class SecurityMiddleware {
  constructor(securityFramework) {
    this.security = securityFramework;
  }

  /**
   * Validation middleware
   */
  validate(validationRules) {
    return [
      ...validationRules,
      (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid input parameters',
              details: errors.array()
            }
          });
        }
        next();
      }
    ];
  }

  /**
   * File upload validation middleware
   */
  validateFileUpload(allowedTypes, maxSize) {
    return (req, res, next) => {
      if (!req.file) {
        return res.status(400).json({
          error: {
            code: 'NO_FILE_UPLOADED',
            message: 'No file was uploaded'
          }
        });
      }

      const validation = this.security.validateFileUpload(req.file, allowedTypes, maxSize);
      
      if (!validation.valid) {
        return res.status(400).json({
          error: {
            code: 'INVALID_FILE',
            message: 'File validation failed',
            details: validation.errors
          }
        });
      }

      next();
    };
  }

  /**
   * CSRF protection middleware
   */
  csrfProtection() {
    return (req, res, next) => {
      if (req.method === 'GET') return next();

      const token = req.headers['x-csrf-token'];
      const sessionToken = req.session?.csrfToken;

      if (!this.security.validateCSRFToken(token, sessionToken)) {
        return res.status(403).json({
          error: {
            code: 'INVALID_CSRF_TOKEN',
            message: 'Invalid or missing CSRF token'
          }
        });
      }

      next();
    };
  }
}

module.exports = {
  SecurityFramework,
  SecurityMiddleware
};