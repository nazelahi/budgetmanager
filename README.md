# Budget Manager App

A modern, feature-rich budget management application built with React Native and Expo. Track your income and expenses, manage categories, and visualize your financial data with beautiful charts and statistics.

## Features

### 📊 Dashboard

- Real-time balance overview
- Monthly income and expense tracking
- Interactive charts showing 6-month trends
- Top spending categories visualization
- Recent transactions preview

### 💰 Transaction Management

- Add income and expense transactions
- Categorize transactions with custom categories
- Filter transactions by type (income/expense)
- Edit and delete transactions
- Date-based transaction tracking

### 🏷️ Category Management

- Pre-defined income and expense categories
- Create custom categories with custom colors and icons
- Edit and delete categories
- Visual category organization

### ⚙️ Settings

- Multiple currency support (USD, EUR, GBP, JPY, etc.)
- Theme customization (Light/Dark mode)
- Notification preferences
- Data export functionality
- Clear all data option
- App statistics

### 📱 Modern UI/UX

- Clean, compact design
- Intuitive navigation with bottom tabs
- Smooth animations and transitions
- Responsive layout
- Accessibility support

## Technology Stack

- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and tools
- **TypeScript** - Type-safe JavaScript
- **React Navigation** - Navigation library
- **AsyncStorage** - Local data persistence
- **React Native Chart Kit** - Data visualization
- **Expo Vector Icons** - Icon library

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd budgetmanager
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

4. Run on your preferred platform:

```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── EmptyState.tsx
│   └── LoadingSpinner.tsx
├── contexts/           # React Context for state management
│   └── AppContext.tsx
├── navigation/         # Navigation configuration
│   └── AppNavigator.tsx
├── screens/           # App screens
│   ├── DashboardScreen.tsx
│   ├── TransactionsScreen.tsx
│   ├── AddTransactionScreen.tsx
│   ├── CategoriesScreen.tsx
│   └── SettingsScreen.tsx
├── services/          # Data services
│   ├── StorageService.ts
│   └── DataService.ts
├── types/             # TypeScript type definitions
│   └── index.ts
└── utils/             # Utility functions and constants
    └── theme.ts
```

## Data Storage

The app uses AsyncStorage for local data persistence. All data is stored locally on the device and includes:

- Transactions (amount, description, category, type, date)
- Categories (name, type, color, icon)
- Budgets (planned spending limits)
- Settings (currency, theme, notifications)

## Key Features Implementation

### Real-time Data Updates

- Context-based state management ensures UI updates immediately when data changes
- Automatic data refresh across all screens

### Category System

- Pre-defined categories for common income and expense types
- Custom category creation with color and icon selection
- Category-based transaction filtering

### Financial Analytics

- Monthly trend analysis with interactive charts
- Top spending categories with pie charts
- Balance calculations and projections

### User Experience

- Intuitive tab-based navigation
- Pull-to-refresh functionality
- Confirmation dialogs for destructive actions
- Loading states and empty state handling

## Customization

### Adding New Categories

1. Go to the Categories tab
2. Tap the "+" button
3. Enter category name, select type, color, and icon
4. Save the category

### Changing Currency

1. Go to Settings
2. Tap on Currency
3. Select your preferred currency from the list

### Theme Customization

1. Go to Settings
2. Toggle between Light and Dark theme

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact us at support@budgetmanager.com

---

Built with ❤️ using React Native and Expo
