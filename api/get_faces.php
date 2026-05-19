<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");
// ... sisa kode kamu

require_once 'config.php';

try {
    $stmt = $pdo->prepare("
        SELECT id, nama_panggilan, faceid 
        FROM register 
        ORDER BY id DESC
    ");
    $stmt->execute();

    $faces = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($faces);

} catch (Exception $e) {
    echo json_encode([
        'error' => $e->getMessage()
    ]);
}