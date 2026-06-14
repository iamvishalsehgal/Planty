module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
    ],
    plugins: [
      "react-native-reanimated/plugin",
      ["module-resolver", {
        alias: {
          "@": "./src",
          "@components": "./src/components",
          "@hooks": "./src/hooks",
          "@stores": "./src/stores",
          "@lib": "./src/lib",
          "@design": "./src/design",
        },
      }],
    ],
  };
};
