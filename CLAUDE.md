# TailTracker - Complete Development Documentation

## 🐾 Project Overview
TailTracker is a cross-platform mobile application for comprehensive pet management, featuring digital pet passports, vaccination tracking, and lost pet alerts (Pro tier only). Built with React Native and Expo for iOS and Android, the platform combines modern mobile development practices with a tiered subscription model.

### 🎯 APPROVED FEATURES ONLY
This documentation reflects ONLY the approved features as defined in the subscription tiers. No additional features should be implemented without explicit approval.

## APPROVED FEATURE SET

### Free Tier (1 pet, 2 family members)
- 1 pet profile with digital passport
- 2 family members total (pet owner + 1)
- Basic health tracking
- Essential reminders (user-set only)
- Family sharing (read-only access)
- 1 photo per pet
- Receive lost pet alerts (cannot create)
- Standard support (FAQ, feedback)

### Premium Tier (2 pets, 3 family members) 
- 2 pet profiles with digital passports
- 3 family members total (pet owner + 2)  
- Enhanced health tracking
- Advanced reminders (user-set only)
- Family collaboration
- QR code sharing
- 6 photos per pet
- Receive lost pet alerts (cannot create)
- Export capabilities
- Standard support (FAQ, feedback)

### Pro Tier (unlimited pets & family)
- Unlimited pet profiles
- Unlimited family members
- Create and receive lost pet alerts
- Community notifications for lost pets
- Advanced family management
- Professional tools
- Advanced analytics
- 12 photos per pet
- Standard support (FAQ, feedback)

### Universal Features (All Tiers)
- Vaccination tracking with user-set reminders
- Basic push notifications
- Photo galleries
- Digital pet passports
- Health record management

