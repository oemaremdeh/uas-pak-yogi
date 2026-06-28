<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../helpers/input.php';

class PendaftaranController {

    public static function store(): void {
        $user = requirePeserta();
        $body = getJsonBody();
        $lombaId = (int)($body['lomba_id'] ?? 0);

        if (!$lombaId) error('lomba_id wajib diisi.');

        $db = getDB();

        $stmt = $db->prepare('SELECT * FROM lomba WHERE id = :id AND deleted_at IS NULL AND is_active = TRUE');
        $stmt->execute(['id' => $lombaId]);
        $lomba = $stmt->fetch();
        if (!$lomba) error('Lomba tidak ditemukan atau tidak aktif.', 404);

        $stmt = $db->prepare('SELECT id FROM user_lomba WHERE user_id = :uid AND lomba_id = :lid AND deleted_at IS NULL');
        $stmt->execute(['uid' => $user['id'], 'lid' => $lombaId]);
        if ($stmt->fetch()) error('Anda sudah terdaftar di lomba ini.', 409);

        $year = date('Y');
        $stmt = $db->query("SELECT COUNT(*) as c FROM user_lomba");
        $count = (int)$stmt->fetch()['c'] + 1;
        $nomorReg = sprintf('SL-%s-%04d', $year, $count);

        $stmt = $db->prepare(
            'INSERT INTO user_lomba (user_id, lomba_id, nomor_registrasi, status)
             VALUES (:uid, :lid, :noreg, \'pending\')'
        );
        $stmt->execute(['uid' => $user['id'], 'lid' => $lombaId, 'noreg' => $nomorReg]);

        success([
            'nomor_registrasi' => $nomorReg,
            'status' => 'pending',
            'lomba' => $lomba['nama_lomba'],
        ], 'Pendaftaran berhasil.', 201);
    }

    public static function index(): void {
        requireAdmin();
        $params = getQueryParams();
        $db = getDB();

        $where = ['ul.deleted_at IS NULL'];
        $binds = [];

        if (!empty($params['status'])) {
            $where[] = 'ul.status = :status';
            $binds['status'] = $params['status'];
        }
        if (!empty($params['search'])) {
            $where[] = '(u.nama ILIKE :search OR u.asal_sekolah ILIKE :search)';
            $binds['search'] = '%' . $params['search'] . '%';
        }

        $page = max(1, (int)($params['page'] ?? 1));
        $limit = max(1, min(50, (int)($params['limit'] ?? 10)));
        $offset = ($page - 1) * $limit;

        $sort = 'ul.created_at DESC';
        if (($params['sort'] ?? '') === 'terbaru') {
            $sort = 'ul.created_at DESC';
        }

        $whereStr = implode(' AND ', $where);

        $countSql = "SELECT COUNT(*) as total FROM user_lomba ul
                     JOIN users u ON u.id = ul.user_id
                     JOIN lomba l ON l.id = ul.lomba_id
                     WHERE $whereStr";
        $stmt = $db->prepare($countSql);
        $stmt->execute($binds);
        $total = (int)$stmt->fetch()['total'];

        $sql = "SELECT ul.id, ul.nomor_registrasi, ul.status, ul.alasan_penolakan, ul.created_at as tanggal_daftar,
                       u.id as user_id, u.nama, u.email, u.nisn, u.asal_sekolah, u.jenjang, u.kelas, u.no_hp_ortu,
                       l.id as lomba_id, l.nama_lomba, l.kode_lomba
                FROM user_lomba ul
                JOIN users u ON u.id = ul.user_id
                JOIN lomba l ON l.id = ul.lomba_id
                WHERE $whereStr
                ORDER BY $sort
                LIMIT :lim OFFSET :off";

        $stmt = $db->prepare($sql);
        foreach ($binds as $k => $v) {
            $stmt->bindValue(":$k", $v);
        }
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':off', $offset, PDO::PARAM_INT);
        $stmt->execute();

        success([
            'data'  => $stmt->fetchAll(),
            'total' => $total,
            'page'  => $page,
            'limit' => $limit,
        ]);
    }

    public static function show(int $id): void {
        requireAdmin();
        $db = getDB();
        $stmt = $db->prepare(
            "SELECT ul.*, u.nama, u.email, u.nisn, u.asal_sekolah, u.jenjang, u.kelas, u.no_hp_ortu,
                    l.nama_lomba, l.kode_lomba, l.tanggal_pelaksanaan, l.pelaksana
             FROM user_lomba ul
             JOIN users u ON u.id = ul.user_id
             JOIN lomba l ON l.id = ul.lomba_id
             WHERE ul.id = :id AND ul.deleted_at IS NULL"
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        if (!$row) error('Pendaftaran tidak ditemukan.', 404);
        success($row);
    }

    public static function verifikasi(int $id): void {
        requireAdmin();
        $body = getJsonBody();
        $status = $body['status'] ?? '';

        if (!in_array($status, ['terverifikasi', 'ditolak'])) {
            error('Status harus "terverifikasi" atau "ditolak".');
        }

        if ($status === 'ditolak' && empty(trim($body['alasan_penolakan'] ?? ''))) {
            error('Alasan penolakan wajib diisi.');
        }

        $db = getDB();
        $stmt = $db->prepare(
            'UPDATE user_lomba SET status = :status, alasan_penolakan = :alasan, updated_at = NOW()
             WHERE id = :id AND deleted_at IS NULL'
        );
        $stmt->execute([
            'status' => $status,
            'alasan' => $status === 'ditolak' ? trim($body['alasan_penolakan']) : null,
            'id'     => $id,
        ]);

        if ($stmt->rowCount() === 0) error('Pendaftaran tidak ditemukan.', 404);
        success(null, 'Status berhasil diperbarui.');
    }

    public static function bulkVerifikasi(): void {
        requireAdmin();
        $body = getJsonBody();
        $ids = $body['ids'] ?? [];
        $status = $body['status'] ?? '';

        if (empty($ids) || !in_array($status, ['terverifikasi', 'ditolak'])) {
            error('ids dan status wajib diisi.');
        }

        $db = getDB();
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $db->prepare(
            "UPDATE user_lomba SET status = ?, updated_at = NOW() WHERE id IN ($placeholders) AND deleted_at IS NULL"
        );
        $params = array_merge([$status], array_map('intval', $ids));
        $stmt->execute($params);

        success(['updated_count' => $stmt->rowCount()], 'Bulk update berhasil.');
    }

    public static function destroy(int $id): void {
        requireAdmin();
        $db = getDB();
        $stmt = $db->prepare('UPDATE user_lomba SET deleted_at = NOW() WHERE id = :id AND deleted_at IS NULL');
        $stmt->execute(['id' => $id]);
        if ($stmt->rowCount() === 0) error('Pendaftaran tidak ditemukan.', 404);
        success(null, 'Pendaftaran berhasil dihapus.');
    }

    public static function bulkDestroy(): void {
        requireAdmin();
        $body = getJsonBody();
        $ids = $body['ids'] ?? [];
        if (empty($ids)) error('ids wajib diisi.');

        $db = getDB();
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $db->prepare(
            "UPDATE user_lomba SET deleted_at = NOW() WHERE id IN ($placeholders) AND deleted_at IS NULL"
        );
        $stmt->execute(array_map('intval', $ids));

        success(['deleted_count' => $stmt->rowCount()], 'Bulk delete berhasil.');
    }
}
