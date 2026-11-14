(() => {
  const params = new URLSearchParams(window.location.search);
  const packageId = params.get("paket");
  const packages = Array.isArray(window.latihanPackages) ? window.latihanPackages : [];
  const questions = Array.isArray(window.latihanPUQuestions) ? window.latihanPUQuestions : [];
  const selectedPackage = packages.find((item) => item.id === packageId);
  const runner = document.querySelector("#runner");
  const invalid = document.querySelector("#invalid-package");
  const breadcrumb = document.querySelector("#breadcrumb-package");

  if (!runner || !invalid) return;

  const isValid = selectedPackage?.status === "available" && selectedPackage.isAvailable;
  const packageQuestions = isValid ? selectedPackage.questionIds.map((id) => questions.find((item) => item.id === id)).filter(Boolean) : [];

  if (!isValid || packageQuestions.length !== selectedPackage?.questionIds.length) {
    invalid.hidden = false;
    invalid.innerHTML = `<strong>Paket latihan tidak tersedia.</strong><p>Paket yang kamu pilih belum siap atau tidak ditemukan. Silakan kembali ke daftar paket dan pilih paket yang tersedia.</p><a class="btn btn--primary" href="paket-latihan.html?subtest=PU">Kembali ke Paket</a>`;
    return;
  }

  runner.hidden = false;
  breadcrumb.textContent = selectedPackage.name;
  document.title = `${selectedPackage.name} — SNBT Learning Center`;

  const state = { current: 0, score: 0, answered: false };
  const questionTitle = document.querySelector("#question-title");
  const questionTopic = document.querySelector("#question-topic");
  const questionDifficulty = document.querySelector("#question-difficulty");
  const questionCounter = document.querySelector("#question-counter");
  const progressLabel = document.querySelector("#progress-label");
  const progressBar = document.querySelector("#progress-bar");
  const answerList = document.querySelector("#answer-list");
  const checkButton = document.querySelector("#check-answer");
  const nextButton = document.querySelector("#next-question");
  const feedback = document.querySelector("#feedback");
  const resultPanel = document.querySelector("#result-panel");
  const resultSummary = document.querySelector("#result-summary");
  const scoreValue = document.querySelector("#score-value");
  const correctCount = document.querySelector("#correct-count");
  const wrongCount = document.querySelector("#wrong-count");
  const blankCount = document.querySelector("#blank-count");
  const restartButton = document.querySelector("#restart-button");

  function renderQuestion() {
    const question = packageQuestions[state.current];
    const progress = Math.round((state.current / packageQuestions.length) * 100);
    questionTitle.textContent = question.question;
    questionTopic.textContent = question.topic;
    questionDifficulty.textContent = question.difficulty;
    questionCounter.textContent = `Soal ${state.current + 1} dari ${packageQuestions.length}`;
    progressLabel.textContent = `${progress}% selesai`;
    progressBar.style.width = `${progress}%`;
    answerList.innerHTML = question.options.map((option) => `<label class="answer-option" for="answer-${option.id}"><input id="answer-${option.id}" name="answer" type="radio" value="${option.id}"><span><strong>${option.id}.</strong> ${option.text}</span></label>`).join("");
    feedback.hidden = true;
    feedback.innerHTML = "";
    checkButton.hidden = false;
    checkButton.disabled = true;
    nextButton.hidden = true;
    state.answered = false;
    questionTitle.focus({ preventScroll: true });
  }

  function selectedAnswer() {
    return answerList.querySelector("input:checked")?.value;
  }

  function renderExplanation(question, isCorrect) {
    feedback.innerHTML = `<strong>${isCorrect ? "Jawaban benar." : "Jawaban belum tepat."}</strong><p>${question.explanation.summary}</p><p><strong>Mengapa kunci ini benar:</strong> ${question.explanation.correct}</p><ul>${Object.entries(question.explanation.incorrect).map(([key, reason]) => `<li><strong>${key}:</strong> ${reason}</li>`).join("")}</ul>`;
    feedback.hidden = false;
  }

  function checkAnswer() {
    const value = selectedAnswer();
    if (!value || state.answered) return;
    const question = packageQuestions[state.current];
    const isCorrect = value === question.answer;
    state.answered = true;
    if (isCorrect) state.score += 1;
    answerList.querySelectorAll("input").forEach((input) => { input.disabled = true; });
    renderExplanation(question, isCorrect);
    checkButton.hidden = true;
    nextButton.hidden = false;
    nextButton.textContent = state.current === packageQuestions.length - 1 ? "Lihat Hasil" : "Soal Berikutnya";
    nextButton.focus({ preventScroll: true });
  }

  function showResult() {
    const score = Math.round((state.score / packageQuestions.length) * 100);
    resultPanel.hidden = false;
    document.querySelector(".question-card").hidden = true;
    scoreValue.textContent = score;
    correctCount.textContent = state.score;
    wrongCount.textContent = packageQuestions.length - state.score;
    blankCount.textContent = "0";
    resultSummary.textContent = `Kamu menjawab ${state.score} dari ${packageQuestions.length} soal dengan benar.`;
    try {
      const completedAt = new Date().toISOString();
      const entry = { type: "latihan", label: selectedPackage.name, score, correct: state.score, wrong: packageQuestions.length - state.score, blank: 0, total: packageQuestions.length, completedAt };
      const history = JSON.parse(localStorage.getItem("snbt-progress-history") || "[]");
      history.unshift(entry);
      localStorage.setItem("snbt-progress-history", JSON.stringify(history.slice(0, 50)));
      if (window.SNBTProgressSync) window.SNBTProgressSync.save(entry);
    } catch (_) {}
    resultPanel.focus({ preventScroll: true });
  }

  function nextQuestion() {
    if (!state.answered) return;
    if (state.current === packageQuestions.length - 1) { showResult(); return; }
    state.current += 1;
    renderQuestion();
  }

  answerList.addEventListener("change", () => { checkButton.disabled = !selectedAnswer() || state.answered; });
  checkButton.addEventListener("click", checkAnswer);
  nextButton.addEventListener("click", nextQuestion);
  restartButton.addEventListener("click", () => { state.current = 0; state.score = 0; resultPanel.hidden = true; document.querySelector(".question-card").hidden = false; renderQuestion(); });
  renderQuestion();
})();