## Table of Contents
1. [Recent Development Log](#recent-development-log)
2. [Critical Development Best Practices](#critical-development-best-practices)
3. [Error Learning System](#error-learning-system)
4. [Technical Architecture](#technical-architecture)
5. [Tech Stack Decisions](#tech-stack-decisions)
6. [Development Guidelines](#development-guidelines)
7. [Feature Implementation](#feature-implementation)
8. [Testing Strategy](#testing-strategy)
9. [Security & Privacy](#security--privacy)
10. [Performance Optimization](#performance-optimization)
11. [CI/CD Pipeline](#cicd-pipeline)
12. [Error Handling](#error-handling)
13. [Deployment Strategy](#deployment-strategy)

---

## Recent Development Log

### 2025-12-26: Authentication Role Fix

**Issue**: Admin tab not showing in web app sidebar despite user having `role: 'admin'` in database.

**Root Cause**: The authentication service was not fetching user role from the `users` table. Multiple functions only used Supabase auth data (via `transformUser()`) which doesn't include database fields like `role`.

**Files Modified**:
- `packages/shared-types/src/index.ts` - Added `role?: 'user' | 'admin' | 'super_admin'` to `User` interface
- `packages/shared-services/src/authService.ts`:
  - `getCurrentUser()` - Now fetches role from `users` table
  - `getSession()` - Now fetches role from `users` table
  - `signIn()` - Now fetches role after successful authentication
  - `onAuthStateChange()` - Now fetches role on each auth state change
- `apps/web/src/components/layouts/AppLayout.tsx` - Changed from `isAdmin` query to `user?.role === 'admin'`

**Database Schema**:
```sql
-- users table has role column
role VARCHAR DEFAULT 'user' -- Values: 'user', 'admin', 'super_admin'
auth_user_id UUID -- Links to auth.users.id
```

**Prevention**:
- All auth functions now consistently fetch profile data including role from `users` table
- User object always includes role field (defaults to 'user' if not found)
- Removed dependency on separate `isAdmin()` query for sidebar visibility

**User Action Required**:
```javascript
// Clear cached session to get fresh user data with role:
localStorage.removeItem('auth-storage');
location.reload();
// Then sign back in
```

---

## Critical Development Best Practices

### 🚨 MANDATORY: Error Learning and Prevention System

**CORE PRINCIPLE**: Every error encountered must be documented, analyzed, and prevented from recurring. The same error should NEVER happen twice.

#### 1. Error Documentation Protocol
```markdown
## ERROR LOG ENTRY
Date: [YYYY-MM-DD HH:MM]
Component/File: [Exact location]
Error Type: [Category]
Error Message: [Complete error message]

### Root Cause:
[Detailed analysis of why this occurred]

### Solution Applied:
[Exact steps taken to resolve]

### Prevention Measures:
[Code changes/patterns to prevent recurrence]

### Related Errors:
[Links to similar issues]

### Verification:
[How to confirm fix works]
```

#### 2. Pre-Development Checklist
Before writing ANY code:
- [ ] Check ERROR_LOG.md for similar issues
- [ ] Review recent fixes in the same component
- [ ] Verify all dependencies are installed
- [ ] Confirm environment variables are set
- [ ] Run type checking on existing code
- [ ] Check for pending migrations

#### 3. Error Categories and Quick Fixes

**Type Errors**
- ALWAYS run `npm run type-check` before committing
- Use strict TypeScript settings
- Never use `any` type without documentation

**Dependency Errors**
- Lock file must be committed (package-lock.json)
- Always run `npm ci` instead of `npm install` in CI
- Document peer dependency requirements

**Build Errors**
- Clear cache first: `npx expo start --clear`
- iOS: `cd ios && pod install && cd ..`
- Android: `cd android && ./gradlew clean && cd ..`

#### 4. Learning Implementation
```typescript
// Every error handler must log to our learning system
import { ErrorLogger } from '@/utils/errorLogger';

try {
  // Your code
} catch (error) {
  // Log to learning system FIRST
  await ErrorLogger.log({
    error,
    context: 'PetProfile.load',
    preventionHint: 'Check if pet ID exists before loading'
  });
  
  // Then handle user experience
  handleError(error);
}
```

---

## Error Learning System

### ERROR_LOG.md Structure
Create and maintain `ERROR_LOG.md` in the project root:

```markdown
# TailTracker Error Log

## Quick Reference Index
- [TypeScript Errors](#typescript-errors)
- [React Native Errors](#react-native-errors)
- [Expo Errors](#expo-errors)
- [Supabase Errors](#supabase-errors)
- [Build Errors](#build-errors)
- [Runtime Errors](#runtime-errors)

## Error Entries

### 2025-01-20 14:30 - TypeError: Cannot read property 'id' of undefined
**Location**: src/screens/PetProfile.tsx:45
**Category**: Runtime Error

**Root Cause**: 
Attempting to access pet.id before checking if pet object exists. Race condition between navigation and data loading.

**Solution**:
```typescript
// Before
const petId = route.params.pet.id;

// After
const petId = route.params?.pet?.id;
if (!petId) {
  navigation.goBack();
  return null;
}
```

**Prevention**:
- Always use optional chaining for route params
- Implement loading states for async data
- Add TypeScript strict null checks

**Verification**:
1. Navigate to pet profile without pet data
2. Should redirect back instead of crashing
```

### Automated Error Detection
```typescript
// src/utils/errorLogger.ts
interface ErrorEntry {
  timestamp: Date;
  error: Error;
  context: string;
  solution?: string;
  prevented: boolean;
}

class ErrorLearningSystem {
  private errors: Map<string, ErrorEntry[]> = new Map();
  private readonly ERROR_LOG_PATH = './ERROR_LOG.md';
  
  async log(entry: Omit<ErrorEntry, 'timestamp' | 'prevented'>) {
    const errorKey = this.getErrorKey(entry.error);
    
    // Check if we've seen this before
    if (this.errors.has(errorKey)) {
      console.error('🚨 REPEATED ERROR DETECTED!');
      console.error('This error has occurred before. Check ERROR_LOG.md');
      console.error(`Previous solutions: ${this.errors.get(errorKey)}`);
      
      // Alert development team
      await this.alertTeam(entry);
    }
    
    // Log to file
    await this.appendToLog(entry);
    
    // Store in memory
    this.errors.set(errorKey, [
      ...(this.errors.get(errorKey) || []),
      { ...entry, timestamp: new Date(), prevented: false }
    ]);
  }
  
  private getErrorKey(error: Error): string {
    return `${error.name}-${error.message}`.substring(0, 100);
  }
  
  async checkForSimilarErrors(error: Error): Promise<ErrorEntry[]> {
    const similar: ErrorEntry[] = [];
    const errorKey = this.getErrorKey(error);
    
    // Search for similar errors
    for (const [key, entries] of this.errors) {
      if (this.calculateSimilarity(errorKey, key) > 0.7) {
        similar.push(...entries);
      }
    }
    
    return similar;
  }
  
  private calculateSimilarity(str1: string, str2: string): number {
    // Implement string similarity algorithm
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }
  
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

export const ErrorLogger = new ErrorLearningSystem();
```

### Development Workflow Integration

#### Pre-Commit Hook
```bash
#!/bin/bash
# .husky/pre-commit

# Check for repeated errors
npm run check-errors

# If repeated errors found, block commit
if [ $? -ne 0 ]; then
  echo "❌ Repeated errors detected. Fix them before committing."
  echo "Check ERROR_LOG.md for solutions."
  exit 1
fi
```

#### Daily Standup Review
```typescript
// src/scripts/errorReport.ts
import { ErrorLogger } from '@/utils/errorLogger';

async function generateDailyReport() {
  const report = await ErrorLogger.generateReport({
    period: '24h',
    includeFixed: false,
    includePrevented: true
  });
  
  console.log('📊 Error Prevention Report');
  console.log(`Errors Prevented: ${report.prevented}`);
  console.log(`New Errors: ${report.new}`);
  console.log(`Repeated Errors: ${report.repeated}`);
  
  if (report.repeated > 0) {
    console.error('⚠️ ATTENTION: Repeated errors detected!');
    report.repeatedList.forEach(error => {
      console.log(`- ${error.context}: ${error.message}`);
      console.log(`  Previous fix: ${error.previousSolution}`);
    });
  }
}
```

### Best Practices Enforcement

#### 1. Code Review Checklist
Every PR must include:
- [ ] No repeated errors from ERROR_LOG.md
- [ ] All new errors documented with solutions
- [ ] Prevention measures implemented
- [ ] Tests added for error scenarios
- [ ] Error recovery paths defined

#### 2. Proactive Error Prevention
```typescript
// Example: Prevent common async/state errors
import { useErrorBoundary } from 'react-error-boundary';

export const useSafeAsync = <T>(asyncFunction: () => Promise<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { showBoundary } = useErrorBoundary();
  
  useEffect(() => {
    let mounted = true;
    
    const execute = async () => {
      try {
        setLoading(true);
        const result = await asyncFunction();
        
        // Prevent state update on unmounted component
        if (mounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        // Check if we've seen this error before
        const similar = await ErrorLogger.checkForSimilarErrors(err as Error);
        
        if (similar.length > 0) {
          console.warn('Similar error found:', similar[0].solution);
        }
        
        if (mounted) {
          setError(err as Error);
          showBoundary(err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    execute();
    
    return () => {
      mounted = false;
    };
  }, [asyncFunction, showBoundary]);
  
  return { data, loading, error };
};
```

#### 3. Testing for Error Prevention
```typescript
// Every component must have error tests
describe('PetProfile Error Handling', () => {
  it('should handle missing pet data gracefully', async () => {
    const { result } = renderHook(() => usePetProfile(undefined));
    
    expect(result.current.error).toBeDefined();
    expect(result.current.error.message).toBe('Pet ID is required');
    
    // Verify error was logged for learning
    expect(ErrorLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'PetProfile.usePetProfile',
        error: expect.any(Error)
      })
    );
  });
  
  it('should not repeat previously fixed errors', async () => {
    // Test that previously fixed errors don't occur
    const previousErrors = await ErrorLogger.getFixedErrors();
    
    for (const error of previousErrors) {
      // Attempt to trigger the error
      const result = await triggerError(error.trigger);
      
      // Should be prevented
      expect(result).not.toThrow();
    }
  });
});
```

#### 4. Continuous Improvement Metrics
```typescript
// Track error prevention success
interface ErrorMetrics {
  totalErrors: number;
  preventedErrors: number;
  repeatedErrors: number;
  meanTimeToFix: number;
  errorRate: number;
}

export const trackErrorMetrics = (): ErrorMetrics => {
  return {
    totalErrors: ErrorLogger.getTotalErrors(),
    preventedErrors: ErrorLogger.getPreventedCount(),
    repeatedErrors: ErrorLogger.getRepeatedCount(),
    meanTimeToFix: ErrorLogger.getMTTF(),
    errorRate: ErrorLogger.getErrorRate()
  };
};

// Goal: 0% repeated errors, 90%+ prevention rate
```

### Zero-Tolerance Error Policy

1. **First Occurrence**: Document, fix, and add prevention
2. **Second Occurrence**: Immediate code review required
3. **Third Occurrence**: Architecture review and refactoring

### Common Error Patterns to Prevent

#### React Native Specific
```typescript
// PREVENT: Can't perform a React state update on an unmounted component
const useMountedState = () => {
  const mountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  const setMountedState = useCallback((setter: Function) => {
    if (mountedRef.current) {
      setter();
    }
  }, []);
  
  return setMountedState;
};
```

#### Expo Specific
```typescript
// PREVENT: Camera/Location permissions errors
const usePermissionSafe = (permission: 'camera' | 'location') => {
  const [status, setStatus] = useState<PermissionStatus | null>(null);
  
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const { status } = await getPermissionAsync(permission);
        setStatus(status);
      } catch (error) {
        // Log and provide fallback
        ErrorLogger.log({
          error,
          context: `Permission.${permission}`,
          solution: 'Fallback to manual permission request'
        });
        setStatus('undetermined');
      }
    };
    
    checkPermission();
  }, [permission]);
  
  return status;
};
```

---

## MCP Tools Integration & Automated Backup System

### 🔧 Available MCP Tools and Usage Patterns

#### GitHub Integration (SSH-based)
**Primary Repository**: `git@github.com:aopopov01/TailTracker.git`
**SSH Key**: `~/.ssh/id_ed25519` (aopopov01@github)
**SSH Fingerprint**: `SHA256:NVCtTVbZYQraMObPNIKCGkCBGM8NujB2/6i/kTQaL2A` (WSL Ubuntu Development)

```bash
# MCP GitHub Operations
mcp__github__create_repository          # Create new repositories
mcp__github__push_files                 # Batch file uploads
mcp__github__create_or_update_file      # Single file operations
mcp__github__get_repository             # Repository information
mcp__github__list_commits               # Commit history
mcp__github__create_branch              # Branch management
```

#### Supabase Integration
**Usage**: Backend data persistence and real-time features
```bash
mcp__supabase-mcp__list_projects        # Project management
mcp__supabase-mcp__create_project       # New project setup
mcp__supabase-mcp__execute_sql          # Database operations
mcp__supabase-mcp__apply_migration      # Schema changes
mcp__supabase-mcp__list_tables          # Database structure
```

#### Desktop Commander (File System Operations)
**Usage**: Local file management and development operations
```bash
mcp__desktop-commander__read_file       # File reading
mcp__desktop-commander__write_file      # File creation/editing
mcp__desktop-commander__create_directory # Directory management
mcp__desktop-commander__search_files    # File discovery
mcp__desktop-commander__start_process   # Process execution
```

### 🚀 Automated Backup System Architecture

#### Core Backup Scripts

**1. auto-backup.sh** - Main backup orchestrator
```bash
# Automated backup triggers
./auto-backup.sh scheduled              # Every 30 minutes
./auto-backup.sh feature "feature-name" # Before new features
./auto-backup.sh error-fix "bug-desc"   # Before bug fixes
./auto-backup.sh milestone "name"       # After major milestones
./auto-backup.sh manual "description"   # Manual backups
```

**2. backup-monitor.sh** - Health monitoring and auto-fixing
```bash
# System monitoring
./backup-monitor.sh health              # Comprehensive health check
./backup-monitor.sh fix                 # Auto-fix common issues
./backup-monitor.sh report              # Generate status report
./backup-monitor.sh watch               # Real-time file monitoring
```

#### Backup Strategy Matrix

| Trigger | Frequency | Command | Purpose |
|---------|-----------|---------|---------|
| **Scheduled** | Every 30 min (9AM-6PM) | `scheduled` | Continuous preservation |
| **Feature Start** | Before implementation | `feature "name"` | Pre-change backup |
| **Error Fix** | Before debugging | `error-fix "desc"` | Safety checkpoint |
| **Milestone** | After completion | `milestone "name"` | Progress marker |
| **File Changes** | Real-time detection | `manual "auto-detected"` | Change preservation |
| **Manual** | On-demand | `manual "reason"` | User-initiated |

#### Multi-Layer Backup Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BACKUP ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────┤
│ Layer 1: Local Git Repository                              │
│  ├── Immediate commits with comprehensive messages         │
│  ├── Error log timestamped backups                        │
│  └── Branch-based feature isolation                       │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: GitHub Remote (SSH)                              │
│  ├── Automatic push after every commit                    │
│  ├── Complete project history preservation                │
│  └── Distributed backup with GitHub's infrastructure      │
├─────────────────────────────────────────────────────────────┤
│ Layer 3: Error Learning System                            │
│  ├── ERROR_LOG.md with timestamped entries               │
│  ├── error_logs/ directory with historical backups       │
│  └── Prevention pattern documentation                     │
├─────────────────────────────────────────────────────────────┤
│ Layer 4: Health Monitoring                                │
│  ├── backup-health.log for system monitoring             │
│  ├── Automated issue detection and resolution             │
│  └── Real-time file change detection                      │
└─────────────────────────────────────────────────────────────┘
```

### 🔄 Continuous Preservation Workflow

#### Development Lifecycle Integration

**1. Pre-Development**
```bash
# Before starting work
./backup-monitor.sh health              # Check system status
./auto-backup.sh feature "new-feature"  # Create feature checkpoint
```

**2. During Development**
```bash
# Automated (cron job every 30 minutes)
./auto-backup.sh scheduled

# Real-time file monitoring (optional)
./backup-monitor.sh watch &
```

**3. Error Handling**
```bash
# Before fixing any error
./auto-backup.sh error-fix "error description"

# Document in ERROR_LOG.md
# Apply fix
# Verify fix works
# Commit fix with learning notes
```

**4. Milestone Completion**
```bash
# After completing major work
./auto-backup.sh milestone "MVP completed"
./backup-monitor.sh report              # Generate status report
```

#### Automated Cron Schedule

```bash
# Setup automated backups (run once)
./auto-backup.sh setup

# Cron schedule created:
# */30 9-18 * * 1-5  - Every 30 minutes, 9AM-6PM, weekdays
```

### 🛡️ Zero Data Loss Guarantee

#### Backup Verification System

```bash
# Integrity checks
./auto-backup.sh verify                 # Verify backup integrity
./auto-backup.sh list                   # List available backups

# Restoration capabilities
./auto-backup.sh restore "commit-hash"  # Restore to specific state
```

#### Restoration Process

**Complete Project Restoration**:
1. Clone repository: `git clone git@github.com:aopopov01/TailTracker.git`
2. Verify integrity: `./backup-monitor.sh health`
3. Check available states: `./auto-backup.sh list`
4. Restore if needed: `./auto-backup.sh restore "hash"`

#### Error Prevention Integration

```typescript
// Integration with error learning system
import { ErrorLogger } from '@/utils/errorLogger';

// Before major operations
await ErrorLogger.createBackupCheckpoint('feature-implementation');

try {
  // Your code
  await implementFeature();
  
  // Success checkpoint
  await ErrorLogger.markSuccess('feature-implementation');
  
} catch (error) {
  // Log error and restore if needed
  await ErrorLogger.logAndRestore(error, 'feature-implementation');
}
```

### 📊 Monitoring and Alerts

#### Health Check System

**Automated Monitoring**:
- Git repository status
- Remote connectivity (GitHub SSH)
- Critical file integrity
- Uncommitted changes detection
- Disk space monitoring
- Backup recency verification

**Alert Conditions**:
- No backup for > 2 hours during work time
- Git repository corruption
- GitHub connectivity issues
- Critical files missing or empty
- Disk space > 90% usage

#### Status Reporting

```bash
# Generate comprehensive report
./backup-monitor.sh report

# Sample report sections:
# - Repository statistics
# - Backup status and sync info
# - Critical files status
# - Health check summary
# - Actionable recommendations
```

### 🔧 Integration with Development Tools

#### IDE Integration (VS Code)

```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Backup: Feature Start",
      "type": "shell",
      "command": "./auto-backup.sh",
      "args": ["feature", "${input:featureName}"],
      "group": "build"
    },
    {
      "label": "Backup: Manual",
      "type": "shell", 
      "command": "./auto-backup.sh",
      "args": ["manual", "${input:description}"],
      "group": "build"
    }
  ]
}
```

#### Git Hooks Integration

```bash
# .git/hooks/pre-commit
#!/bin/bash
# Auto-backup before commits
./backup-monitor.sh health || exit 1

# .git/hooks/post-commit  
#!/bin/bash
# Verify backup after commits
./auto-backup.sh verify
```

### 🎯 Usage Examples

#### Daily Development Workflow

```bash
# Morning startup
cd /home/he_reat/Desktop/Projects/TailTracker
./backup-monitor.sh status              # Check overnight status

# Starting new feature
./auto-backup.sh feature "user authentication"

# Work in progress... (auto-backups every 30 min)

# Before fixing bug
./auto-backup.sh error-fix "login crash on Android"

# After major milestone
./auto-backup.sh milestone "authentication module complete"

# End of day
./backup-monitor.sh report              # Generate daily report
```

#### Emergency Recovery

```bash
# If system corruption occurs
git clone git@github.com:aopopov01/TailTracker.git TailTracker-recovery
cd TailTracker-recovery
./backup-monitor.sh health              # Verify integrity
./auto-backup.sh list                   # Find good restore point
./auto-backup.sh restore "abc1234"      # Restore to working state
```

---

## Technical Architecture

### Core Technologies
- **Framework**: React Native with Expo SDK 53+
- **Language**: TypeScript 5.x for type safety
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **State Management**: TanStack Query + Zustand
- **UI Framework**: NativeBase + React Native Paper
- **Navigation**: React Navigation 6
- **Push Notifications**: Expo Push Service
- **Payment Processing**: RevenueCat + Stripe
- **Analytics**: Expo Analytics + Sentry

### Project Structure
```
TailTracker/
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── common/             # Shared components
│   │   ├── pet/                # Pet-specific components
│   │   └── premium/            # Premium feature components
│   ├── screens/                # Screen components
│   │   ├── auth/               # Authentication screens
│   │   ├── pet/                # Pet management screens
│   │   ├── vaccination/        # Vaccination tracking
│   │   ├── lost/               # Lost pet features
│   │   └── settings/           # App settings
│   ├── services/               # API and business logic
│   │   ├── supabase/          # Database operations
│   │   ├── notifications/     # Push notification handling
│   │   ├── location/          # Location services
│   │   ├── payment/           # Subscription management
│   │   └── offline/           # Offline sync logic
│   ├── stores/                # Zustand state stores
│   ├── hooks/                 # Custom React hooks
│   ├── utils/                 # Helper functions
│   ├── types/                 # TypeScript definitions
│   └── constants/             # App constants
├── assets/                    # Images, fonts, icons
├── __tests__/                # Test files
├── app.config.js             # Expo configuration
└── CLAUDE.md                 # This documentation
```

---

## Tech Stack Decisions

### Why React Native + Expo?
**Decision Rationale:**
- **Developer Velocity**: JavaScript ecosystem and hot reloading
- **Code Sharing**: 95% code reuse between iOS and Android
- **Community**: Largest mobile dev community (20x more than Flutter)
- **Web Compatibility**: Future web expansion path
- **OTA Updates**: Instant bug fixes without app store review

### Why Supabase?
**Advantages over Firebase/AWS:**
- **PostgreSQL**: Superior relational data modeling for pet records
- **Row-Level Security**: Built-in data isolation
- **Real-time**: Native WebSocket support for lost pet alerts
- **Cost Predictable**: Fixed pricing vs usage-based spikes
- **Open Source**: No vendor lock-in

### State Management Architecture
```typescript
// Server State (TanStack Query)
const usePetProfiles = () => {
  return useQuery({
    queryKey: ['pets', userId],
    queryFn: fetchPetProfiles,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
};

// Client State (Zustand)
interface AppStore {
  currentPet: Pet | null;
  theme: 'light' | 'dark';
  notificationsEnabled: boolean;
  setCurrentPet: (pet: Pet) => void;
  toggleTheme: () => void;
  setNotifications: (enabled: boolean) => void;
}

const useAppStore = create<AppStore>((set) => ({
  currentPet: null,
  theme: 'light',
  notificationsEnabled: true,
  setCurrentPet: (pet) => set({ currentPet: pet }),
  toggleTheme: () => set((state) => ({ 
    theme: state.theme === 'light' ? 'dark' : 'light' 
  })),
  setNotifications: (enabled) => set({ notificationsEnabled: enabled })
}));
```

---

## Development Guidelines

### Code Quality Standards
**TypeScript Configuration:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### Naming Conventions
- **Components**: PascalCase (`PetProfile.tsx`)
- **Hooks**: camelCase with 'use' prefix (`usePetData.ts`)
- **Utils**: camelCase (`formatDate.ts`)
- **Types**: PascalCase with suffix (`PetProfileType.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)

### Component Structure
```typescript
// Example: PetCard.tsx
import React, { memo } from 'react';
import { View, Text, Image } from 'react-native';
import { Card } from 'native-base';
import { Pet } from '@/types/Pet';

interface PetCardProps {
  pet: Pet;
  onPress?: (pet: Pet) => void;
  showVaccineStatus?: boolean;
}

export const PetCard = memo<PetCardProps>(({ 
  pet, 
  onPress, 
  showVaccineStatus = false 
}) => {
  // Component logic here
  return (
    <Card onPress={() => onPress?.(pet)}>
      {/* Component JSX */}
    </Card>
  );
});

PetCard.displayName = 'PetCard';
```

### Error Boundaries
```typescript
// Every screen should be wrapped in an error boundary
export class ScreenErrorBoundary extends Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, {
      contexts: { react: { componentStack: errorInfo.componentStack } }
    });
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={this.resetError} />;
    }
    return this.props.children;
  }
}
```

---

## Feature Implementation

### Core Features

#### 1. Pet Onboarding Wizard
**7-Step Progressive Onboarding:**
- **Step 1 - Basic Information**: Pet name and species selection with clear indication that species affects later steps
- **Step 2 - Physical Details**: Size, breed, and appearance characteristics  
- **Step 3 - Health Information**: Medical conditions and care requirements
- **Step 4 - Personality**: Character traits and temperament selection
- **Step 5 - Care Preferences**: Daily care and feeding requirements
- **Step 6 - Favorite Activities**: Species-specific activity selection based on chosen pet type
- **Step 7 - Review & Save**: Profile confirmation with clean "Create" button (no cloud icon)

**Species-Specific Activity System:**
```typescript
// PetPersonalityService provides tailored activities
const dogActivities = ['Playing Fetch', 'Long Walks', 'Dog Parks', 'Swimming'];
const catActivities = ['Laser Pointer', 'Window Bird Watching', 'Catnip Toys'];
const birdActivities = ['Foraging Games', 'Talking/Mimicking', 'Perch Swinging'];

// Step 6 dynamically shows relevant options
const activities = PetPersonalityService.getAllFavoriteActivities(petSpecies);
```

**Implementation Architecture:**
```typescript
// Onboarding flow integration
export const PetOnboardingWizard: React.FC = () => {
  // Step 6 uses species from Step 1 to filter activities
  const speciesActivities = useMemo(() => {
    if (!profile.species) return [];
    return PetPersonalityService.getAllFavoriteActivities(profile.species);
  }, [profile.species]);

  // Step 7 shows clean "Create" button without icon
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const buttonIcon = isLastStep ? undefined : "chevron-right";
  const buttonText = isLastStep ? 'Create' : 'Next';
};
```

#### 2. Pet Passport System
**Database Schema:**
```sql
-- Pets table with comprehensive profile data
CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  species VARCHAR(50) NOT NULL,
  breed VARCHAR(100),
  birth_date DATE,
  microchip_id VARCHAR(50) UNIQUE,
  weight DECIMAL(5,2),
  color VARCHAR(50),
  medical_conditions TEXT[],
  dietary_restrictions TEXT[],
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own pets
CREATE POLICY "Users can view own pets" ON pets
  FOR SELECT USING (auth.uid() = user_id);
```

#### 2. Vaccination Tracking
**Implementation:**
```typescript
// Vaccination reminder system
interface Vaccination {
  id: string;
  petId: string;
  vaccineName: string;
  dateAdministered: Date;
  nextDueDate: Date;
  veterinarianId?: string;
  notes?: string;
}

const scheduleVaccinationReminder = async (vaccination: Vaccination) => {
  // Schedule push notification
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Vaccination Reminder for ${vaccination.petName}`,
      body: `${vaccination.vaccineName} is due tomorrow`,
      data: { petId: vaccination.petId, vaccinationId: vaccination.id }
    },
    trigger: {
      date: subDays(vaccination.nextDueDate, 1), // Day before
      repeats: false
    }
  });
};
```

#### 3. Lost Pet Alert System
**Regional Notification Architecture:**
```typescript
// Lost pet alert with geofencing
const reportLostPet = async (petId: string, lastSeenLocation: Location) => {
  // Update pet status
  await supabase
    .from('pets')
    .update({ status: 'lost', last_seen_location: lastSeenLocation })
    .eq('id', petId);
  
  // Find nearby users (5km radius)
  const nearbyUsers = await supabase.rpc('find_nearby_users', {
    center_lat: lastSeenLocation.latitude,
    center_lng: lastSeenLocation.longitude,
    radius_meters: 5000
  });
  
  // Send push notifications
  const notifications = nearbyUsers.map(user => ({
    to: user.push_token,
    title: 'Lost Pet Alert',
    body: `A ${pet.species} named ${pet.name} is missing in your area`,
    data: { petId, location: lastSeenLocation }
  }));
  
  await sendPushNotifications(notifications);
};
```

### Premium Features

#### Subscription Management
```typescript
// RevenueCat integration
const ENTITLEMENT_ID = 'premium';

export const usePremiumStatus = () => {
  const [isPremium, setIsPremium] = useState(false);
  
  useEffect(() => {
    const checkPremiumStatus = async () => {
      const customerInfo = await Purchases.getCustomerInfo();
      setIsPremium(customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined);
    };
    
    checkPremiumStatus();
    
    // Listen for updates
    Purchases.addCustomerInfoUpdateListener((info) => {
      setIsPremium(info.entitlements.active[ENTITLEMENT_ID] !== undefined);
    });
  }, []);
  
  return isPremium;
};
```

---

## Testing Strategy

### Testing Pyramid
```
         /\
        /  \  E2E Tests (Detox)
       /    \ - Critical user flows
      /      \ - Payment flows
     /________\ Integration Tests
    /          \ - API integration
   /            \ - Database operations
  /______________\ Unit Tests (Jest)
                   - Components
                   - Hooks
                   - Utils
```

### Unit Testing Example
```typescript
// PetCard.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { PetCard } from '@/components/PetCard';

describe('PetCard', () => {
  const mockPet = {
    id: '1',
    name: 'Max',
    species: 'Dog',
    breed: 'Golden Retriever'
  };
  
  it('renders pet information correctly', () => {
    const { getByText } = render(<PetCard pet={mockPet} />);
    expect(getByText('Max')).toBeTruthy();
    expect(getByText('Golden Retriever')).toBeTruthy();
  });
  
  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <PetCard pet={mockPet} onPress={onPress} testID="pet-card" />
    );
    fireEvent.press(getByTestId('pet-card'));
    expect(onPress).toHaveBeenCalledWith(mockPet);
  });
});
```

### E2E Testing
```typescript
// e2e/lostPetFlow.test.ts
describe('Lost Pet Alert Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
    await loginAsTestUser();
  });
  
  it('should send regional alerts when pet is reported lost', async () => {
    await element(by.id('pet-list')).tap();
    await element(by.text('Max')).tap();
    await element(by.id('report-lost-button')).tap();
    await element(by.id('confirm-lost')).tap();
    
    await expect(element(by.text('Alert sent to nearby users'))).toBeVisible();
    await expect(element(by.id('pet-status'))).toHaveText('Lost');
  });
});
```

---

## Security & Privacy

### Data Protection
**Encryption:**
- **At Rest**: Supabase automatic encryption
- **In Transit**: TLS 1.3 for all API calls
- **Local Storage**: AsyncStorage encryption for sensitive data

**Privacy Implementation:**
```typescript
// Location privacy controls
const useLocationTracking = () => {
  const [permission, requestPermission] = Location.useForegroundPermissions();
  
  const enableTracking = async () => {
    if (permission?.status !== 'granted') {
      const { status } = await requestPermission();
      if (status !== 'granted') {
        Alert.alert(
          'Location Required',
          'Location access is needed for lost pet alerts'
        );
        return false;
      }
    }
    // Only track when explicitly needed
    return true;
  };
  
  return { enableTracking };
};
```

### Authentication Security
```typescript
// Biometric authentication for app access
const useBiometricAuth = () => {
  const authenticate = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return false;
    
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access TailTracker',
      fallbackLabel: 'Use passcode',
      disableDeviceFallback: false
    });
    
    return result.success;
  };
  
  return { authenticate };
};
```

---

## Performance Optimization

### Image Optimization
```typescript
// Lazy loading and caching
import FastImage from 'react-native-fast-image';

