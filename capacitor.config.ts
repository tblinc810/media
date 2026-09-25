import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tblinc.media',
  appName: 'tblinc Media',
  webDir: 'out',                   // Next.js static export output directory
  server: {
    androidScheme: 'http',         // Allow plain-http to local media servers
    cleartext: true,               // Required for http:// on Android 9+
  },
  android: {
    allowMixedContent: true,       // Allow http streams inside https WebView
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
