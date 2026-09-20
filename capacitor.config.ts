export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  server?: {
    androidScheme?: string;
    cleartext?: boolean;
    url?: string;
  };
  plugins?: Record<string, unknown>;
}

const config: CapacitorConfig = {
  appId: 'cd.nnecxy.app',
  appName: 'NNECXY',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    App: {},
    Share: {},
    Filesystem: {},
  },
};

export default config;
