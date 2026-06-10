<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';

$nama_panggilan = trim($_GET['nama_panggilan'] ?? '');


if ($nama_panggilan === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing nama_panggilan']);
    exit;
}

try {
    $stmt = $pdo->prepare(
        "SELECT id, work_date, description, seconds_worked, earning ".
        "FROM work_logs ".
        "WHERE nama_panggilan = ? ".
        "ORDER BY work_date DESC, id DESC"
    );
    $stmt->execute([$nama_panggilan]);


    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);


    echo json_encode(['success' => true, 'items' => $rows]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

