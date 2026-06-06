// ============================================================
// DATA MATERI PUISI (tidak perlu diedit)
// ============================================================
const topicsData = [
    {
        id: "pengertian",
        title: "Pengertian Puisi",
        icon: "fas fa-book-open",
        shortDesc: "Apa itu puisi?",
        explanation: `<p><strong>Puisi</strong> adalah salah satu jenis karya sastra yang mengungkapkan pikiran dan perasaan penyair secara imajinatif dan tersusun dengan konsentrasi kekuatan bahasa. Puisi memperhatikan irama, rima, diksi, dan majas untuk membangun suasana serta makna mendalam.</p>
                      <p>Ciri khas puisi: bahasa yang padat, kaya makna, dan penuh imaji. Puisi berbeda dengan prosa karena menggunakan baris-baris (larik) dan bait.</p>
                      <div style="background:#faf1e9; padding:1rem; border-radius:1rem; margin-top:1rem;"><i class="fas fa-quote-left"></i> "Puisi adalah jendela yang membuka langit dan bumi sekaligus."</div>`
    },
    {
        id: "unsur",
        title: "Unsur Puisi",
        icon: "fas fa-puzzle-piece",
        shortDesc: "Struktur pembangun puisi",
        explanation: `<p>Unsur puisi terbagi menjadi <strong>struktur fisik</strong> dan <strong>struktur batin</strong>.</p>
                      <ul style="margin-left:1.5rem; margin-top:0.5rem;">
                        <li><strong>Struktur Fisik:</strong> Diksi (pilihan kata), imaji, kata konkret, gaya bahasa/majas, rima/ritme, tipografi.</li>
                        <li><strong>Struktur Batin:</strong> Tema/makna, rasa (feeling), nada (tone), amanat (pesan).</li>
                      </ul>
                      <p>Kedua unsur ini saling terkait untuk menghadirkan pengalaman estetik yang kuat.</p>`
    },
    {
        id: "jenis",
        title: "Jenis-Jenis Puisi",
        icon: "fas fa-layer-group",
        shortDesc: "Beragam bentuk puisi",
        explanation: `<p>Berdasarkan zamannya, puisi dibedakan menjadi <strong>puisi lama</strong> dan <strong>puisi baru</strong>.</p>
                      <p><strong>Puisi lama:</strong> pantun, syair, gurindam, talibun. Ciri: terikat aturan jumlah baris, suku kata, dan rima.</p>
                      <p><strong>Puisi baru:</strong> soneta, ode, elegi, balada, epigram, romance. Ciri: lebih bebas dan ekspresif.</p>
                      <p>Sedangkan berdasarkan isi dikenal pula puisi naratif, lirik, dan deskriptif.</p>`
    },
    {
        id: "majas",
        title: "Majas dalam Puisi",
        icon: "fas fa-palette",
        shortDesc: "Gaya bahasa puitis",
        explanation: `<p>Majas (gaya bahasa) memperindah puisi dan memberikan efek imajinasi. Beberapa yang sering muncul:</p>
                      <ul>
                        <li><strong>Personifikasi:</strong> Memberi sifat manusia pada benda mati. Contoh: "Ombak berbisik di tepian."</li>
                        <li><strong>Metafora:</strong> Perbandingan langsung. Contoh: "Rambutnya adalah mahkota malam."</li>
                        <li><strong>Hiperbola:</strong> Melebih-lebihkan. Contoh: "Hatiku hancur sejuta kali."</li>
                        <li><strong>Simile:</strong> Perbandingan dengan kata bagaikan/laksana.</li>
                      </ul>
                      <p>Penggunaan majas yang tepat membuat puisi lebih hidup dan menggugah.</p>`
    },
    {
        id: "apresiasi",
        title: "Apresiasi Puisi",
        icon: "fas fa-heart",
        shortDesc: "Cara menikmati & menganalisis",
        explanation: `<p>Apresiasi puisi adalah kegiatan menghayati dan memahami nilai-nilai keindahan dalam puisi. Langkah-langkahnya:</p>
                      <ol style="margin-left:1.5rem;">
                        <li>Membaca puisi secara berulang dengan ekspresi.</li>
                        <li>Memahami makna kata sulit (diksi).</li>
                        <li>Menemukan tema dan amanat.</li>
                        <li>Menganalisis majas dan irama.</li>
                        <li>Memberikan interpretasi pribadi serta menikmati efek emosional.</li>
                      </ol>
                      <p>Apresiasi membuat kita merasakan getaran batin yang disampaikan penyair.</p>`
    }
];

// ============================================================
// DOM ELEMENTS
// ============================================================
const topicsGrid = document.getElementById('topicsGrid');
const explanationTitle = document.getElementById('explanationTitle');
const explanationContent = document.getElementById('explanationContent');
const closeExplanationBtn = document.getElementById('closeExplanation');
const backBtn = document.getElementById('backBtn');
const extraBtn = document.getElementById('extraBtn');

// State untuk riwayat topik
let topicHistory = [];
let currentTopicId = null;

// ============================================================
// RENDER KARTU TOPIK
// ============================================================
function renderTopics() {
    topicsGrid.innerHTML = '';
    topicsData.forEach(topic => {
        const card = document.createElement('div');
        card.className = 'topic-card';
        card.setAttribute('data-id', topic.id);
        card.innerHTML = `
            <div class="topic-icon"><i class="${topic.icon}"></i></div>
            <h3>${topic.title}</h3>
            <p>${topic.shortDesc}</p>
        `;
        card.addEventListener('click', (e) => {
            e.stopPropagation();
            showExplanation(topic.id);
        });
        topicsGrid.appendChild(card);
    });
}

