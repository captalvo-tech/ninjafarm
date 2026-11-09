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
 * Enforces authenticated session, read-only system prompt, and 30-second penalty on error.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Gemini-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

$dataDir = __DIR__ . '/data';
$rateLimitsDir = $dataDir . '/rate_limits';
$sessionsDir = $dataDir . '/sessions';

foreach ([$dataDir, $rateLimitsDir, $sessionsDir] as $dir) {
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }
}

function getBearerToken(): ?string {
    $headers = getallheaders();
    if (isset($headers['Authorization']) && preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
        return $matches[1];
    }
    if (isset($_COOKIE['ninja_session'])) {
        return $_COOKIE['ninja_session'];
    }
    if (isset($_GET['token'])) {
        return $_GET['token'];
    }
    return null;
}

function getSessionUser(?string $token, string $sessionsDir): ?array {
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
    return $data['user'] ?? null;
}

$token = getBearerToken();
$user = getSessionUser($token, $sessionsDir);

if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Autenticação necessária']);
    exit;
}

$userId = hash('sha256', $user['sub'] ?? 'anonymous');
$rateLimitFile = $rateLimitsDir . '/' . $userId . '.json';

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

// Identifica a chave Gemini (passada pelo cliente ou variável de ambiente)
$apiKey = $_SERVER['HTTP_X_GEMINI_KEY'] ?? $body['apiKey'] ?? getenv('GEMINI_API_KEY');

if (!$apiKey) {
    echo json_encode([
        'success' => false,
        'mode' => 'limited',
        'message' => 'Nenhuma chave Gemini configurada. Utilize os relatórios no Modo Limitado.'
    ]);
    exit;
}

if ($action === 'test') {
    // Teste leve de conectividade
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
        echo json_encode(['success' => true, 'message' => 'Conexão com Gemini estabelecida!']);
    } else {
        // Registra erro com penalidade
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
        // Registra penalidade de 30 segundos após erro
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