export const PetImage: FC<{ uri: string }> = ({ uri }) => {
  return (
    <FastImage
      source={{
        uri,
        priority: FastImage.priority.normal,
        cache: FastImage.cacheControl.immutable
      }}
      resizeMode={FastImage.resizeMode.cover}
      onError={() => {
        // Fallback to placeholder
      }}
    />
  );
};
```

### List Performance
```typescript
// Virtualized lists for large datasets
import { FlashList } from '@shopify/flash-list';

export const PetList = ({ pets }: { pets: Pet[] }) => {
  return (
    <FlashList
      data={pets}
      renderItem={({ item }) => <PetCard pet={item} />}
      estimatedItemSize={120}
      keyExtractor={(item) => item.id}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
    />
  );
};
```

### Offline-First Architecture
```typescript
// Offline sync with conflict resolution
const syncOfflineData = async () => {
  const pendingChanges = await AsyncStorage.getItem('pendingChanges');
  if (!pendingChanges) return;
  
  const changes = JSON.parse(pendingChanges);
  
  for (const change of changes) {
    try {
      await supabase
        .from(change.table)
        .upsert(change.data, {
          onConflict: 'id',
          ignoreDuplicates: false
        });
    } catch (error) {
      // Handle conflict resolution
      await resolveConflict(change, error);
    }
  }
  
  await AsyncStorage.removeItem('pendingChanges');
};
```

---

## CI/CD Pipeline

### GitHub Actions Workflow
```yaml
name: TailTracker CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run linting
        run: npm run lint
      
      - name: Run tests
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build for production
        run: |
          eas build --platform all \
            --profile production \
            --non-interactive
      
      - name: Submit to stores
        if: startsWith(github.ref, 'refs/tags/v')
        run: |
          eas submit --platform ios --profile production
          eas submit --platform android --profile production
