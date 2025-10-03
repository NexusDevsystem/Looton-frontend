module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // (outros plugins que você tiver)
      'react-native-reanimated/plugin', // ← SEMPRE o ÚLTIMO
    ],
  };
};
