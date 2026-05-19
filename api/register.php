<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
require_once 'config.php';

try {
$raw_input = file_get_contents('php://input');
    error_log("Raw input length: " . strlen($raw_input));
    error_log("Raw input preview: " . substr($raw_input, 0, 500));
    
    $data = json_decode($raw_input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON input: ' . json_last_error_msg() . '. Raw preview: ' . substr($raw_input, 0, 200));
    }

    if (!isset($data['nama_lengkap'], $data['nama_panggilan'], $data['pin'], $data['faceid']) ||
        empty(trim($data['nama_lengkap'])) || empty(trim($data['nama_panggilan']))) {
        throw new Exception('Missing or empty required fields: nama_lengkap, nama_panggilan, pin, faceid');
    }

    if (!is_array($data['faceid']) || count($data['faceid']) !== 1 || !is_array($data['faceid'][0]) || count($data['faceid'][0]) < 100) {
        throw new Exception('Invalid faceid format. Expected [[~128 floats]]');
    }

    $nama_lengkap = trim($data['nama_lengkap']);
    $nama_panggilan = trim($data['nama_panggilan']);
    $pin = $data['pin'];

    if (strlen($pin) !== 4 || !ctype_digit($pin)) {
        throw new Exception('PIN harus 4 digit angka');
    }

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM register WHERE nama_panggilan = ?");
    $stmt->execute([$nama_panggilan]);

    if ($stmt->fetchColumn() > 0) {
        throw new Exception('Nama panggilan sudah digunakan');
    }

    $pin_hash = password_hash($pin, PASSWORD_DEFAULT);
    $faceid_json = json_encode($data['faceid']);  // Store original array structure

    $stmt = $pdo->prepare("INSERT INTO register (faceid, nama_lengkap, nama_panggilan, pin) VALUES (?, ?, ?, ?)");
    $stmt->execute([$faceid_json, $nama_lengkap, $nama_panggilan, $pin_hash]);

    error_log("Register success ID: " . $pdo->lastInsertId() . " for " . $nama_panggilan);

    echo json_encode([
        'success' => true,
        'id' => $pdo->lastInsertId(),
        'nama_panggilan' => $nama_panggilan
    ]);
} catch (PDOException $e) {
    http_response_code(400);
    error_log("Register insert error: " . $e->getMessage());
    echo json_encode(['error' => 'Insert failed: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(400);
    error_log("Register error: " . $e->getMessage());
    echo json_encode(['error' => $e->getMessage()]);
}
