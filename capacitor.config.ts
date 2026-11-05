import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.pineros.sue",
  appName: "SÚE",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
  ios: {
    contentInset: "automatic",
    backgroundColor: "#140c1f",
  },
  android: {
    backgroundColor: "#140c1f",
  },
  plugins: {
    StatusBar: {
      style: "DARK",
      backgroundColor: "#140c1f",
    },
  },
};

export default config;
