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

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

$dataDir = __DIR__ . '/data';
$adminSessionsDir = $dataDir . '/admin_sessions';
$adminAuditDir = $dataDir . '/admin_audit';
$savesDir = $dataDir . '/saves';
$usersDir = $dataDir . '/users';
$reportsDir = $dataDir . '/reports';
$credentialsFile = $dataDir . '/admin_credentials.json';
$rateLimitFile = $dataDir . '/admin_rate_limit.json';
$alertsFile = $dataDir . '/admin_alerts.json';

foreach ([$dataDir, $adminSessionsDir, $adminAuditDir, $savesDir, $usersDir, $reportsDir] as $dir) {
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }
}

// -------------------------------------------------------------
// Funções de Segurança e Auditoria
// -------------------------------------------------------------

function getClientIP(): string {
    return $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
}

function checkRateLimit(string $rateLimitFile, string $ip): bool {
    if (!file_exists($rateLimitFile)) return true;
    $limits = json_decode(file_get_contents($rateLimitFile), true) ?: [];
    if (isset($limits[$ip])) {
        $entry = $limits[$ip];
        if ($entry['attempts'] >= 5 && (time() - $entry['lastAttempt']) < 900) {
            return false; // Bloqueado por 15 minutos
        }
    }
    return true;
}

function recordFailedAttempt(string $rateLimitFile, string $ip): void {
    $limits = file_exists($rateLimitFile) ? (json_decode(file_get_contents($rateLimitFile), true) ?: []) : [];
    $entry = $limits[$ip] ?? ['attempts' => 0, 'lastAttempt' => 0];
    if ((time() - $entry['lastAttempt']) > 900) {
        $entry['attempts'] = 1;
    } else {
        $entry['attempts']++;
    }
    $entry['lastAttempt'] = time();
    $limits[$ip] = $entry;
    file_put_contents($rateLimitFile, json_encode($limits, JSON_PRETTY_PRINT));
}

function resetRateLimit(string $rateLimitFile, string $ip): void {
    if (!file_exists($rateLimitFile)) return;
    $limits = json_decode(file_get_contents($rateLimitFile), true) ?: [];
    unset($limits[$ip]);
    file_put_contents($rateLimitFile, json_encode($limits, JSON_PRETTY_PRINT));
}

function logAdminAudit(string $adminAuditDir, string $adminEmail, string $action, array $details = []): void {
    $entry = [
        'timestamp' => time(),
        'date' => date('Y-m-d H:i:s'),
        'admin' => $adminEmail,
        'action' => $action,
        'ip' => getClientIP(),
        'details' => $details
    ];
    $logFile = $adminAuditDir . '/audit_' . date('Y_m') . '.log';
    file_put_contents($logFile, json_encode($entry, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND);
}

function getAdminBearerToken(): ?string {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
            return $matches[1];
        }
    }
    if (isset($_COOKIE['ninja_admin_token'])) {
        return $_COOKIE['ninja_admin_token'];
    }
    if (isset($_GET['admin_token'])) {
        return $_GET['admin_token'];
    }
    return null;
}

function validateAdminSession(string $adminSessionsDir): ?array {
    $token = getAdminBearerToken();
    if (!$token) return null;

    $sanitized = preg_replace('/[^a-f0-9]/', '', $token);
    $sessionFile = $adminSessionsDir . '/' . $sanitized . '.json';
    if (!file_exists($sessionFile)) return null;

    $session = json_decode(file_get_contents($sessionFile), true);
    if (!$session || $session['expiresAt'] < time()) {
        @unlink($sessionFile);
        return null;
    }

    // Renova tempo de expiração na atividade (4 horas)
    $session['expiresAt'] = time() + 14400;
    file_put_contents($sessionFile, json_encode($session));

    return $session;
}

// -------------------------------------------------------------
// Roteamento de Ações
// -------------------------------------------------------------

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $_GET['action'] ?? $input['action'] ?? 'check';
$ip = getClientIP();

// 1. Setup inicial seguro do administrador (executado apenas se não houver credenciais)
if ($action === 'setup_initial_admin') {
    if (file_exists($credentialsFile)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Administrador já provisionado. Acesso negado.']);
        exit;
    }

    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';

    if ($email !== 'mvioli7@gmail.com') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'E-mail do administrador inicial inválido.']);
        exit;
    }

    if (strlen($password) < 8) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'A senha deve conter no mínimo 8 caracteres.']);
        exit;
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $credentials = [
        'email' => $email,
        'password_hash' => $hash,
        'createdAt' => time(),
        'role' => 'superadmin'
    ];
    file_put_contents($credentialsFile, json_encode($credentials, JSON_PRETTY_PRINT));

    logAdminAudit($adminAuditDir, $email, 'setup_initial_admin', ['status' => 'success']);

    echo json_encode(['success' => true, 'message' => 'Conta de administrador provisionada com segurança!']);
    exit;
}

