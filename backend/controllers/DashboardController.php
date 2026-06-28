<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

class DashboardController {

    public static function stats(): void {
        requireAdmin();
        $db = getDB();

        $peserta = (int)$db->query("SELECT COUNT(*) FROM users WHERE role = 'peserta' AND deleted_at IS NULL")->fetchColumn();
        $lombaAktif = (int)$db->query("SELECT COUNT(*) FROM lomba WHERE is_active = TRUE AND deleted_at IS NULL")->fetchColumn();

        success([
            'total_peserta' => $peserta,
            'lomba_aktif'   => $lombaAktif,
        ]);
    }

    public static function pendaftaranPerLomba(): void {
        requireAdmin();
        $db = getDB();

        $stmt = $db->query(
            "SELECT l.nama_lomba as lomba, COUNT(ul.id) as jumlah
             FROM lomba l
             LEFT JOIN user_lomba ul ON ul.lomba_id = l.id AND ul.deleted_at IS NULL
             WHERE l.deleted_at IS NULL AND l.is_active = TRUE
             GROUP BY l.id, l.nama_lomba
             ORDER BY jumlah DESC"
        );

        success($stmt->fetchAll());
    }
}
