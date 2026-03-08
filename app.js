/**
 * ScanRupiah · app.js
 * Kamera langsung (getUserMedia) + galeri + Claude AI (Haiku)
 */

// ── State ─────────────────────────────────────────────────
let currentResultText = '';
let isSpeaking        = false;
let stream            = null;
let facingMode        = 'environment';

// ── Elements ──────────────────────────────────────────────
const $ = id => document.getElementById(id);

const fileInput        = $('fileInput');
const cameraInputFb    = $('cameraInputFallback');
const galleryBtn       = $('galleryBtn');
const cameraBtnLive    = $('cameraBtnLive');
const repeatBtn        = $('repeatBtn');
const scanZoneBtn      = $('scanZoneBtn');
const previewImg       = $('previewImg');
const scanIconWrap     = $('scanIconWrap');
const loadingOverlay   = $('loadingOverlay');
const resultCard       = $('resultCard');
const resultNominal    = $('resultNominal');
const resultDesc       = $('resultDesc');
const confBar          = $('confBar');
const confLabel        = $('confLabel');
const speakBtn         = $('speakBtn');
const errorCard        = $('errorCard');
const errorMsg         = $('errorMsg');
const announcement     = $('announcement');
const cameraModal      = $('cameraModal');
const videoEl          = $('videoEl');
const snapBtn          = $('snapBtn');
const closeCameraBtn   = $('closeCameraBtn');
const switchCamBtn     = $('switchCamBtn');
const canvasEl         = $('canvasEl');

// ── Events ────────────────────────────────────────────────
galleryBtn.addEventListener('click',     () => fileInput.click());
fileInput.addEventListener('change',     e  => handleFile(e.target.files[0]));
cameraInputFb.addEventListener('change', e  => handleFile(e.target.files[0]));
cameraBtnLive.addEventListener('click',  openCamera);
scanZoneBtn.addEventListener('click',    openCamera);
snapBtn.addEventListener('click',        capturePhoto);
closeCameraBtn.addEventListener('click', closeCamera);
switchCamBtn.addEventListener('click',   switchCamera);
speakBtn.addEventListener('click',       () => speakText(currentResultText));
repeatBtn.addEventListener('click',      () => speakText(currentResultText));

document.addEventListener('keydown', e => {
  if (e.code === 'Escape') closeCamera();
  if (e.code === 'Space' && document.activeElement === snapBtn) {
    e.preventDefault(); capturePhoto();
  }
});

// ── Kamera Langsung ───────────────────────────────────────
async function openCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    cameraInputFb.click(); return;
  }
  try {
    if (stream) stopStream();
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });
    videoEl.srcObject = stream;
    await videoEl.play();
    cameraModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    announce('Kamera terbuka. Arahkan ke uang lalu ketuk Ambil Foto.');
    speakText('Kamera terbuka. Arahkan ke uang lalu ketuk Ambil Foto.');
    snapBtn.focus();
  } catch (err) {
    if (err.name === 'NotAllowedError') {
      showError('Izin kamera ditolak. Gunakan tombol Galeri atau izinkan akses kamera di browser.');
      speakText('Izin kamera ditolak. Gunakan tombol Galeri.');
    } else {
      cameraInputFb.click();
    }
  }
}

async function switchCamera() {
  facingMode = facingMode === 'environment' ? 'user' : 'environment';
  stopStream();
  await openCamera();
}

function closeCamera() {
  stopStream();
  cameraModal.classList.remove('active');
  document.body.style.overflow = '';
}

function stopStream() {
  stream?.getTracks().forEach(t => t.stop());
  stream = null;
  videoEl.srcObject = null;
}

function capturePhoto() {
  const w = videoEl.videoWidth  || 640;
  const h = videoEl.videoHeight || 480;
  canvasEl.width  = w;
  canvasEl.height = h;
  canvasEl.getContext('2d').drawImage(videoEl, 0, 0, w, h);
  canvasEl.toBlob(blob => {
    if (!blob) { showError('Gagal mengambil foto. Coba lagi.'); return; }
    closeCamera();
    handleFile(new File([blob], 'uang.jpg', { type: 'image/jpeg' }));
  }, 'image/jpeg', 0.92);
}

// ── Handle File ───────────────────────────────────────────
async function handleFile(file) {
  if (!file) return;

  previewImg.src             = URL.createObjectURL(file);
  previewImg.style.display   = 'block';
  scanIconWrap.style.display = 'none';

  hideError(); hideResult(); showLoading();
  announce('Foto diterima. Sedang menganalisis...');
  speakText('Foto diterima. Sedang menganalisis, mohon tunggu.');

  try {
    const base64 = await compressAndEncode(file);
    const result = await analyzeMoneyWithAI(base64);
    hideLoading();
    showResult(result);
  } catch (err) {
    hideLoading();
    showError(err.message || 'Gagal menganalisis. Coba lagi.');
  }
}

