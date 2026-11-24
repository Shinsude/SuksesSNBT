(() => {
  const params = new URLSearchParams(window.location.search);
  const packageId = params.get("paket");
  const bankId = params.get("bank");
  const runner = document.querySelector("#runner");
  const invalid = document.querySelector("#invalid-package");
  const breadcrumb = document.querySelector("#breadcrumb-package");
  if (!runner || !invalid) return;

  const config = window.SNBT_SUPABASE_CONFIG || {};
  const apiBase = config.url ? (config.url.endsWith("/") ? config.url.slice(0, -1) : config.url) : "";
  const apiUrl = apiBase ? apiBase + "/functions/v1/student-practice-preview" : "";
  const request = async (payload) => {
    if (!apiUrl || !config.publishableKey) throw new Error("Layanan latihan belum tersedia. Silakan coba lagi nanti.");
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: config.publishableKey },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Permintaan latihan gagal.");
    return result;
  };
  const showUnavailable = (message) => {
    invalid.hidden = false;
    invalid.replaceChildren();
    const title = document.createElement("strong");
    title.textContent = "Latihan belum tersedia.";
    const detail = document.createElement("p");
    detail.textContent = message;
    const link = document.createElement("a");
    link.className = "btn btn--primary";
    link.href = "paket-latihan.html";
    link.textContent = "Kembali ke Paket";
    invalid.append(title, detail, link);
  };

  if (bankId) {
    runPublishedBank().catch((error) => showUnavailable(error.message));
    return;
  }

  const packages = Array.isArray(window.latihanPackages) ? window.latihanPackages : [];
  const questions = Array.isArray(window.latihanQuestions) ? window.latihanQuestions : [];
  const selectedPackage = packages.find((item) => item.id === packageId);
  const isValid = selectedPackage?.status === "available" && selectedPackage.isAvailable;
  const packageQuestions = isValid ? selectedPackage.questionIds.map((id) => questions.find((item) => item.id === id)).filter(Boolean) : [];

  if (!isValid || packageQuestions.length !== selectedPackage?.questionIds.length) {
    showUnavailable("Paket yang kamu pilih belum siap atau tidak ditemukan. Silakan kembali ke daftar paket dan pilih paket yang tersedia.");
    return;
  }

  runner.hidden = false;
  breadcrumb.textContent = selectedPackage.name;
  document.title = `${selectedPackage.name} — Sukses SNBT`;
  document.querySelector("#package-subtest").textContent = selectedPackage.subject || selectedPackage.subtest;
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
  function selectedAnswer() { return answerList.querySelector("input:checked")?.value; }
  function renderExplanation(question, isCorrect) {
    feedback.innerHTML = `<strong>${isCorrect ? "Jawaban benar." : "Jawaban belum tepat."}</strong><p>${question.explanation.summary}</p><p><strong>Mengapa kunci ini benar:</strong> ${question.explanation.correct}</p><ul>${Object.entries(question.explanation.incorrect).map(([key, reason]) => `<li><strong>${key}:</strong> ${reason}</li>`).join("")}</ul>`;
    feedback.hidden = false;
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
      const entry = { type: "latihan", subtest: selectedPackage.subtest, label: selectedPackage.name, score, correct: state.score, wrong: packageQuestions.length - state.score, blank: 0, total: packageQuestions.length, completedAt };
      const history = JSON.parse(localStorage.getItem("snbt-progress-history") || "[]");
      history.unshift(entry);
      localStorage.setItem("snbt-progress-history", JSON.stringify(history.slice(0, 50)));
      if (window.SNBTProgressSync) window.SNBTProgressSync.save(entry);
    } catch (_) {}
    resultPanel.focus({ preventScroll: true });
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

  async function runPublishedBank() {
    const data = await request({ action: "question", bank_id: bankId });
    const bank = data.bank;
    const items = Array.isArray(data.questions) ? data.questions : [];
    if (!items.length) throw new Error("Bank soal ini belum memiliki soal yang siap dikerjakan.");
    runner.hidden = false;
    breadcrumb.textContent = bank.title;
    document.title = `${bank.title} — Sukses SNBT`;
    document.querySelector("#package-subtest").textContent = bank.subject || "Bank Soal";
    document.querySelector("#package-title").textContent = bank.title;
    document.querySelector("#package-description").textContent = bank.description || "Kerjakan soal dan periksa jawabanmu setelah memilih.";
    const bankState = { current: 0, score: 0, answered: false, busy: false };
    const refs = {
      title: document.querySelector("#question-title"), topic: document.querySelector("#question-topic"),
      difficulty: document.querySelector("#question-difficulty"), counter: document.querySelector("#question-counter"),
      progress: document.querySelector("#progress-label"), bar: document.querySelector("#progress-bar"),
      answers: document.querySelector("#answer-list"), check: document.querySelector("#check-answer"),
      next: document.querySelector("#next-question"), feedback: document.querySelector("#feedback"),
      result: document.querySelector("#result-panel")
    };
    const appendText = (parent, tag, value, strong = false) => {
      const node = document.createElement(tag);
      if (strong) { const b = document.createElement("strong"); b.textContent = value; node.append(b); }
      else node.textContent = value;
      parent.append(node);
      return node;
    };
    function draw() {
      const q = items[bankState.current];
      refs.title.textContent = q.prompt;
      refs.topic.textContent = bank.subject || "Bank Soal";
      refs.difficulty.textContent = q.difficulty || "Latihan";
      refs.counter.textContent = `Soal ${bankState.current + 1} dari ${items.length}`;
      const pct = Math.round(bankState.current / items.length * 100);
      refs.progress.textContent = `${pct}% selesai`;
      refs.bar.style.width = pct + "%";
      refs.answers.replaceChildren();
      q.options.forEach((option) => {
        const label = document.createElement("label"); label.className = "answer-option";
        const input = document.createElement("input"); input.type = "radio"; input.name = "answer"; input.value = option.id;
        const span = document.createElement("span");
        const strong = document.createElement("strong"); strong.textContent = option.id + ". ";
        span.append(strong, document.createTextNode(option.text));
        label.append(input, span); refs.answers.append(label);
      });
      refs.feedback.replaceChildren(); refs.feedback.hidden = true;
      refs.check.hidden = false; refs.check.disabled = true; refs.next.hidden = true;
      bankState.answered = false; bankState.busy = false;
      refs.title.focus({ preventScroll: true });
    }
    const chosen = () => refs.answers.querySelector("input:checked")?.value;
    function feedback(correct, explanation, key) {
      refs.feedback.replaceChildren();
      appendText(refs.feedback, "strong", correct ? "Jawaban benar." : "Jawaban belum tepat.");
      appendText(refs.feedback, "p", "Kunci jawaban: " + key);
      appendText(refs.feedback, "p", explanation || "Belum ada pembahasan untuk soal ini.");
      refs.feedback.hidden = false;
    }
    async function submit() {
      const answer = chosen();
      if (!answer || bankState.answered || bankState.busy) return;
      bankState.busy = true; refs.check.disabled = true;
      try {
        const result = await request({ action: "check-answer", bank_id: bank.id, question_id: items[bankState.current].id, answer });
        bankState.answered = true;
        if (result.is_correct) bankState.score += 1;
        refs.answers.querySelectorAll("input").forEach((input) => { input.disabled = true; });
        feedback(result.is_correct, result.explanation, result.correct_answer);
        refs.check.hidden = true; refs.next.hidden = false;
        refs.next.textContent = bankState.current === items.length - 1 ? "Lihat Hasil" : "Soal Berikutnya";
        refs.next.focus({ preventScroll: true });
      } catch (error) {
        appendText(refs.feedback, "p", error.message);
        refs.feedback.hidden = false; refs.check.disabled = false;
      } finally { bankState.busy = false; }
    }
    function finish() {
      const score = Math.round(bankState.score / items.length * 100);
      document.querySelector(".question-card").hidden = true;
      refs.result.hidden = false;
      document.querySelector("#score-value").textContent = score;
      document.querySelector("#correct-count").textContent = bankState.score;
      document.querySelector("#wrong-count").textContent = items.length - bankState.score;
      document.querySelector("#blank-count").textContent = "0";
      document.querySelector("#result-summary").textContent = `Kamu menjawab ${bankState.score} dari ${items.length} soal dengan benar.`;
      try {
        const completedAt = new Date().toISOString();
        const entry = { type: "latihan", subtest: bank.subject || "Bank Soal", label: bank.title, score, correct: bankState.score, wrong: items.length - bankState.score, blank: 0, total: items.length, completedAt };
        const history = JSON.parse(localStorage.getItem("snbt-progress-history") || "[]");
        history.unshift(entry); localStorage.setItem("snbt-progress-history", JSON.stringify(history.slice(0, 50)));
        if (window.SNBTProgressSync) window.SNBTProgressSync.save(entry);
      } catch (_) {}
    }
    refs.answers.addEventListener("change", () => { refs.check.disabled = !chosen() || bankState.busy; });
    refs.check.addEventListener("click", submit);
    refs.next.addEventListener("click", () => {
      if (!bankState.answered) return;
      if (bankState.current === items.length - 1) { finish(); return; }
      bankState.current += 1; draw();
    });
    document.querySelector("#restart-button").addEventListener("click", () => {
      bankState.current = 0; bankState.score = 0; refs.result.hidden = true;
      document.querySelector(".question-card").hidden = false; draw();
    });
    draw();
  }
})();
