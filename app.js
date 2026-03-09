/* ═══════════════════════════════════════
   ScanRupiah · app.js
   Scan uang rupiah dengan Claude AI Vision
═══════════════════════════════════════ */

// ── Elemen DOM ─────────────────────────
const videoEl         = document.getElementById('videoEl');
const canvasEl        = document.getElementById('canvasEl');
const snapBtn         = document.getElementById('snapBtn');
const closeCameraBtn  = document.getElementById('closeCameraBtn');
const switchCamBtn    = document.getElementById('switchCamBtn');
const cameraModal     = document.getElementById('cameraModal');
const loadingOverlay  = document.getElementById('loadingOverlay');
const resultCard      = document.getElementById('resultCard');
const resultNominal   = document.getElementById('resultNominal');
const resultDesc      = document.getElementById('resultDesc');
const resultBadge     = document.getElementById('resultBadge');
const confBar         = document.getElementById('confBar');
const confLabel       = document.getElementById('confLabel');
const speakBtn        = document.getElementById('speakBtn');
const repeatBtn       = document.getElementById('repeatBtn');
const errorCard       = document.getElementById('errorCard');
const errorMsg        = document.getElementById('errorMsg');
const fileInput       = document.getElementById('fileInput');
const cameraInputFallback = document.getElementById('cameraInputFallback');
const previewImg      = document.getElementById('previewImg');
const scanIconWrap    = document.getElementById('scanIconWrap');
const scanZoneBtn     = document.getElementById('scanZoneBtn');
const cameraBtnLive   = document.getElementById('cameraBtnLive');
const galleryBtn      = document.getElementById('galleryBtn');
const announcement    = document.getElementById('announcement');

// ── State ──────────────────────────────
let stream         = null;
let useFrontCam    = false;
let lastResultText = '';
let currentDeviceIndex = 0;

// ── Helpers ────────────────────────────
function announce(msg) {
  announcement.textContent = '';
  requestAnimationFrame(() => { announcement.textContent = msg; });
}

function showLoading(show) {
  loadingOverlay.classList.toggle('active', show);
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorCard.classList.add('visible');
  resultCard.classList.remove('visible');
  announce('Error: ' + msg);
}

function hideError() {
  errorCard.classList.remove('visible');
}

// ── Kamera ─────────────────────────────
async function openCamera() {
  hideError();
  try {
    // Coba akses kamera
    const constraints = {
      video: {
        facingMode: useFrontCam ? 'user' : { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoEl.srcObject = stream;
    await videoEl.play();
    cameraModal.classList.add('active');
    snapBtn.focus();
    announce('Kamera terbuka. Arahkan ke uang lalu ketuk tombol foto.');
  } catch (err) {
    console.error('Kamera error:', err);
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      showError('Izin kamera ditolak. Mohon izinkan akses kamera di pengaturan browser.');
    } else if (err.name === 'NotFoundError') {
      showError('Tidak ada kamera ditemukan. Coba gunakan galeri foto.');
    } else {
      // Fallback ke input kamera HTML
      cameraInputFallback.click();
    }
  }
}

function closeCamera() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  videoEl.srcObject = null;
  cameraModal.classList.remove('active');
  cameraBtnLive.focus();
  announce('Kamera ditutup.');
}

async function switchCamera() {
  useFrontCam = !useFrontCam;
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: useFrontCam ? 'user' : { ideal: 'environment' } }
    });
    videoEl.srcObject = stream;
    await videoEl.play();
    announce(useFrontCam ? 'Kamera depan aktif.' : 'Kamera belakang aktif.');
  } catch {
    showError('Gagal mengganti kamera.');
  }
}

// ── Ambil Foto dari Video ──────────────
function captureFromVideo() {
  canvasEl.width  = videoEl.videoWidth  || 640;
  canvasEl.height = videoEl.videoHeight || 480;
  const ctx = canvasEl.getContext('2d');
  ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
  return canvasEl.toDataURL('image/jpeg', 0.85);
}

// ── Konversi File ke Base64 ────────────
function fileToBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload  = e => res(e.target.result);
    reader.onerror = () => rej(new Error('Gagal membaca file'));
    reader.readAsDataURL(file);
  });
}

// ── Set Preview ────────────────────────
function setPreview(dataUrl) {
  previewImg.src = dataUrl;
  previewImg.style.display = 'block';
  scanIconWrap.style.display = 'none';
}

