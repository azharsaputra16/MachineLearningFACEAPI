// Face Recognition ML - Registration Script
// Powered by face-api.js

// Global variables
let videoStream = null;
let capturedImage = null;
let faceDescriptor = null;
let modelsLoaded = false;
let previewInterval = null;

// DOM Elements
const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('startBtn');
const captureBtn = document.getElementById('captureBtn');
const capturedImageEl = document.getElementById('capturedImage');
const noPreview = document.getElementById('noPreview');
const cameraStatus = document.getElementById('cameraStatus');
const faceStatus = document.getElementById('faceStatus');
const faceQuality = document.getElementById('faceQuality');
const registerForm = document.getElementById('registerForm');
const saveBtn = document.getElementById('saveBtn');
const registeredFacesList = document.getElementById('registeredFacesList');
const successModal = document.getElementById('successModal');
const errorModal = document.getElementById('errorModal');
const errorMessage = document.getElementById('errorMessage');
const photoInput = document.getElementById('photoInput');

// Model path
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadRegisteredFaces();
    loadModels();
});

// Form validation
function checkFormValidity() {
    const name = document.getElementById('name').value.trim();
    const nickname = document.getElementById('nickname').value.trim();
    const pin = document.getElementById('pin').value.trim();

    if (name && nickname && pin && capturedImage && faceDescriptor) {
        saveBtn.disabled = false;
    } else {
        saveBtn.disabled = true;
    }
}

// Load models
async function loadModels() {
    try {
        cameraStatus.textContent = '⏳ Loading models...';

        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);

        modelsLoaded = true;
        startBtn.disabled = false;

        cameraStatus.textContent = '✅ Models loaded';
        cameraStatus.className = 'status-value success';

    } catch (error) {
        console.error(error);
        cameraStatus.textContent = '❌ Gagal load model';
    }
}

// Start camera
async function startCamera() {
    try {
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            }
        });

        video.srcObject = videoStream;

        video.onloadedmetadata = () => {
            const displaySize = {
                width: video.videoWidth,
                height: video.videoHeight
            };

            faceapi.matchDimensions(overlay, displaySize);

            startBtn.disabled = true;
            captureBtn.disabled = false;

            cameraStatus.textContent = '📹 Kamera aktif';
            cameraStatus.className = 'status-value success';

            startFaceDetectionPreview();
        };

    } catch (error) {
        cameraStatus.textContent = '❌ Kamera gagal';
    }
}

// Face detection preview
function startFaceDetectionPreview() {
    previewInterval = setInterval(async () => {
        const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks();

        const ctx = overlay.getContext('2d');
        ctx.clearRect(0, 0, overlay.width, overlay.height);

        if (detections.length === 0) {
            faceStatus.textContent = '❌ Tidak ada wajah';
            faceQuality.textContent = '-';
            return;
        }

        if (detections.length > 1) {
            faceStatus.textContent = '⚠️ Multiple wajah';
            faceQuality.textContent = '1 wajah saja';
            return;
        }

        const box = detections[0].detection.box;

        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        faceStatus.textContent = '✅ Wajah terdeteksi';
        faceQuality.textContent = 'Bagus';
    }, 120);
}

// Capture image
async function captureImage() {
    if (!modelsLoaded) {
        showError("Model belum siap");
        return;
    }

    try {
        const canvas = document.createElement('canvas');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        capturedImage = canvas.toDataURL('image/jpeg', 0.9);

        capturedImageEl.src = capturedImage;
        capturedImageEl.classList.add('show');
        noPreview.style.display = 'none';

        faceStatus.textContent = "🔍 Mendeteksi wajah...";

        // DETECT FROM CANVAS (FIX BUG)
        const detection = await faceapi
            .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {
            faceDescriptor = null;

            faceStatus.textContent = '❌ Wajah tidak terdeteksi';
            faceQuality.textContent = '-';

            showError("Wajah tidak terdeteksi dengan jelas");

            return;
        }

        faceDescriptor = detection.descriptor;

        faceStatus.textContent = '✅ Foto berhasil';
        faceQuality.textContent = 'Siap disimpan';

        checkFormValidity();
    } catch (error) {
        showError("Capture gagal");
    }
}

// Load registered faces from API (sync with login)
// Load registered faces from API
async function loadRegisteredFaces() {
    try {
        const listContainer = document.getElementById("registeredFacesList");
        if (!listContainer) return;

        // Gunakan path absolut agar tidak bingung folder
        const response = await fetch("http://localhost/webprojek/api/get_faces.php");
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const text = await response.text();
        console.log("RAW RESPONSE:", text);

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error("Response bukan JSON valid:", text);
            listContainer.innerHTML = '<p class="no-faces">Format data server salah</p>';
            return;
        }

        // VALIDASI & RENDER
        if (Array.isArray(data) && data.length > 0) {
            console.log("Memanggil render dengan data:", data);
            renderRegisteredFaces(data); // <--- INI KUNCINYA
        } else {
            listContainer.innerHTML = '<p class="no-faces">Belum ada wajah terdaftar</p>';
        }

    } catch (err) {
        console.error("LOAD FACE ERROR:", err);
        document.getElementById("registeredFacesList").innerHTML = '<p class="no-faces">Gagal terhubung ke API</p>';
    }
}