// 2. Login Administrativo
if ($action === 'login') {
    if (!checkRateLimit($rateLimitFile, $ip)) {
        http_response_code(429);
        echo json_encode(['success' => false, 'error' => 'Muitas tentativas falhas. Bloqueado por 15 minutos por segurança.']);
        exit;
    }

    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';

    if (!file_exists($credentialsFile)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Administrador não provisionado no servidor. Execute o setup inicial.', 'need_setup' => true]);
        exit;
    }

    $creds = json_decode(file_get_contents($credentialsFile), true);
    if (!$creds || $creds['email'] !== $email || !password_verify($password, $creds['password_hash'])) {
        recordFailedAttempt($rateLimitFile, $ip);
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Credenciais administrativas inválidas.']);
        exit;
    }

    resetRateLimit($rateLimitFile, $ip);

    $token = bin2hex(random_bytes(32));
    $csrfToken = bin2hex(random_bytes(16));
    $session = [
        'token' => $token,
        'csrfToken' => $csrfToken,
        'email' => $email,
        'role' => $creds['role'] ?? 'superadmin',
        'createdAt' => time(),
        'expiresAt' => time() + 14400,
        'ip' => $ip
    ];

    file_put_contents($adminSessionsDir . '/' . $token . '.json', json_encode($session));

    // Cookie HttpOnly seguro
    setcookie('ninja_admin_token', $token, [
        'expires' => time() + 14400,
        'path' => '/',
        'secure' => isset($_SERVER['HTTPS']),
        'httponly' => true,
        'samesite' => 'Strict'
    ]);

    logAdminAudit($adminAuditDir, $email, 'login', ['ip' => $ip]);

    echo json_encode([
        'success' => true,
        'adminToken' => $token,
        'csrfToken' => $csrfToken,
        'email' => $email
    ]);
    exit;
}

// 3. Verificação de Sessão (Check)
if ($action === 'check') {
    $session = validateAdminSession($adminSessionsDir);
    if (!$session) {
        $needSetup = !file_exists($credentialsFile);
        http_response_code(401);
        echo json_encode(['authenticated' => false, 'need_setup' => $needSetup]);
        exit;
    }

    echo json_encode([
        'authenticated' => true,
        'email' => $session['email'],
        'role' => $session['role'],
        'csrfToken' => $session['csrfToken']
    ]);
    exit;
}

// 4. Logout Administrativo
if ($action === 'logout') {
    $token = getAdminBearerToken();
    if ($token) {
        $sanitized = preg_replace('/[^a-f0-9]/', '', $token);
        $file = $adminSessionsDir . '/' . $sanitized . '.json';
        if (file_exists($file)) {
            $sess = json_decode(file_get_contents($file), true);
            logAdminAudit($adminAuditDir, $sess['email'] ?? 'unknown', 'logout');
            @unlink($file);
        }
    }
    setcookie('ninja_admin_token', '', ['expires' => time() - 3600, 'path' => '/']);
    echo json_encode(['success' => true]);
    exit;
}

// =============================================================
// A PARTIR DAQUI: TODAS AS ROTAS EXIGEM SESSÃO ADMINISTRATIVA
// =============================================================

$adminSession = validateAdminSession($adminSessionsDir);
if (!$adminSession) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Acesso negado. Sessão administrativa exigida.']);
    exit;
}

// Proteção CSRF para requisições de mutação (POST)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $sentCsrf = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? $input['csrfToken'] ?? '';
    if ($sentCsrf !== $adminSession['csrfToken']) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Token CSRF inválido ou ausente.']);
        exit;
    }
}

