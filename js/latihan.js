import { supabase } from "./supabase-client.js";

const subtests = [
  { key: "penalaran-umum", name: "Penalaran Umum", link: "materi/penalaran-umum.html" },
  { key: "ppu", name: "Pengetahuan dan Pemahaman Umum", link: "materi/ppu.html" },
  { key: "pbm", name: "Pemahaman Bacaan dan Menulis", link: "materi/pbm.html" },
  { key: "pk", name: "Pengetahuan Kuantitatif", link: "materi/pk.html" },
  { key: "penalaran-matematika", name: "Penalaran Matematika", link: "materi/penalaran-matematika.html" },
  { key: "literasi-indonesia", name: "Literasi Bahasa Indonesia", link: "materi/literasi-indonesia.html" },
  { key: "literasi-inggris", name: "Literasi Bahasa Inggris", link: "materi/literasi-inggris.html" }
];

const questionSets = {
  "penalaran-umum": [
    {topic:"Silogisme",context:"Semua peserta yang lolos seleksi administrasi berhak mengikuti tes tahap berikutnya. Sebagian pendaftar dari SMA Nusantara lolos seleksi administrasi.",question:"Kesimpulan yang pasti benar adalah …",options:["Semua pendaftar SMA Nusantara mengikuti tes berikutnya.","Sebagian pendaftar SMA Nusantara berhak mengikuti tes berikutnya.","Tidak ada pendaftar SMA Nusantara yang mengikuti tes berikutnya.","Semua peserta tes berikutnya berasal dari SMA Nusantara.","Sebagian peserta yang lolos administrasi tidak berhak mengikuti tes."],answer:1,explanation:"Sebagian pendaftar SMA Nusantara dinyatakan lolos administrasi. Karena setiap peserta yang lolos berhak mengikuti tahap berikutnya, sebagian pendaftar tersebut juga berhak mengikutinya."},
    {topic:"Penalaran sebab-akibat",context:"Dalam tiga bulan terakhir, perpustakaan sekolah memperpanjang jam layanan hingga sore. Pada periode yang sama, jumlah peminjaman buku meningkat.",question:"Pernyataan yang paling tepat berdasarkan informasi tersebut adalah …",options:["Perpanjangan jam layanan pasti menjadi satu-satunya penyebab kenaikan peminjaman.","Kenaikan peminjaman membuktikan semua siswa gemar membaca.","Terdapat hubungan waktu antara perpanjangan layanan dan kenaikan peminjaman, tetapi sebab-akibat belum dapat dipastikan.","Perpustakaan harus selalu buka sepanjang malam.","Jumlah buku yang tersedia pasti bertambah."],answer:2,explanation:"Dua peristiwa terjadi pada periode yang sama. Informasi ini menunjukkan keterkaitan waktu, tetapi belum cukup untuk memastikan bahwa perpanjangan jam layanan adalah penyebab tunggal kenaikan peminjaman."},
    {topic:"Analisis argumen",context:"Sekolah berencana menyediakan lebih banyak tempat minum isi ulang. Kepala sekolah berpendapat kebijakan ini dapat mengurangi sampah botol plastik sekali pakai.",question:"Bukti yang paling kuat untuk mendukung pendapat kepala sekolah adalah …",options:["Banyak siswa menyukai desain tempat minum baru.","Harga botol minum pribadi beragam.","Setelah fasilitas serupa diterapkan, jumlah botol plastik di tempat sampah sekolah turun secara terukur.","Tempat minum isi ulang tersedia dalam berbagai warna.","Sekolah lain juga memiliki kantin."],answer:2,explanation:"Data penurunan jumlah botol plastik setelah fasilitas diterapkan merupakan bukti langsung yang relevan dengan tujuan kebijakan."},
    {topic:"Pola bilangan",context:"Perhatikan urutan berikut: 3, 7, 15, 31, …",question:"Bilangan berikutnya adalah …",options:["47","55","61","63","65"],answer:3,explanation:"Setiap bilangan diperoleh dengan mengalikan bilangan sebelumnya dengan 2 lalu menambahkan 1: 3→7→15→31→63."},
    {topic:"Penalaran kuantitatif",context:"Sebuah kelompok belajar terdiri dari 24 siswa. Sebanyak 3/8 bagian mengikuti kelas tambahan matematika.",question:"Berapa siswa yang mengikuti kelas tambahan matematika?",options:["6","8","9","12","15"],answer:2,explanation:"3/8 × 24 = 3 × 3 = 9 siswa."},
    {topic:"Logika pernyataan",context:"Jika hujan deras, pertandingan di lapangan ditunda. Hari ini pertandingan tidak ditunda.",question:"Kesimpulan logis berdasarkan pernyataan tersebut adalah …",options:["Hari ini pasti cerah sepanjang hari.","Hari ini tidak terjadi hujan deras.","Pertandingan dipindahkan ke dalam ruangan.","Hujan deras selalu berlangsung singkat.","Pertandingan tetap berlangsung meskipun hujan deras."],answer:1,explanation:"Bentuk logikanya: jika P maka Q. Ketika Q tidak terjadi, P juga tidak terjadi (modus tollens). Jadi, tidak terjadi hujan deras."},
    {topic:"Perbandingan",context:"Rasio jumlah buku fiksi dan nonfiksi di rak adalah 2 : 3. Jumlah seluruh buku 40 eksemplar.",question:"Jumlah buku nonfiksi adalah …",options:["12","16","20","24","30"],answer:3,explanation:"Total bagian = 2 + 3 = 5. Setiap bagian bernilai 40 ÷ 5 = 8. Buku nonfiksi = 3 × 8 = 24."},
    {topic:"Evaluasi kesimpulan",context:"Semua anggota klub debat rutin berlatih berbicara. Rina rutin berlatih berbicara.",question:"Apakah dapat disimpulkan bahwa Rina anggota klub debat?",options:["Ya, karena semua anggota klub debat berlatih.","Ya, karena Rina memiliki kebiasaan yang sama.","Tidak, karena orang di luar klub juga mungkin rutin berlatih.","Tidak, karena anggota klub debat tidak selalu berlatih.","Ya, jika Rina pernah mengikuti lomba."],answer:2,explanation:"Pernyataan hanya menyebut semua anggota klub debat rutin berlatih, bukan bahwa semua orang yang rutin berlatih pasti anggota klub. Ini kekeliruan membalik implikasi."},
    {topic:"Interpretasi data",context:"Dalam survei 100 siswa, 60 siswa memilih belajar pagi, 25 siswa memilih sore, dan sisanya memilih malam.",question:"Berapa persen siswa yang memilih belajar malam?",options:["10%","15%","20%","25%","35%"],answer:1,explanation:"Siswa yang memilih malam = 100 − 60 − 25 = 15 siswa, sehingga persentasenya 15%."},
    {topic:"Pola hubungan",context:"Dokter berhubungan dengan rumah sakit sebagaimana guru berhubungan dengan …",question:"Pasangan yang memiliki hubungan paling sepadan adalah …",options:["Buku","Sekolah","Siswa","Papan tulis","Pelajaran"],answer:1,explanation:"Rumah sakit merupakan tempat dokter bekerja. Hubungan sepadannya adalah sekolah sebagai tempat guru bekerja."}
  ],
  "ppu": [
    {topic:"Pengetahuan kelembagaan",context:"Dalam sistem pemerintahan Indonesia, fungsi legislatif di tingkat pusat dijalankan oleh lembaga perwakilan rakyat.",question:"Lembaga yang menjalankan fungsi tersebut adalah …",options:["Mahkamah Agung","Dewan Perwakilan Rakyat","Kementerian Dalam Negeri","Badan Pemeriksa Keuangan","Presiden"],answer:1,explanation:"Dewan Perwakilan Rakyat menjalankan fungsi legislatif di tingkat pusat, antara lain membentuk undang-undang."},
    {topic:"Nilai Pancasila",context:"Sila kelima Pancasila berbunyi Keadilan sosial bagi seluruh rakyat Indonesia.",question:"Contoh sikap yang paling sesuai dengan sila tersebut adalah …",options:["Mengutamakan kepentingan sendiri dalam kelompok","Membagi tugas secara adil dan memberi bantuan kepada yang membutuhkan","Membiarkan teman sendirian agar mandiri","Menolak bekerja sama karena takut rugi","Mengambil lebih banyak bagian tanpa alasan"],answer:1,explanation:"Sila kelima menekankan keadilan dan kepedulian sosial. Membagi tugas secara adil serta membantu yang membutuhkan mencerminkan nilai tersebut."},
    {topic:"Pengetahuan sosial",context:"Peraturan sekolah menyebutkan bahwa setiap siswa wajib menjaga kebersihan area kelasnya masing-masing.",question:"Sikap yang paling tepat berdasarkan aturan itu adalah …",options:["Membiarkan sampah karena petugas kebersihan yang bertugas","Membersihkan area sendiri dan mengingatkan teman dengan sopan","Menunggu sampai guru memarahi teman","Mengambil alih seluruh tugas petugas kebersihan","Melaporkan semua teman tanpa menawarkan bantuan"],answer:1,explanation:"Sikap ini memenuhi aturan sekaligus menjaga hubungan baik dengan teman, tanpa mengabaikan tanggung jawab sendiri."}
  ],
  "pbm": [
    {topic:"Ide pokok",context:"Sampah rumah tangga yang tidak dipilah sering berakhir di TPA. Padahal, sampah organik dapat diolah menjadi kompos. Jika pemilahan dilakukan sejak dari rumah, volume sampah yang dibuang bisa berkurang.",question:"Ide pokok paragraf tersebut adalah …",options:["TPA sampah terlalu jauh dari permukiman","Pemilahan sampah sejak dari rumah dapat mengurangi volume sampah","Kompos lebih mahal daripada pupuk kimia","Sampah organik tidak bisa diolah lagi","Petugas kebersihan tidak perlu bekerja keras"],answer:1,explanation:"Kalimat utama dan kalimat penjelas mengarah pada satu gagasan: pemilahan sampah di rumah mengurangi sampah yang dibuang ke TPA."},
    {topic:"Makna kata dalam konteks",context:"Panitia menetapkan bahwa keamanan peserta menjadi prioritas utama acara.",question:"Kata prioritas dalam kalimat tersebut bermakna …",options:["Hal yang paling penting untuk dilakukan lebih dulu","Hal yang dijadikan bahan pertimbangan tambahan","Hal yang belum direncanakan","Hal yang dianggap tidak mendesak","Hal yang hanya dibicarakan setelah acara"],answer:0,explanation:"Prioritas berarti sesuatu yang lebih utama dan dilakukan lebih awal dibanding yang lain."},
    {topic:"Kalimat efektif",context:"Perhatikan beberapa versi kalimat berikut.",question:"Kalimat yang paling efektif adalah …",options:["Untuk dapat dapat menyelesaikan tugas dengan cepat, maka haruslah dilakukan pengelompokan oleh kami.","Kami mengelompokkan tugas agar selesai lebih cepat.","Tugas dikelompokkan oleh kami untuk bisa selesai lebih cepat dengan cara pengelompokan.","Dengan melakukan pengelompokan-pengelompokan, maka tugas bisa lebih cepat selesai oleh kami.","Kami melakukan pengelompokan terhadap tugas-tugas supaya tugas menjadi selesai dengan lebih cepat."],answer:1,explanation:"Kalimat kedua paling hemat, jelas subjek dan predikatnya, serta tidak mengulang makna yang sama."}
  ],
  "pk": [
    {topic:"Aritmetika sosial",context:"Harga sebuah buku Rp250.000,00. Toko memberikan diskon 20%.",question:"Harga buku setelah diskon adalah …",options:["Rp200.000,00","Rp210.000,00","Rp225.000,00","Rp230.000,00","Rp270.000,00"],answer:0,explanation:"Diskon = 20% × Rp250.000,00 = Rp50.000,00. Harga setelah diskon = Rp250.000,00 − Rp50.000,00 = Rp200.000,00."},
    {topic:"Persamaan linear",context:"Diketahui persamaan 3x − 5 = 16.",question:"Nilai x yang memenuhi persamaan tersebut adalah …",options:["3","5","7","9","11"],answer:2,explanation:"3x − 5 = 16 → 3x = 21 → x = 7."},
    {topic:"Statistika dasar",context:"Data nilai ulangan: 4, 6, 6, 9, 11.",question:"Median data tersebut adalah …",options:["5","6","7","8","9"],answer:1,explanation:"Data sudah terurut. Median adalah nilai tengah, yaitu data ketiga: 6."}
  ],
  "penalaran-matematika": [
    {topic:"Model data",context:"Jumlah buku yang dibaca selama tiga hari berturut-turut adalah 12, 18, dan 15 eksemplar.",question:"Rata-rata jumlah buku yang dibaca per hari adalah …",options:["13","14","15","16","18"],answer:2,explanation:"Jumlah seluruh buku = 12 + 18 + 15 = 45. Rata-rata = 45 ÷ 3 = 15 eksemplar per hari."},
    {topic:"Fungsi",context:"Diketahui fungsi f(x) = 2x + 3.",question:"Nilai f(4) adalah …",options:["8","9","11","12","14"],answer:2,explanation:"f(4) = 2 × 4 + 3 = 8 + 3 = 11."},
    {topic:"Peluang",context:"Sebuah kotak berisi 4 bola merah dan 6 bola biru. Satu bola diambil secara acak.",question:"Peluang terambilnya bola merah adalah …",options:["20%","30%","40%","50%","60%"],answer:2,explanation:"Jumlah seluruh bola 10. Peluang merah = 4 ÷ 10 = 0,4 = 40%."}
  ],
  "literasi-indonesia": [
    {topic:"Ide pokok",context:"Membaca digital memberi akses cepat ke banyak sumber. Namun, pembaca tetap perlu memilih sumber terpercaya, mencatat ide utama, dan mengulang informasi penting agar tidak sekadar bergulir.",question:"Ide pokok paragraf tersebut adalah …",options:["Membaca digital selalu lebih baik daripada membaca cetak","Membaca digital bermanfaat jika disertai strategi memilih dan mengulang informasi","Semua sumber digital tidak dapat dipercaya","Mencatat ide utama membuat membaca menjadi lambat","Informasi digital tidak perlu diulang"],answer:1,explanation:"Paragraf mengemukakan manfaat membaca digital sekaligus strategi agar manfaat itu benar-benar dirasakan."},
    {topic:"Makna kata",context:"Karena jadwalnya padat, Dina menyisihkan dua puluh menit setiap malam untuk membaca.",question:"Kata menyisihkan dalam kalimat tersebut berarti …",options:["Membuang","Mengabaikan","Menyediakan waktu khusus","Menunda tanpa batas","Mengganti seluruh kegiatan"],answer:2,explanation:"Menyisihkan waktu berarti meluangkan atau menyediakan bagian dari waktu untuk suatu kegiatan."},
    {topic:"Simpulan tersirat",context:"Meski jadwalnya penuh, Rani tetap membaca sepuluh halaman setiap malam. Ia meyakini sedikit bacaan yang konsisten lebih berguna daripada bacaan banyak yang jarang dilakukan.",question:"Simpulan yang paling tepat adalah …",options:["Rani tidak memiliki jadwal yang padat","Rani berpendapat konsistensi lebih penting daripada jumlah bacaan sesekali","Rani hanya membaca saat libur","Rani lebih suka buku tebal daripada buku tipis","Rani berhenti membaca karena waktunya penuh"],answer:1,explanation:"Kalimat terakhir secara langsung menunjukkan keyakinan Rani bahwa keteraturan membaca lebih bermanfaat."}
  ],
  "literasi-inggris": [
    {topic:"Main idea",context:"Many students review vocabulary with flashcards. A short, regular review is often easier to remember than one long session before a test.",question:"What is the main idea of the passage?",options:["Students should avoid taking tests.","Flashcards are the only way to study.","Regular short review can help students remember vocabulary.","Long study sessions are always useless.","Vocabulary is not important for reading."],answer:2,explanation:"Both sentences point to the same idea: short and regular review helps students remember vocabulary."},
    {topic:"Vocabulary in context",context:"The school reported a modest increase in library visitors after the reading program began.",question:"The word modest in the sentence means …",options:["Very large","Small but noticeable","Completely absent","Unexpectedly dangerous","Exactly the same"],answer:1,explanation:"Modest means small in size or amount. Here, it describes an increase that is not huge but can be observed."},
    {topic:"Author's purpose",context:"This notice reminds students to return library books before Friday. Late returns will make it difficult for other students to borrow them.",question:"What is the author's purpose?",options:["To entertain students with a story","To persuade students to buy new books","To inform students about the return deadline","To describe a favorite novel","To compare two libraries"],answer:2,explanation:"The notice gives a clear deadline and a reason, so its main purpose is to inform students."}
  ]
};

