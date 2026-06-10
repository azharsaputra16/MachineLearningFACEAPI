<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['nama_panggilan']) || !isset($data['work_date']) || !isset($data['description']) || !isset($data['seconds_worked']) || !isset($data['earning'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing fields']);
    exit;
}

$nama_panggilan = trim($data['nama_panggilan']);
$work_date = trim($data['work_date']); // YYYY-MM-DD
$description = trim($data['description']);
$seconds_worked = (int)$data['seconds_worked'];
$earning = (float)$data['earning'];

if ($nama_panggilan === '' || $work_date === '' || $description === '' || $seconds_worked < 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid input']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO work_logs (nama_panggilan, work_date, description, seconds_worked, earning) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$nama_panggilan, $work_date, $description, $seconds_worked, $earning]);

    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

