<?php
// Ensure JSON output always
ob_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
require_once 'config.php';

if (!isset($pdo)) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode(['error' => 'Database not connected']);
    exit;
}
try {
    $data = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON input: ' . json_last_error_msg());
    }

    if (!isset($data['nama_lengkap'], $data['nama_panggilan'], $data['pin'], $data['faceid']) ||
        empty(trim($data['nama_lengkap'])) || empty(trim($data['nama_panggilan']))) {
        throw new Exception('Missing or empty required fields');
    }

    if (!is_array($data['faceid']) || count($data['faceid']) !== 1 || !is_array($data['faceid'][0]) || count($data['faceid'][0]) < 100) {
        throw new Exception('Invalid faceid format. Expected [[~128 floats]]');
    }

    $nama_lengkap = trim($data['nama_lengkap']);
    $nama_panggilan = trim($data['nama_panggilan']);
    $pin = $data['pin'];
    $faceid_json = json_encode($data['faceid']);

    if (strlen($pin) !== 4 || !ctype_digit($pin)) {
        throw new Exception('PIN harus 4 digit angka');
    }

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM `register` WHERE nama_panggilan = ?");
    $stmt->execute([$nama_panggilan]);
    if ($stmt->fetchColumn() > 0) {
        throw new Exception('Nama panggilan sudah digunakan');
    }

    $pin_hash = password_hash($pin, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("INSERT INTO `register` (faceid, nama_lengkap, nama_panggilan, pin) VALUES (?, ?, ?, ?)");
    $stmt->execute([$faceid_json, $nama_lengkap, $nama_panggilan, $pin_hash]);

    $insert_id = $pdo->lastInsertId();
    error_log("Register success ID: $insert_id for $nama_panggilan");

    echo json_encode([
        'success' => true,
        'id' => $insert_id,
        'nama_panggilan' => $nama_panggilan
    ]);

} catch (PDOException $e) {
    error_log("Register DB error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Register error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}
?>