const $ = (selector) => document.querySelector(selector);
let user = null;
let activeKey = "penalaran-umum";
let questions = questionSets[activeKey];
let current = 0;
let answers = Array(questions.length).fill(null);
let startedAt = 0;
let finished = false;
let saved = false;
let elapsedSeconds = 0;
let timerInterval = null;
const clientId = crypto.randomUUID();

function metaFor(key) {
  return subtests.find((item) => item.key === key) || subtests[0];
}
function formatTime(seconds) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return mins + ":" + secs;
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
function updateProgress() {
  $("#questionCounter").textContent = "Soal " + (current + 1) + " dari " + questions.length;
  $("#progressFill").style.width = ((current + 1) / questions.length * 100) + "%";
  $("#timer").textContent = formatTime(elapsedSeconds);
}
function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}
function startTimer() {
  stopTimer();
  startedAt = Date.now();
  elapsedSeconds = 0;
  timerInterval = setInterval(() => {
    elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
    $("#timer").textContent = formatTime(elapsedSeconds);
  }, 1000);
}
function renderIntro() {
  stopTimer();
  current = 0;
  answers = Array(questions.length).fill(null);
  finished = false;
  saved = false;
  elapsedSeconds = 0;
  $("#introArea").hidden = false;
  $("#questionArea").hidden = true;
  $("#questionArea").innerHTML = "";
  $("#questionCounter").textContent = "Pilih subtes";
  $("#progressFill").style.width = "0%";
  $("#timer").textContent = "00:00";
  $("#saveStatus").textContent = "";
  const meta = metaFor(activeKey);
  $("#introArea").innerHTML = `
    <p class="badge badge--soft">Pilih subtes</p>
    <h1 class="question-text">Latihan Soal SNBT Interaktif</h1>
    <p style="color:var(--muted);line-height:1.7">Pilih salah satu subtes UTBK-SNBT, lalu kerjakan soal pilihan ganda dengan timer. Setelah selesai, kamu mendapat nilai dan pembahasan. Tanpa akun tetap bisa latihan; hasil tersimpan hanya jika kamu masuk.</p>
    <div class="subtest-picker" id="subtestPicker" role="group" aria-label="Pilih subtes latihan">
      ${subtests.map((item) => `
        <button type="button" class="subtest-chip ${item.key === activeKey ? "is-active" : ""}" data-subtest="${item.key}" aria-pressed="${item.key === activeKey}">
          <strong>${escapeHtml(item.name)}</strong>
          <span>${questionSets[item.key].length} soal</span>
        </button>`).join("")}
    </div>
    <p class="notice" id="pickerHint">Subtes dipilih: <strong>${escapeHtml(meta.name)}</strong> — ${questions.length} soal. <a href="${meta.link}" style="color:var(--accent);font-weight:700">Buka materinya →</a></p>
    <button class="btn btn--primary" id="startButton" type="button" style="margin-top:8px">Mulai latihan ${escapeHtml(meta.name)} →</button>`;
  document.querySelectorAll("[data-subtest]").forEach((button) => {
    button.addEventListener("click", () => {
      activeKey = button.dataset.subtest;
      questions = questionSets[activeKey];
      document.title = "Latihan " + metaFor(activeKey).name + " SNBT — " + questions.length + " Soal | SNBT Learning Center";
      renderIntro();
    });
  });
  $("#startButton").addEventListener("click", startPractice);
}
function startPractice() {
  current = 0;
  questions = questionSets[activeKey];
  answers = Array(questions.length).fill(null);
  finished = false;
  saved = false;
  startTimer();
  renderQuestion();
}
function renderQuestion() {
  const q = questions[current];
  updateProgress();
  $("#introArea").hidden = true;
  $("#questionArea").hidden = false;
  $("#questionArea").innerHTML = `
    <p class="badge badge--soft">${escapeHtml(q.topic)}</p>
    <div class="question-context">${escapeHtml(q.context)}</div>
    <h1 class="question-text">${escapeHtml(q.question)}</h1>
    <div class="answers">${q.options.map((option,index)=>`
      <label class="answer-option">
        <input type="radio" name="answer" value="${index}" ${answers[current]===index?"checked":""}>
        <span><strong>${String.fromCharCode(65+index)}.</strong> ${escapeHtml(option)}</span>
      </label>`).join("")}
    </div>
    <div class="practice-actions">
      <button class="btn secondary" id="previousButton" type="button" ${current===0?"disabled":""}>← Sebelumnya</button>
      ${current===questions.length-1?'<button class="btn btn--primary" id="finishButton" type="button">Selesaikan latihan</button>':'<button class="btn btn--primary" id="nextButton" type="button">Berikutnya →</button>'}
    </div>`;
  $("#questionArea").querySelectorAll('input[name="answer"]').forEach(input=>{
    input.addEventListener("change",()=>{answers[current]=Number(input.value);});
  });
  $("#previousButton").addEventListener("click",()=>{current--;renderQuestion();});
  $("#nextButton")?.addEventListener("click",()=>{if(answers[current]===null){$("#saveStatus").textContent="Pilih satu jawaban atau lanjutkan setelah memilih.";return;}current++;renderQuestion();});
  $("#finishButton")?.addEventListener("click",()=>{if(answers[current]===null){$("#saveStatus").textContent="Pilih satu jawaban sebelum menyelesaikan latihan.";return;}finishPractice();});
  $("#saveStatus").textContent="";
}
async function ensureUser() {
  if (user) return user;
  const { data } = await supabase.auth.getUser();
  user = data.user || null;
  return user;
}
async function saveResult(result) {
  const currentUser = await ensureUser();
  if (!currentUser) {
    $("#saveStatus").textContent = "Hasil tidak disimpan. Masuk dengan akun jika ingin menyimpan riwayat di dashboard.";
    return false;
  }
  const correct = result.correct;
  const wrong = result.wrong;
  const blank = result.blank;
  const score = Math.round(correct / questions.length * 100);
  const meta = metaFor(activeKey);
  const payload = {
    user_id: currentUser.id, client_id: clientId, activity_type: "latihan",
    label: "Latihan " + meta.name + " — " + questions.length + " Soal",
    score, correct_count: correct, wrong_count: wrong, blank_count: blank,
    total_count: questions.length, completed_at: new Date().toISOString(),
    details: {
      subtest: meta.name, duration_seconds: elapsedSeconds,
      answers: answers.map((answer,index)=>({question:index+1,selected:answer,correct:questions[index].answer,is_correct:answer===questions[index].answer})),
      version: 2
    }
  };
  const { error } = await supabase.from("progress_entries").insert(payload);
  if (error && error.code !== "23505") throw error;
  $("#saveStatus").textContent = "Hasil berhasil disimpan ke akunmu. Lihat riwayat di dashboard.";
  return true;
}
async function finishPractice() {
  if (finished) return;
  finished = true;
  stopTimer();
  const correct = answers.filter((answer,index)=>answer===questions[index].answer).length;
  const blank = answers.filter(answer=>answer===null).length;
  const wrong = questions.length-correct-blank;
  const result = {correct,wrong,blank};
  const score = Math.round(correct/questions.length*100);
  const meta = metaFor(activeKey);
  $("#questionArea").innerHTML = `
    <p class="badge badge--soft">Latihan selesai</p>
    <h1 class="question-text">Hasil latihan ${escapeHtml(meta.name)}</h1>
    <div class="result-score">${score}<span style="font-size:20px">/100</span></div>
    <p style="color:var(--muted)">Waktu pengerjaan: ${formatTime(elapsedSeconds)}</p>
    <div class="result-grid">
      <div class="result-stat"><strong>${correct}</strong><span>Benar</span></div>
      <div class="result-stat"><strong>${wrong}</strong><span>Salah</span></div>
      <div class="result-stat"><strong>${blank}</strong><span>Kosong</span></div>
    </div>
    <h2 style="margin:26px 0 8px">Pembahasan</h2>
    ${questions.map((q,index)=>`
      <article class="review-item">
        <strong>${index+1}. ${escapeHtml(q.question)}</strong>
        <p>Jawaban benar: <strong>${String.fromCharCode(65+q.answer)}. ${escapeHtml(q.options[q.answer])}</strong></p>
        <p>${escapeHtml(q.explanation)}</p>
      </article>`).join("")}
    <div class="practice-actions">
      <button class="btn secondary" id="changeButton" type="button">Pilih subtes lain</button>
      <button class="btn btn--primary" id="retryButton" type="button">Ulangi subtes ini</button>
    </div>
    <div class="pillar-cta" style="margin-top:18px;">
      <a class="btn secondary" href="${meta.link}">Materi ${escapeHtml(meta.name)}</a>
      <a class="btn secondary" href="dashboard.html">Lihat dashboard →</a>
    </div>`;
  $("#questionCounter").textContent = "Latihan selesai";
  $("#progressFill").style.width = "100%";
  $("#timer").textContent = formatTime(elapsedSeconds);
  $("#changeButton").addEventListener("click", renderIntro);
  $("#retryButton").addEventListener("click", startPractice);
  try {
    await saveResult(result);
    saved = true;
  } catch (error) {
    $("#saveStatus").textContent = "Latihan selesai, tetapi hasil belum tersimpan: "+error.message+". Kamu tetap dapat melihat pembahasan di halaman ini.";
  }
}
renderIntro();
