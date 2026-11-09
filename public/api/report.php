<?php
/**
 * Ninja Farm - Tester Bug & Feedback Report Endpoint
 * Strictly sanitized: ignores authentication tokens and Gemini API keys.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método não permitido']);
    exit;
}

$dataDir = __DIR__ . '/data';
$reportsDir = $dataDir . '/reports';

if (!is_dir($reportsDir)) {
    @mkdir($reportsDir, 0750, true);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || empty($input['message'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'A mensagem descritiva do problema é obrigatória.']);
    exit;
}

$reportId = 'rep_' . date('Ymd_His') . '_' . bin2hex(random_bytes(3));
$sanitizedReport = [
    'id' => $reportId,
    'timestamp' => time(),
    'version' => preg_replace('/[^0-9a-zA-Z\.\-]/', '', $input['version'] ?? 'alpha-0.1'),
    'browser' => substr(strip_tags($input['browser'] ?? $_SERVER['HTTP_USER_AGENT'] ?? 'Desconhecido'), 0, 200),
    'platform' => substr(strip_tags($input['platform'] ?? 'Web'), 0, 80),
    'screen' => substr(strip_tags($input['screen'] ?? 'gameplay'), 0, 50),
    'activeTask' => substr(strip_tags($input['activeTask'] ?? 'Nenhuma'), 0, 100),
    'message' => substr(strip_tags($input['message']), 0, 2000),
    'recentErrors' => array_slice(array_map(function($e) {
        return substr(strip_tags((string)$e), 0, 300);
    }, $input['recentErrors'] ?? []), -5)
];

$filePath = $reportsDir . '/' . $reportId . '.json';
file_put_contents($filePath, json_encode($sanitizedReport, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo json_encode([
    'success' => true,
    'reportId' => $reportId,
    'message' => 'Relatório enviado com sucesso à equipe de desenvolvimento!'
]);
