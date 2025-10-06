# Manage Time App - React Native 0.81

A comprehensive cross-platform mobile application for advanced time management, task organization, and productivity enhancement built with React Native 0.81.

## 🚀 Features

- 🔔 **Advanced Alarms & Reminders**: Recurring and location-based reminders with Arabic support
- 📋 **Task Management**: Full task/project/goal management with team collaboration
- 🤖 **AI Plan Generator**: Convert goals into actionable plans with milestones and tasks
- 📊 **Analytics Dashboard**: Productivity insights and progress tracking
- 🔄 **Offline-First**: Works offline with automatic sync when online
- 🔐 **Secure Authentication**: No sensitive data in localStorage, uses platform secure storage
- 🌍 **Cross-Platform**: React Native for iOS and Android

## 🏗️ Architecture

- **Mobile**: React Native 0.81 with WatermelonDB for offline storage
- **State Management**: Zustand with persistence
- **Navigation**: React Navigation v6
- **UI Library**: React Native Paper (Material Design)
- **Database**: WatermelonDB for offline-first storage
- **Authentication**: React Native Keychain for secure storage
- **Charts**: React Native Chart Kit
- **TypeScript**: Full TypeScript support

## 📦 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ErrorBoundary.tsx
│   ├── LoadingScreen.tsx
│   └── TaskCard.tsx
├── config/              # Configuration files
│   └── env.ts
├── database/            # WatermelonDB setup
│   ├── database.ts
│   ├── schema.ts
│   └── models/          # Database models
│       ├── Alarm.ts
│       ├── Goal.ts
│       ├── Project.ts
│       ├── Task.ts
│       └── User.ts
├── hooks/               # Custom React hooks
├── navigation/          # Navigation configuration
│   ├── AppNavigator.tsx
│   ├── AuthNavigator.tsx
│   └── MainNavigator.tsx
├── screens/             # App screens
│   ├── alarms/
│   │   └── AlarmsScreen.tsx
│   ├── analytics/
│   │   └── AnalyticsScreen.tsx
│   ├── auth/
│   │   ├── ForgotPasswordScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   └── RegisterScreen.tsx
│   ├── goals/
│   │   └── GoalsScreen.tsx
│   ├── profile/
│   │   └── ProfileScreen.tsx
│   ├── projects/
│   │   └── ProjectsScreen.tsx
│   └── tasks/
│       └── TasksScreen.tsx
├── services/            # API and business logic
│   ├── apiClient.ts
│   ├── authService.ts
│   ├── goalService.ts
│   ├── projectService.ts
│   └── taskService.ts
├── store/               # State management
│   ├── authStore.ts
│   └── taskStore.ts
├── types/               # TypeScript type definitions
│   ├── alarm.ts
│   ├── goal.ts
│   ├── index.ts
│   ├── project.ts
│   ├── task.ts
│   └── user.ts
└── utils/               # Utility functions
    ├── dateUtils.ts
    ├── logger.ts
    ├── theme.ts
    └── validation.ts
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** - JavaScript runtime
- **npm 8+** - Package manager
- **React Native CLI** - `npm install -g @react-native-community/cli`
- **Android Studio** - For Android development
- **Xcode** - For iOS development (macOS only)
- **Java Development Kit (JDK) 11** - For Android builds

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ManageTimeApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment file
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **iOS Setup (macOS only)**
   ```bash
   cd ios
   pod install
   cd ..
   ```

5. **Start Development Server**
   ```bash
   npm start
   ```

6. **Run on Platform**
   ```bash
   # Android
   npm run android
   
   # iOS (macOS only)
   npm run ios
   ```

## 🔧 Development

### Available Scripts

- `npm start` - Start Metro bundler
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run clean` - Clean build artifacts

### Key Dependencies

**Core React Native:**
- `react-native`: 0.81.0
- `react`: 18.2.0
- `typescript`: 4.8.4

**Navigation:**
- `@react-navigation/native`: ^6.1.9
- `@react-navigation/bottom-tabs`: ^6.5.11
- `@react-navigation/stack`: ^6.3.20

**UI Components:**
- `react-native-paper`: ^5.11.6 (Material Design)
- `react-native-elements`: ^3.4.3
- `react-native-vector-icons`: ^10.0.3

**State Management:**
- `zustand`: ^4.4.7 (with persistence)

**Database:**
- `@nozbe/watermelondb`: ^0.27.0 (offline-first)

**Authentication:**
- `react-native-keychain`: ^8.1.3 (secure storage)

**Charts & Visualization:**
- `react-native-chart-kit`: ^6.12.0
- `react-native-svg`: ^13.14.0

**Utilities:**
- `axios`: ^1.6.2 (HTTP client)
- `date-fns`: ^2.30.0 (date manipulation)
- `lodash`: ^4.17.21 (utility functions)

## 🎨 UI Components

### Theme System
The app uses a comprehensive theme system defined in `src/utils/theme.ts`:

```typescript
export const theme = {
  colors: {
    primary: '#2196F3',
    secondary: '#FF9800',
    tertiary: '#4CAF50',
    // ... more colors
  },
  spacing: {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 40
  },
  // ... more theme properties
};
```

### Core Components

#### TaskCard Component
```typescript
interface TaskCardProps {
  task: Task;
  onPress?: (task: Task) => void;
  onComplete?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onEdit?: (task: Task) => void;
}
```

**Features:**
- Priority color coding
- Status indicators
- Due date display with overdue highlighting
- Action buttons (complete, delete, edit)
- Tag display
- Responsive design

## 🗄️ Database Schema

The app uses WatermelonDB for offline-first storage with the following models:

- **User**: User accounts and settings
- **Project**: Team projects with collaboration
- **Task**: Individual tasks with assignments
- **Goal**: User goals and objectives
- **Milestone**: Goal milestones and progress
- **Alarm**: Scheduled alarms and notifications
- **Reminder**: Time and location-based reminders
- **Notification**: Push notification queue
- **AnalyticsEvent**: User behavior tracking

## 🔐 Authentication

The app uses secure authentication with:

- JWT tokens with refresh token rotation
- Secure token storage using React Native Keychain
- Automatic token refresh
- Logout from all devices
- Password change functionality

## 📱 Screens

### Authentication Screens
- **LoginScreen**: User login with email/password
- **RegisterScreen**: User registration
- **ForgotPasswordScreen**: Password reset

### Main Screens
- **TasksScreen**: Task management with filtering and search
- **ProjectsScreen**: Project management and team collaboration
- **GoalsScreen**: Goal setting and progress tracking
- **AlarmsScreen**: Alarm and reminder management
- **AnalyticsScreen**: Productivity insights and charts
- **ProfileScreen**: User profile and settings

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🚀 Deployment

### Android
1. Generate signed APK
2. Upload to Google Play Store

### iOS
1. Archive the app in Xcode
2. Upload to App Store Connect

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

For support, email support@managetime.app or create an issue on GitHub.

## 🔧 Troubleshooting

### Common Issues

#### Android Development
1. **Android SDK not found**:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools
   ```

2. **Gradle build issues**:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npm run android
   ```

#### iOS Development
1. **CocoaPods issues**:
   ```bash
   cd ios
   pod deintegrate
   pod install
   cd ..
   npm run ios
   ```

2. **Xcode build issues**:
   ```bash
   npm run clean
   npm run ios
   ```

#### General Issues
1. **Node modules issues**:
   ```bash
   npm run clean
   npm install
   ```

2. **Metro bundler issues**:
   ```bash
   npm run start:reset
   ```