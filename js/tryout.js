(() => {
  const questions = Array.isArray(window.latihanPUQuestions) ? window.latihanPUQuestions : [];
  const intro = document.querySelector("#tryout-intro");
  const shell = document.querySelector("#tryout-shell");
  const result = document.querySelector("#tryout-result");
  if (!intro || !shell || !result || !questions.length) return;

  const durationSeconds = 5 * 60;
  const state = { current: 0, answers: Array(questions.length).fill(null), remaining: durationSeconds, timerId: null, finished: false };
  const answerList = document.querySelector("#answer-list");
  const questionTitle = document.querySelector("#question-title");
  const questionTopic = document.querySelector("#question-topic");
  const questionDifficulty = document.querySelector("#question-difficulty");
  const questionCounter = document.querySelector("#question-counter");
  const timer = document.querySelector("#timer-value");
  const timerBox = document.querySelector(".timer");
  const navList = document.querySelector("#question-nav-list");
  const answeredSummary = document.querySelector("#answered-summary");
  const previous = document.querySelector("#previous-question");
  const next = document.querySelector("#next-question");
  const finish = document.querySelector("#finish-tryout");

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
    const remainder = (seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainder}`;
  }

  function renderNavigation() {
    navList.innerHTML = questions.map((question, index) => `<button class="question-nav__button${index === state.current ? " is-current" : ""}${state.answers[index] ? " is-answered" : ""}" type="button" data-question-index="${index}" aria-label="Buka soal ${index + 1}" aria-current="${index === state.current ? "step" : "false"}">${index + 1}</button>`).join("");
    answeredSummary.textContent = `${state.answers.filter(Boolean).length} dari ${questions.length} dijawab`;
  }

  function renderQuestion() {
    const question = questions[state.current];
    questionTitle.textContent = question.question;
    questionTopic.textContent = question.topic;
    questionDifficulty.textContent = question.difficulty;
    questionCounter.textContent = `Soal ${state.current + 1} dari ${questions.length}`;
    answerList.innerHTML = question.options.map((option) => `<label class="answer-option" for="tryout-answer-${option.id}"><input id="tryout-answer-${option.id}" name="tryout-answer" type="radio" value="${option.id}"${state.answers[state.current] === option.id ? " checked" : ""}><span><strong>${option.id}.</strong> ${option.text}</span></label>`).join("");
    previous.disabled = state.current === 0;
    next.textContent = state.current === questions.length - 1 ? "Soal Terakhir" : "Soal Berikutnya";
    renderNavigation();
    questionTitle.focus({ preventScroll: true });
  }

  function tick() {
    state.remaining -= 1;
    timer.textContent = formatTime(Math.max(0, state.remaining));
    if (state.remaining <= 60) timerBox.classList.add("timer--urgent");
    if (state.remaining <= 0) finishTryout("Waktu habis");
  }

  function startTimer() {
    clearInterval(state.timerId);
    state.timerId = window.setInterval(tick, 1000);
  }

  function renderReview() {
    let correct = 0;
    let wrong = 0;
    let blank = 0;
    const review = questions.map((question, index) => {
      const answer = state.answers[index];
      if (!answer) blank += 1;
      else if (answer === question.answer) correct += 1;
      else wrong += 1;
      const label = answer ? `Jawabanmu: ${answer}. Kunci: ${question.answer}.` : `Belum dijawab. Kunci: ${question.answer}.`;
      const status = !answer ? "Kosong" : answer === question.answer ? "Benar" : "Salah";
      const className = !answer ? "" : answer === question.answer ? " review-item--correct" : " review-item--wrong";
      return `<article class="review-item${className}"><strong>Soal ${index + 1} · ${status}</strong><p>${label} ${question.explanation.summary}</p><p><strong>Penjelasan:</strong> ${question.explanation.correct}</p></article>`;
    }).join("");
    const score = Math.round((correct / questions.length) * 100);
    document.querySelector("#score-value").textContent = score;
    document.querySelector("#correct-count").textContent = correct;
    document.querySelector("#wrong-count").textContent = wrong;
    document.querySelector("#blank-count").textContent = blank;
    document.querySelector("#result-summary").textContent = `Kamu menjawab ${correct} dari ${questions.length} soal dengan benar.`;
    document.querySelector("#review-list").innerHTML = review;
    document.querySelector("#saved-note").textContent = "Ringkasan hasil disimpan sementara di perangkat ini. Data dapat hilang jika data situs atau browser dihapus.";
    try {
      const completedAt = new Date().toISOString();
      const entry = { type: "tryout", label: "Simulasi Tryout PU", score, correct, wrong, blank, total: questions.length, completedAt };
      const history = JSON.parse(localStorage.getItem("snbt-progress-history") || "[]");
      history.unshift(entry);
      localStorage.setItem("snbt-progress-history", JSON.stringify(history.slice(0, 50)));
      localStorage.setItem("snbt-tryout-last-result", JSON.stringify(entry));
    } catch (error) {
      document.querySelector("#saved-note").textContent = "Hasil tetap tampil selama halaman ini terbuka; penyimpanan perangkat tidak tersedia.";
    }
  }

  function finishTryout(reason) {
    if (state.finished) return;
    state.finished = true;
    clearInterval(state.timerId);
    renderReview();
    shell.hidden = true;
    result.hidden = false;
    result.querySelector("#result-title").textContent = reason === "Waktu habis" ? "Waktu tryout habis" : "Hasil tryoutmu";
    result.focus({ preventScroll: true });
  }

  document.querySelector("#start-tryout").addEventListener("click", () => {
    intro.hidden = true;
    shell.hidden = false;
    renderQuestion();
    startTimer();
  });

  answerList.addEventListener("change", (event) => {
    if (event.target.matches("input")) {
      state.answers[state.current] = event.target.value;
      renderNavigation();
    }
  });

  navList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-question-index]");
    if (!button || state.finished) return;
    state.current = Number(button.dataset.questionIndex);
    renderQuestion();
  });

  previous.addEventListener("click", () => { if (state.current > 0) { state.current -= 1; renderQuestion(); } });
  next.addEventListener("click", () => { if (state.current < questions.length - 1) { state.current += 1; renderQuestion(); } });
  finish.addEventListener("click", () => finishTryout("Selesai"));
  document.querySelector("#restart-tryout").addEventListener("click", () => window.location.reload());
})();
