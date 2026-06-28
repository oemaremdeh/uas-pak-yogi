<?php
$dbUrl = getenv('DATABASE_URL');
if ($dbUrl) {
    $parsed = parse_url($dbUrl);
    define('DB_HOST', $parsed['host']);
    define('DB_PORT', $parsed['port'] ?? '5432');
    define('DB_NAME', ltrim($parsed['path'], '/'));
    define('DB_USER', $parsed['user']);
    define('DB_PASS', $parsed['pass'] ?? '');
} else {
    define('DB_HOST', '127.0.0.1');
    define('DB_PORT', '5433');
    define('DB_NAME', 'smartlomba');
    define('DB_USER', 'mac');
    define('DB_PASS', '');
}

define('TOKEN_EXPIRY_HOURS', 24);
