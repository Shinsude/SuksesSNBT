import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
});

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authorization = req.headers.get("Authorization") || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!token) return json({ error: "Sesi login diperlukan." }, 401);

    const url = Deno.env.get("SUPABASE_URL");
    const publishableKeys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}");
    const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    const publishableKey = publishableKeys.default || Deno.env.get("SUPABASE_ANON_KEY");
    const secretKey = secretKeys.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !publishableKey || !secretKey) {
      console.error("Required Supabase function environment is unavailable.");
      return json({ error: "Konfigurasi layanan admin belum lengkap." }, 503);
    }

    const authClient = createClient(url, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    const user = authData?.user;
    if (authError || !user) return json({ error: "Sesi tidak valid. Silakan masuk kembali." }, 401);

    const metadata = user.app_metadata || {};
    if (metadata.role !== "admin" && metadata.admin !== true) {
      return json({ error: "Akun ini tidak memiliki hak administrator." }, 403);
    }

    const admin = createClient(url, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "overview");

    if (action === "overview") {
      const [profiles, progress, recent] = await Promise.all([
        admin.from("profiles").select("id", { count: "exact", head: true }),
        admin.from("progress_entries").select("id,score", { count: "exact" }).limit(10000),
        admin.from("progress_entries")
          .select("user_id,activity_type,label,score,completed_at")
          .order("completed_at", { ascending: false }).limit(8),
      ]);
      if (profiles.error || progress.error || recent.error) {
        console.error("Admin overview query failed.", profiles.error || progress.error || recent.error);
        return json({ error: "Ringkasan database belum dapat dimuat." }, 500);
      }
      const ids = [...new Set((recent.data || []).map((row) => row.user_id))];
      const profileResult = ids.length
        ? await admin.from("profiles").select("id,display_name").in("id", ids)
        : { data: [], error: null };
      if (profileResult.error) return json({ error: "Profil pengguna belum dapat dimuat." }, 500);
      const names = new Map((profileResult.data || []).map((profile) => [profile.id, profile.display_name]));
      const scores = (progress.data || []).map((row) => Number(row.score)).filter(Number.isFinite);
      return json({
        userCount: profiles.count || 0,
        progressCount: progress.count || 0,
        averageScore: scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null,
        recent: (recent.data || []).map((row) => ({ ...row, display_name: names.get(row.user_id) || "" })),
      });
    }

    if (action === "users") {
      const page = Math.max(1, Math.min(10000, Number(body.page) || 1));
      const perPage = 25;
      const { data: userData, error: userError } = await admin.auth.admin.listUsers({
        page,
        perPage,
      });
      if (userError) {
        console.error("Admin user listing failed.", userError);
        return json({ error: "Daftar pengguna belum dapat dimuat." }, 500);
      }
      const ids = (userData.users || []).map((item) => item.id);
      const profileResult = ids.length
        ? await admin.from("profiles").select("id,display_name").in("id", ids)
        : { data: [], error: null };
      if (profileResult.error) return json({ error: "Profil pengguna belum dapat dimuat." }, 500);
      const names = new Map((profileResult.data || []).map((profile) => [profile.id, profile.display_name]));
      return json({
        hasMore: (userData.users || []).length === perPage,
        users: (userData.users || []).map((item) => ({
          id: item.id,
          email: item.email,
          created_at: item.created_at,
          last_sign_in_at: item.last_sign_in_at,
          email_confirmed_at: item.email_confirmed_at,
          display_name: names.get(item.id) || item.user_metadata?.display_name || "",
        })),
      });
    }

    if (action === "progress") {
      const page = Math.max(1, Math.min(10000, Number(body.page) || 1));
      const perPage = 25;
      const from = (page - 1) * perPage;
      const { data: entries, error: entriesError, count } = await admin.from("progress_entries")
        .select("user_id,activity_type,label,score,correct_count,total_count,completed_at", { count: "exact" })
        .order("completed_at", { ascending: false }).range(from, from + perPage - 1);
      if (entriesError) {
        console.error("Admin progress listing failed.", entriesError);
        return json({ error: "Riwayat belajar belum dapat dimuat." }, 500);
      }
      const ids = [...new Set((entries || []).map((row) => row.user_id))];
      const profileResult = ids.length
        ? await admin.from("profiles").select("id,display_name").in("id", ids)
        : { data: [], error: null };
      if (profileResult.error) return json({ error: "Profil pengguna belum dapat dimuat." }, 500);
      const names = new Map((profileResult.data || []).map((profile) => [profile.id, profile.display_name]));
      return json({
        entries: (entries || []).map((row) => ({ ...row, display_name: names.get(row.user_id) || "" })),
        hasMore: from + (entries || []).length < (count || 0),
        total: count || 0,
      });
    }

    return json({ error: "Aksi admin tidak dikenal." }, 400);
  } catch (error) {
    console.error("Admin API unexpected error.", error);
    return json({ error: "Terjadi kendala pada layanan admin." }, 500);
  }
});