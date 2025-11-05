module.exports = {
  expo: {
    name: "Looton",
    slug: "looton-app",
    version: "1.7",
    orientation: "portrait",
    scheme: "looton",
    platforms: ["ios", "android"],
    userInterfaceStyle: "automatic",
    newArchEnabled: false,
    icon: "./assets/images/logo.png",
    assetBundlePatterns: ["**/*"],
    runtimeVersion: "1.7",
    android: {
      package: "com.nexusdevsystem.looton",
      versionCode: 7,
      targetSdkVersion: 35,
      googleServicesFile: "./google-services.json",
      adaptiveIcon: {
        foregroundImage: "./assets/images/logo.png",
        backgroundColor: "#ffffff"
      },
      permissions: [
        "android.permission.INTERNET",
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.SCHEDULE_EXACT_ALARM",
        "android.permission.VIBRATE"
      ]
    },
    plugins: [
      "expo-router",
      [
        "expo-notifications",
        {
          icon: "./assets/images/logo.png",
          color: "#ffffff",
          sounds: ["./assets/sounds/notification.wav"],
          mode: "production"
        }
      ],
      [
        "expo-build-properties",
        {
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            buildToolsVersion: "35.0.0"
          }
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "b5f22baa-ee4f-4bce-8db5-e5de8aaaa0df"
      }
    },
    owner: "nyill"
  }
};
