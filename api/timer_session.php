<?php
require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['nama_panggilan']) || !isset($data['seconds_worked']) || !isset($data['earning'])) {
    http_response_code(400);
    echo json_encode(['success' => false]);
    exit;
}

$nama_panggilan = $data['nama_panggilan'];
$seconds_worked = $data['seconds_worked'];
$earning = $data['earning'];

// Update register table totals
$stmt = $pdo->prepare("UPDATE `register` SET saldo_kerja = saldo_kerja + ?, jam_kerja = jam_kerja + ? WHERE nama_panggilan = ?");
$stmt->execute([$earning, $seconds_worked, $nama_panggilan]);

echo json_encode(['success' => true]);
?>

