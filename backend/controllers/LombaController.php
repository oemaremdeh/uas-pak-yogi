<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../helpers/input.php';

class LombaController {

    public static function index(): void {
        $db = getDB();
        $stmt = $db->query('SELECT * FROM lomba WHERE deleted_at IS NULL AND is_active = TRUE ORDER BY tanggal_pelaksanaan ASC');
        success($stmt->fetchAll());
    }

    public static function show(int $id): void {
        $db = getDB();
        $stmt = $db->prepare('SELECT * FROM lomba WHERE id = :id AND deleted_at IS NULL');
        $stmt->execute(['id' => $id]);
        $lomba = $stmt->fetch();
        if (!$lomba) error('Lomba tidak ditemukan.', 404);
        success($lomba);
    }

    public static function store(): void {
        requireAdmin();
        $body = getJsonBody();

        $required = ['nama_lomba', 'kode_lomba', 'tanggal_pelaksanaan', 'maksimal_peserta', 'pelaksana'];
        foreach ($required as $f) {
            if (empty(trim($body[$f] ?? ''))) {
                error("Field '$f' wajib diisi.");
            }
        }

        $db = getDB();

        $stmt = $db->prepare('SELECT id FROM lomba WHERE kode_lomba = :kode AND deleted_at IS NULL');
        $stmt->execute(['kode' => trim($body['kode_lomba'])]);
        if ($stmt->fetch()) {
            error('Kode lomba sudah digunakan.', 409);
        }

        $stmt = $db->prepare(
            'INSERT INTO lomba (nama_lomba, kode_lomba, deskripsi, tanggal_pelaksanaan, maksimal_peserta, pelaksana)
             VALUES (:nama, :kode, :desk, :tgl, :maks, :pelaksana)'
        );
        $stmt->execute([
            'nama'      => trim($body['nama_lomba']),
            'kode'      => trim($body['kode_lomba']),
            'desk'      => trim($body['deskripsi'] ?? ''),
            'tgl'       => $body['tanggal_pelaksanaan'],
            'maks'      => (int)$body['maksimal_peserta'],
            'pelaksana' => trim($body['pelaksana']),
        ]);

        $id = (int)$db->lastInsertId();
        $stmt = $db->prepare('SELECT * FROM lomba WHERE id = :id');
        $stmt->execute(['id' => $id]);

        success($stmt->fetch(), 'Lomba berhasil ditambahkan.', 201);
    }

    public static function update(int $id): void {
        requireAdmin();
        $body = getJsonBody();
        $db = getDB();

        $stmt = $db->prepare('SELECT * FROM lomba WHERE id = :id AND deleted_at IS NULL');
        $stmt->execute(['id' => $id]);
        if (!$stmt->fetch()) error('Lomba tidak ditemukan.', 404);

        $fields = [];
        $params = ['id' => $id];

        foreach (['nama_lomba', 'kode_lomba', 'deskripsi', 'tanggal_pelaksanaan', 'pelaksana'] as $f) {
            if (isset($body[$f])) {
                $fields[] = "$f = :$f";
                $params[$f] = trim($body[$f]);
            }
        }
        if (isset($body['maksimal_peserta'])) {
            $fields[] = 'maksimal_peserta = :maksimal_peserta';
            $params['maksimal_peserta'] = (int)$body['maksimal_peserta'];
        }
        if (isset($body['is_active'])) {
            $fields[] = 'is_active = :is_active';
            $params['is_active'] = $body['is_active'] ? 'true' : 'false';
        }

        if (empty($fields)) error('Tidak ada data yang diubah.');

        $fields[] = 'updated_at = NOW()';
        $sql = 'UPDATE lomba SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $db->prepare($sql)->execute($params);

        $stmt = $db->prepare('SELECT * FROM lomba WHERE id = :id');
        $stmt->execute(['id' => $id]);
        success($stmt->fetch(), 'Lomba berhasil diperbarui.');
    }

    public static function destroy(int $id): void {
        requireAdmin();
        $db = getDB();
        $stmt = $db->prepare('UPDATE lomba SET deleted_at = NOW() WHERE id = :id AND deleted_at IS NULL');
        $stmt->execute(['id' => $id]);
        if ($stmt->rowCount() === 0) error('Lomba tidak ditemukan.', 404);
        success(null, 'Lomba berhasil dihapus.');
    }
}
