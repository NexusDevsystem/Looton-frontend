const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Remove screen orientation restrictions from AndroidManifest.xml
 * to support large screen devices (tablets, foldables) on Android 16+
 */
module.exports = function withAndroidManifestFix(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;

    // Find all activities and remove screenOrientation attribute
    if (androidManifest.manifest?.application?.[0]?.activity) {
      androidManifest.manifest.application[0].activity.forEach((activity) => {
        // Remove screenOrientation restriction
        if (activity.$?.['android:screenOrientation']) {
          delete activity.$['android:screenOrientation'];
        }

        // Enable resizing for large screens
        if (!activity.$?.['android:resizeableActivity']) {
          activity.$['android:resizeableActivity'] = 'true';
        }

        // Support all screen sizes
        if (!activity.$?.['android:supportsPictureInPicture']) {
          activity.$['android:supportsPictureInPicture'] = 'false';
        }
      });
    }

    return config;
  });
};
