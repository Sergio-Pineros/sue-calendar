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
    backgroundColor: "#100c16",
  },
  android: {
    backgroundColor: "#100c16",
  },
  plugins: {
    StatusBar: {
      style: "DARK",
      backgroundColor: "#100c16",
    },
  },
};

export default config;
