(function () {
  const questions = window.latihanQuestions || window.latihanPUQuestions || [];
  const availableQuestionIds = new Set(questions.map((question) => question.id));
  const definitions = [
    ["pu-dasar-1","PU","Penalaran Umum","PU Dasar","Latihan pola, logika, analogi, dan penarikan kesimpulan.",["pu-001","pu-002","pu-003","pu-004","pu-005","pu-006","pu-007","pu-008","pu-009","pu-010"]],
    ["ppu-dasar-1","PPU","Pengetahuan dan Pemahaman Umum","PPU Dasar","Latihan makna kata, hubungan kata, dan pemahaman gagasan.",["ppu-001","ppu-002","ppu-003","ppu-004","ppu-005","ppu-006","ppu-007","ppu-008","ppu-009","ppu-010"]],
    ["pbm-dasar-1","PBM","Pemahaman Bacaan dan Menulis","PBM Dasar","Latihan kalimat efektif, ejaan, konjungsi, dan kepaduan paragraf.",["pbm-001","pbm-002","pbm-003","pbm-004","pbm-005","pbm-006","pbm-007","pbm-008","pbm-009","pbm-010"]],
    ["pk-dasar-1","PK","Pengetahuan Kuantitatif","PK Dasar","Latihan aritmetika, aljabar, perbandingan, geometri, dan statistika.",["pk-001","pk-002","pk-003","pk-004","pk-005","pk-006","pk-007","pk-008","pk-009","pk-010"]],
    ["penmat-dasar-1","PENMAT","Penalaran Matematika","PenMat Dasar","Latihan pemodelan, data, peluang, dan penerapan matematika.",["pm-001","pm-002","pm-003","pm-004","pm-005","pm-006","pm-007","pm-008","pm-009","pm-010"]],
    ["li-dasar-1","LI","Literasi Bahasa Indonesia","Literasi Indonesia Dasar","Latihan gagasan utama, inferensi, tujuan penulis, dan evaluasi argumen.",["li-001","li-002","li-003","li-004","li-005","li-006","li-007","li-008","li-009","li-010"]],
    ["le-dasar-1","LE","Literasi Bahasa Inggris","English Literacy Basics","Practice main ideas, vocabulary, inference, reference, and purpose.",["le-001","le-002","le-003","le-004","le-005","le-006","le-007","le-008","le-009","le-010"]],
    ["pu-pendalaman-1","PU","Penalaran Umum","PU Pendalaman","Latihan implikasi, kuantor, evaluasi argumen, susunan, dan pola bilangan.",["pu-011","pu-012","pu-013","pu-014","pu-015"]],
    ["ppu-pendalaman-1","PPU","Pengetahuan dan Pemahaman Umum","PPU Pendalaman","Latihan makna kontekstual, analogi, kohesi, istilah, dan simpulan.",["ppu-011","ppu-012","ppu-013","ppu-014","ppu-015"]],
    ["pbm-pendalaman-1","PBM","Pemahaman Bacaan dan Menulis","PBM Pendalaman","Latihan kalimat efektif, tanda baca, urutan, rujukan, dan konjungsi.",["pbm-011","pbm-012","pbm-013","pbm-014","pbm-015"]],
    ["pk-pendalaman-1","PK","Pengetahuan Kuantitatif","PK Pendalaman","Latihan sistem persamaan, peluang, rata-rata gabungan, geometri, dan perbandingan.",["pk-011","pk-012","pk-013","pk-014","pk-015"]],
    ["penmat-pendalaman-1","PENMAT","Penalaran Matematika","PenMat Pendalaman","Latihan model linear, persentase, kecepatan, data, dan kapasitas.",["pm-011","pm-012","pm-013","pm-014","pm-015"]],
    ["li-pendalaman-1","LI","Literasi Bahasa Indonesia","Literasi Indonesia Pendalaman","Latihan inferensi, evaluasi bukti, simpulan, sikap penulis, dan ungkapan.",["li-011","li-012","li-013","li-014","li-015"]],
    ["le-pendalaman-1","LE","Literasi Bahasa Inggris","English Literacy Practice","Practice main ideas, inference, vocabulary, reference, and author purpose.",["le-011","le-012","le-013","le-014","le-015"]]
  ];
  const packages = definitions.map(([id,subtest,subject,name,description,questionIds]) => ({
    id, subtest, subject, name, description, difficulty: id.includes("pendalaman") ? "Menengah–Sulit" : "Dasar–Sedang", questionIds, status:"available"
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