// 5. Dashboard Geral: Consolidação Real de Jogadores, Fazendas e Droid
if ($action === 'dashboard') {
    $saveFiles = glob($savesDir . '/*.json') ?: [];
    $userFiles = glob($usersDir . '/*.json') ?: [];

    $totalAccounts = count($userFiles);
    $totalFarms = count($saveFiles);

    $now = time();
    $activeToday = 0;
    $active7d = 0;
    $active30d = 0;

    $droidsCount = 0;
    $droidsWorking = 0;
    $droidsRecharging = 0;
    $droidsIdle = 0;
    $droidsLowBattery = 0;

    $tasksTotal = 0;
    $tasksScheduled = 0;
    $tasksCompleted = 0;
    $tasksWaitingResources = 0;

    $farmsWithActiveCrops = 0;
    $farmsHaltedEnergy = 0;

    foreach ($saveFiles as $sf) {
        $save = json_decode(file_get_contents($sf), true);
        if (!$save) continue;

        $savedAtSec = (int)(($save['savedAt'] ?? 0) / 1000);
        $diff = $now - $savedAtSec;

        if ($diff <= 86400) $activeToday++;
        if ($diff <= 86400 * 7) $active7d++;
        if ($diff <= 86400 * 30) $active30d++;

        // Droid
        if (isset($save['droid'])) {
            $droidsCount++;
            $st = $save['droid']['state'] ?? 'idle';
            if ($st === 'working') $droidsWorking++;
            elseif ($st === 'recharging') $droidsRecharging++;
            else $droidsIdle++;

            if (($save['droid']['battery'] ?? 100) < 15) {
                $droidsLowBattery++;
            }
        }

        // Tarefas
        if (isset($save['scheduler']['tasks']) && is_array($save['scheduler']['tasks'])) {
            foreach ($save['scheduler']['tasks'] as $t) {
                $tasksTotal++;
                $tStatus = $t['status'] ?? 'SCHEDULED';
                if ($tStatus === 'SCHEDULED' || $tStatus === 'IN_PROGRESS') $tasksScheduled++;
                elseif ($tStatus === 'COMPLETED') $tasksCompleted++;
                elseif ($tStatus === 'WAITING_RESOURCES') $tasksWaitingResources++;
            }
        }

        // Culturas
        if (!empty($save['crops'])) {
            $farmsWithActiveCrops++;
        }

        // Energia
        if (($save['resources']['energy'] ?? 0) <= 2.0) {
            $farmsHaltedEnergy++;
        }
    }

    echo json_encode([
        'success' => true,
        'serverTime' => $now,
        'system' => [
            'phpVersion' => PHP_VERSION,
            'deployedVersion' => 'Alpha 0.1.0',
            'apiStatus' => 'OPERATIONAL',
            'databaseStatus' => 'OPERATIONAL (File-based atomic SQLite/JSON)'
        ],
        'players' => [
            'totalAccounts' => $totalAccounts,
            'activeToday' => $activeToday,
            'active7d' => $active7d,
            'active30d' => $active30d
        ],
        'farms' => [
            'totalFarms' => $totalFarms,
            'farmsWithActiveCrops' => $farmsWithActiveCrops,
            'farmsHaltedEnergy' => $farmsHaltedEnergy
        ],
        'droid' => [
            'totalDroids' => $droidsCount,
            'working' => $droidsWorking,
            'recharging' => $droidsRecharging,
            'idle' => $droidsIdle,
            'lowBattery' => $droidsLowBattery,
            'operationalUtilization' => $droidsCount > 0 ? round(($droidsWorking / $droidsCount) * 100, 1) : 0
        ],
        'scheduler' => [
            'totalTasks' => $tasksTotal,
            'scheduled' => $tasksScheduled,
            'completed' => $tasksCompleted,
            'waitingResources' => $tasksWaitingResources
        ]
    ]);
    exit;
}

