<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// handle preflight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config.php';

try {
    // ambil raw input JSON
    $raw = file_get_contents("php://input");
    $data = json_decode($raw, true);

    // DEBUG (aktifkan kalau masih error)
    // file_put_contents(__DIR__ . "/debug_delete.txt", "RAW:" . $raw);
    error_log("DEBUG_DELETE_RAW=" . $raw);


    // validasi JSON
    if (!is_array($data) || !isset($data['id'])) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "error" => "Invalid JSON body or missing id"
        ]);
        exit;
    }

    $id = (int)$data['id'];

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "error" => "Invalid id"
        ]);
        exit;
    }

    // delete data
    $stmt = $pdo->prepare("DELETE FROM register WHERE id = ?");
    $stmt->execute([$id]);

    $deleted = $stmt->rowCount();

    if ($deleted <= 0) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "error" => "Data not found"
        ]);
        exit;
    }

    echo json_encode([
        "success" => true,
        "message" => "Face deleted successfully",
        "id" => $id
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Server error",
        "detail" => $e->getMessage() // hapus ini kalau sudah production
    ]);
}