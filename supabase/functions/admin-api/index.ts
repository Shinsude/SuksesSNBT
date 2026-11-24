import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
});
const fail = (message: string, status = 400) => json({ error: message }, status);
const clean = (value: unknown, max = 2000) => String(value ?? "").trim().slice(0, max);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return fail("Method not allowed", 405);
  try {
    const authorization = req.headers.get("Authorization") || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!token) return fail("Sesi login diperlukan.", 401);

    const url = Deno.env.get("SUPABASE_URL");
    const publishableKeys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}");
    const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    const publishableKey = publishableKeys.default || Deno.env.get("SUPABASE_ANON_KEY");
    const secretKey = secretKeys.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !publishableKey || !secretKey) return fail("Konfigurasi layanan admin belum lengkap.", 503);

    const authClient = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    const user = authData?.user;
    if (authError || !user) return fail("Sesi tidak valid. Silakan masuk kembali.", 401);

    const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const body = await req.json().catch(() => ({}));
    const action = clean(body.action || "overview", 80);

    // One-time owner bootstrap: exact immutable Auth UID + email; never trust user_metadata.
    if (action === "bootstrap-owner") {
      if (user.id !== "8b2a6f97-3b12-44a9-b1da-59c759a7de24" ||
          clean(user.email, 200).toLowerCase() !== "alfachriansyah@gmail.com") {
        return fail("Akun tidak memenuhi syarat aktivasi pemilik.", 403);
      }
      const current = user.app_metadata || {};
      if (current.role === "admin" || current.admin === true) return json({ success: true, already_admin: true });
      if (current.snbt_admin_bootstrap_claimed === true) return fail("Klaim aktivasi pemilik sudah pernah digunakan.", 403);
      const { error } = await admin.auth.admin.updateUserById(user.id, {
        app_metadata: { ...current, role: "admin", snbt_admin_bootstrap_claimed: true },
      });
      if (error) {
        console.error("Owner bootstrap failed.", error);
        return fail("Aktivasi hak admin gagal.", 500);
      }
      return json({ success: true });
    }

    const metadata = user.app_metadata || {};
    if (metadata.role !== "admin" && metadata.admin !== true) return fail("Akun ini tidak memiliki hak administrator.", 403);

    const audit = async (verb: string, resource: string, id: string | null, before: unknown, after: unknown) => {
      const { error } = await admin.from("admin_audit_logs").insert({
        actor_id: user.id, action: verb, resource_type: resource, resource_id: id,
        before_data: before ?? null, after_data: after ?? null,
      });
      if (error) {
        console.error("Audit log write failed.", error);
        return { error };
      }
      return { error: null };
    };
    const pageNumber = Math.max(1, Math.min(10000, Number(body.page) || 1));
    const perPage = 25;

    if (action === "overview") {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const [profiles, progress, recent, breakdown, last30] = await Promise.all([
        admin.from("profiles").select("id", { count: "exact", head: true }),
        admin.from("progress_entries").select("id,score", { count: "exact" }).limit(10000),
        admin.from("progress_entries").select("user_id,activity_type,label,score,completed_at")
          .order("completed_at", { ascending: false }).limit(8),
        admin.from("progress_entries").select("activity_type").limit(10000),
        admin.from("progress_entries").select("id", { count: "exact", head: true }).gte("completed_at", since),
      ]);
      if ([profiles, progress, recent, breakdown, last30].some(x => x.error)) {
        console.error("Overview query failed.");
        return fail("Ringkasan database belum dapat dimuat.", 500);
      }
      const ids = [...new Set((recent.data || []).map(row => row.user_id))];
      const p = ids.length ? await admin.from("profiles").select("id,display_name").in("id", ids) : { data: [], error: null };
      if (p.error) return fail("Profil pengguna belum dapat dimuat.", 500);
      const names = new Map((p.data || []).map(x => [x.id, x.display_name]));
      const scores = (progress.data || []).map(x => Number(x.score)).filter(Number.isFinite);
      const counts = new Map<string, number>();
      for (const row of breakdown.data || []) counts.set(row.activity_type, (counts.get(row.activity_type) || 0) + 1);
      return json({
        userCount: profiles.count || 0, progressCount: progress.count || 0,
        averageScore: scores.length ? scores.reduce((a,b) => a+b,0) / scores.length : null,
        activeLast30Days: last30.count || 0,
        activityBreakdown: [...counts].map(([type,count]) => ({ type,count })),
        recent: (recent.data || []).map(row => ({ ...row, display_name: names.get(row.user_id) || "" })),
      });
    }

    if (action === "users") {
      const { data, error } = await admin.auth.admin.listUsers({ page: pageNumber, perPage });
      if (error) return fail("Daftar pengguna belum dapat dimuat.", 500);
      const ids = (data.users || []).map(x => x.id);
      const p = ids.length ? await admin.from("profiles").select("id,display_name").in("id", ids) : { data: [], error: null };
      if (p.error) return fail("Profil pengguna belum dapat dimuat.", 500);
      const names = new Map((p.data || []).map(x => [x.id,x.display_name]));
      return json({ hasMore: (data.users || []).length === perPage, users: (data.users || []).map(x => ({
        id:x.id,email:x.email,created_at:x.created_at,last_sign_in_at:x.last_sign_in_at,
        email_confirmed_at:x.email_confirmed_at,banned_until:x.banned_until || null,
        is_owner:x.id === "8b2a6f97-3b12-44a9-b1da-59c759a7de24",
        display_name:names.get(x.id) || x.user_metadata?.display_name || "",
      })) });
    }

    if (action === "user-access-set") {
      const targetId = clean(body.user_id, 64);
      const enabled = body.enabled === true;
      if (!targetId || !/^[0-9a-f-]{36}$/i.test(targetId)) return fail("ID pengguna tidak valid.");
      if (targetId === user.id) return fail("Admin tidak dapat menonaktifkan akunnya sendiri.", 403);
      if (targetId === "8b2a6f97-3b12-44a9-b1da-59c759a7de24") return fail("Akun pemilik utama tidak dapat dinonaktifkan dari panel.", 403);
      const { data: target, error: targetError } = await admin.auth.admin.getUserById(targetId);
      if (targetError || !target?.user) return fail("Pengguna tidak ditemukan.", 404);
      const before = { banned_until: target.user.banned_until || null, email: target.user.email || null };
      const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(targetId, {
        ban_duration: enabled ? "none" : "876000h",
      });
      if (updateError || !updated?.user) {
        console.error("User access update failed.", updateError);
        return fail("Status akun gagal diperbarui.", 500);
      }
      const auditResult = await audit(enabled ? "user_enable" : "user_disable", "pengguna", targetId, before, {
        banned_until: updated.user.banned_until || null, email: updated.user.email || null,
      });
      if (auditResult?.error) {
        const previousBan = target.user.banned_until
          ? Math.max(1, Math.ceil((new Date(target.user.banned_until).getTime() - Date.now()) / 1000)) + "s"
          : "none";
        const { error: rollbackError } = await admin.auth.admin.updateUserById(targetId, { ban_duration: previousBan });
        if (rollbackError) console.error("User access rollback failed after audit failure.", rollbackError);
        return fail(rollbackError
          ? "Audit gagal dan pemulihan status akun juga gagal. Periksa log layanan segera."
          : "Perubahan dibatalkan karena audit log gagal disimpan.", 500);
      }
      return json({ success: true, enabled, banned_until: updated.user.banned_until || null });
    }

    if (action === "user-detail") {
      const id = clean(body.user_id, 64);
      const [{ data: profile }, { data: activities, error }, { data: authUser, error: authErr }] = await Promise.all([
        admin.from("profiles").select("*").eq("id",id).maybeSingle(),
        admin.from("progress_entries").select("*").eq("user_id",id).order("completed_at",{ascending:false}).limit(100),
        admin.auth.admin.getUserById(id),
      ]);
      if (error || authErr || !authUser?.user) return fail("Detail pengguna belum dapat dimuat.", 404);
      const scores = (activities || []).map(x => Number(x.score)).filter(Number.isFinite);
      return json({ profile: profile || { display_name: authUser.user.user_metadata?.display_name || "", created_at: authUser.user.created_at },
        email: authUser.user.email, last_sign_in_at: authUser.user.last_sign_in_at,
        activityCount: activities?.length || 0,
        averageScore: scores.length ? scores.reduce((a,b)=>a+b,0)/scores.length : null, activities: activities || [] });
    }

    if (action === "progress") {
      const from = (pageNumber - 1) * perPage;
      const { data, error, count } = await admin.from("progress_entries")
        .select("user_id,activity_type,label,score,correct_count,total_count,completed_at",{count:"exact"})
        .order("completed_at",{ascending:false}).range(from,from+perPage-1);
      if (error) return fail("Riwayat belajar belum dapat dimuat.",500);
      const ids = [...new Set((data || []).map(x=>x.user_id))];
      const p = ids.length ? await admin.from("profiles").select("id,display_name").in("id",ids) : {data:[],error:null};
      if (p.error) return fail("Profil pengguna belum dapat dimuat.",500);
      const names = new Map((p.data || []).map(x=>[x.id,x.display_name]));
      return json({ entries:(data || []).map(x=>({...x,display_name:names.get(x.user_id)||""})),
        hasMore:from+(data||[]).length<(count||0),total:count||0 });
    }

    if (action === "content-list") {
      const [materials,banks,settings] = await Promise.all([
        admin.from("learning_materials").select("*").order("sort_order").order("updated_at",{ascending:false}),
        admin.from("question_banks").select("*,questions(count)").order("updated_at",{ascending:false}),
        admin.from("app_settings").select("*").order("key"),
      ]);
      if (materials.error || banks.error || settings.error) return fail("Data konten belum dapat dimuat.",500);
      return json({materials:materials.data||[],banks:banks.data||[],settings:settings.data||[]});
    }

    if (action === "questions-list") {
      const bankId = clean(body.bank_id,64);
      if (!bankId) return json({questions:[]});
      const {data,error} = await admin.from("questions").select("*").eq("bank_id",bankId).order("sort_order").order("created_at");
      if (error) return fail("Daftar soal belum dapat dimuat.",500);
      return json({questions:data||[]});
    }

    const item = body.item && typeof body.item === "object" ? body.item : {};
    const saveMap: Record<string,{table:string,resource:string,required:string[]}> = {
      "material-save":{table:"learning_materials",resource:"materi",required:["title"]},
      "bank-save":{table:"question_banks",resource:"bank_soal",required:["title"]},
      "question-save":{table:"questions",resource:"soal",required:["bank_id","prompt","correct_answer"]},
      "setting-save":{table:"app_settings",resource:"pengaturan",required:["key"]},
    };
    if (saveMap[action]) {
      const cfg = saveMap[action];
      for (const key of cfg.required) if (!clean(item[key],4000)) return fail("Kolom wajib belum diisi: "+key);
      const payload: Record<string,unknown> = {...item};
      if (action === "material-save") {
        for (const k of ["title","description","category","content","status"]) if (k in payload) payload[k]=clean(payload[k], k==="content"?100000:2000);
        payload.sort_order = Number(payload.sort_order)||0;
      }
      if (action === "bank-save") {
        for (const k of ["title","subject","description","status"]) if (k in payload) payload[k]=clean(payload[k],2000);
      }
      if (action === "question-save") {
        payload.prompt=clean(payload.prompt,20000); payload.correct_answer=clean(payload.correct_answer,20);
        payload.explanation=clean(payload.explanation,30000); payload.sort_order=Number(payload.sort_order)||0;
        if (!Array.isArray(payload.options) || payload.options.length < 2 || payload.options.length > 8) return fail("Opsi jawaban harus berupa array berisi 2–8 pilihan.");
      }
      if (action === "setting-save") {
        payload.key=clean(payload.key,100); payload.description=clean(payload.description,500);
        payload.updated_by=user.id;
      }
      const key = action === "setting-save" ? "key" : "id";
      const id = clean(payload[key],128);
      let before: unknown = null;
      if (id) {
        const old = await admin.from(cfg.table).select("*").eq(key,id).maybeSingle();
        if (old.error) return fail("Data lama gagal diperiksa.",500);
        before=old.data;
      }
      const result = id
        ? await admin.from(cfg.table).update(payload).eq(key,id).select("*").single()
        : await admin.from(cfg.table).insert({...payload, ...(cfg.table==="learning_materials"||cfg.table==="question_banks"?{created_by:user.id}:{})}).select("*").single();
      if (result.error) {
        console.error("Admin save failed.",action,result.error);
        return fail("Data gagal disimpan. Periksa isian dan relasi datanya.",400);
      }
      const auditResult = await audit(id?"update":"create",cfg.resource,String(result.data[key]),before,result.data);
      if (auditResult.error) {
        const rollback = id
          ? await admin.from(cfg.table).update(before as Record<string, unknown>).eq(key,id)
          : await admin.from(cfg.table).delete().eq(key,result.data[key]);
        if (rollback.error) {
          console.error("Admin save rollback failed after audit failure.",action,rollback.error);
          return fail("Audit gagal dan pemulihan data juga gagal. Periksa log layanan segera.",500);
        }
        return fail("Perubahan dibatalkan karena audit log gagal disimpan.",500);
      }
      return json({item:result.data});
    }

    const deleteMap: Record<string,{table:string,resource:string,key:string}> = {
      "material-delete":{table:"learning_materials",resource:"materi",key:"id"},
      "bank-delete":{table:"question_banks",resource:"bank_soal",key:"id"},
      "question-delete":{table:"questions",resource:"soal",key:"id"},
      "setting-delete":{table:"app_settings",resource:"pengaturan",key:"key"},
    };
    if (deleteMap[action]) {
      const cfg=deleteMap[action], id=clean(body[cfg.key],128);
      if (!id) return fail("ID data tidak valid.");
      const old=await admin.from(cfg.table).select("*").eq(cfg.key,id).maybeSingle();
      if (old.error || !old.data) return fail("Data tidak ditemukan.",404);
      const {error}=await admin.from(cfg.table).delete().eq(cfg.key,id);
      if (error) return fail("Data tidak dapat dihapus. Pastikan tidak masih digunakan oleh data lain.",409);
      const auditResult = await audit("delete",cfg.resource,id,old.data,null);
      if (auditResult.error) {
        const {error: rollbackError} = await admin.from(cfg.table).insert(old.data);
        if (rollbackError) {
          console.error("Admin delete rollback failed after audit failure.",cfg.resource,rollbackError);
          return fail("Audit gagal dan pemulihan data juga gagal. Periksa log layanan segera.",500);
        }
        return fail("Penghapusan dibatalkan karena audit log gagal disimpan.",500);
      }
      return json({success:true});
    }

    if (action === "audit-logs") {
      const from=(pageNumber-1)*perPage;
      const {data,error,count}=await admin.from("admin_audit_logs").select("*",{count:"exact"})
        .order("created_at",{ascending:false}).range(from,from+perPage-1);
      if (error) return fail("Log audit belum dapat dimuat.",500);
      return json({logs:data||[],hasMore:from+(data||[]).length<(count||0),total:count||0});
    }

    return fail("Aksi admin tidak dikenal.",400);
  } catch (error) {
    console.error("Admin API unexpected error.", error);
    return fail("Terjadi kendala pada layanan admin.",500);
  }
});