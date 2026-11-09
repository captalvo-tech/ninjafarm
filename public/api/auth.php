<?php
/**
 * Ninja Farm - Google Authentication & Session Endpoint
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
    if (isset($_GET['token'])) {
        return $_GET['token'];
    }
    return null;
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $_GET['action'] ?? $input['action'] ?? 'check';

if ($action === 'login') {
    $idToken = $input['id_token'] ?? '';
    $devMock = $input['dev_mock'] ?? false;

    $userData = null;

    if ($devMock && (isset($input['dev_user']))) {
        // Modo de desenvolvimento / testes automatizados
        $userData = [
            'sub' => $input['dev_user']['sub'] ?? 'dev_sub_12345',
            'email' => $input['dev_user']['email'] ?? 'ninja.cultivator@example.com',
            'name' => $input['dev_user']['name'] ?? 'Ninja Agroecológico',
            'picture' => $input['dev_user']['picture'] ?? ''
        ];
    } else {
        if (empty($idToken)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'id_token é obrigatório']);
            exit;
        }

        // Validação oficial com a API do Google
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
            echo json_encode(['success' => false, 'error' => 'Token do Google inválido ou expirado.']);
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
