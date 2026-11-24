import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey, authorization, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
});
const fail = (message: string, status = 400) => json({ error: message }, status);
const clean = (value: unknown, max = 200) => String(value ?? "").trim().slice(0, max);
const uuid = (value: unknown) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean(value, 64));

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return fail("Method not allowed.", 405);
  try {
    const raw = await req.text();
    if (raw.length > 12000) return fail("Permintaan terlalu besar.", 413);
    const body = JSON.parse(raw || "{}");
    const action = clean(body.action, 40);
    const url = Deno.env.get("SUPABASE_URL");
    const secrets = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    const secret = secrets.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !secret) return fail("Layanan latihan belum dikonfigurasi.", 503);
    const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

    if (action === "catalog") {
      const { data, error } = await db.from("question_banks")
        .select("id,title,subject,description")
        .eq("status", "published").order("updated_at", { ascending: false }).limit(100);
      if (error) {
        console.error("Practice catalog query failed.", error);
        return fail("Bank soal belum dapat dimuat.", 500);
      }
      const banks = data || [];
      const counts = banks.length ? await db.from("questions").select("bank_id").in("bank_id", banks.map((bank) => bank.id)) : { data: [], error: null };
      if (counts.error) return fail("Jumlah soal belum dapat dimuat.", 500);
      const countMap = new Map<string, number>();
      for (const row of counts.data || []) countMap.set(row.bank_id, (countMap.get(row.bank_id) || 0) + 1);
      return json({ banks: banks.map((bank) => ({ ...bank, question_count: countMap.get(bank.id) || 0 })) });
    }

    if (!uuid(body.bank_id)) return fail("Bank soal tidak valid.");
    const bankId = clean(body.bank_id, 64);
    const { data: bank, error: bankError } = await db.from("question_banks")
      .select("id,title,subject,description,status").eq("id", bankId).eq("status", "published").maybeSingle();
    if (bankError) return fail("Bank soal belum dapat diperiksa.", 500);
    if (!bank) return fail("Bank soal tidak tersedia atau belum dipublikasikan.", 404);

    if (action === "question") {
      const { data, error } = await db.from("questions")
        .select("id,bank_id,prompt,options,difficulty,sort_order")
        .eq("bank_id", bankId).order("sort_order").order("created_at").limit(200);
      if (error) return fail("Soal belum dapat dimuat.", 500);
      const questions = (data || []).map((item) => ({
        id: item.id, prompt: item.prompt, difficulty: item.difficulty,
        options: Array.isArray(item.options) ? item.options.map((text: string, index: number) => ({
          id: String.fromCharCode(65 + index), text: String(text).replace(/^[A-H](?:[.)\s:-]+)?/i, "").trim() || String(text),
        })) : [],
      })).filter((item) => item.options.length >= 2 && item.options.length <= 8);
      return json({ bank: { id: bank.id, title: bank.title, subject: bank.subject, description: bank.description }, questions });
    }

    if (action === "check-answer") {
      if (!uuid(body.question_id)) return fail("Soal tidak valid.");
      const answer = clean(body.answer, 8).toUpperCase();
      if (!/^[A-H]$/.test(answer)) return fail("Pilih salah satu jawaban yang tersedia.");
      const { data: question, error } = await db.from("questions")
        .select("id,options,correct_answer,explanation")
        .eq("id", clean(body.question_id, 64)).eq("bank_id", bankId).maybeSingle();
      if (error) return fail("Jawaban belum dapat diperiksa.", 500);
      if (!question || !Array.isArray(question.options)) return fail("Soal tidak ditemukan.", 404);
      const index = answer.charCodeAt(0) - 65;
      if (index < 0 || index >= question.options.length) return fail("Pilihan jawaban tidak tersedia.");
      const storedAnswer = clean(question.correct_answer, 1000).toUpperCase();
      const correctIndex = question.options.findIndex((option: string, optionIndex: number) => {
        const optionText = String(option).trim();
        const optionLabel = optionText.match(/^([A-H])(?:[.)\s:-]|$)/i)?.[1]?.toUpperCase();
        return storedAnswer === String.fromCharCode(65 + optionIndex) ||
          storedAnswer === optionLabel || storedAnswer === optionText.toUpperCase();
      });
      if (correctIndex < 0) return fail("Kunci jawaban soal belum valid.", 500);
      const correctAnswer = String.fromCharCode(65 + correctIndex);
      const isCorrect = index === correctIndex;
      return json({
        is_correct: isCorrect,
        explanation: clean(question.explanation, 30000),
      });
    }
    return fail("Aksi tidak dikenal.", 404);
  } catch (error) {
    console.error("Student practice request failed.", error);
    return fail("Permintaan latihan tidak dapat diproses.", 400);
  }
});
