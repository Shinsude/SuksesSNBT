window.latihanPUQuestions = [
  {
    id: "pu-001",
    subtest: "PU",
    topic: "Pola Bilangan",
    difficulty: "mudah",
    question: "Perhatikan pola bilangan berikut: 2, 4, 6, 8, ... Bilangan berikutnya adalah ...",
    options: [
      { id: "A", text: "9" },
      { id: "B", text: "10" },
      { id: "C", text: "11" },
      { id: "D", text: "12" }
    ],
    answer: "B",
    explanation: {
      summary: "Pola bilangan bertambah 2 pada setiap langkah.",
      correct: "B benar karena 8 + 2 = 10.",
      incorrect: {
        A: "A salah karena 9 bukan hasil penambahan 2 dari 8.",
        C: "C salah karena 11 bukan hasil penambahan 2 dari 8.",
        D: "D salah karena 12 memerlukan penambahan 4 dari 8."
      }
    }
  },
  {
    id: "pu-002",
    subtest: "PU",
    topic: "Analogi",
    difficulty: "mudah",
    question: "Buku : Membaca = Musik : ...",
    options: [
      { id: "A", text: "Menulis" },
      { id: "B", text: "Menggambar" },
      { id: "C", text: "Mendengarkan" },
      { id: "D", text: "Menghitung" }
    ],
    answer: "C",
    explanation: {
      summary: "Analogi membandingkan kegiatan yang umum dilakukan terhadap suatu objek.",
      correct: "C benar karena buku dibaca, sedangkan musik didengarkan.",
      incorrect: {
        A: "A salah karena menulis bukan kegiatan utama untuk menikmati musik.",
        B: "B salah karena menggambar tidak memiliki hubungan langsung dengan musik pada analogi ini.",
        D: "D salah karena menghitung tidak berkaitan dengan cara menikmati musik."
      }
    }
  },
  {
    id: "pu-003",
    subtest: "PU",
    topic: "Silogisme",
    difficulty: "sedang",
    question: "Semua siswa rajin membaca. Rani adalah siswa. Kesimpulan yang tepat adalah ...",
    options: [
      { id: "A", text: "Rani rajin membaca" },
      { id: "B", text: "Rani tidak suka membaca" },
      { id: "C", text: "Semua pembaca adalah siswa" },
      { id: "D", text: "Rani selalu mendapat nilai 100" }
    ],
    answer: "A",
    explanation: {
      summary: "Kesimpulan ditarik dari hubungan antara kelompok siswa dan sifat rajin membaca.",
      correct: "A benar karena Rani adalah siswa dan semua siswa rajin membaca.",
      incorrect: {
        B: "B salah karena bertentangan dengan informasi bahwa semua siswa rajin membaca.",
        C: "C salah karena premis tidak menyatakan bahwa semua pembaca adalah siswa.",
        D: "D salah karena premis tidak memberikan informasi tentang nilai Rani."
      }
    }
  },
  {
    id: "pu-004",
    subtest: "PU",
    topic: "Perbandingan",
    difficulty: "mudah",
    question: "Dina memiliki 6 pensil. Bima memiliki 2 pensil lebih banyak daripada Dina. Berapa pensil Bima?",
    options: [
      { id: "A", text: "4" },
      { id: "B", text: "6" },
      { id: "C", text: "8" },
      { id: "D", text: "12" }
    ],
    answer: "C",
    explanation: {
      summary: "Jumlah pensil Bima diperoleh dengan menambahkan 2 pada jumlah pensil Dina.",
      correct: "C benar karena 6 + 2 = 8 pensil.",
      incorrect: {
        A: "A salah karena 4 adalah hasil pengurangan 2 dari 6.",
        B: "B salah karena 6 adalah jumlah pensil Dina, bukan jumlah pensil Bima.",
        D: "D salah karena 12 merupakan hasil menggandakan 6, bukan menambahkan 2."
      }
    }
  },
  {
    id: "pu-005",
    subtest: "PU",
    topic: "Logika Pernyataan",
    difficulty: "sedang",
    question: "Jika hari ini hujan, maka lapangan basah. Hari ini hujan. Kesimpulannya adalah ...",
    options: [
      { id: "A", text: "Lapangan pasti kering" },
      { id: "B", text: "Lapangan basah" },
      { id: "C", text: "Besok pasti hujan" },
      { id: "D", text: "Tidak ada kesimpulan" }
    ],
    answer: "B",
    explanation: {
      summary: "Pernyataan bersyarat menyebutkan bahwa hujan menyebabkan lapangan basah.",
      correct: "B benar karena hari ini hujan, sehingga berdasarkan pernyataan lapangan basah.",
      incorrect: {
        A: "A salah karena bertentangan dengan akibat yang disebutkan dalam premis.",
        C: "C salah karena premis hanya membahas hari ini, bukan cuaca besok.",
        D: "D salah karena dua premis sudah cukup untuk menarik kesimpulan."
      }
    }
  }
];
