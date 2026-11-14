(function () {
  const questions = window.latihanQuestions || window.latihanPUQuestions || [];
  const availableQuestionIds = new Set(questions.map((question) => question.id));
  const definitions = [
    ["pu-dasar-1","PU","Penalaran Umum","PU Dasar","Latihan pola, logika, analogi, dan penarikan kesimpulan.",["pu-001","pu-002","pu-003","pu-004","pu-005"]],
    ["ppu-dasar-1","PPU","Pengetahuan dan Pemahaman Umum","PPU Dasar","Latihan makna kata, hubungan kata, dan pemahaman gagasan.",["ppu-001","ppu-002","ppu-003","ppu-004","ppu-005"]],
    ["pbm-dasar-1","PBM","Pemahaman Bacaan dan Menulis","PBM Dasar","Latihan kalimat efektif, ejaan, konjungsi, dan kepaduan paragraf.",["pbm-001","pbm-002","pbm-003","pbm-004","pbm-005"]],
    ["pk-dasar-1","PK","Pengetahuan Kuantitatif","PK Dasar","Latihan aritmetika, aljabar, perbandingan, geometri, dan statistika.",["pk-001","pk-002","pk-003","pk-004","pk-005"]],
    ["penmat-dasar-1","PenMat","Penalaran Matematika","PenMat Dasar","Latihan pemodelan, data, peluang, dan penerapan matematika.",["pm-001","pm-002","pm-003","pm-004","pm-005"]],
    ["li-dasar-1","LI","Literasi Bahasa Indonesia","Literasi Indonesia Dasar","Latihan gagasan utama, inferensi, tujuan penulis, dan evaluasi argumen.",["li-001","li-002","li-003","li-004","li-005"]],
    ["le-dasar-1","LE","Literasi Bahasa Inggris","English Literacy Basics","Practice main ideas, vocabulary, inference, reference, and purpose.",["le-001","le-002","le-003","le-004","le-005"]]
  ];
  const packages = definitions.map(([id,subtest,subject,name,description,questionIds]) => ({
    id, subtest, subject, name, description, difficulty:"Dasar–Sedang", questionIds, status:"available"
  }));
  window.latihanPackages = packages.map((practicePackage) => ({
    ...practicePackage,
    isAvailable: practicePackage.status === "available" &&
      practicePackage.questionIds.length > 0 &&
      practicePackage.questionIds.every((questionId) => availableQuestionIds.has(questionId))
  }));
  window.isPracticePackageAvailable = (practicePackage) =>
    practicePackage.status === "available" &&
    practicePackage.questionIds.length > 0 &&
    practicePackage.questionIds.every((questionId) => availableQuestionIds.has(questionId));
})();