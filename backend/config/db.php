<?php
require_once __DIR__ . '/config.php';

function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = 'pgsql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME;
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
            migrateIfNeeded($pdo);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
            exit;
        }
    }
    return $pdo;
}

function migrateIfNeeded(PDO $pdo): void {
    $result = $pdo->query("SELECT to_regclass('public.users')")->fetchColumn();
    if ($result) return;

    $schema = file_get_contents(__DIR__ . '/../sql/schema.sql');
    $pdo->exec($schema);

    $seed = file_get_contents(__DIR__ . '/../sql/seed.sql');
    $pdo->exec($seed);
}
