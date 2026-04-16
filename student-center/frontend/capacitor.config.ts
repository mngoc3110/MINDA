import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "vn.io.minda.app",
  appName: "MINDA",
  webDir: "out",
  server: {
    // Trong dev, trỏ về web server thực để hot reload
    // Comment dòng dưới khi build production
    url: "https://minda.io.vn",
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#F7F3EE",
      showSpinner: false,
    },
  },
  android: {
    allowMixedContent: true,
  },
  ios: {
    contentInset: "automatic",
  },
};

export default config;
