# Delivery Driver App

A mobile app for delivery drivers of **VirtualPet** ecommerce logistics.

## Objective

Help VirtualPet drivers take orders from the depot, deliver them to customers, and report orders that could not be delivered and must return. The app reduces administrative friction so drivers can focus on the road and the customer.

## Target audience

Delivery drivers who work outdoors, often under direct sunlight, with limited attention and one hand free. They are not power users, so the interface prioritizes clarity over density.

## Solution

An offline-first mobile application built with React Native and Expo.

- Drivers see their assigned orders and current delivery route.
- Actions are recorded locally and synchronized with the backend when connectivity returns.
- The app supports proof-of-delivery photo capture, background location tracking, and push notifications.
- Session tokens and driver data are stored securely.

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | React Native + Expo (TypeScript) |
| Navigation | Expo Router |
| State management | Zustand |
| Offline persistence | WatermelonDB |
| Secure storage | `expo-secure-store` |
| Location | `expo-location` |
| Camera | `expo-camera` |
| Notifications | `expo-notifications` |
| Monitoring | Sentry for React Native |
| CI/CD | EAS (Expo Application Services) |

## Project structure

```
src/
├── app/                 # Expo Router routes and screens
│   ├── (auth)/          # Authenticated route group
│   └── login/           # Login screen
├── components/          # Reusable UI components
├── features/            # Domain modules (orders, deliveries, sync)
├── services/            # API clients and HTTP communication
├── stores/              # Zustand stores (auth, orders, sync)
├── database/            # WatermelonDB configuration and models
├── hooks/               # Shared custom hooks
├── constants/           # Global configuration and tokens
└── types/               # Shared TypeScript types
```

## Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

Because the app uses native modules (WatermelonDB and Sentry), it must run in a [development build](./docs/DEVELOPMENT_BUILD_SETUP.md). Expo Go is not supported.

## Project scripts

```bash
npm start      # Start the Expo development server
npm run android
npm run ios
npm run web
npm run lint
```

## Notes

- Agent context and design documents live in `.agents/context/`.
