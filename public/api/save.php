<?php
/**
 * Ninja Farm - Cloud Save & Authoritative State Endpoint
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

$dataDir = __DIR__ . '/data';
$sessionsDir = $dataDir . '/sessions';
$savesDir = $dataDir . '/saves';

foreach ([$dataDir, $sessionsDir, $savesDir] as $dir) {
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }
}

function getBearerToken(): ?string {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
            return $matches[1];
        }
    }
    if (isset($_COOKIE['ninja_session'])) {
        return $_COOKIE['ninja_session'];
    }
    if (isset($_GET['token'])) {
        return $_GET['token'];
    }
    return null;
}

$token = getBearerToken();
if (!$token) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Sessão não autenticada. Faça login com o Google.']);
    exit;
}

$sessionFile = $sessionsDir . '/' . preg_replace('/[^a-f0-9]/', '', $token) . '.json';
if (!file_exists($sessionFile)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Sessão inválida ou expirada.']);
    exit;
}

$session = json_decode(file_get_contents($sessionFile), true);
if (!$session || $session['expiresAt'] < time()) {
    @unlink($sessionFile);
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Sessão expirada.']);
    exit;
}

$userHash = $session['userHash'];
$saveFile = $savesDir . '/' . $userHash . '.json';

function generateInitialStarterSave(string $userHash): array {
    $nowMs = (int)(microtime(true) * 1000);
    return [
        'version' => 1,
        'revision' => 1,
        'userId' => $userHash,
        'savedAt' => $nowMs,
        'resources' => [
            'wood' => 50,
            'metal' => 20,
            'parts' => 10,
            'food' => 30,
            'water' => 40,
            'energy' => 50
        ],
        'buildings' => [
            [
                'instanceId' => 'hq_main',
                'type' => 'hq',
                'gridX' => 16,
                'gridY' => 12,
                'orientation' => 0,
                'createdAt' => $nowMs,
                'health' => 500
            ],
            [
                'instanceId' => 'crop_plot_init_1',
                'type' => 'crop_field',
                'gridX' => 16,
                'gridY' => 18,
                'orientation' => 0,
                'createdAt' => $nowMs,
                'health' => 100,
                'customData' => ['soilStatus' => 'raw']
            ],
            [
                'instanceId' => 'solar_panel_init_1',
                'type' => 'solar_panel',
                'gridX' => 12,
                'gridY' => 14,
                'orientation' => 0,
                'createdAt' => $nowMs,
                'health' => 80
            ],
            [
                'instanceId' => 'water_pump_init_1',
                'type' => 'water_pump',
                'gridX' => 22,
                'gridY' => 14,
                'orientation' => 0,
                'createdAt' => $nowMs,
                'health' => 100
            ],
            [
                'instanceId' => 'bonfire_init_1',
                'type' => 'bonfire',
                'gridX' => 20,
                'gridY' => 16,
                'orientation' => 0,
                'createdAt' => $nowMs,
                'health' => 60
            ]
        ],
        'crops' => [],
        'animals' => [
            [
                'id' => 'chicken_farm_1',
                'type' => 'chicken',
                'state' => 'idle',
                'posX' => 21,
                'posY' => 18,
                'hunger' => 20,
                'lastFedAt' => $nowMs,
                'productionProgress' => 0.0,
                'readyToCollect' => false
            ]
        ],
        'dayTime' => 0.35,
        'elapsedGameDays' => 1,
        'ninjaPosition' => ['x' => 0, 'y' => 0, 'z' => 0],
        'droid' => [
            'id' => 'farm_droid_01',
            'battery' => 100,
            'maxBattery' => 100,
            'state' => 'idle',
            'position' => ['x' => -2, 'y' => 0, 'z' => 2],
            'currentTaskId' => null,
            'workSpeedMultiplier' => 1.0
        ],
        'scheduler' => [
            'tasks' => [],
            'activeTaskId' => null,
            'lastProcessedTimestamp' => time()
        ],
        'geminiConfig' => [
            'mode' => 'limited',
            'hasCustomKey' => false,
            'model' => 'gemini-1.5-flash'
        ],
        'eventsLog' => [
            [
                'id' => 'evt_' . bin2hex(random_bytes(4)),
                'timestamp' => $nowMs,
                'type' => 'welcome',
                'title' => 'Fundação da Propriedade',
                'description' => 'A Fazenda Ninja foi estabelecida sob a supervisão do Droid operacional.'
            ]
        ]
    ];
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $_GET['action'] ?? $input['action'] ?? 'load';

if ($action === 'load') {
    $saveData = null;
    if (file_exists($saveFile)) {
        $saveData = json_decode(file_get_contents($saveFile), true);
    }

    if (!$saveData) {
        $saveData = generateInitialStarterSave($userHash);
        file_put_contents($saveFile, json_encode($saveData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    echo json_encode([
        'success' => true,
        'save' => $saveData,
        'serverTime' => time()
    ]);
    exit;
}

if ($action === 'save') {
    $incoming = $input['save'] ?? null;
    $clientRevision = (int)($input['clientRevision'] ?? 0);

    if (!$incoming || !is_array($incoming)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Dados de save inválidos.']);
        exit;
    }

    $currentServerSave = null;
    if (file_exists($saveFile)) {
        $currentServerSave = json_decode(file_get_contents($saveFile), true);
    }

    $currentServerRevision = (int)($currentServerSave['revision'] ?? 0);

    // Controle otimista de concorrência
    if ($clientRevision < $currentServerRevision) {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'error' => 'Conflict',
            'message' => 'O save no servidor foi modificado por outra sessão mais recente.',
            'serverRevision' => $currentServerRevision,
            'serverSave' => $currentServerSave
        ]);
        exit;
    }

    $newRevision = $currentServerRevision + 1;
    $incoming['revision'] = $newRevision;
    $incoming['userId'] = $userHash;
    $incoming['savedAt'] = (int)(microtime(true) * 1000);

    file_put_contents($saveFile, json_encode($incoming, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    echo json_encode([
        'success' => true,
        'revision' => $newRevision,
        'savedAt' => $incoming['savedAt']
    ]);
    exit;
}

if ($action === 'reset') {
    $confirm = $input['confirm'] ?? false;
    if (!$confirm) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Confirmação obrigatória para apagar progresso.']);
        exit;
    }

    $freshSave = generateInitialStarterSave($userHash);
    file_put_contents($saveFile, json_encode($freshSave, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    echo json_encode([
        'success' => true,
        'message' => 'Progresso apagado com sucesso. Fazenda reinicializada do zero.',
        'save' => $freshSave
    ]);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Ação de save desconhecida.']);

