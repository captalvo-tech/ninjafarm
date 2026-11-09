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
 * Ninja Farm - Gemini AI Read-Only Assistant Endpoint
 * Production Hardened: Encrypted credentials at rest per user, read-only system prompt,
 * rate limit penalty on error, and support for key set/delete/test actions.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

$dataDir = __DIR__ . '/data';
$rateLimitsDir = $dataDir . '/rate_limits';
$sessionsDir = $dataDir . '/sessions';
$usersDir = $dataDir . '/users';

foreach ([$dataDir, $rateLimitsDir, $sessionsDir, $usersDir] as $dir) {
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }
}

function getMasterEncryptionKey(): string {
    $configFile = __DIR__ . '/config.php';
    if (file_exists($configFile)) {
        $cfg = require $configFile;
        if (!empty($cfg['app_key'])) return hash('sha256', $cfg['app_key'], true);
    }
    $envKey = getenv('APP_KEY');
    if (!empty($envKey)) return hash('sha256', $envKey, true);

    $masterKeyFile = __DIR__ . '/data/master.key';
    if (file_exists($masterKeyFile)) {
        return file_get_contents($masterKeyFile);
    }
    $newKey = random_bytes(32);
    @file_put_contents($masterKeyFile, $newKey);
    @chmod($masterKeyFile, 0600);
    return $newKey;
}

function encryptKey(string $plainText, string $masterKey): string {
    $iv = random_bytes(16);
    $ciphertext = openssl_encrypt($plainText, 'AES-256-CBC', $masterKey, OPENSSL_RAW_DATA, $iv);
    return base64_encode($iv . $ciphertext);
}

function decryptKey(string $encryptedData, string $masterKey): ?string {
    $raw = base64_decode($encryptedData, true);
    if (!$raw || strlen($raw) < 17) return null;
    $iv = substr($raw, 0, 16);
    $ciphertext = substr($raw, 16);
    $decrypted = openssl_decrypt($ciphertext, 'AES-256-CBC', $masterKey, OPENSSL_RAW_DATA, $iv);
    return $decrypted !== false ? $decrypted : null;
}

function getBearerToken(): ?string {
    $headers = getallheaders();
    if (isset($headers['Authorization']) && preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
        return $matches[1];
    }
    if (isset($_COOKIE['ninja_session'])) {
        return $_COOKIE['ninja_session'];
    }
    return null;
}

function getSessionUser(?string $token, string $sessionsDir, string $usersDir): ?array {
    if (!$token || !preg_match('/^[a-f0-9]{64}$/', $token)) {
        return null;
    }
    $sessionFile = $sessionsDir . '/' . $token . '.json';
    if (!file_exists($sessionFile)) {
        return null;
    }
    $data = json_decode(file_get_contents($sessionFile), true);
    if (!$data || !isset($data['expiresAt']) || $data['expiresAt'] < time()) {
        @unlink($sessionFile);
        return null;
    }
    $userHash = $data['userHash'] ?? hash('sha256', 'ninja_user_' . ($data['sub'] ?? ''));
    $userFile = $usersDir . '/' . $userHash . '.json';
    if (file_exists($userFile)) {
        $profile = json_decode(file_get_contents($userFile), true);
        if ($profile) return $profile;
    }
    return ['sub' => $data['sub'] ?? 'anonymous', 'userHash' => $userHash];
}

$token = getBearerToken();
$user = getSessionUser($token, $sessionsDir, $usersDir);

if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Autenticação necessária']);
    exit;
}

$userHash = $user['userHash'] ?? hash('sha256', 'ninja_user_' . ($user['sub'] ?? 'anonymous'));
$rateLimitFile = $rateLimitsDir . '/' . $userHash . '.json';
$userKeyFile = $usersDir . '/' . $userHash . '_gemini.enc';
$masterKey = getMasterEncryptionKey();

// Checa penalidade de 30 segundos
if (file_exists($rateLimitFile)) {
    $limitData = json_decode(file_get_contents($rateLimitFile), true);
    if ($limitData && isset($limitData['lastErrorTime'])) {
        $elapsed = time() - $limitData['lastErrorTime'];
        if ($elapsed < 30) {
            http_response_code(429);
            echo json_encode([
                'success' => false,
                'error' => 'Intervalo de segurança ativo após erro. Aguarde 30 segundos.',
                'remainingSeconds' => 30 - $elapsed
            ]);
            exit;
        }
    }
}

$rawInput = file_get_contents('php://input');
$body = json_decode($rawInput, true) ?: [];
$action = $_GET['action'] ?? $body['action'] ?? 'query';

