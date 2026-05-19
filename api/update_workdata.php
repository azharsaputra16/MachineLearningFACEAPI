<?php
require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['nama_panggilan']) || !isset($data['total_seconds']) || !isset($data['total_earning'])) {
    http_response_code(400);
    echo json_encode(['success' => false]);
    exit;
}

$nama_panggilan = $data['nama_panggilan'];
$total_seconds = $data['total_seconds'];
$total_earning = $data['total_earning'];

// Update register table (add columns first if needed)
// ALTER TABLE `register` ADD COLUMN saldo_kerja DECIMAL(10,2) DEFAULT 0;
// ALTER TABLE `register` ADD COLUMN jam_kerja BIGINT DEFAULT 0;

$stmt = $pdo->prepare("UPDATE `register` SET saldo_kerja = saldo_kerja + ?, jam_kerja = jam_kerja + ? WHERE nama_panggilan = ?");
$stmt->execute([$total_earning, $total_seconds, $nama_panggilan]);

echo json_encode(['success' => true]);
?>

