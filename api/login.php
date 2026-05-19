<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'init_db.php';

$data = json_decode(file_get_contents('php://input'), true);

$nama_panggilan = trim($data['nama_panggilan'] ?? '');
$pin = trim($data['pin'] ?? '');

$stmt = $pdo->prepare("
SELECT * FROM register
WHERE nama_panggilan = ?
");

$stmt->execute([$nama_panggilan]);

$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {

    echo json_encode([
        'success' => false,
        'error' => 'User tidak ditemukan'
    ]);

    exit;
}

if (
    !password_verify($pin, $user['pin']) &&
    $pin !== $user['pin']
) {

    echo json_encode([
        'success' => false,
        'error' => 'PIN salah'
    ]);

    exit;
}

echo json_encode([
    'success' => true,
    'user' => [
        'id' => $user['id'],
        'nama_panggilan' => $user['nama_panggilan']
    ]
]);