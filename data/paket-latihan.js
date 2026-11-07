(function () {
  const availableQuestionIds = new Set(
    (window.latihanPUQuestions || []).map((question) => question.id),
  );

  const packages = [
    {
      id: "pu-dasar-1",
      subtest: "PU",
      name: "PU Dasar 1",
      description: "Latihan dasar Penalaran Umum untuk memahami pola dan logika awal.",
      difficulty: "Mudah",
      questionIds: ["pu-001", "pu-002", "pu-003", "pu-004", "pu-005"],
      status: "available",
    },
    {
      id: "pu-dasar-2",
      subtest: "PU",
      name: "PU Dasar 2",
      description: "Paket lanjutan untuk memperkuat kemampuan dasar Penalaran Umum.",
      difficulty: "Mudah–Sedang",
      questionIds: [],
      status: "preparation",
    },
    {
      id: "pu-campuran",
      subtest: "PU",
      name: "PU Campuran",
      description: "Paket campuran dengan variasi topik Penalaran Umum.",
      difficulty: "Sedang",
      questionIds: [],
      status: "preparation",
    },
  ];

  function isPracticePackageAvailable(practicePackage) {
    return (
      practicePackage.status === "available" &&
      practicePackage.questionIds.length > 0 &&
      practicePackage.questionIds.every((questionId) => availableQuestionIds.has(questionId))
    );
  }

  window.latihanPackages = packages.map((practicePackage) => ({
    ...practicePackage,
    isAvailable: isPracticePackageAvailable(practicePackage),
  }));

  window.isPracticePackageAvailable = isPracticePackageAvailable;
})();
