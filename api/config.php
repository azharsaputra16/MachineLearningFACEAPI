<?php
$host = 'localhost';
$dbname = 'face_recognition';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    die(json_encode(['error' => 'DB Connection failed: ' . $e->getMessage()]));
}
?>

