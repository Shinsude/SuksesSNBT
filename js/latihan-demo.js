const questions = [
  {
    topic: "Pola Bilangan",
    question: "Perhatikan pola bilangan berikut: 2, 4, 6, 8, ... Bilangan berikutnya adalah ...",
    options: ["9", "10", "11", "12"],
    answer: 1,
    explanation: "Setiap bilangan bertambah 2. Setelah 8, bilangan berikutnya adalah 10."
  },
  {
    topic: "Analogi",
    question: "Buku : Membaca = Musik : ...",
    options: ["Menulis", "Menggambar", "Mendengarkan", "Menghitung"],
    answer: 2,
    explanation: "Buku digunakan untuk membaca, sedangkan musik dinikmati dengan mendengarkan."
  },
  {
    topic: "Silogisme",
    question: "Semua siswa rajin membaca. Rani adalah siswa. Kesimpulan yang tepat adalah ...",
    options: ["Rani rajin membaca", "Rani tidak suka membaca", "Semua pembaca adalah siswa", "Rani selalu mendapat nilai 100"],
    answer: 0,
    explanation: "Karena Rani termasuk siswa dan semua siswa rajin membaca, Rani juga rajin membaca."
  },
  {
    topic: "Perbandingan",
    question: "Dina memiliki 6 pensil. Bima memiliki 2 pensil lebih banyak daripada Dina. Berapa pensil Bima?",
    options: ["4", "6", "8", "12"],
    answer: 2,
    explanation: "Jumlah pensil Bima adalah 6 + 2 = 8 pensil."
  },
  {
    topic: "Logika Pernyataan",
    question: "Jika hari ini hujan, maka lapangan basah. Hari ini hujan. Kesimpulannya adalah ...",
    options: ["Lapangan pasti kering", "Lapangan basah", "Besok pasti hujan", "Tidak ada kesimpulan"],
    answer: 1,
    explanation: "Pernyataan menyebutkan bahwa hujan menyebabkan lapangan basah. Karena hari ini hujan, lapangan basah."
  }
];

const state = {
  current: 0,
  score: 0,
  checked: false
};

const questionCounter = document.getElementById("question-counter");
const progressLabel = document.getElementById("progress-label");
const progressValue = document.getElementById("progress-value");
const questionTopic = document.getElementById("question-topic");
const questionTitle = document.getElementById("question-title");
const answerList = document.getElementById("answer-list");
const feedback = document.getElementById("feedback");
const checkAnswer = document.getElementById("check-answer");
const nextQuestion = document.getElementById("next-question");
const questionPanel = document.getElementById("question-panel");
const resultPanel = document.getElementById("result-panel");
const scoreValue = document.getElementById("score-value");
const correctCount = document.getElementById("correct-count");
const wrongCount = document.getElementById("wrong-count");
const resultMessage = document.getElementById("result-message");
const restartPractice = document.getElementById("restart-practice");

function renderQuestion() {
  const item = questions[state.current];
  const progress = (state.current / questions.length) * 100;

  state.checked = false;
  questionCounter.textContent = `Soal ${state.current + 1} dari ${questions.length}`;
  progressLabel.textContent = `${Math.round(progress)}% selesai`;
  progressValue.style.width = `${Math.max(progress, 20)}%`;
  questionTopic.textContent = item.topic;
  questionTitle.textContent = item.question;
  answerList.innerHTML = item.options.map((option, index) => `
    <label class="answer-option" for="answer-${index}">
      <input id="answer-${index}" name="answer" type="radio" value="${index}" />
      <span><strong>${String.fromCharCode(65 + index)}.</strong> ${option}</span>
    </label>
  `).join("");

  feedback.hidden = true;
  feedback.innerHTML = "";
  checkAnswer.hidden = false;
  checkAnswer.disabled = true;
  nextQuestion.hidden = true;
  questionTitle.focus({ preventScroll: true });

  answerList.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", () => {
      checkAnswer.disabled = false;
      answerList.querySelectorAll(".answer-option").forEach((option) => option.classList.remove("is-selected"));
      input.closest(".answer-option").classList.add("is-selected");
    });
  });
}

function checkCurrentAnswer() {
  const selected = answerList.querySelector("input:checked");
  if (!selected || state.checked) return;

  const selectedIndex = Number(selected.value);
  const item = questions[state.current];
  const isCorrect = selectedIndex === item.answer;
  state.checked = true;
  state.score += Number(isCorrect);

  answerList.querySelectorAll("input").forEach((input, index) => {
    input.disabled = true;
    const option = input.closest(".answer-option");
    option.classList.add("is-locked");
    if (index === item.answer) option.classList.add("is-correct");
    if (index === selectedIndex && !isCorrect) option.classList.add("is-wrong");
  });

  feedback.innerHTML = `<strong>${isCorrect ? "Jawaban benar" : "Jawaban belum tepat"}</strong><span>${item.explanation}</span>`;
  feedback.hidden = false;
  checkAnswer.hidden = true;
  nextQuestion.hidden = false;
  nextQuestion.textContent = state.current === questions.length - 1 ? "Lihat Hasil" : "Soal Berikutnya";
  nextQuestion.focus();
}

function showResult() {
  const wrong = questions.length - state.score;
  const score = (state.score / questions.length) * 100;
  questionPanel.hidden = true;
  resultPanel.hidden = false;
  progressLabel.textContent = "100% selesai";
  progressValue.style.width = "100%";
  scoreValue.textContent = score;
  correctCount.textContent = state.score;
  wrongCount.textContent = wrong;
  resultMessage.textContent = score >= 80
    ? "Bagus! Pertahankan latihan rutinmu."
    : "Tetap semangat. Baca kembali pembahasannya dan coba lagi.";
  resultPanel.focus({ preventScroll: true });
}

function goToNextQuestion() {
  if (!state.checked) return;
  if (state.current === questions.length - 1) {
    showResult();
    return;
  }
  state.current += 1;
  renderQuestion();
}

function restart() {
  state.current = 0;
  state.score = 0;
  questionPanel.hidden = false;
  resultPanel.hidden = true;
  renderQuestion();
}

checkAnswer.addEventListener("click", checkCurrentAnswer);
nextQuestion.addEventListener("click", goToNextQuestion);
restartPractice.addEventListener("click", restart);

renderQuestion();
