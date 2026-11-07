const questions = window.latihanPUQuestions;

if (!Array.isArray(questions) || questions.length === 0) {
  throw new Error("Data latihan PU tidak tersedia.");
}

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
  answerList.innerHTML = item.options.map((option) => `
    <label class="answer-option" for="answer-${option.id}">
      <input id="answer-${option.id}" name="answer" type="radio" value="${option.id}" />
      <span><strong>${option.id}.</strong> ${option.text}</span>
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

  const selectedId = selected.value;
  const item = questions[state.current];
  const isCorrect = selectedId === item.answer;
  state.checked = true;
  state.score += Number(isCorrect);

  answerList.querySelectorAll("input").forEach((input) => {
    input.disabled = true;
    const option = input.closest(".answer-option");
    option.classList.add("is-locked");
    if (input.value === item.answer) option.classList.add("is-correct");
    if (input.value === selectedId && !isCorrect) option.classList.add("is-wrong");
  });

  feedback.innerHTML = `
    <strong>${isCorrect ? "Jawaban benar" : "Jawaban belum tepat"}</strong>
    <span>${item.explanation.summary}</span>
    <span><strong>Alasan jawaban benar:</strong> ${item.explanation.correct}</span>
    <ul>${Object.entries(item.explanation.incorrect).map(([optionId, reason]) => `<li><strong>${optionId}.</strong> ${reason}</li>`).join("")}</ul>
  `;
  feedback.hidden = false;
  checkAnswer.hidden = true;
  nextQuestion.hidden = false;
  nextQuestion.textContent = state.current === questions.length - 1 ? "Lihat Hasil" : "Soal Berikutnya";
  nextQuestion.focus({ preventScroll: true });
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
