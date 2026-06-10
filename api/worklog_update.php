<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['id']) || !isset($data['description']) || !isset($data['seconds_worked']) || !isset($data['earning'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing fields']);
    exit;
}

$id = (int)$data['id'];
$description = trim($data['description']);
$seconds_worked = (int)$data['seconds_worked'];
$earning = (float)$data['earning'];

if ($id <= 0 || $description === '' || $seconds_worked < 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid input']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE work_logs SET description = ?, seconds_worked = ?, earning = ?, updated_at = NOW() WHERE id = ?");
    $stmt->execute([$description, $seconds_worked, $earning, $id]);

    echo json_encode(['success' => true]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

