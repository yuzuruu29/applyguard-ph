import { defineConfig } from "@capacitor/cli";

const config = {
  appId: "ph.applyguard.app",
  appName: "ApplyGuard PH",
  webDir: "dist",
  server: {
    androidScheme: "https",
    cleartext: true,
    allowNavigation: ["*"],
  },
  ios: {
    contentInset: "automatic",
    allowsLinkPreview: false,
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0b6e5f",
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#0b6e5f",
    },
  },
};

export default defineConfig(config);
