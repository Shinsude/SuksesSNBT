import { supabase } from "./supabase-client.js";

// OAuth returns to the configured site URL (the homepage). Supabase restores
// the session from the URL before this check, then sends signed-in users onward.
const { data: { session } } = await supabase.auth.getSession();
if (session && (window.location.pathname === "/" || window.location.pathname.endsWith("/index.html"))) {
  window.location.replace("dashboard.html");
}
