<?php

require_once 'config.php';

try {

    $sql = "CREATE TABLE IF NOT EXISTS `register` (
        `id` INT NOT NULL AUTO_INCREMENT,
        `faceid` LONGTEXT NOT NULL,
        `nama_lengkap` VARCHAR(100) NOT NULL,
        `nama_panggilan` VARCHAR(50) NOT NULL UNIQUE,
        `pin` VARCHAR(255) NOT NULL,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    $pdo->exec($sql);

} catch (PDOException $e) {

    die($e->getMessage());
}