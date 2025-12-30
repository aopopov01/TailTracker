# TailTracker Mobile App

A comprehensive pet management application built with React Native and Expo, featuring digital pet passports, vaccination tracking, and community-powered lost pet alerts.

## 🚀 Features

### 🆔 Digital Pet Passport
- Store all your pet's important information in one secure place
- Complete pet profiles with photos and details
- Medical history and records management
- Emergency contact information

### 💉 Vaccination Tracking
- Never miss a vaccination with smart reminders
- Complete vaccination history and records
- Automatic reminder notifications
- Veterinary appointment scheduling

### 🚨 Lost Pet Alerts
- Community-powered alert system for lost pets
- Instant notifications to nearby TailTracker users
- Share pet details and photos quickly
- Collaborative search coordination

### 📋 Health Management
- Complete digital health records for each pet
- Vaccination tracking with automatic reminders
- Medication scheduling and dosage alerts
- Veterinary appointment management
- Growth and weight monitoring

### 👥 Multi-Pet Support
- Manage multiple pets from a single account
- Individual profiles with custom settings
- Pet-specific tracking and health records
- Family sharing capabilities

## 🏗️ Technical Architecture

### Frontend
- **Framework**: React Native with Expo SDK 51+
- **Navigation**: React Navigation 6
- **UI Components**: React Native Paper (Material Design 3)
- **State Management**: Zustand
- **Forms**: React Hook Form
- **Maps**: React Native Maps (Apple Maps on iOS, default on Android)

### Backend Integration
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **File Storage**: Supabase Storage
- **Push Notifications**: Firebase Cloud Messaging

### Android-Specific Features
- **Background Services**: Location tracking and pet monitoring
- **Google Play Services**: Billing, Firebase
- **Material Design 3**: Native Android theming
- **Performance**: ProGuard/R8 optimization
- **Security**: Network Security Config, encrypted storage

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ and yarn/npm
- Android Studio with SDK 34
- Java 11+
- Expo CLI
- Git

### Installation
```bash
# Clone the repository
git clone https://github.com/your-repo/tailtracker-mobile.git
cd tailtracker-mobile/mobile

# Install dependencies
yarn install

# Install Expo CLI globally
npm install -g @expo/cli

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your configuration
```

### Environment Variables
```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Firebase Configuration (for FCM)
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
```

### Running the App

#### Development
```bash
# Start Expo development server
yarn start

# Run on Android emulator
yarn android

# Run on physical Android device
yarn android --device
```

#### Building
```bash
# Build development APK
yarn build:android:dev

# Build preview APK
yarn build:android:preview

# Build production AAB
yarn build:android:production

# Or use the build script
./scripts/build-release.sh --flavor premium --build-type release
```

## 📱 Android Development

### Build Configurations
- **Debug**: Development builds with debugging enabled
- **Staging**: Pre-production builds with staging backend
- **Release**: Production builds with all optimizations

### Build Flavors
- **Lite**: Free version with limited features
- **Premium**: Full version with all features

### Signing Configuration
```bash
# Generate keystores
./scripts/generate-keystore.sh --type upload
./scripts/generate-keystore.sh --type release

# Configure in android/local.properties
MYAPP_UPLOAD_STORE_FILE=keystores/tailtracker-upload-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=upload
MYAPP_UPLOAD_STORE_PASSWORD=your_password
MYAPP_UPLOAD_KEY_PASSWORD=your_password
```

## 🧪 Testing

### Unit Tests
```bash
# Run unit tests
yarn test

# Run with coverage
yarn test:coverage

# Watch mode
yarn test:watch
```

### E2E Tests
```bash
# Build for testing
yarn build:detox:android

# Run E2E tests
yarn test:android
```

### Manual Testing
- Test on multiple Android devices and API levels
- Verify background location tracking
- Test push notifications
- Validate payment flows
- Check offline functionality

## 📦 Deployment

### Google Play Store
1. **Prepare Release**
   ```bash
   ./scripts/build-release.sh --build-type release --flavor premium
   ```

2. **Upload to Play Console**
   - Upload AAB file
   - Complete store listing
   - Configure data safety
   - Submit for review

3. **Monitoring**
   - Monitor Play Console Vitals
   - Track crash reports with Firebase Crashlytics
   - Analyze user feedback and ratings

### CI/CD Pipeline
- GitHub Actions workflow for automated building
- Automated testing on every PR
- Security scanning with Snyk
- Automated deployment to internal testing

## 📊 Performance & Monitoring

### Analytics
- Firebase Analytics for user behavior
- Custom events for feature usage
- Performance monitoring with Firebase Performance
- Crash reporting with Firebase Crashlytics

### Optimization
- ProGuard/R8 for code minification
- Bundle splitting for smaller downloads
- Image optimization and caching
- Battery usage optimization

## 🔒 Security & Privacy

### Data Protection
- End-to-end encryption for sensitive data
- Secure authentication with Supabase Auth
- Local data encryption on device
- Network security with certificate pinning

### Privacy Compliance
- GDPR compliance for European users
- CCPA compliance for California users
- Transparent data collection practices
- User control over data sharing

### Google Play Policies
- Compliance with Google Play Store policies
- Proper permission usage and justification
- Data safety declarations
- User data protection measures

## 📖 Documentation

- [API Documentation](./docs/API.md)
- [Architecture Guide](./docs/ARCHITECTURE.md)
- [Testing Guide](./docs/TESTING.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Email**: help@tailtracker.com
- **Website**: https://www.tailtracker.com
- **FAQ**: https://www.tailtracker.com/faq
- **GitHub Issues**: https://github.com/your-repo/tailtracker-mobile/issues

## 🙏 Acknowledgments

- React Native community for the excellent framework
- Expo team for the amazing development tools
- Supabase for the backend infrastructure
- OpenStreetMap contributors for free mapping data
- All contributors and beta testers

---

Made with ❤️ for pet lovers everywhere.