// ── Analisis dengan Claude AI ──────────
async function analyzeImage(base64DataUrl) {
  // Pisahkan prefix dari data base64
  const parts    = base64DataUrl.split(',');
  const mimeType = parts[0].match(/:(.*?);/)[1]; // e.g. "image/jpeg"
  const b64data  = parts[1];

  const prompt = `Kamu adalah sistem deteksi uang kertas rupiah Indonesia yang sangat akurat dan membantu penyandang tunanetra.

Analisis gambar ini dan tentukan:
1. Apakah ini foto uang kertas rupiah Indonesia? (ya/tidak)
2. Jika ya, berapa nominalnya?
3. Seberapa yakin kamu? (persentase 0-100)
4. Kondisi uang: bersih/lusuh/terlipat/dll
5. Sisi mana yang terlihat: depan/belakang/tidak jelas

Balas HANYA dengan format JSON berikut (tanpa markdown, tanpa penjelasan lain):
{
  "detected": true,
  "nominal": "Rp 50.000",
  "nominal_angka": 50000,
  "confidence": 92,
  "kondisi": "bersih",
  "sisi": "depan",
  "deskripsi": "Uang kertas lima puluh ribu rupiah. Bergambar I Gusti Ngurah Rai. Warna dominan biru."
}

Jika bukan uang rupiah atau gambar tidak jelas, isi detected: false dan jelaskan di deskripsi.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType, data: b64data }
          },
          { type: 'text', text: prompt }
        ]
      }]
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.content.map(c => c.text || '').join('');

  // Parse JSON dari response
  let parsed;
  try {
    // Bersihkan markdown code fence jika ada
    const clean = rawText.replace(/```json|```/gi, '').trim();
    // Cari blok JSON pertama
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Format tidak valid');
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error('AI memberikan respons yang tidak dapat diproses. Coba lagi.');
  }

  return parsed;
}

// ── Tampilkan Hasil ────────────────────
function showResult(result) {
  hideError();

  if (!result.detected) {
    showError(result.deskripsi || 'Uang tidak terdeteksi. Pastikan foto jelas dan pencahayaan cukup.');
    return;
  }

  const nominal    = result.nominal      || 'Tidak diketahui';
  const desc       = result.deskripsi    || '';
  const conf       = Math.min(100, Math.max(0, result.confidence || 0));
  const kondisi    = result.kondisi      || '';
  const sisi       = result.sisi         || '';

  resultNominal.textContent = nominal;
  resultDesc.textContent    = [desc, kondisi ? `Kondisi: ${kondisi}` : '', sisi ? `Sisi: ${sisi}` : '']
    .filter(Boolean).join('\n');
  resultBadge.textContent   = '✓ Terdeteksi';

  // Progress bar keyakinan
  setTimeout(() => {
    confBar.style.width = conf + '%';
    confLabel.textContent = conf + '%';
  }, 50);

  resultCard.classList.add('visible');
  resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  resultCard.focus();

  // Teks untuk diucapkan
  lastResultText = `Terdeteksi ${nominal}. ${desc}. Tingkat keyakinan ${conf} persen.`;
  announce(lastResultText);

  // Auto-speak
  setTimeout(() => speakText(lastResultText), 600);
}

// ── Text to Speech ─────────────────────
function speakText(text) {
  if (!('speechSynthesis' in window)) {
    showVolumeBadge('🔇 TTS tidak didukung');
    return;
  }
  window.speechSynthesis.cancel();
  const utt  = new SpeechSynthesisUtterance(text);
  utt.lang   = 'id-ID';
  utt.rate   = 0.95;
  utt.pitch  = 1;

  // Pilih suara bahasa Indonesia jika ada
  const voices = window.speechSynthesis.getVoices();
  const idVoice = voices.find(v => v.lang.startsWith('id'));
  if (idVoice) utt.voice = idVoice;

  window.speechSynthesis.speak(utt);
  showVolumeBadge('🔊 Membacakan hasil...');
}

function showVolumeBadge(msg) {
  let badge = document.querySelector('.volume-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.className = 'volume-badge';
    document.body.appendChild(badge);
  }
  badge.textContent = msg;
  badge.style.display = 'flex';
  clearTimeout(badge._timer);
  badge._timer = setTimeout(() => { badge.style.display = 'none'; }, 2500);
}

// ── Proses Gambar (main flow) ──────────
async function processImage(dataUrl) {
  setPreview(dataUrl);
  showLoading(true);
  hideError();
  resultCard.classList.remove('visible');

  try {
    const result = await analyzeImage(dataUrl);
    showResult(result);
  } catch (err) {
    console.error('Analisis error:', err);
    showError('Gagal menganalisis: ' + (err.message || 'Coba lagi.'));
  } finally {
    showLoading(false);
  }
}

// ── Event Listeners ────────────────────

// Tombol "Buka Kamera"
cameraBtnLive.addEventListener('click', openCamera);

// Scan zone juga buka kamera
scanZoneBtn.addEventListener('click', openCamera);

// Galeri
galleryBtn.addEventListener('click', () => fileInput.click());

// File input (galeri)
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const dataUrl = await fileToBase64(file);
    await processImage(dataUrl);
  } catch {
    showError('Gagal membaca gambar dari galeri.');
  }
  fileInput.value = '';
});

// Fallback camera input
cameraInputFallback.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const dataUrl = await fileToBase64(file);
    await processImage(dataUrl);
  } catch {
    showError('Gagal membaca gambar dari kamera.');
  }
  cameraInputFallback.value = '';
});

// Snap (ambil foto dari kamera live)
snapBtn.addEventListener('click', async () => {
  const dataUrl = captureFromVideo();
  closeCamera();
  await processImage(dataUrl);
});

// Tutup kamera
closeCameraBtn.addEventListener('click', closeCamera);

// Ganti kamera
switchCamBtn.addEventListener('click', switchCamera);

// Bacakan hasil
speakBtn.addEventListener('click', () => {
  if (lastResultText) speakText(lastResultText);
});

// Ulangi suara
repeatBtn.addEventListener('click', () => {
  if (lastResultText) speakText(lastResultText);
});

// Tutup kamera dengan Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && cameraModal.classList.contains('active')) {
    closeCamera();
  }
});

// Muat suara TTS saat halaman siap
if ('speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    window.speechSynthesis.getVoices(); // cache voices
  });
}

// ── Selamat datang ─────────────────────
window.addEventListener('load', () => {
  setTimeout(() => {
    announce('ScanRupiah siap digunakan. Ketuk Buka Kamera untuk memindai uang.');
  }, 500);
});
