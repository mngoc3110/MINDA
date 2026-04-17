import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "vn.io.minda.app.ngoc",
  appName: "MINDA",
  webDir: "out",
  server: {
    // url: "https://minda.io.vn",
    cleartext: true,
  },
  plugins: {
    CapacitorHttp: {
      enabled: false,
    },
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
