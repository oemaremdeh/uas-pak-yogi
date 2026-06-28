<?php
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri    = rtrim($uri, '/');

// Serve frontend files if not an /api route
if (!str_starts_with($uri, '/api')) {
    return false;
}

$path = substr($uri, 4); // strip /api

// ---- AUTH ----
if ($path === '/auth/register' && $method === 'POST') {
    require_once __DIR__ . '/controllers/AuthController.php';
    AuthController::register();
}
if ($path === '/auth/login' && $method === 'POST') {
    require_once __DIR__ . '/controllers/AuthController.php';
    AuthController::login();
}
if ($path === '/auth/me' && $method === 'GET') {
    require_once __DIR__ . '/controllers/AuthController.php';
    AuthController::me();
}
if ($path === '/auth/logout' && $method === 'POST') {
    require_once __DIR__ . '/controllers/AuthController.php';
    AuthController::logout();
}

// ---- LOMBA ----
if ($path === '/lomba' && $method === 'GET') {
    require_once __DIR__ . '/controllers/LombaController.php';
    LombaController::index();
}
if ($path === '/lomba' && $method === 'POST') {
    require_once __DIR__ . '/controllers/LombaController.php';
    LombaController::store();
}
if (preg_match('#^/lomba/(\d+)$#', $path, $m)) {
    $id = (int)$m[1];
    if ($method === 'GET') {
        require_once __DIR__ . '/controllers/LombaController.php';
        LombaController::show($id);
    }
    if ($method === 'PUT') {
        require_once __DIR__ . '/controllers/LombaController.php';
        LombaController::update($id);
    }
    if ($method === 'DELETE') {
        require_once __DIR__ . '/controllers/LombaController.php';
        LombaController::destroy($id);
    }
}

// ---- PENDAFTARAN ----
if ($path === '/pendaftaran' && $method === 'POST') {
    require_once __DIR__ . '/controllers/PendaftaranController.php';
    PendaftaranController::store();
}
if ($path === '/pendaftaran' && $method === 'GET') {
    require_once __DIR__ . '/controllers/PendaftaranController.php';
    PendaftaranController::index();
}
if ($path === '/pendaftaran/bulk' && $method === 'PATCH') {
    require_once __DIR__ . '/controllers/PendaftaranController.php';
    PendaftaranController::bulkVerifikasi();
}
if ($path === '/pendaftaran/bulk' && $method === 'DELETE') {
    require_once __DIR__ . '/controllers/PendaftaranController.php';
    PendaftaranController::bulkDestroy();
}
if (preg_match('#^/pendaftaran/(\d+)/verifikasi$#', $path, $m) && $method === 'PATCH') {
    require_once __DIR__ . '/controllers/PendaftaranController.php';
    PendaftaranController::verifikasi((int)$m[1]);
}
if (preg_match('#^/pendaftaran/(\d+)$#', $path, $m)) {
    $id = (int)$m[1];
    if ($method === 'GET') {
        require_once __DIR__ . '/controllers/PendaftaranController.php';
        PendaftaranController::show($id);
    }
    if ($method === 'DELETE') {
        require_once __DIR__ . '/controllers/PendaftaranController.php';
        PendaftaranController::destroy($id);
    }
}

// ---- PESERTA (self-service) ----
if ($path === '/peserta/me' && $method === 'GET') {
    require_once __DIR__ . '/controllers/PesertaController.php';
    PesertaController::me();
}
if ($path === '/peserta/me' && $method === 'PUT') {
    require_once __DIR__ . '/controllers/PesertaController.php';
    PesertaController::update();
}
if ($path === '/peserta/me/pendaftaran' && $method === 'GET') {
    require_once __DIR__ . '/controllers/PesertaController.php';
    PesertaController::pendaftaran();
}

// ---- DASHBOARD (Admin) ----
if ($path === '/dashboard/stats' && $method === 'GET') {
    require_once __DIR__ . '/controllers/DashboardController.php';
    DashboardController::stats();
}
if ($path === '/dashboard/pendaftaran-per-lomba' && $method === 'GET') {
    require_once __DIR__ . '/controllers/DashboardController.php';
    DashboardController::pendaftaranPerLomba();
}

// ---- 404 ----
require_once __DIR__ . '/helpers/response.php';
error('Endpoint tidak ditemukan.', 404);
