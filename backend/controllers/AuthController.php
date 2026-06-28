<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../helpers/input.php';

class AuthController {

    public static function register(): void {
        $body = getJsonBody();
        $required = ['nama', 'nisn', 'asal_sekolah', 'jenjang', 'kelas', 'email', 'no_hp_ortu', 'password'];
        foreach ($required as $field) {
            if (empty(trim($body[$field] ?? ''))) {
                error("Field '$field' wajib diisi.");
            }
        }

        $nisn = trim($body['nisn']);
        if (!preg_match('/^\d{10}$/', $nisn)) {
            error('NISN harus 10 digit angka.');
        }

        $email = trim($body['email']);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            error('Format email tidak valid.');
        }

        if (strlen($body['password']) < 8) {
            error('Password minimal 8 karakter.');
        }

        $db = getDB();

        $stmt = $db->prepare('SELECT id FROM users WHERE email = :email AND deleted_at IS NULL');
        $stmt->execute(['email' => $email]);
        if ($stmt->fetch()) {
            error('Email sudah terdaftar.', 409);
        }

        $stmt = $db->prepare('SELECT id FROM users WHERE nisn = :nisn AND deleted_at IS NULL');
        $stmt->execute(['nisn' => $nisn]);
        if ($stmt->fetch()) {
            error('NISN sudah terdaftar.', 409);
        }

        $hash = password_hash($body['password'], PASSWORD_BCRYPT);

        $stmt = $db->prepare(
            'INSERT INTO users (nama, email, password_hash, role, nisn, asal_sekolah, jenjang, kelas, no_hp_ortu)
             VALUES (:nama, :email, :hash, \'peserta\', :nisn, :sekolah, :jenjang, :kelas, :hp)'
        );
        $stmt->execute([
            'nama'    => trim($body['nama']),
            'email'   => $email,
            'hash'    => $hash,
            'nisn'    => $nisn,
            'sekolah' => trim($body['asal_sekolah']),
            'jenjang' => trim($body['jenjang']),
            'kelas'   => trim($body['kelas']),
            'hp'      => trim($body['no_hp_ortu']),
        ]);

        $userId = (int)$db->lastInsertId();
        $stmt = $db->prepare('SELECT id, nama, email, role, nisn, asal_sekolah, jenjang, kelas, no_hp_ortu FROM users WHERE id = :id');
        $stmt->execute(['id' => $userId]);

        success($stmt->fetch(), 'Registrasi berhasil.', 201);
    }

    public static function login(): void {
        $body = getJsonBody();
        $identifier = trim($body['identifier'] ?? '');
        $password   = $body['password'] ?? '';
        $role       = $body['role'] ?? '';

        if (!$identifier || !$password || !$role) {
            error('Identifier, password, dan role wajib diisi.');
        }

        $db = getDB();

        if ($role === 'admin') {
            $stmt = $db->prepare('SELECT * FROM users WHERE username = :id AND role = \'admin\' AND deleted_at IS NULL');
        } else {
            $stmt = $db->prepare('SELECT * FROM users WHERE email = :id AND role = \'peserta\' AND deleted_at IS NULL');
        }
        $stmt->execute(['id' => $identifier]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            error('Email/username atau password salah.', 401);
        }

        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', strtotime('+' . TOKEN_EXPIRY_HOURS . ' hours'));

        $stmt = $db->prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (:token, :uid, :exp)');
        $stmt->execute(['token' => $token, 'uid' => $user['id'], 'exp' => $expires]);

        unset($user['password_hash'], $user['deleted_at']);

        success(['token' => $token, 'user' => $user], 'Login berhasil.');
    }

    public static function me(): void {
        $user = requireAuth();
        success($user);
    }

    public static function logout(): void {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/^Bearer\s+(.+)$/i', $header, $m)) {
            $db = getDB();
            $stmt = $db->prepare('DELETE FROM sessions WHERE token = :token');
            $stmt->execute(['token' => $m[1]]);
        }
        success(null, 'Logout berhasil.');
    }
}