// ── Kompres Gambar (maks 800px, quality 0.75) ─────────────
function compressAndEncode(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 800;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else       { w = Math.round(w * MAX / h); h = MAX; }
      }
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.75).split(',')[1]);
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ── Claude AI (Haiku - cepat) ─────────────────────────────
async function analyzeMoneyWithAI(base64Data) {
  const prompt = `Identifikasi uang Rupiah Indonesia di gambar ini. Balas HANYA JSON tanpa teks lain:
Jika uang: {"isValid":true,"nominal":"Rp50.000","jenis":"Uang Kertas","kondisi":"Baik","keyakinan":95,"deskripsi":"singkat","ucapan":"Ini uang lima puluh ribu rupiah."}
Jika bukan: {"isValid":false,"pesan":"alasan singkat","ucapan":"pesan untuk tunanetra"}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Data } },
          { type: 'text',  text: prompt }
        ]
      }]
    })
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error?.message || `Error ${res.status}`);
  }

  const data  = await res.json();
  const raw   = data.content.map(b => b.text || '').join('').trim();
  const clean = raw.replace(/```json|```/gi, '').trim();
  try   { return JSON.parse(clean); }
  catch { throw new Error('Format respons AI tidak valid. Coba lagi.'); }
}

// ── Tampilkan Hasil ───────────────────────────────────────
function showResult(data) {
  resultCard.classList.add('visible');

  if (!data.isValid) {
    resultNominal.textContent = '—';
    resultDesc.textContent    = data.pesan || 'Bukan uang Rupiah';
    confBar.style.width       = '0%';
    confLabel.textContent     = '0%';
    currentResultText         = data.ucapan || data.pesan;
    resultCard.focus();
    announce(currentResultText);
    speakText(currentResultText);
    return;
  }

  resultNominal.textContent = data.nominal;
  resultDesc.textContent    = `${data.jenis} · ${data.kondisi}\n${data.deskripsi}`;
  const pct                 = Math.min(100, Math.max(0, data.keyakinan || 90));
  confBar.style.width       = pct + '%';
  confLabel.textContent     = pct + '%';
  currentResultText         = data.ucapan || `Ini adalah uang ${data.nominal}`;
  resultCard.focus();
  announce(currentResultText);
  setTimeout(() => speakText(currentResultText), 400);
}

// ── TTS ───────────────────────────────────────────────────
function speakText(text) {
  if (!text) return;
  window.speechSynthesis.cancel();
  const utt    = new SpeechSynthesisUtterance(text);
  utt.lang     = 'id-ID';
  utt.rate     = 0.95;
  utt.pitch    = 1.05;
  utt.volume   = 1;
  const voices = window.speechSynthesis.getVoices();
  const id     = voices.find(v => v.lang.startsWith('id') || v.lang.startsWith('ID'));
  if (id) utt.voice = id;
  utt.onstart = () => { isSpeaking = true;  showVolumeBadge(); };
  utt.onend   = () => { isSpeaking = false; };
  utt.onerror = () => { isSpeaking = false; };
  window.speechSynthesis.speak(utt);
}

function showVolumeBadge() {
  document.querySelector('.volume-badge')?.remove();
  const b = document.createElement('div');
  b.className = 'volume-badge';
  b.setAttribute('aria-hidden', 'true');
  b.innerHTML = '🔊 Memperdengarkan...';
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 3500);
}

function announce(text) {
  announcement.textContent = '';
  setTimeout(() => { announcement.textContent = text; }, 100);
}

// ── UI Helpers ────────────────────────────────────────────
function showLoading() { loadingOverlay.classList.add('active');    }
function hideLoading() { loadingOverlay.classList.remove('active'); }
function hideResult()  { resultCard.classList.remove('visible');    }
function hideError()   { errorCard.classList.remove('visible');     }

function showError(msg) {
  errorMsg.textContent = msg;
  errorCard.classList.add('visible');
  announce('Kesalahan: ' + msg);
  speakText('Terjadi kesalahan. ' + msg);
  errorCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ── Init ──────────────────────────────────────────────────
window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
window.speechSynthesis.getVoices();

window.addEventListener('load', () => {
  setTimeout(() => {
    const msg = 'Selamat datang di ScanRupiah. Ketuk Buka Kamera untuk foto langsung, atau ketuk Galeri untuk pilih dari foto tersimpan.';
    announce(msg);
    speakText(msg);
  }, 1200);
});