```

### Pre-commit Hooks
```json
// .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run type-check
npm run lint
npm run test:staged
```

---

## Error Handling

### Global Error Handler
```typescript
// errorHandler.ts
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode?: number,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const globalErrorHandler = (error: Error) => {
  if (error instanceof AppError && error.isOperational) {
    // Known errors - show user-friendly message
    showErrorToast(error.message);
  } else {
    // Unknown errors - log and show generic message
    Sentry.captureException(error);
    showErrorToast('Something went wrong. Please try again.');
  }
};
```

### Network Error Recovery
```typescript
// Automatic retry with exponential backoff
const apiClient = axios.create({
  baseURL: Config.API_URL,
  timeout: 10000
});

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config;
    
    if (!config || !config.retry) {
      config.retry = 0;
    }
    
    if (config.retry >= 3) {
      return Promise.reject(error);
    }
    
    config.retry += 1;
    
    const backoff = new Promise(resolve => {
      setTimeout(resolve, Math.pow(2, config.retry) * 1000);
    });
    
    await backoff;
    return apiClient(config);
  }
);
```

---

## Deployment Strategy

### Environment Configuration
```typescript
// config/index.ts
const ENV = {
  dev: {
    apiUrl: 'https://dev.tailtracker.app',
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL_DEV,
    supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV
  },
  staging: {
    apiUrl: 'https://staging.tailtracker.app',
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL_STAGING,
    supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY_STAGING
  },
  prod: {
    apiUrl: 'https://api.tailtracker.app',
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL_PROD,
    supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY_PROD
  }
};

