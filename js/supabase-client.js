(() => {
  const config = window.SNBT_SUPABASE_CONFIG;
  const sdk = window.supabase;
  if (!config || !config.url || !config.publishableKey || !sdk || !sdk.createClient) {
    window.snbtSupabase = null;
    window.SNBT_AUTH_READY = false;
    return;
  }
  window.snbtSupabase = sdk.createClient(config.url, config.publishableKey, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
  });
  window.SNBT_AUTH_READY = true;
})();
