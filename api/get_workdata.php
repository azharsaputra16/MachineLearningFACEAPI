<?php
header('Content-Type: application/json');
require_once 'config.php';

$user_id = $_GET['user_id'] ?? 0;

$stmt = $pdo->prepare("SELECT jam_kerja, saldo_kerja FROM register WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

echo json_encode([
    'total_seconds' => (int)($user['jam_kerja'] ?? 0),
    'total_earning' => (float)($user['saldo_kerja'] ?? 0)
]);