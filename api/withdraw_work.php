<?php
header('Content-Type: application/json');
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$nama_panggilan = trim($data['nama_panggilan'] ?? '');

if ($nama_panggilan === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'nama_panggilan wajib']);
    exit;
}

try {
    // Ensure columns exist (best-effort)
    $pdo->exec("ALTER TABLE `register` ADD COLUMN IF NOT EXISTS saldo_kerja DECIMAL(10,2) DEFAULT 0");
    $pdo->exec("ALTER TABLE `register` ADD COLUMN IF NOT EXISTS jam_kerja BIGINT DEFAULT 0");

    $stmt = $pdo->prepare("SELECT saldo_kerja FROM `register` WHERE nama_panggilan = ? LIMIT 1");
    $stmt->execute([$nama_panggilan]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'User tidak ditemukan']);
        exit;
    }

    $saldo_kerja = (float)($row['saldo_kerja'] ?? 0);
    $bonus = $saldo_kerja * 0.1;
    $total_pencairan = $saldo_kerja + $bonus;

    if (abs($saldo_kerja) < 0.00001 && abs($bonus) < 0.00001) {
        echo json_encode([
            'success' => false,
            'error' => 'Tidak ada saldo yang dapat ditarik.'
        ]);
        exit;
    }

    // Set Saldo Kerja menjadi 0 (bonus mengikuti karena dihitung dari saldo_kerja di frontend)
    $stmtUp = $pdo->prepare("UPDATE `register` SET saldo_kerja = 0 WHERE nama_panggilan = ?");
    $stmtUp->execute([$nama_panggilan]);

    echo json_encode([
        'success' => true,
        'pencairan' => [
            'saldo_kerja' => $saldo_kerja,
            'bonus' => $bonus,
            'total' => $total_pencairan
        ]
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

