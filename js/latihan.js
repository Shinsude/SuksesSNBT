import { supabase } from "./supabase-client.js";

const questions = [
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
];

const $ = (selector) => document.querySelector(selector);
let user = null;
let current = 0;
let answers = Array(questions.length).fill(null);
let startedAt = 0;
let finished = false;
let saved = false;
let elapsedSeconds = 0;
let timerInterval = null;
const clientId = crypto.randomUUID();

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
function renderQuestion() {
  const q = questions[current];
  updateProgress();
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
async function saveResult(result) {
  const correct = result.correct;
  const wrong = result.wrong;
  const blank = result.blank;
  const score = Math.round(correct / questions.length * 100);
  const payload = {
    user_id:user.id, client_id:clientId, activity_type:"latihan",
    label:"Latihan Penalaran Umum — 10 Soal",
    score, correct_count:correct, wrong_count:wrong, blank_count:blank,
    total_count:questions.length, completed_at:new Date().toISOString(),
    details:{
      subtest:"Penalaran Umum", duration_seconds:elapsedSeconds,
      answers:answers.map((answer,index)=>({question:index+1,selected:answer,correct:questions[index].answer,is_correct:answer===questions[index].answer})),
      version:1
    }
  };
  const {error}=await supabase.from("progress_entries").insert(payload);
  if(error && error.code!=="23505") throw error;
}
async function finishPractice() {
  if(finished)return;
  finished=true;
  clearInterval(timerInterval);
  const correct=answers.filter((answer,index)=>answer===questions[index].answer).length;
  const blank=answers.filter(answer=>answer===null).length;
  const wrong=questions.length-correct-blank;
  const result={correct,wrong,blank};
  const score=Math.round(correct/questions.length*100);
  $("#questionArea").innerHTML=`
    <p class="badge badge--soft">Latihan selesai</p>
    <h1 class="question-text">Hasil latihanmu</h1>
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
    <div class="practice-actions"><a class="btn secondary" href="materi.html">Kembali ke materi</a><a class="btn btn--primary" href="dashboard.html">Lihat dashboard →</a></div>`;
  $("#questionCounter").textContent="Latihan selesai";
  $("#progressFill").style.width="100%";
  $("#timer").textContent=formatTime(elapsedSeconds);
  try{
    await saveResult(result);
    saved=true;
    $("#saveStatus").textContent="Hasil berhasil disimpan ke akunmu. Lihat riwayat di dashboard.";
  }catch(error){
    $("#saveStatus").textContent="Latihan selesai, tetapi hasil belum tersimpan: "+error.message+". Kamu tetap dapat melihat pembahasan di halaman ini.";
  }
}
async function init(){
  const {data:{user:currentUser},error}=await supabase.auth.getUser();
  if(error||!currentUser){window.location.replace("login.html");return;}
  user=currentUser;
  $("#startButton").addEventListener("click",()=>{
    startedAt=Date.now();
    timerInterval=setInterval(()=>{elapsedSeconds=Math.floor((Date.now()-startedAt)/1000);$("#timer").textContent=formatTime(elapsedSeconds);},1000);
    renderQuestion();
  });
}
init();
