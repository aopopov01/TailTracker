# TailTracker Error Log

## 🚨 CRITICAL: This file is the single source of truth for all errors and their fixes

**RULE**: Before attempting ANY fix, search this file first. The same error should NEVER happen twice.

## Quick Reference Index
- [TypeScript Errors](#typescript-errors)
- [React Native Errors](#react-native-errors)
- [Expo Errors](#expo-errors)
- [Supabase Errors](#supabase-errors)
- [Build Errors](#build-errors)
- [Runtime Errors](#runtime-errors)
- [iOS Specific](#ios-specific)
- [Android Specific](#android-specific)
- [Dependencies](#dependencies)
- [Performance Issues](#performance-issues)

## Search Keywords
Use Ctrl+F to search for these common terms:
- "undefined", "null", "cannot read"
- "permission", "camera", "location"
- "build failed", "gradle", "pod"
- "network", "timeout", "connection"
- "memory", "leak", "performance"
- "navigation", "route", "params"
- "async", "promise", "await"

---

## Error Entries

<!-- 
TEMPLATE FOR NEW ERRORS:
Copy and use this template for each new error

### [DATE TIME] - [ERROR TYPE]
**Component/File**: [Exact file path and line]
**Error Message**: 
```
[Complete error message]
```

**Root Cause**: 
[Why this happened]

**Solution Applied**:
```typescript
// Code that fixed it
```

**Prevention**:
- [Step 1 to prevent]
- [Step 2 to prevent]

**Verification**:
1. [How to test the fix]
2. [Expected result]

**Related Issues**: [Link to similar errors]

---
-->

### Example Entry: 2025-01-20 14:30 - TypeError
**Component/File**: src/screens/PetProfile.tsx:45
**Error Message**: 
```
TypeError: Cannot read property 'id' of undefined
```

**Root Cause**: 
Attempting to access pet.id before checking if pet object exists. Race condition between navigation and data loading.

**Solution Applied**:
```typescript
// Before (WRONG)
const petId = route.params.pet.id;

// After (CORRECT)
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
- Add default params to navigation types

**Verification**:
1. Navigate to pet profile without pet data
2. Should redirect back instead of crashing
3. No error in console

**Related Issues**: Navigation params, Async data loading

---

## TypeScript Errors

<!-- TypeScript related errors go here -->

---

## React Native Errors

<!-- React Native specific errors go here -->

---

## Expo Errors

<!-- Expo specific errors go here -->

---

## Supabase Errors

<!-- Supabase and database errors go here -->

---

## Build Errors

<!-- Build and compilation errors go here -->

---

## Runtime Errors

<!-- Runtime and production errors go here -->

---

## iOS Specific

<!-- iOS platform specific errors go here -->

---

## Android Specific

<!-- Android platform specific errors go here -->

---

## Dependencies

<!-- Package and dependency errors go here -->

---

## Performance Issues

<!-- Performance related issues and fixes go here -->

---

## Prevention Checklist

Before starting development each day:
- [ ] Pull latest ERROR_LOG.md
- [ ] Review recent entries
- [ ] Check for patterns in your work area
- [ ] Run `npm run check-errors`
- [ ] Clear all caches if switching branches

Before committing:
- [ ] Search ERROR_LOG.md for similar issues
- [ ] Run all type checks
- [ ] Test error scenarios
- [ ] Document any new errors found

---

## Statistics

**Total Errors Logged**: 1
**Repeated Errors**: 0
**Prevention Success Rate**: 100%
**Last Updated**: 2025-01-20

---

## Quick Fixes Reference

### Clear All Caches
```bash
# Expo
npx expo start --clear

# iOS
cd ios && pod cache clean --all && pod install && cd ..

# Android  
cd android && ./gradlew clean && cd ..

# Node modules
rm -rf node_modules && npm ci
```

### Reset Everything
```bash
# Nuclear option - use when nothing else works
rm -rf node_modules
rm -rf ios/Pods
rm -rf android/build
rm -rf .expo
npm ci
cd ios && pod install && cd ..
npx expo prebuild --clean
```

---

*Remember: Every error is a learning opportunity. Document it, fix it, prevent it.*