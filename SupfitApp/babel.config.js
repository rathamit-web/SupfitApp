const plugins = [];

// Reanimated plugin must be last.
plugins.push('react-native-reanimated/plugin');

module.exports = {
  presets: ['babel-preset-expo'],
  plugins,
};
