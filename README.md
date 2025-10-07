# Budget Manager App

A comprehensive React Native Expo budget management application with modern UI and advanced features.

## Features

### 🏠 Dashboard
- Financial overview with income, expenses, and balance
- Quick action buttons for adding transactions and budgets
- Budget progress tracking with visual indicators
- Recent transactions list
- Beautiful gradient header design

### 💰 Transaction Management
- Add, edit, and delete transactions
- Categorize transactions (income/expense)
- Filter by type and sort by date/amount
- Support for multiple currencies
- Date-based transaction tracking

### 📊 Budget Management
- Create and manage budgets by category
- Set budget periods (weekly, monthly, yearly)
- Visual progress tracking with color-coded indicators
- Budget exceeded warnings
- Filter budgets by status

### 📈 Reports & Analytics
- Interactive charts and graphs
- Monthly income vs expenses trend
- Category breakdown with pie charts
- Top categories bar chart
- Time range filtering (week, month, year)
- Export data functionality

### 🏷️ Category Management
- Custom category creation and editing
- Color and icon customization
- Income and expense category separation
- Category-based filtering

### ⚙️ Settings
- User profile management
- Currency selection
- Theme preferences (light/dark)
- Notification settings
- Data export/import
- Account management

## Technology Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **Redux Toolkit** for state management
- **React Navigation** for navigation
- **AsyncStorage** for data persistence
- **React Native Chart Kit** for analytics
- **Expo Vector Icons** for icons
- **Expo Linear Gradient** for gradients

## Installation

1. **Prerequisites**
   - Node.js (v16 or higher)
   - npm or yarn
   - Expo CLI (`npm install -g @expo/cli`)
   - iOS Simulator (for iOS development)
   - Android Studio (for Android development)

2. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd budgetmanager
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on device/simulator**
   - For iOS: Press `i` in the terminal or scan QR code with Expo Go app
   - For Android: Press `a` in the terminal or scan QR code with Expo Go app
   - For Web: Press `w` in the terminal

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   └── Input.tsx
├── constants/           # App constants
│   ├── colors.ts
│   ├── typography.ts
│   └── spacing.ts
├── navigation/          # Navigation configuration
├── screens/            # App screens
│   ├── DashboardScreen.tsx
│   ├── TransactionsScreen.tsx
│   ├── BudgetsScreen.tsx
│   ├── ReportsScreen.tsx
│   ├── SettingsScreen.tsx
│   └── ...
├── services/           # Business logic services
│   ├── storageService.ts
│   └── syncService.ts
├── store/              # Redux store configuration
│   ├── store.ts
│   └── slices/
│       ├── transactionsSlice.ts
│       ├── budgetsSlice.ts
│       ├── categoriesSlice.ts
│       └── userSlice.ts
└── types/              # TypeScript type definitions
    └── navigation.ts
```

## Key Features Implementation

### State Management
- Redux Toolkit for centralized state management
- Separate slices for different data domains
- Async actions for data persistence

### Data Persistence
- AsyncStorage for local data storage
- Automatic data synchronization
- Export/import functionality

### Modern UI/UX
- Consistent design system
- Responsive layouts
- Smooth animations and transitions
- Accessibility support

### Charts & Analytics
- Line charts for trends
- Pie charts for category breakdown
- Bar charts for comparisons
- Interactive data visualization

## Customization

### Colors
Edit `src/constants/colors.ts` to customize the app's color scheme.

### Typography
Modify `src/constants/typography.ts` to change fonts and text styles.

### Categories
Default categories can be modified in `src/store/slices/categoriesSlice.ts`.

## Building for Production

1. **Configure app.json**
   - Update app name, version, and other metadata
   - Configure icons and splash screens

2. **Build the app**
   ```bash
   # For iOS
   expo build:ios
   
   # For Android
   expo build:android
   ```

3. **Submit to app stores**
   - Follow platform-specific guidelines
   - Test thoroughly before submission

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.

---

**Note**: This is a demo application. For production use, consider adding:
- User authentication
- Cloud data synchronization
- Advanced security measures
- Performance optimizations
- Comprehensive testing
