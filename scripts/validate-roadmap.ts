/**
 * ============================================================================
 * NINJA FARM — CONTRATO OBRIGATÓRIO DO ROADMAP
 * ============================================================================
 *
 * Script de validação contínua da governança do Roadmap Vivo.
 * Executado localmente e no CI/CD para garantir sincronismo estrito entre:
 * 1. Código-fonte (cabeçalhos obrigatórios de contrato em módulos core)
 * 2. Catálogo de funcionalidades (`project/roadmap/features.json`)
 * 3. Histórico permanente append-only (`project/roadmap/history.jsonl`)
 * ============================================================================
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const FEATURES_PATH = path.join(ROOT_DIR, 'project', 'roadmap', 'features.json');
const HISTORY_PATH = path.join(ROOT_DIR, 'project', 'roadmap', 'history.jsonl');

const MANDATORY_HEADER_SIGNATURE = 'NINJA FARM — CONTRATO OBRIGATÓRIO DO ROADMAP';

const CORE_MODULES_TO_CHECK = [
    'src/main.ts',
    'src/core/config.ts',
    'src/core/grid.ts',
    'src/core/telemetry.ts',
    'src/simulation/clock.ts',
    'src/simulation/energy.ts',
    'src/simulation/water.ts',
    'src/simulation/crops.ts',
    'src/simulation/inventory.ts',
    'src/simulation/task-scheduler.ts',
    'src/simulation/event-journal.ts',
    'src/simulation/time-simulator.ts',
    'src/rendering/droid.ts',
    'src/rendering/fauna.ts',
    'src/rendering/character.ts',
    'src/rendering/models.ts',
    'src/persistence/auth.ts',
    'src/persistence/cloud-save.ts',
    'src/ai/gemini-service.ts',
    'src/ui/hud.ts',
    'src/ui/tutorial.ts',
    'src/ui/bug-report.ts',
    'public/api/admin.php',
    'public/api/auth.php',
    'public/api/save.php',
    'public/api/ai.php',
    'public/api/report.php'
];

interface FeatureRecord {
    id: string;
    name: string;
    description: string;
    category: string;
    phase: number;
    status: 'PLANEJADO' | 'EM_DESENVOLVIMENTO' | 'IMPLEMENTADO' | 'VALIDADO' | 'DEPRECIADO' | 'REMOVIDO';
    addedAt: string;
    implementedAt?: string | null;
    validatedAt?: string | null;
    modules?: string[];
    tests?: string[];
    removalReason?: string;
    removalCommit?: string;
}

interface HistoryRecord {
    id: string;
    featureId: string;
    action: 'CRIADO' | 'ATUALIZADO' | 'VALIDADO' | 'REMOVIDO';
    timestamp: number;
    date: string;
    commit: string;
    author: string;
    details: string;
}

function runRoadmapValidation() {
    console.log('🔍 [ROADMAP VALIDATOR] Iniciando verificação de integridade do Roadmap Vivo...\n');
    let hasErrors = false;

    // 1. Validar existência dos arquivos estruturados
    if (!fs.existsSync(FEATURES_PATH)) {
        console.error(`❌ [ERRO] Arquivo de features não encontrado: ${FEATURES_PATH}`);
        process.exit(1);
    }
    if (!fs.existsSync(HISTORY_PATH)) {
        console.error(`❌ [ERRO] Arquivo de histórico não encontrado: ${HISTORY_PATH}`);
        process.exit(1);
    }

    // 2. Parse e validação de features.json
    let features: FeatureRecord[] = [];
    try {
        const rawFeatures = fs.readFileSync(FEATURES_PATH, 'utf-8');
        features = JSON.parse(rawFeatures);
        if (!Array.isArray(features)) {
            throw new Error('features.json deve conter uma lista JSON de objetos.');
        }
        console.log(`✅ [FEATURES] ${features.length} funcionalidades registradas no catálogo.`);
    } catch (e: any) {
        console.error(`❌ [ERRO] Falha ao analisar features.json: ${e.message}`);
        process.exit(1);
    }

    const featureIds = new Set<string>();
    const validStatuses = new Set(['PLANEJADO', 'EM_DESENVOLVIMENTO', 'IMPLEMENTADO', 'VALIDADO', 'DEPRECIADO', 'REMOVIDO']);

    for (const f of features) {
        if (!f.id || !/^feat_[a-z0-9_]+$/.test(f.id)) {
            console.error(`❌ [ERRO] ID de funcionalidade inválido: "${f.id}". Padrão esperado: feat_<nome_snake_case>`);
            hasErrors = true;
        }
        if (featureIds.has(f.id)) {
            console.error(`❌ [ERRO] ID duplicado no catálogo de features: "${f.id}"`);
            hasErrors = true;
        }
        featureIds.add(f.id);

        if (!f.name || !f.description || !f.category || typeof f.phase !== 'number') {
            console.error(`❌ [ERRO] Campos obrigatórios ausentes na funcionalidade "${f.id}"`);
            hasErrors = true;
        }

        if (!validStatuses.has(f.status)) {
            console.error(`❌ [ERRO] Status inválido "${f.status}" na funcionalidade "${f.id}"`);
            hasErrors = true;
        }

        if (f.status === 'REMOVIDO') {
            if (!f.removalReason || !f.removalCommit) {
                console.error(`❌ [ERRO] Funcionalidade "${f.id}" está marcada como REMOVIDO mas não possui 'removalReason' ou 'removalCommit' obrigatórios.`);
                hasErrors = true;
            }
        }
    }

    // 3. Parse e validação de history.jsonl
    let historyEntries: HistoryRecord[] = [];
    try {
        const rawHistory = fs.readFileSync(HISTORY_PATH, 'utf-8');
        const lines = rawHistory.split('\n').filter(l => l.trim().length > 0);
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const entry = JSON.parse(line) as HistoryRecord;
            if (!entry.id || !entry.featureId || !entry.action || !entry.commit || !entry.details) {
                console.error(`❌ [ERRO] Linha ${i + 1} de history.jsonl possui campos incompletos.`);
                hasErrors = true;
            }
            if (!featureIds.has(entry.featureId)) {
                console.error(`❌ [ERRO] Linha ${i + 1} de histórico referencia feature inexistente no catálogo: "${entry.featureId}". Funcionalidades nunca devem ser apagadas do catálogo!`);
                hasErrors = true;
            }
            historyEntries.push(entry);
        }
        console.log(`✅ [HISTÓRICO] ${historyEntries.length} eventos históricos validados com sucesso.`);
    } catch (e: any) {
        console.error(`❌ [ERRO] Falha ao analisar history.jsonl: ${e.message}`);
        process.exit(1);
    }

    // 4. Verificação dos cabeçalhos obrigatórios de contrato em módulos core
    console.log(`\n📋 [CONTRATO DE CÓDIGO] Verificando cabeçalhos de governança em ${CORE_MODULES_TO_CHECK.length} módulos essenciais...`);
    let checkedModules = 0;
    for (const relPath of CORE_MODULES_TO_CHECK) {
        const fullPath = path.join(ROOT_DIR, relPath);
        if (!fs.existsSync(fullPath)) {
            console.warn(`⚠️ [AVISO] Módulo listado ainda não existe no disco: ${relPath}`);
            continue;
        }
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (!content.includes(MANDATORY_HEADER_SIGNATURE)) {
            console.error(`❌ [CONTRATO AUSENTE] Módulo sem o cabeçalho obrigatório do Roadmap Vivo: ${relPath}`);
            hasErrors = true;
        } else {
            checkedModules++;
        }
    }
    console.log(`✅ [CONTRATO DE CÓDIGO] ${checkedModules} módulos confirmados com cabeçalho de governança.`);

    if (hasErrors) {
        console.error('\n💥 Falha na validação do Roadmap Vivo. Corrija os erros acima antes de prosseguir.');
        process.exit(1);
    } else {
        console.log('\n🎉 [SUCESSO] Todos os requisitos de governança do Roadmap Vivo foram cumpridos!\n');
    }
}

runRoadmapValidation();