export default ENV[process.env.EXPO_PUBLIC_ENV || 'dev'];
```

### App Store Deployment
**iOS Requirements:**
- Apple Developer Account ($99/year)
- App Store Connect configuration
- TestFlight for beta testing
- App review compliance

**Android Requirements:**
- Google Play Console ($25 one-time)
- App signing configuration
- Internal testing track
- Production rollout strategy

### Over-The-Air Updates
```typescript
// OTA update configuration
import * as Updates from 'expo-updates';

export const checkForUpdates = async () => {
  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      Alert.alert(
        'Update Available',
        'Restart the app to apply updates',
        [
          { text: 'Later' },
          { text: 'Restart', onPress: () => Updates.reloadAsync() }
        ]
      );
    }
  } catch (e) {
    // Handle error silently
  }
};
```

---

## Development Commands

### Essential Scripts
```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "test": "jest --watchAll",
    "test:ci": "jest --ci --coverage",
    "lint": "eslint . --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"**/*.{ts,tsx,json}\"",
    "build:ios": "eas build --platform ios --profile preview",
    "build:android": "eas build --platform android --profile preview",
    "submit:ios": "eas submit --platform ios",
    "submit:android": "eas submit --platform android"
  }
}
```

### Development Workflow
```bash
# Initial setup
npm install
npx expo prebuild

# Start development
npm start

# Run on specific platform
npm run ios
npm run android

# Testing
npm test
npm run test:coverage

# Code quality
npm run lint
npm run type-check
npm run format

# Build for testing
eas build --profile preview

# Production build
eas build --profile production
```

---

## Performance Metrics

### Key Performance Indicators
- **App Launch Time**: < 2 seconds
- **Screen Load Time**: < 500ms
- **API Response Time**: < 1 second
- **Image Load Time**: < 300ms
- **Crash Rate**: < 0.1%
- **ANR Rate**: < 0.05%

### Monitoring Setup
```typescript
// Performance monitoring with Sentry
Sentry.init({
  dsn: Config.SENTRY_DSN,
  enableAutoSessionTracking: true,
  sessionTrackingIntervalMillis: 10000,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.ReactNativeTracing({
      routingInstrumentation,
      tracingOrigins: ['localhost', /^\//],
    }),
  ],
});
```

---

## Accessibility

### WCAG 2.1 Compliance
```typescript
// Accessibility implementation
export const AccessiblePetCard: FC<PetCardProps> = ({ pet }) => {
  return (
    <Pressable
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Pet profile for ${pet.name}`}
      accessibilityHint="Double tap to view pet details"
    >
      <View>
        <Text accessibilityRole="header">{pet.name}</Text>
        <Text>{pet.breed}</Text>
      </View>
    </Pressable>
  );
};
```

---

## Future Considerations

### Technical Improvements Only
- [ ] React Native New Architecture adoption
- [ ] Hermes engine optimization  
- [ ] Code splitting and lazy loading
- [ ] Advanced caching strategies
- [ ] Performance optimizations

**NOTE**: No new features should be added to this roadmap without explicit approval. Focus remains on delivering the approved feature set with exceptional quality.

---

## Support & Resources

### Documentation Links
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev)
- [Supabase Docs](https://supabase.com/docs)
- [RevenueCat Integration](https://docs.revenuecat.com)

### Community
- GitHub Issues: `/TailTracker/issues`
- Discord Server: TailTracker Dev Community
- Stack Overflow: Tag `tailtracker`

### Contact
- Technical Lead: tech@tailtracker.app
- Product: product@tailtracker.app
- Support: support@tailtracker.app

---

## License & Credits

**License**: MIT License
**Version**: 1.0.0
**Last Updated**: January 2025
**Status**: Active Development

### Core Contributors
- Mobile Architecture Team
- UI/UX Design Team
- Backend Engineering Team
- QA & Testing Team

---

## Quick Reference

### Common Issues & Solutions

**Issue**: Build failing on iOS
```bash
cd ios && pod install && cd ..
npx expo prebuild --clean
```

**Issue**: Metro bundler cache issues
```bash
npx expo start --clear
```

**Issue**: Android Gradle issues
```bash
cd android && ./gradlew clean && cd ..
```

**Issue**: Push notifications not working
```bash
expo credentials:manager
# Select platform and reconfigure push notifications
```

---

**🚀 Ready to Build**: This documentation provides comprehensive guidance for developing TailTracker with cutting-edge mobile technology, best practices, and a focus on exceptional user experience.

**📱 Platform Target**: iOS 13+ and Android 8+ (API 26+)
**🎯 Code Coverage Goal**: 80%+
**⚡ Performance Target**: 60 FPS animations
**🔒 Security Standard**: OWASP Mobile Top 10 compliance

---

*TailTracker - Where Every Tail Has a Story*
*Documentation Version: 1.0.0*
*Framework Version: React Native 0.73+ with Expo SDK 53+*