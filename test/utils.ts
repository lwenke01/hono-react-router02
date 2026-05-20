export const setTestEnv = (env: Record<string, unknown>) => ({
  ...env,
  BETTER_AUTH_SECRET: 'k1kFVTToDj5WoE8EAGIev1lq_mHxP82BWR06f98_uSU',
  BETTER_AUTH_URL: 'http://localhost:5173',
})