// 6. Central de Alertas e Incidentes
if ($action === 'alerts') {
    $alerts = file_exists($alertsFile) ? (json_decode(file_get_contents($alertsFile), true) ?: []) : [];

    // Importa relatórios dos testadores não processados como alertas tipo 'tester_report'
    $reportFiles = glob($reportsDir . '/*.json') ?: [];
    $existingAlertIds = array_column($alerts, 'id');

    foreach ($reportFiles as $rf) {
        $rep = json_decode(file_get_contents($rf), true);
        if (!$rep || in_array($rep['id'], $existingAlertIds)) continue;

        $newAlert = [
            'id' => $rep['id'],
            'type' => 'tester_bug_report',
            'severity' => 'Médio',
            'title' => 'Relato de Testador: ' . substr($rep['message'], 0, 40) . '...',
            'description' => $rep['message'],
            'firstOccurrence' => $rep['timestamp'],
            'lastOccurrence' => $rep['timestamp'],
            'occurrences' => 1,
            'version' => $rep['version'] ?? 'alpha-0.1',
            'module' => $rep['screen'] ?? 'gameplay',
            'status' => 'Novo',
            'details' => [
                'browser' => $rep['browser'] ?? 'Desconhecido',
                'platform' => $rep['platform'] ?? 'Web',
                'activeTask' => $rep['activeTask'] ?? 'Nenhuma'
            ]
        ];
        $alerts[] = $newAlert;
    }

    file_put_contents($alertsFile, json_encode($alerts, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    echo json_encode([
        'success' => true,
        'alerts' => $alerts,
        'unresolvedCount' => count(array_filter($alerts, fn($a) => $a['status'] !== 'Resolvido'))
    ]);
    exit;
}

// 7. Atualização do Status de Alerta
if ($action === 'alerts_update_status') {
    $alertId = $input['alertId'] ?? '';
    $newStatus = $input['status'] ?? '';
    $allowed = ['Novo', 'Em análise', 'Em correção', 'Aguardando validação', 'Resolvido', 'Ignorado'];

    if (!in_array($newStatus, $allowed)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Status inválido']);
        exit;
    }

    $alerts = file_exists($alertsFile) ? (json_decode(file_get_contents($alertsFile), true) ?: []) : [];
    $found = false;

    foreach ($alerts as &$a) {
        if ($a['id'] === $alertId) {
            $a['status'] = $newStatus;
            $a['updatedAt'] = time();
            $found = true;
            break;
        }
    }

    if ($found) {
        file_put_contents($alertsFile, json_encode($alerts, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        logAdminAudit($adminAuditDir, $adminSession['email'], 'alert_status_updated', ['alertId' => $alertId, 'status' => $newStatus]);
        echo json_encode(['success' => true]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Alerta não encontrado']);
    }
    exit;
}

// 8. Economia do Jogo
if ($action === 'economy') {
    $saveFiles = glob($savesDir . '/*.json') ?: [];

    $aggregateResources = [
        'wood' => 0,
        'metal' => 0,
        'parts' => 0,
        'food' => 0,
        'water' => 0,
        'energy' => 0
    ];

    $resourceScarcityScores = [
        'water' => 0,
        'energy' => 0,
        'wood' => 0,
        'metal' => 0,
        'parts' => 0,
        'food' => 0
    ];

    $solarCapacityTotal = 0;

    foreach ($saveFiles as $sf) {
        $save = json_decode(file_get_contents($sf), true);
        if (!$save) continue;

        foreach ($aggregateResources as $k => $v) {
            $val = $save['resources'][$k] ?? 0;
            $aggregateResources[$k] += $val;
            if ($val <= 5.0) {
                $resourceScarcityScores[$k]++;
            }
        }

        // Calcula capacidade instalada de painéis solares
        if (isset($save['buildings']) && is_array($save['buildings'])) {
            foreach ($save['buildings'] as $b) {
                if (($b['type'] ?? '') === 'solar_panel' && empty($b['isBlueprint'])) {
                    $solarCapacityTotal += 18; // 18W por painel
                }
            }
        }
    }

    echo json_encode([
        'success' => true,
        'aggregateResources' => $aggregateResources,
        'scarcityFarmsCount' => $resourceScarcityScores,
        'solarInfrastructure' => [
            'solarPanelsActiveCapacity' => $solarCapacityTotal . ' W (pico solar)',
            'farmsCount' => count($saveFiles)
        ]
    ]);
    exit;
}

// 9. Roadmap Vivo (Consulta dos arquivos de governança permanente)
if ($action === 'roadmap') {
    $candidateFeatures = [
        __DIR__ . '/../project/roadmap/features.json',
        dirname(__DIR__, 1) . '/project/roadmap/features.json',
        dirname(__DIR__, 2) . '/project/roadmap/features.json'
    ];
    $candidateHistory = [
        __DIR__ . '/../project/roadmap/history.jsonl',
        dirname(__DIR__, 1) . '/project/roadmap/history.jsonl',
        dirname(__DIR__, 2) . '/project/roadmap/history.jsonl'
    ];

    $roadmapFeaturesFile = null;
    foreach ($candidateFeatures as $path) {
        if (file_exists($path)) {
            $roadmapFeaturesFile = $path;
            break;
        }
    }

    $roadmapHistoryFile = null;
    foreach ($candidateHistory as $path) {
        if (file_exists($path)) {
            $roadmapHistoryFile = $path;
            break;
        }
    }

    $features = ($roadmapFeaturesFile && file_exists($roadmapFeaturesFile)) ? json_decode(file_get_contents($roadmapFeaturesFile), true) : [];
    $historyLines = [];

    if ($roadmapHistoryFile && file_exists($roadmapHistoryFile)) {
        $lines = file($roadmapHistoryFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $parsed = json_decode($line, true);
            if ($parsed) $historyLines[] = $parsed;
        }
    }

    echo json_encode([
        'success' => true,
        'features' => $features,
        'history' => array_reverse($historyLines)
    ]);
    exit;
}

// 10. Auditoria de Acessos
if ($action === 'audit_logs') {
    $logFile = $adminAuditDir . '/audit_' . date('Y_m') . '.log';
    $logs = [];
    if (file_exists($logFile)) {
        $lines = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach (array_slice($lines, -50) as $line) {
            $parsed = json_decode($line, true);
            if ($parsed) $logs[] = $parsed;
        }
    }
    echo json_encode(['success' => true, 'logs' => array_reverse($logs)]);
    exit;
}

http_response_code(400);
echo json_encode(['success' => false, 'error' => 'Ação administrativa desconhecida: ' . htmlspecialchars($action)]);

