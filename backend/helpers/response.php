<?php
function jsonResponse($data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function success($data = null, string $message = 'OK', int $code = 200): void {
    jsonResponse(['success' => true, 'data' => $data, 'message' => $message], $code);
}

function error(string $message, int $code = 400): void {
    jsonResponse(['success' => false, 'data' => null, 'message' => $message], $code);
}
