<?php
/**
 * ============================================================================
 * NINJA FARM — CONTRATO OBRIGATÓRIO DO ROADMAP
 * ============================================================================
 *
 * Script CLI de provisionamento e redefinição segura do Administrador.
 * Não armazena nem expõe senhas em texto plano.
 * Gera hash com salt utilizando password_hash(..., PASSWORD_DEFAULT).
 * ============================================================================
 */

if (php_sapi_name() !== 'cli') {
    die("Este script só pode ser executado via linha de comando (CLI).\n");
}

$rootDir = dirname(__DIR__);
$dataDir = $rootDir . '/public/api/data';
$credentialsFile = $dataDir . '/admin_credentials.json';
$auditDir = $dataDir . '/admin_audit';

if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0750, true);
}
if (!is_dir($auditDir)) {
    @mkdir($auditDir, 0750, true);
}

$email = 'mvioli7@gmail.com';

echo "========================================================\n";
echo " NINJA FARM — PROVISIONAMENTO DO SUPERADMINISTRADOR\n";
echo "========================================================\n\n";

$password = $argv[1] ?? null;

if (!$password) {
    echo "Informe a senha desejada para {$email}: ";
    $handle = fopen("php://stdin", "r");
    $password = trim(fgets($handle));
    fclose($handle);
}

if (strlen($password) < 8) {
    echo "❌ Erro: A senha deve possuir no mínimo 8 caracteres.\n";
    exit(1);
}

$hash = password_hash($password, PASSWORD_DEFAULT);

$credentials = [
    'email' => $email,
    'password_hash' => $hash,
    'createdAt' => time(),
    'updatedAt' => time(),
    'role' => 'superadmin'
];

if (file_put_contents($credentialsFile, json_encode($credentials, JSON_PRETTY_PRINT))) {
    @chmod($credentialsFile, 0600);

    $auditEntry = [
        'timestamp' => time(),
        'date' => date('Y-m-d H:i:s'),
        'admin' => $email,
        'action' => 'cli_provision_admin',
        'ip' => 'CLI',
        'details' => ['status' => 'success']
    ];
    $logFile = $auditDir . '/audit_' . date('Y_m') . '.log';
    file_put_contents($logFile, json_encode($auditEntry, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND);

    echo "✅ Superadministrador [{$email}] provisionado com sucesso!\n";
    echo "📁 Credenciais salvas de forma segura em public/api/data/admin_credentials.json (hash com salt).\n";
} else {
    echo "❌ Falha ao gravar arquivo de credenciais.\n";
    exit(1);
}