// 1. Salvar chave pessoal criptografada
if ($action === 'set_key') {
    $apiKey = trim($body['apiKey'] ?? '');
    if (empty($apiKey) || strlen($apiKey) < 20) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Chave da API inválida ou incompleta.']);
        exit;
    }

    $encrypted = encryptKey($apiKey, $masterKey);
    file_put_contents($userKeyFile, $encrypted);
    @chmod($userKeyFile, 0600);

    $masked = substr($apiKey, 0, 6) . '...' . substr($apiKey, -4);
    echo json_encode([
        'success' => true,
        'message' => 'Chave pessoal do Gemini criptografada e salva com sucesso no servidor.',
        'maskedKey' => $masked
    ]);
    exit;
}

// 2. Consultar status da chave pessoal
if ($action === 'get_key_status') {
    $hasKey = file_exists($userKeyFile);
    $masked = '';
    if ($hasKey) {
        $encrypted = file_get_contents($userKeyFile);
        $decrypted = decryptKey($encrypted, $masterKey);
        if ($decrypted && strlen($decrypted) >= 10) {
            $masked = substr($decrypted, 0, 6) . '...' . substr($decrypted, -4);
        }
    }
    echo json_encode([
        'success' => true,
        'hasCustomKey' => $hasKey,
        'maskedKey' => $masked,
        'model' => 'gemini-2.0-flash'
    ]);
    exit;
}

// 3. Remover chave pessoal
if ($action === 'delete_key') {
    if (file_exists($userKeyFile)) {
        @unlink($userKeyFile);
    }
    echo json_encode(['success' => true, 'message' => 'Chave pessoal removida. Jogo retornado ao Modo Limitado.']);
    exit;
}

// Recupera a chave para test ou query (do usuário ou fallback do servidor)
$apiKey = null;
if (file_exists($userKeyFile)) {
    $encrypted = file_get_contents($userKeyFile);
    $apiKey = decryptKey($encrypted, $masterKey);
}
if (!$apiKey) {
    $apiKey = getenv('GEMINI_API_KEY') ?: null;
}

if (!$apiKey) {
    echo json_encode([
        'success' => false,
        'mode' => 'limited',
        'message' => 'Nenhuma chave Gemini configurada. Utilize os relatórios no Modo Limitado.'
    ]);
    exit;
}

if ($action === 'test') {
    $testUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" . urlencode($apiKey);
    $payload = json_encode([
        'contents' => [
            ['parts' => [['text' => 'Responda apenas: OK']]]
        ]
    ]);

    $ch = curl_init($testUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $res = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        echo json_encode(['success' => true, 'message' => 'Conexão com Gemini 2.0 Flash validada com sucesso!']);
    } else {
        file_put_contents($rateLimitFile, json_encode(['lastErrorTime' => time()]));
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Chave inválida ou cota excedida.', 'httpCode' => $httpCode]);
    }
    exit;
}

if ($action === 'query') {
    $question = trim($body['question'] ?? '');
    $farmContext = $body['context'] ?? [];

    if (empty($question)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Pergunta vazia']);
        exit;
    }

    $systemInstruction = "Você é a Unidade Droid Shinobi de Ninja Farm, um robô humanoide autônomo responsável pela manutenção física da propriedade.
Você é educado, prático, objetivo e leal ao mestre Ninja.
REGRAS FUNDAMENTAIS:
1. Você é SOMENTE LEITURA. Você NÃO pode executar ações no mundo, modificar recursos, enfileirar tarefas ou alterar o jogo pelo chat.
2. Seu papel é explicar o estado da fazenda, tirar dúvidas sobre plantios, água, energia e sugerir os próximos passos estratégicos para o Ninja.
3. Responda em português de forma concisa e amigável, usando emojis temáticos quando apropriado.
Contexto atual da fazenda:\n" . json_encode($farmContext, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

    $geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" . urlencode($apiKey);
    $geminiPayload = json_encode([
        'system_instruction' => [
            'parts' => [['text' => $systemInstruction]]
        ],
        'contents' => [
            ['role' => 'user', 'parts' => [['text' => $question]]]
        ],
        'generationConfig' => [
            'temperature' => 0.4,
            'maxOutputTokens' => 600
        ]
    ]);

    $ch = curl_init($geminiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $geminiPayload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 && $response) {
        $json = json_decode($response, true);
        $reply = $json['candidates'][0]['content']['parts'][0]['text'] ?? 'Desculpe, mestre. Não consegui processar essa resposta.';
        echo json_encode(['success' => true, 'reply' => $reply]);
    } else {
        file_put_contents($rateLimitFile, json_encode(['lastErrorTime' => time()]));
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Erro na resposta do Gemini. Bloqueio de segurança de 30s ativado.',
            'remainingSeconds' => 30
        ]);
    }
    exit;
}

