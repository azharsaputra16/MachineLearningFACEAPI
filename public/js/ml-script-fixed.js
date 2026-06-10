const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("startBtn");

const pinModal = document.getElementById("pinModal");
const pinInput = document.getElementById("pinInput");
const pinNickname = document.getElementById("pinNickname");

let labeledFaceDescriptors = [];
let currentMatchedNickname = null;
let displaySize;
let modelsLoaded = false;

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";


// LOAD MODEL
async function loadModels() {
    await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
}


// LOAD WAJAH DARI API
async function loadRegisteredFaces() {

    try {

        const res = await fetch(
            "http://localhost/webprojek/api/get_faces.php"
        );

        const data = await res.json();

        console.log("DATA API:", data);

        labeledFaceDescriptors = [];

        if (!Array.isArray(data)) {
            console.log("DATA BUKAN ARRAY");
            return;
        }

        for (const face of data) {

            try {

                console.log("PROCESS FACE:", face);

                // FIX FORMAT
                let parsed;

                if (typeof face.faceid === "string") {

                    parsed = JSON.parse(face.faceid);

                } else {

                    parsed = face.faceid;
                }

                console.log("PARSED:", parsed);

                const descriptor =
                    Array.isArray(parsed[0])
                        ? parsed[0]
                        : parsed;

                console.log(
                    "DESCRIPTOR LENGTH:",
                    descriptor.length
                );

                // VALIDASI
                if (
                    !Array.isArray(descriptor) ||
                    descriptor.length !== 128
                ) {

                    console.log(
                        "DESCRIPTOR INVALID"
                    );

                    continue;
                }

                const float32 =
                    new Float32Array(descriptor);

                const labeled =
                    new faceapi.LabeledFaceDescriptors(
                        face.nama_panggilan,
                        [float32]
                    );

                labeledFaceDescriptors.push(labeled);

                console.log(
                    "SUCCESS ADD:",
                    face.nama_panggilan
                );

            } catch (err) {

                console.error(
                    "FACE ERROR:",
                    err
                );
            }
        }

        console.log(
            "FINAL:",
            labeledFaceDescriptors
        );

        console.log(
            "TOTAL:",
            labeledFaceDescriptors.length
        );

    } catch (err) {

        console.error(
            "LOAD ERROR:",
            err
        );
    }
}
// VERIFY PIN
async function verifyPin() {

    console.log(currentMatchedNickname);

    // gunakan path absolut agar proxy Express tepat.
    const res = await fetch("http://localhost/webprojek/api/delete_face.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nama_panggilan: currentMatchedNickname.trim(),
            pin: pinInput.value
        })
    });


    const text = await res.text();

    console.log("LOGIN RESPONSE:", text);

    try {

        const result = JSON.parse(text);

        if (result.success) {

            localStorage.setItem(
                "currentUser",
                JSON.stringify(result.user)
            );

            alert("Login berhasil!");

            window.location.href = "dashboard.html";

        } else {

            alert(result.error || "Login gagal");
        }

    } catch (e) {

        console.error("Bukan JSON:", text);

        alert("Response login bukan JSON. Cek login.php");
    }
}


// INIT
document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadModels();

        await loadRegisteredFaces();

        console.log(
            "READY:",
            labeledFaceDescriptors
        );
    }
);

startBtn.addEventListener("click", startCamera);
async function startCamera() {
    if (!modelsLoaded) {
        alert("Model belum selesai dimuat, tunggu sebentar ya!");
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        video.srcObject = stream;
        
        // Update status di UI
        const cameraStatus = document.getElementById("cameraStatus");
        if (cameraStatus) cameraStatus.innerText = "Kamera Aktif";

        // Mulai deteksi setelah video diputar
        video.onplay = () => {
            const canvas = faceapi.createCanvasFromMedia(video);
            // Ganti overlay canvas yang sudah ada dengan yang baru atau gunakan yang lama
            const container = document.querySelector('.video-wrapper');
            
            displaySize = { width: video.offsetWidth, height: video.offsetHeight };
            faceapi.matchDimensions(overlay, displaySize);

            setInterval(async () => {
                const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks()
                    .withFaceDescriptors();

                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                
                // Bersihkan canvas
                overlay.getContext("2d").clearRect(0, 0, overlay.width, overlay.height);
                
                // Update jumlah wajah di UI
                const faceCount = document.getElementById("faceCount");
                if (faceCount) faceCount.innerText = detections.length > 0 ? "Terdeteksi" : "Tidak Ada";

                if (labeledFaceDescriptors.length > 0 && detections.length > 0) {
                    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
                    const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));

                    results.forEach((result, i) => {
                        const box = resizedDetections[i].detection.box;
                        const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });
                        drawBox.draw(overlay);

                        // JIKA WAJAH COCOK (Bukan 'unknown')
                        if (result.label !== "unknown" && !pinModal.classList.contains("show")) {
                            currentMatchedNickname = result.label;
                            showPinModal(result.label);
                        }
                    });
                }
            }, 100);
        };
    } catch (err) {
        console.error("Gagal akses kamera:", err);
        alert("Gagal mengakses kamera. Pastikan izin kamera sudah diberikan.");
    }
}

// Fungsi pembantu untuk munculkan modal PIN
function showPinModal(nickname) {
    pinNickname.innerText = nickname;
    pinModal.classList.add("show");
}

// VERIFY PIN BUTTON
const verifyPinBtn = document.getElementById("verifyPinBtn");
const cancelPinBtn = document.getElementById("cancelPinBtn");

if (verifyPinBtn) {
    verifyPinBtn.addEventListener("click", async () => {
        console.log("[PIN] verify clicked", {
            currentMatchedNickname,
            pinValue: pinInput ? pinInput.value : null
        });

        // validasi sederhana agar currentMatchedNickname tidak null
        if (!currentMatchedNickname) {
            if (pinModal) pinModal.classList.remove("show");
            alert("Wajah belum terdeteksi / tidak cocok");
            return;
        }

        if (!pinInput) {
            alert("PIN input tidak ditemukan");
            return;
        }

        await verifyPin();
    });
}


if (cancelPinBtn) {
    cancelPinBtn.addEventListener("click", () => {
        pinModal.classList.remove("show");
        currentMatchedNickname = null;
        pinInput.value = "";
    });
}

// enter key
if (pinInput) {
    pinInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            if (!currentMatchedNickname) return;
            verifyPin();
        }
    });
}

