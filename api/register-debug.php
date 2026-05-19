<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo json_encode([
    'debug' => 'PHP OK',
    'path' => __FILE__,
    'time' => date('Y-m-d H:i:s')
]);