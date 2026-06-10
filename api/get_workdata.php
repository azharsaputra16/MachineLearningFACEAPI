<?php
header('Content-Type: application/json');
require_once 'config.php';

$user_id = $_GET['user_id'] ?? 0;
$nama_panggilan = trim($_GET['nama_panggilan'] ?? '');

// Ambil totals berdasarkan id (utama). Jika 0 dan nama_panggilan tersedia, coba fallback.
$totalSeconds = 0;
$totalEarning = 0;

try {
    if ($user_id) {
        $stmt = $pdo->prepare("SELECT jam_kerja, saldo_kerja FROM register WHERE id = ?");
        $stmt->execute([$user_id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $totalSeconds = (int)($row['jam_kerja'] ?? 0);
            $totalEarning = (float)($row['saldo_kerja'] ?? 0);
            if ($totalSeconds !== 0 || $totalEarning !== 0) {
                echo json_encode([
                    'total_seconds' => $totalSeconds,
                    'total_earning' => $totalEarning
                ]);
                exit;
            }
        }
    }

    if ($nama_panggilan !== '') {
        $stmt = $pdo->prepare("SELECT jam_kerja, saldo_kerja FROM register WHERE nama_panggilan = ?");
        $stmt->execute([$nama_panggilan]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $totalSeconds = (int)($row['jam_kerja'] ?? 0);
            $totalEarning = (float)($row['saldo_kerja'] ?? 0);
        }
    }
} catch (Throwable $e) {
    // Jangan 500 tanpa response; tetap kirim 0.
    error_log('[get_workdata] ' . $e->getMessage());
}

echo json_encode([
    'total_seconds' => $totalSeconds,
    'total_earning' => $totalEarning
]);

