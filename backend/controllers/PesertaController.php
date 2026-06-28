<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../helpers/input.php';

class PesertaController {

    public static function me(): void {
        $user = requirePeserta();
        success($user);
    }

    public static function update(): void {
        $user = requirePeserta();
        $body = getJsonBody();
        $db = getDB();

        $fields = [];
        $params = ['id' => $user['id']];

        foreach (['nama', 'asal_sekolah', 'jenjang', 'kelas', 'no_hp_ortu'] as $f) {
            if (isset($body[$f])) {
                $fields[] = "$f = :$f";
                $params[$f] = trim($body[$f]);
            }
        }

        if (isset($body['email'])) {
            $email = trim($body['email']);
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) error('Format email tidak valid.');
            $stmt = $db->prepare('SELECT id FROM users WHERE email = :email AND id != :uid AND deleted_at IS NULL');
            $stmt->execute(['email' => $email, 'uid' => $user['id']]);
            if ($stmt->fetch()) error('Email sudah digunakan.', 409);
            $fields[] = 'email = :email';
            $params['email'] = $email;
        }

        if (isset($body['nisn'])) {
            $nisn = trim($body['nisn']);
            if (!preg_match('/^\d{10}$/', $nisn)) error('NISN harus 10 digit angka.');
            $stmt = $db->prepare('SELECT id FROM users WHERE nisn = :nisn AND id != :uid AND deleted_at IS NULL');
            $stmt->execute(['nisn' => $nisn, 'uid' => $user['id']]);
            if ($stmt->fetch()) error('NISN sudah digunakan.', 409);
            $fields[] = 'nisn = :nisn';
            $params['nisn'] = $nisn;
        }

        if (empty($fields)) error('Tidak ada data yang diubah.');

        $fields[] = 'updated_at = NOW()';
        $sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $db->prepare($sql)->execute($params);

        $stmt = $db->prepare(
            'SELECT id, nama, email, role, nisn, asal_sekolah, jenjang, kelas, no_hp_ortu FROM users WHERE id = :id'
        );
        $stmt->execute(['id' => $user['id']]);
        success($stmt->fetch(), 'Profil berhasil diperbarui.');
    }

    public static function pendaftaran(): void {
        $user = requirePeserta();
        $params = getQueryParams();
        $db = getDB();

        $where = ['ul.user_id = :uid', 'ul.deleted_at IS NULL'];
        $binds = ['uid' => $user['id']];

        if (!empty($params['status'])) {
            $where[] = 'ul.status = :status';
            $binds['status'] = $params['status'];
        }

        $whereStr = implode(' AND ', $where);
        $stmt = $db->prepare(
            "SELECT ul.id, ul.nomor_registrasi, ul.status, ul.alasan_penolakan, ul.created_at as tanggal_daftar,
                    l.id as lomba_id, l.nama_lomba, l.kode_lomba, l.tanggal_pelaksanaan, l.pelaksana, l.maksimal_peserta
             FROM user_lomba ul
             JOIN lomba l ON l.id = ul.lomba_id
             WHERE $whereStr
             ORDER BY ul.created_at DESC"
        );
        $stmt->execute($binds);
        success($stmt->fetchAll());
    }
}
