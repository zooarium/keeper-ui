// App-specific config only.
// HTTP client config (apiBase, authBase, refreshPath) is in main.jsx via configure().
// No import.meta.env.* outside this file and main.jsx.
export const config = {
  appName: import.meta.env.VITE_APP_NAME ?? 'App',
  isDev: import.meta.env.DEV,
};
