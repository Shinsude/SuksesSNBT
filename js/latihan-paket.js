(() => {
  const params = new URLSearchParams(window.location.search);
  const packageId = params.get("paket");
  const packages = Array.isArray(window.latihanPackages) ? window.latihanPackages : [];
  const questions = Array.isArray(window.latihanQuestions) ? window.latihanQuestions : [];
  const selectedPackage = packages.find((item) => item.id === packageId);
  const runner = document.querySelector("#runner");
  const invalid = document.querySelector("#invalid-package");
  const breadcrumb = document.querySelector("#breadcrumb-package");

  if (!runner || !invalid) return;

  const databaseBankId = params.get("bank");
  if (databaseBankId) {
    (async () => {
      const config = window.SNBT_SUPABASE_CONFIG || {};
      const apiUrl = config.url ? config.url.replace(/\\/$/, "") + "/functions/v1/student-practice-preview" : "";
      const apiHeaders = { "Content-Type": "application/json", apikey: config.publishableKey || "" };
      const request = async (payload) => {
        const response = await fetch(apiUrl, { method: "POST", headers: apiHeaders, body: JSON.stringify(payload) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Layanan latihan tidak dapat dihubungi.");
        return result;
      };
      const showError = (message) => {
        invalid.hidden = false;
        invalid.replaceChildren();
        const strong = document.createElement("strong");
        strong.textContent = "Latihan belum dapat dibuka.";
        const paragraph = document.createElement("p");
        paragraph.textContent = message;
        const link = document.createElement("a");
        link.className = "btn btn--primary";
        link.href = "paket-latihan.html?subtest=PU";
        link.textContent = "Kembali ke Paket";
        invalid.append(strong, paragraph, link);
      };
      try {
        if (!apiUrl || !config.publishableKey) throw new Error("Konfigurasi layanan belum tersedia. Muat ulang halaman beberapa saat lagi.");
        const result = await request({ action: "question", bank_id: databaseBankId });
        const bank = result.bank;
        const questions = result.questions || [];
        if (!bank || !questions.length) throw new Error("Bank soal ini belum memiliki soal yang siap dikerjakan.");
        runner.hidden = false;
        breadcrumb.textContent = bank.title;
        document.title = bank.title + " — Sukses SNBT";
        document.querySelector("#package-subtest").textContent = bank.subject || "SNBT";
        document.querySelector("#package-title").textContent = bank.title;
        document.querySelector("#package-description").textContent = bank.description || "Kerjakan soal dan periksa pembahasan setelah menjawab.";
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
        const renderQuestion = () => {
          const question = questions[state.current];
          questionTitle.textContent = question.prompt;
          questionTopic.textContent = bank.subject || "Latihan";
          questionDifficulty.textContent = question.difficulty || "Umum";
          questionCounter.textContent = "Soal " + (state.current + 1) + " dari " + questions.length;
          const progress = Math.round((state.current / questions.length) * 100);
          progressLabel.textContent = progress + "% selesai";
          progressBar.style.width = progress + "%";
          answerList.querySelectorAll("label.answer-option").forEach((node) => node.remove());
          question.options.forEach((option) => {
            const label = document.createElement("label");
            label.className = "answer-option";
            const input = document.createElement("input");
            input.type = "radio";
            input.name = "answer";
            input.value = option.id;
            const span = document.createElement("span");
            const strong = document.createElement("strong");
            strong.textContent = option.id + ". ";
            span.append(strong, document.createTextNode(option.text));
            label.append(input, span);
            answerList.append(label);
          });
          feedback.hidden = true;
          feedback.textContent = "";
          checkButton.hidden = false;
          checkButton.disabled = true;
          nextButton.hidden = true;
          state.answered = false;
          questionTitle.focus({ preventScroll: true });
        };
        const selectedAnswer = () => answerList.querySelector("input:checked")?.value;
        answerList.addEventListener("change", () => { checkButton.disabled = !selectedAnswer() || state.answered; });
        checkButton.addEventListener("click", async () => {
          const answer = selectedAnswer();
          if (!answer || state.answered) return;
          checkButton.disabled = true;
          checkButton.textContent = "Memeriksa...";
          try {
            const checked = await request({ action: "check-answer", bank_id: databaseBankId, question_id: questions[state.current].id, answer });
            state.answered = true;
            if (checked.is_correct) state.score += 1;
            answerList.querySelectorAll("input").forEach((input) => { input.disabled = true; });
            feedback.replaceChildren();
            const heading = document.createElement("strong");
            heading.textContent = checked.is_correct ? "Jawaban benar." : "Jawaban belum tepat. Kunci: " + checked.correct_answer;
            const explanation = document.createElement("p");
            explanation.textContent = checked.explanation || "Belum ada pembahasan untuk soal ini.";
            feedback.append(heading, explanation);
            feedback.hidden = false;
            checkButton.hidden = true;
            nextButton.hidden = false;
            nextButton.textContent = state.current === questions.length - 1 ? "Lihat Hasil" : "Soal Berikutnya";
            nextButton.focus({ preventScroll: true });
          } catch (error) {
            feedback.textContent = error.message || "Jawaban gagal diperiksa. Silakan coba lagi.";
            feedback.hidden = false;
            checkButton.disabled = false;
          } finally {
            checkButton.textContent = "Periksa Jawaban";
          }
        });
        const showResult = () => {
          const score = Math.round((state.score / questions.length) * 100);
          resultPanel.hidden = false;
          document.querySelector(".question-card").hidden = true;
          scoreValue.textContent = score;
          correctCount.textContent = state.score;
          wrongCount.textContent = questions.length - state.score;
          blankCount.textContent = "0";
          resultSummary.textContent = "Kamu menjawab " + state.score + " dari " + questions.length + " soal dengan benar.";
          try {
            const completedAt = new Date().toISOString();
            const entry = { type: "latihan", subtest: bank.subject || "SNBT", label: bank.title, score, correct: state.score, wrong: questions.length - state.score, blank: 0, total: questions.length, completedAt };
            const history = JSON.parse(localStorage.getItem("snbt-progress-history") || "[]");
            history.unshift(entry);
            localStorage.setItem("snbt-progress-history", JSON.stringify(history.slice(0, 50)));
            if (window.SNBTProgressSync) window.SNBTProgressSync.save(entry);
          } catch (_) {}
          resultPanel.focus({ preventScroll: true });
        };
        nextButton.addEventListener("click", () => {
          if (!state.answered) return;
          if (state.current === questions.length - 1) { showResult(); return; }
          state.current += 1;
          renderQuestion();
        });
        restartButton.addEventListener("click", () => {
          state.current = 0; state.score = 0; resultPanel.hidden = true;
          document.querySelector(".question-card").hidden = false;
          renderQuestion();
        });
        renderQuestion();
      } catch (error) {
        showError(error.message || "Terjadi kesalahan saat memuat bank soal.");
      }
    })();
    return;
  }

  const isValid = selectedPackage?.status === "available" && selectedPackage.isAvailable;
  const packageQuestions = isValid ? selectedPackage.questionIds.map((id) => questions.find((item) => item.id === id)).filter(Boolean) : [];

  if (!isValid || packageQuestions.length !== selectedPackage?.questionIds.length) {
    invalid.hidden = false;
    invalid.innerHTML = `<strong>Paket latihan tidak tersedia.</strong><p>Paket yang kamu pilih belum siap atau tidak ditemukan. Silakan kembali ke daftar paket dan pilih paket yang tersedia.</p><a class="btn btn--primary" href="paket-latihan.html?subtest=PU">Kembali ke Paket</a>`;
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
      const entry = { type: "latihan", subtest: selectedPackage.subtest, label: selectedPackage.name, score, correct: state.score, wrong: packageQuestions.length - state.score, blank: 0, total: packageQuestions.length, completedAt };
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
