# Push Notification System Documentation

## Overview

The LooTOn app implements a comprehensive push notification system that includes both local and remote notifications for delivering game deals, price alerts, and other important updates to users.

## Architecture

### Mobile (React Native/Expo)

1. **Push Token Registration**:
   - When the app starts, `askPushPermissionFirstLaunch()` requests permission for push notifications
   - If granted, Expo generates a unique push token for the device
   - The token is automatically sent to the backend via the `/users` endpoint

2. **Notification Services**:
   - `SmartNotificationService.ts`: Handles intelligent local notifications based on app rules
   - `NotificationService.ts`: Contains various notification methods and handles remote notification events
   - `App.tsx`: Initializes notifications and manages token registration

### Backend (Node.js/Fastify)

1. **User Model**:
   - Stores push tokens in the `User.pushToken` field
   - Tokens are updated/created when users register via the `/users` endpoint

2. **Notification Services**:
   - `notification.service.ts`: Contains the `sendPush()` method that sends notifications via Expo
   - `alerts.service.ts`: Uses the notification service to send price alerts
   - `offers.service.ts`: Can trigger notifications when new deals are found

## How It Works

### 1. Token Registration Flow

```
App Launch → askPushPermissionFirstLaunch() → Expo generates token → sendPushTokenToBackend() → POST /users → User.pushToken updated
```

### 2. Remote Notification Flow

```
New Deal Found → evaluateAndPush() → sendPush() → Expo Push API → Device receives notification
```

### 3. Local Notification Flow

```
In-app event → SmartNotificationService.addNotification() → Local notification shown
```

## Configuration

### Android Permissions

The app requests necessary permissions defined in `app.json`:

```json
"android": {
  "permissions": [
    "android.permission.RECEIVE_BOOT_COMPLETED",
    "android.permission.WAKE_LOCK"
  ]
}
```

### Expo Notifications Plugin

The `expo-notifications` plugin is included in the app configuration.

## Testing

To test push notifications, you can:

1. Register a push token manually (it's done automatically on first launch)
2. Use the backend to trigger notifications based on specific events
3. Check the debug routes in `debug.routes.ts` for testing endpoints

## Types of Notifications

1. **Price Drop Alerts**: Triggered when games on a user's wishlist drop to a target price
2. **New Deal Notifications**: Sent when new deals matching user preferences are found
3. **Wishlist Reminders**: Periodic reminders about games in the wishlist
4. **Daily Digests**: Summary of the best deals of the day

## Security

- Push tokens are stored securely in the database
- User data is not exposed through notification payloads
- All API endpoints are secured with appropriate validation

## Troubleshooting

- If notifications aren't appearing, check if permission was granted
- Verify the push token is properly stored in the database
- Check Expo notification service credentials and configuration