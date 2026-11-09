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
 * Ninja Farm - Google Authentication & Session Endpoint
 * Strict Production Hardened: Validates Google token aud, iss, exp, and sub.
 * Disables dev_mock in production environment.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

$rootDir = dirname(__DIR__, 2);
$configFile = __DIR__ . '/config.php';
$serverConfig = file_exists($configFile) ? require $configFile : [];

$appEnv = getenv('APP_ENV') ?: ($serverConfig['app_env'] ?? 'production');
$googleClientId = getenv('GOOGLE_CLIENT_ID') ?: ($serverConfig['google_client_id'] ?? '1029384756-ninjafarm.apps.googleusercontent.com');

$dataDir = __DIR__ . '/data';
$usersDir = $dataDir . '/users';
$sessionsDir = $dataDir . '/sessions';

foreach ([$dataDir, $usersDir, $sessionsDir] as $dir) {
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
    return null;
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $_GET['action'] ?? $input['action'] ?? 'check';

if ($action === 'config') {
    echo json_encode([
        'success' => true,
        'googleClientId' => $googleClientId,
        'appEnv' => $appEnv
    ]);
    exit;
}

if ($action === 'login') {
    $idToken = $input['id_token'] ?? '';
    $devMock = $input['dev_mock'] ?? false;

    $userData = null;

    if ($devMock) {
        // Bloqueio rigoroso em ambiente de produção
        if ($appEnv !== 'development') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error' => 'Acesso de desenvolvimento proibido em ambiente público de produção.'
            ]);
            exit;
        }

        // Permitido estritamente em ambiente local de desenvolvimento
        $devSub = 'dev_sub_' . hash('sha256', ($input['dev_user']['email'] ?? 'dev') . '_ninjalocal');
        $userData = [
            'sub' => $devSub,
            'email' => $input['dev_user']['email'] ?? 'ninja.cultivator@example.com',
            'name' => $input['dev_user']['name'] ?? 'Ninja Agroecológico (Dev)',
            'picture' => ''
        ];
    } else {
        if (empty($idToken)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'id_token é obrigatório']);
            exit;
        }

        // Validação oficial com a API do Google (Tokeninfo)
        $verifyUrl = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($idToken);
        $ctx = stream_context_create([
            'http' => [
                'timeout' => 8,
                'ignore_errors' => true
            ]
        ]);
        $response = @file_get_contents($verifyUrl, false, $ctx);
        $tokenInfo = json_decode($response, true);

        if (!$tokenInfo || empty($tokenInfo['sub'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Token do Google inválido ou não assinado.']);
            exit;
        }

        // 1. Validação de emissor (iss)
        $validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
        if (!in_array($tokenInfo['iss'] ?? '', $validIssuers, true)) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Emissor do token inválido.']);
            exit;
        }

        // 2. Validação de audiência (aud) - Client ID
        if (!empty($googleClientId) && ($tokenInfo['aud'] ?? '') !== $googleClientId) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Audiência do token (Client ID) incompatível.']);
            exit;
        }

        // 3. Validação de expiração (exp)
        if (isset($tokenInfo['exp']) && (int)$tokenInfo['exp'] < time()) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Token do Google expirado.']);
            exit;
        }

        $userData = [
            'sub' => $tokenInfo['sub'],
            'email' => $tokenInfo['email'] ?? '',
            'name' => $tokenInfo['name'] ?? 'Mestre Ninja',
            'picture' => $tokenInfo['picture'] ?? ''
        ];
    }

    $userHash = hash('sha256', 'ninja_user_' . $userData['sub']);
    $userFile = $usersDir . '/' . $userHash . '.json';

    $existing = [];
    if (file_exists($userFile)) {
        $existing = json_decode(file_get_contents($userFile), true) ?: [];
    }

    $userProfile = array_merge($existing, [
        'sub' => $userData['sub'],
        'email' => $userData['email'],
        'name' => $userData['name'],
        'picture' => $userData['picture'],
        'lastLoginAt' => time(),
        'createdAt' => $existing['createdAt'] ?? time()
    ]);

    file_put_contents($userFile, json_encode($userProfile, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    // Gera token de sessão criptograficamente seguro
    $sessionToken = bin2hex(random_bytes(32));
    $sessionData = [
        'userHash' => $userHash,
        'sub' => $userData['sub'],
        'createdAt' => time(),
        'expiresAt' => time() + (86400 * 30) // 30 dias
    ];

    file_put_contents($sessionsDir . '/' . $sessionToken . '.json', json_encode($sessionData));

    // Define cookie seguro
    setcookie('ninja_session', $sessionToken, [
        'expires' => time() + (86400 * 30),
        'path' => '/',
        'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
        'httponly' => true,
        'samesite' => 'Lax'
    ]);

    echo json_encode([
        'success' => true,
        'user' => [
            'sub' => $userProfile['sub'],
            'email' => $userProfile['email'],
            'name' => $userProfile['name'],
            'picture' => $userProfile['picture']
        ],
        'sessionToken' => $sessionToken
    ]);
    exit;
}

if ($action === 'check') {
    $token = getBearerToken();
    if (!$token) {
        echo json_encode(['authenticated' => false]);
        exit;
    }

    $sessionFile = $sessionsDir . '/' . preg_replace('/[^a-f0-9]/', '', $token) . '.json';
    if (!file_exists($sessionFile)) {
        echo json_encode(['authenticated' => false]);
        exit;
    }

    $session = json_decode(file_get_contents($sessionFile), true);
    if (!$session || $session['expiresAt'] < time()) {
        @unlink($sessionFile);
        echo json_encode(['authenticated' => false]);
        exit;
    }

    $userFile = $usersDir . '/' . $session['userHash'] . '.json';
    if (!file_exists($userFile)) {
        echo json_encode(['authenticated' => false]);
        exit;
    }

    $userProfile = json_decode(file_get_contents($userFile), true);

    echo json_encode([
        'authenticated' => true,
        'user' => [
            'sub' => $userProfile['sub'],
            'email' => $userProfile['email'],
            'name' => $userProfile['name'],
            'picture' => $userProfile['picture']
        ]
    ]);
    exit;
}

if ($action === 'logout') {
    $token = getBearerToken();
    if ($token) {
        $sessionFile = $sessionsDir . '/' . preg_replace('/[^a-f0-9]/', '', $token) . '.json';
        if (file_exists($sessionFile)) {
            @unlink($sessionFile);
        }
    }

    setcookie('ninja_session', '', [
        'expires' => time() - 3600,
        'path' => '/'
    ]);

    echo json_encode(['success' => true, 'message' => 'Desconectado com sucesso.']);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Ação inválida.']);

