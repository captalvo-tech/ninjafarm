<?php
/**
 * ============================================================================
 * NINJA FARM — CONTRATO OBRIGATÓRIO DO ROADMAP
 * ============================================================================
 *
 * O ROADMAP É O REGISTRO OFICIAL DA EVOLUÇÃO DESTE PROJETO.
 *
 * Qualquer alteração funcional relevante neste módulo exige:
 *
 * 1. Atualizar o registro de funcionalidades do roadmap.
 * 2. Registrar a alteração no histórico permanente.
 * 3. Atualizar a documentação técnica relacionada.
 * 4. Registrar funcionalidades adicionadas, modificadas ou removidas.
 * 5. Relacionar a mudança ao commit e aos testes realizados.
 *
 * Funcionalidades removidas DEVEM permanecer no histórico com
 * status REMOVIDO. Nunca apagar seu registro histórico.
 *
 * Documentação:
 * - docs/02-ROADMAP.md
 * - docs/19-LOG-IMPLEMENTACAO.md
 * - Registro estruturado de funcionalidades do projeto
 *
 * IMPORTANTE: Código, roadmap e documentação devem permanecer
 * sincronizados durante todo o desenvolvimento.
 * ============================================================================
 */

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
            'model' => 'gemini-2.0-flash'
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

function validateSaveData(array &$incoming, ?array $currentServerSave): ?string {
    if (!isset($incoming['version']) || (int)$incoming['version'] < 1) {
        return 'Versão do esquema de save inválida.';
    }

    if (!isset($incoming['resources']) || !is_array($incoming['resources'])) {
        return 'Recursos da fazenda ausentes ou inválidos.';
    }

    $validResources = ['wood', 'metal', 'parts', 'food', 'water', 'energy'];
    foreach ($validResources as $resKey) {
        $val = $incoming['resources'][$resKey] ?? 0;
        if (!is_numeric($val) || $val < 0) {
            return "Saldo do recurso '{$resKey}' não pode ser negativo ou não-numérico.";
        }
        if ($val > 1000000) {
            return "Saldo do recurso '{$resKey}' excede a capacidade de armazenamento.";
        }
    }

    if (!isset($incoming['buildings']) || !is_array($incoming['buildings'])) {
        return 'Estruturas da fazenda ausentes ou inválidas.';
    }

    foreach ($incoming['buildings'] as $b) {
        if (!isset($b['instanceId']) || !isset($b['type']) || !isset($b['gridX']) || !isset($b['gridY'])) {
            return 'Estrutura com dados corrompidos ou incompletos.';
        }
        $gx = (int)$b['gridX'];
        $gy = (int)$b['gridY'];
        if ($gx < 0 || $gx >= 64 || $gy < 0 || $gy >= 36) {
            return "Estrutura fora dos limites da grade 64x36 ({$gx}, {$gy}).";
        }
    }

    if (isset($incoming['droid']) && is_array($incoming['droid'])) {
        $battery = (float)($incoming['droid']['battery'] ?? 0);
        if ($battery < 0.0 || $battery > 100.0) {
            return 'Bateria do Droid fora dos limites operacionais (0 a 100%).';
        }
    }

    return null;
}

function saveStateAtomically(string $saveFile, array $data): bool {
    $dir = dirname($saveFile);
    $tmpFile = $dir . '/tmp_save_' . bin2hex(random_bytes(8)) . '.json';
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    if (file_put_contents($tmpFile, $json, LOCK_EX) === false) {
        return false;
    }
    @chmod($tmpFile, 0644);
    if (!@rename($tmpFile, $saveFile)) {
        @unlink($tmpFile);
        return file_put_contents($saveFile, $json, LOCK_EX) !== false;
    }
    return true;
}

