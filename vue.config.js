module.exports = {
  // ...other vue-cli plugin options...
  pwa: {
    msTileColor: '#000000',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
    iconPaths: {
      favicon32: 'favicon-32x32.png',
      favicon16: 'favicon-16x16.png',
      appleTouchIcon: 'apple-icon-152x152.png',
      msTileImage: 'ms-icon-144x144.png',
    },
    //lint ignore (ignore all console warnings only for dev mode)
    lintOnSave: false,

    // configure the workbox plugin
    workboxPluginMode: 'InjectManifest',
    workboxOptions: {
      // swSrc is required in InjectManifest mode.
      swSrc: 'src/service-worker.js',
      // ...other Workbox options...
      // exclude auth.esm.js to get trough login
      exclude: [/\.map$/, /manifest\.json$/, /auth\.esm\.js$/],
    },
  },
};