// ============================================================
// MENAMPILKAN PENJELASAN UTAMA
// ============================================================
function showExplanation(topicId) {
    const topic = topicsData.find(t => t.id === topicId);
    if (!topic) return;

    if (currentTopicId !== null && currentTopicId !== topicId) {
        topicHistory.push(currentTopicId);
        if (topicHistory.length > 15) topicHistory.shift();
    }

    explanationTitle.innerHTML = `<i class="${topic.icon}" style="margin-right: 8px;"></i> ${topic.title}`;
    explanationContent.innerHTML = topic.explanation;
    currentTopicId = topic.id;

    const explanationArea = document.getElementById('explanationArea');
    explanationArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================
// FUNGSI KHUSUS UNTUK TOMBOL "KEMBALI KE TOPIK SEBELUMNYA"
// ============================================================
function goToPreviousTopic() {
    if (topicHistory.length === 0) {
        explanationContent.innerHTML = `<p><i class="fas fa-info-circle"></i> Belum ada topik sebelumnya yang dikunjungi. Klik salah satu materi terlebih dahulu.</p>
                                        <div class="placeholder-icon"><i class="fas fa-feather-alt"></i></div>`;
        explanationTitle.innerHTML = '📜 Belum ada riwayat';
        currentTopicId = null;
        return;
    }
    const previousId = topicHistory.pop();
    const previousTopic = topicsData.find(t => t.id === previousId);
    if (previousTopic) {
        explanationTitle.innerHTML = `<i class="${previousTopic.icon}" style="margin-right: 8px;"></i> ${previousTopic.title}`;
        explanationContent.innerHTML = previousTopic.explanation;
        currentTopicId = previousTopic.id;
    }
}

// ============================================================
// ============================================================
// !!! AREA EDIT TAUTAN - UBAH SESUAI KEBUTUHAN ANDA !!!
// ============================================================
// ============================================================

// ------------------------------------------------------------
// TOMBOL 1 (backBtn) - Tombol "Kembali" (icon panah kiri)
// Saat ini: kembali ke halaman browser sebelumnya
// 
// CARA EDIT: Ganti "window.history.back()" dengan URL tujuan
// Contoh: window.location.href = "https://www.google.com"
//         window.location.href = "index.html"
//         window.location.href = "beranda.html"
// ------------------------------------------------------------
backBtn.addEventListener('click', () => {
    // ========== EDIT DI SINI (BARIS INI) ==========
    window.location.href = "https://bollen.sija-smkn11malang.my.id";  // <--- GANTI baris ini dengan URL tujuan Anda
    // ==============================================
    
    /* Contoh-contoh penggantian (hapus tanda // pada salah satu):
    
    // Opsi 1: Kembali ke halaman beranda/index
    // window.location.href = "index.html";
    
    // Opsi 2: Kembali ke URL eksternal
    // window.location.href = "https://www.google.com";
    
    // Opsi 3: Kembali ke halaman tertentu
    // window.location.href = "beranda.html";
    
    // Opsi 4: Refresh halaman saat ini
    // location.reload();
    
    // Opsi 5: Muncul alert dulu baru kembali
    // if(confirm("Yakin ingin kembali?")) {
    //     window.history.back();
    // }
    */
});

// ------------------------------------------------------------
// TOMBOL 2 (extraBtn) - Tombol "Kembali ke Topik Sebelumnya"
// Saat ini: kembali ke materi puisi yang sebelumnya diklik
//
// CARA EDIT: Ganti "goToPreviousTopic()" dengan URL/aksi yang diinginkan
// ------------------------------------------------------------
extraBtn.addEventListener('click', () => {
    // ========== EDIT DI SINI (BARIS INI) ==========
    goToPreviousTopic();  // <--- GANTI baris ini dengan URL/aksi tujuan Anda
    // ===============================================
    
    /* Contoh-contoh penggantian (hapus tanda // pada salah satu):
    
    // Opsi 1: Kembali ke halaman beranda
    // window.location.href = "index.html";
    
    // Opsi 2: Kembali ke URL tertentu
    // window.location.href = "https://www.google.com";
    
    // Opsi 3: Menampilkan topik secara acak
    // const randomIndex = Math.floor(Math.random() * topicsData.length);
    // showExplanation(topicsData[randomIndex].id);
    
    // Opsi 4: Scroll ke atas halaman
    // window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Opsi 5: Refresh halaman
    // location.reload();
    */
});

// ============================================================
// TOMBOL CLOSE (Tidak perlu diedit)
// ============================================================
closeExplanationBtn.addEventListener('click', () => {
    explanationTitle.innerHTML = '✨ Penjelasan Puisi';
    explanationContent.innerHTML = `<p>Klik salah satu topik puisi di atas untuk menampilkan penjelasan lengkapnya di sini.</p>
                                    <div class="placeholder-icon"><i class="fas fa-hand-pointer"></i></div>`;
    currentTopicId = null;
});

// ============================================================
// INITIALISASI
// ============================================================
renderTopics();

console.log("Website puisi interaktif siap - Edit tautan di baris 130 dan 161 pada file script.js");