<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/response.php';

function getAuthUser(): ?array {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer\s+(.+)$/i', $header, $m)) {
        return null;
    }
    $token = $m[1];
    $db = getDB();
    $stmt = $db->prepare(
        'SELECT u.id, u.nama, u.email, u.username, u.role, u.nisn, u.asal_sekolah, u.jenjang, u.kelas, u.no_hp_ortu
         FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token = :token AND s.expires_at > NOW() AND u.deleted_at IS NULL'
    );
    $stmt->execute(['token' => $token]);
    return $stmt->fetch() ?: null;
}

function requireAuth(): array {
    $user = getAuthUser();
    if (!$user) {
        error('Unauthorized', 401);
    }
    return $user;
}

function requireAdmin(): array {
    $user = requireAuth();
    if ($user['role'] !== 'admin') {
        error('Forbidden', 403);
    }
    return $user;
}

function requirePeserta(): array {
    $user = requireAuth();
    if ($user['role'] !== 'peserta') {
        error('Forbidden', 403);
    }
    return $user;
}