function simulateServerAuthoritativeAFK(array &$saveData, int $nowSec): array {
    $lastSec = (int)(($saveData['savedAt'] ?? 0) / 1000);
    if ($lastSec <= 0) return ['elapsedSeconds' => 0];
    $elapsedSeconds = max(0, $nowSec - $lastSec);
    if ($elapsedSeconds < 10) return ['elapsedSeconds' => $elapsedSeconds];

    $simSeconds = min($elapsedSeconds, 86400 * 30); // Limite de 30 dias por lote
    $dayCycleDuration = 240.0;
    $daysAdvanced = $simSeconds / $dayCycleDuration;
    $currentDayTime = fmod(($saveData['dayTime'] ?? 0.35) + $daysAdvanced, 1.0);
    $saveData['dayTime'] = $currentDayTime;
    $saveData['elapsedGameDays'] = ($saveData['elapsedGameDays'] ?? 1) + (int)$daysAdvanced;

    $solarPanels = 0;
    if (isset($saveData['buildings']) && is_array($saveData['buildings'])) {
        foreach ($saveData['buildings'] as $b) {
            if (($b['type'] ?? '') === 'solar_panel' && empty($b['isBlueprint'])) {
                $solarPanels++;
            }
        }
    }
    $solarWhGenerated = $solarPanels * 18.0 * ($simSeconds / 3600.0) * 0.35;
    $saveData['resources']['energy'] = min(500.0, ($saveData['resources']['energy'] ?? 50) + $solarWhGenerated);

    $maturedCrops = 0;
    if (isset($saveData['crops']) && is_array($saveData['crops'])) {
        foreach ($saveData['crops'] as &$crop) {
            if (($crop['stage'] ?? '') === 'growing') {
                if ($simSeconds >= 90.0) {
                    $crop['stage'] = 'ready';
                    $crop['growthProgress'] = 1.0;
                    $maturedCrops++;
                }
            }
        }
    }

    $eggsProduced = 0;
    if (isset($saveData['animals']) && is_array($saveData['animals'])) {
        $hours = $simSeconds / 3600.0;
        foreach ($saveData['animals'] as &$animal) {
            if (($animal['type'] ?? '') === 'chicken') {
                $animal['hunger'] = min(100.0, ($animal['hunger'] ?? 20) + ($hours * 15.0));
                if ($animal['hunger'] < 80.0 && $hours >= 2.0) {
                    $eggs = (int)floor($hours / 2.0);
                    $eggsProduced += $eggs;
                    $animal['readyToCollect'] = true;
                }
            }
        }
    }

    $tasksCompleted = 0;
    if (isset($saveData['scheduler']['tasks']) && is_array($saveData['scheduler']['tasks'])) {
        $battery = (float)($saveData['droid']['battery'] ?? 100);
        $remainingTime = (float)$simSeconds;

        foreach ($saveData['scheduler']['tasks'] as &$task) {
            if (($task['status'] ?? '') === 'PENDING' || ($task['status'] ?? '') === 'IN_PROGRESS') {
                $duration = (float)($task['duration'] ?? 15.0);
                if ($battery < 15.0) {
                    $task['status'] = 'WAITING_RESOURCES';
                    break;
                }
                if ($remainingTime >= $duration) {
                    $remainingTime -= $duration;
                    $battery = max(0.0, $battery - 15.0);
                    $task['status'] = 'COMPLETED';
                    $task['progress'] = 1.0;
                    $tasksCompleted++;
                    if (str_contains($task['type'] ?? '', 'harvest')) {
                        $saveData['resources']['food'] = ($saveData['resources']['food'] ?? 0) + 12;
                    } elseif (str_contains($task['type'] ?? '', 'clean_debris')) {
                        $saveData['resources']['wood'] = ($saveData['resources']['wood'] ?? 0) + 8;
                    }
                } else {
                    $task['status'] = 'IN_PROGRESS';
                    $task['progress'] = min(0.99, ($task['progress'] ?? 0) + ($remainingTime / $duration));
                    break;
                }
            }
        }
        $saveData['droid']['battery'] = $battery;
    }

    $saveData['savedAt'] = $nowSec * 1000;

    return [
        'elapsedSeconds' => $simSeconds,
        'solarWhGenerated' => round($solarWhGenerated, 1),
        'maturedCrops' => $maturedCrops,
        'eggsProduced' => $eggsProduced,
        'tasksCompleted' => $tasksCompleted
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
        saveStateAtomically($saveFile, $saveData);
    } else {
        // Reconciliação autoritativa AFK offline no servidor
        $afkResult = simulateServerAuthoritativeAFK($saveData, time());
        if (($afkResult['elapsedSeconds'] ?? 0) > 10) {
            saveStateAtomically($saveFile, $saveData);
        }
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

    // Validação econômica e estrutural no backend
    $validationError = validateSaveData($incoming, $currentServerSave);
    if ($validationError !== null) {
        http_response_code(422);
        echo json_encode(['success' => false, 'error' => $validationError]);
        exit;
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

    saveStateAtomically($saveFile, $incoming);

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

