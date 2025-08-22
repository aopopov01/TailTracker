# TailTracker Mobile - Deployment Quick Reference

## 🚀 Quick Commands

### Development Build
```bash
npm run preflight:dev && npm run build:android:dev
npm run preflight:dev && npm run build:ios:dev
```

### Staging Release
```bash
npm run version:patch
npm run preflight:staging
npm run build:android:preview && npm run build:ios:preview
```

### Production Release
```bash
# Via GitHub Actions (Recommended)
# Go to Actions → Release → Run workflow

# Or manual:
npm run version:minor
npm run preflight:production  
npm run build:android:production && npm run build:ios:production
npm run submit:android && npm run submit:ios
```

## 📋 Pre-Release Checklist

### Code Quality
- [ ] All tests passing (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] TypeScript compilation clean (`npm run type-check`)
- [ ] No high-severity vulnerabilities (`npm audit`)

### Configuration
- [ ] Environment variables updated
- [ ] App version bumped
- [ ] Store metadata updated
- [ ] Code signing certificates valid

### Testing
- [ ] Manual testing completed
- [ ] E2E tests passing
- [ ] Performance benchmarks acceptable
- [ ] Accessibility compliance verified

### Store Requirements
- [ ] App icons and splash screens updated
- [ ] Privacy policy and terms updated
- [ ] Store descriptions and screenshots current
- [ ] Required permissions justified

## 🔄 Release Process

### 1. Version Bump
```bash
# Choose appropriate version bump
npm run version:patch    # 1.0.0 → 1.0.1 (bug fixes)
npm run version:minor    # 1.0.0 → 1.1.0 (new features)
npm run version:major    # 1.0.0 → 2.0.0 (breaking changes)
```

### 2. Preflight Check
```bash
npm run preflight:production
```

### 3. Build & Deploy
```bash
# GitHub Actions (Recommended)
# Go to Actions → Release → Run workflow with:
# - Release type: patch/minor/major
# - Platform: both
# - Environment: production

# Manual deployment
npm run build:android:production
npm run build:ios:production
npm run submit:android
npm run submit:ios
```

## 📱 Platform-Specific Commands

### Android
```bash
# Local build
./scripts/build-android.sh --environment production --type aab --clean

# EAS build
npm run build:android:production

# Submit to Play Store
npm run submit:android
```

### iOS
```bash
# Local build (macOS only)
./scripts/build-ios.sh --environment production --device device --archive

# EAS build
npm run build:ios:production

# Submit to App Store
npm run submit:ios
```

## 🔧 Environment Setup

### Required Tools
- Node.js 18+
- Expo CLI & EAS CLI
- Platform SDKs (iOS: Xcode, Android: Android SDK)

### Environment Files
```bash
cp .env.template .env.development     # Edit with dev config
cp .env.template .env.staging         # Edit with staging config  
cp .env.template .env.production      # Edit with prod config
```

### Code Signing Setup
```bash
npm run setup:signing --platform both --environment production
```

## 🐛 Troubleshooting

### Build Failures
```bash
# Clean everything
npm run clean:all

# Platform-specific clean
npm run ios:clean    # iOS
cd android && ./gradlew clean && cd ..    # Android

# Reset environment
rm -rf node_modules && npm ci
```

### Common Issues
| Issue | Solution |
|-------|----------|
| Metro bundler error | `npx expo start -c` |
| CocoaPods error | `npm run ios:reset` |
| Keystore not found | `npm run setup:signing` |
| EAS build timeout | Check EAS dashboard, retry |

## 📊 Monitoring

### Build Status
- GitHub Actions: Check workflow status
- EAS Dashboard: Monitor cloud builds
- App Store Connect: Track review status
- Google Play Console: Monitor rollout

### Key Metrics
- Build success rate
- Bundle size trends  
- Store review times
- Crash rates post-release

## 🔄 Rollback Procedure

### If Issues Found After Release
1. **Immediate**: Halt store rollout if possible
2. **Quick Fix**: Create hotfix branch, minimal change
3. **Emergency**: Rollback to previous version
4. **Communication**: Notify team and stakeholders

### Emergency Rollback
```bash
# Revert to last known good version
git revert <commit-hash>
npm run version:patch
# Deploy emergency fix
```

## 📞 Support

### Team Contacts
- **Build Issues**: #mobile-development
- **Store Issues**: #app-store-support  
- **Emergency**: @mobile-team-leads

### Resources
- [Full Build Guide](./BUILD_GUIDE.md)
- [GitHub Actions Workflows](./.github/workflows/)
- [EAS Dashboard](https://expo.dev)
- [Internal Wiki](link-to-wiki)

---

## 🏷️ Version Tags

### Semantic Versioning
- **PATCH** (1.0.1): Bug fixes, minor updates
- **MINOR** (1.1.0): New features, backwards compatible
- **MAJOR** (2.0.0): Breaking changes, major updates

### Release Channels
- **development**: Feature development and testing
- **staging**: QA testing, internal releases
- **production**: Public app store releases

---

*Keep this reference handy for quick deployments. For detailed information, see [BUILD_GUIDE.md](./BUILD_GUIDE.md)*