// Render faces
function renderRegisteredFaces(faces) {
    if (!faces || faces.length === 0) {
        registeredFacesList.innerHTML = '<p class="no-faces">Belum ada wajah</p>';
        return;
    }

    registeredFacesList.innerHTML = faces.map(face => {
        // Gunakan fallback ke properti yang mungkin dikirim PHP
        const nameToShow = face.nama_panggilan || face.nickname || 'Tanpa Nama';
        const fullName = face.nama_lengkap || face.name || '-';
        const faceId = face.id;

        return `
            <div class="face-card">
                <button
                    class="delete-btn"
                    onclick="deleteFace(${faceId}, '${String(nameToShow).replace(/'/g, "\\'")}')">
                    ✕
                </button>
                <div class="name">${nameToShow}</div>
                <div class="nickname">${fullName}</div>
            </div>
        `;
    }).join('');
}

// Delete face
async function deleteFace(id, nama) {
    if (!confirm(`Yakin hapus wajah "${nama}"?`)) return;

    try {
const res = await fetch("/api/delete_face.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ id: id })
        });

        const result = await res.json();

        if (result.success) {
            alert("Wajah berhasil dihapus");
            loadRegisteredFaces();
        } else {
            alert(result.error || "Gagal hapus");
        }

    } catch (err) {
        console.error(err);
        alert("Server error");
    }
}


// Save face to API - FIXED VERSION 1: RELATIVE PATH '../api/register.php'
// ===============================================================
// Handles 404, HTML responses, JSON parse errors with full debugging
// Production-ready, clean, and safe
saveBtn.addEventListener("click", async () => {
    const name = document.getElementById('name').value.trim();
    const nickname = document.getElementById('nickname').value.trim();
    const pin = document.getElementById('pin').value.trim();

    // Validation
    if (!capturedImage) {
        showError("Ambil foto dulu");
        return;
    }
    if (!faceDescriptor) {
        showError("Wajah tidak terdeteksi saat foto");
        return;
    }
    if (pin.length !== 4 || !/^[0-9]{4}$/.test(pin)) {
        showError("PIN harus 4 digit angka");
        return;
    }

    const descriptor = Array.from(faceDescriptor);
    const API_URL = '/webprojek/api/register.php';

    try {
        console.log('🔄 Sending register request to:', API_URL);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nama_lengkap: name,
                nama_panggilan: nickname,
                pin: pin,
                faceid: [descriptor]
            })
        });

        // DEBUG: Log full response info
        console.log('📡 Response status:', response.status, response.statusText);
        console.log('📡 Response headers:', [...response.headers.entries()]);

        // Always read as TEXT first (safe)
        const responseText = await response.text();
        console.log('📄 Raw response (first 500 chars):', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));

        // Check if response is valid JSON
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ JSON parse failed:', parseError);
            if (response.status === 404) {
                showError(`API not found (404): ${API_URL}\nCek apakah file api/register.php ada dan XAMPP berjalan`);
            } else {
                showError(`Server error. Status: ${response.status}\nResponse: ${responseText.substring(0, 200)}...`);
            }
            return;
        }

        console.log('✅ Parsed JSON result:', result);

        // Handle API response
        if (result.success) {
            // Save to localStorage for consistency
            const newFace = {
                id: result.id,
                nama_lengkap: name,
                nama_panggilan: nickname,
                descriptor: descriptor
            };
            const stored = JSON.parse(localStorage.getItem('faces') || '[]');
            stored.push(newFace);
            localStorage.setItem('faces', JSON.stringify(stored));
            
            showSuccess(`Berhasil! ${nickname} terdaftar`);
            resetForm();
            loadRegisteredFaces();
        } else {
            const errorMsg = result.error || result.message || 'Registration failed';
            console.error('❌ API error:', errorMsg);
            showError(errorMsg);
        }

    } catch (networkError) {
        console.error('🌐 Network error:', networkError);
        showError(`Koneksi gagal: ${networkError.message}\nCek XAMPP Apache/MySQL dan internet`);
    }
});

// VERSION 2 - ABSOLUTE PATH (juga benar): const API_URL = '/webprojek/api/register.php';
// ===============================================================

// Reset form
function resetForm() {
    registerForm.reset();

    capturedImage = null;
    faceDescriptor = null;

    capturedImageEl.src = "";
    capturedImageEl.classList.remove("show");

    noPreview.style.display = "block";

    saveBtn.disabled = true;
}

// Show success
function showSuccess() {
    successModal.classList.add("show");
}

// Show error
function showError(message) {
    errorMessage.textContent = message;

    errorModal.classList.add("show");
}

// Event listeners
startBtn.addEventListener('click', startCamera);
captureBtn.addEventListener('click', captureImage);

document.getElementById('name').addEventListener('input', checkFormValidity);
document.getElementById('nickname').addEventListener('input', checkFormValidity);
document.getElementById('pin').addEventListener('input', checkFormValidity);

// Modal close
document.getElementById('closeModalBtn').addEventListener('click', () => {
    successModal.classList.remove("show");
});

document.getElementById('closeErrorBtn').addEventListener('click', () => {
    errorModal.classList.remove("show");
});
