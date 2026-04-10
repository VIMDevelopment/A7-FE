module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve = webpackConfig.resolve || {};
      webpackConfig.resolve.fallback = {
        ...(webpackConfig.resolve.fallback || {}),
        fs: false,
      };

      webpackConfig.ignoreWarnings = [
        ...(webpackConfig.ignoreWarnings || []),
        (warning) =>
          warning?.module?.resource?.includes("face-api.js/build/es6") &&
          /Failed to parse source map/.test(warning?.message || ""),
      ];

      return webpackConfig;
    },
  },
};
