/**
 * ============================================================================
 * NINJA FARM — CONTRATO OBRIGATÓRIO DO ROADMAP
 * ============================================================================
 *
 * Testes Unitários de Autenticação Administrativa e Integridade do Roadmap
 * ============================================================================
 */

import * as fs from 'fs';
import * as path from 'path';

import { describe, it, expect } from 'vitest';

describe('Painel /admin: Autenticação, Segurança e Governança do Roadmap', () => {
    const projectRoot = path.resolve(__dirname, '../..');
    const featuresPath = path.join(projectRoot, 'project', 'roadmap', 'features.json');
    const historyPath = path.join(projectRoot, 'project', 'roadmap', 'history.jsonl');

    it('1. Valida integridade do catálogo de features (features.json)', () => {
        expect(fs.existsSync(featuresPath)).toBe(true);
        const content = fs.readFileSync(featuresPath, 'utf-8');
        const features = JSON.parse(content);
        expect(Array.isArray(features)).toBe(true);
        expect(features.length).toBeGreaterThanOrEqual(25);

        const ids = new Set<string>();
        for (const f of features) {
            expect(f.id).toMatch(/^feat_[a-z0-9_]+$/);
            expect(ids.has(f.id)).toBe(false);
            ids.add(f.id);

            expect(typeof f.name).toBe('string');
            expect(typeof f.description).toBe('string');
            expect(typeof f.phase).toBe('number');
            expect(['PLANEJADO', 'EM_DESENVOLVIMENTO', 'IMPLEMENTADO', 'VALIDADO', 'DEPRECIADO', 'REMOVIDO']).toContain(
                f.status
            );

            if (f.status === 'REMOVIDO') {
                expect(typeof f.removalReason).toBe('string');
                expect(f.removalReason.length).toBeGreaterThan(5);
                expect(typeof f.removalCommit).toBe('string');
            }
        }
    });

    it('2. Valida integridade do histórico imutável (history.jsonl)', () => {
        expect(fs.existsSync(historyPath)).toBe(true);
        const content = fs.readFileSync(historyPath, 'utf-8');
        const lines = content.split('\n').filter((l) => l.trim().length > 0);
        expect(lines.length).toBeGreaterThanOrEqual(20);

        const features = JSON.parse(fs.readFileSync(featuresPath, 'utf-8'));
        const featureIds = new Set(features.map((f: any) => f.id));

        for (const line of lines) {
            const entry = JSON.parse(line);
            expect(entry.id).toBeDefined();
            expect(featureIds.has(entry.featureId)).toBe(true);
            expect(['CRIADO', 'ATUALIZADO', 'VALIDADO', 'REMOVIDO']).toContain(entry.action);
            expect(typeof entry.timestamp).toBe('number');
            expect(typeof entry.commit).toBe('string');
            expect(typeof entry.details).toBe('string');
        }
    });

    it('3. Simula Rate Limiting com bloqueio de 15 minutos após 5 tentativas incorretas', () => {
        interface RateLimitEntry {
            attempts: number;
            lastAttempt: number;
        }

        const limits: Record<string, RateLimitEntry> = {};
        const testIp = '192.168.1.100';

        function checkRateLimit(ip: string, now: number): boolean {
            const entry = limits[ip];
            if (!entry) return true;
            if (entry.attempts >= 5 && now - entry.lastAttempt < 900) {
                return false; // bloqueado
            }
            return true;
        }

        function recordAttempt(ip: string, now: number) {
            const entry = limits[ip] || { attempts: 0, lastAttempt: 0 };
            if (now - entry.lastAttempt > 900) {
                entry.attempts = 1;
            } else {
                entry.attempts++;
            }
            entry.lastAttempt = now;
            limits[ip] = entry;
        }

        const t0 = 1000;
        // 4 tentativas falhas permitidas
        for (let i = 0; i < 4; i++) {
            expect(checkRateLimit(testIp, t0)).toBe(true);
            recordAttempt(testIp, t0);
        }
        expect(checkRateLimit(testIp, t0)).toBe(true);
        recordAttempt(testIp, t0); // 5ª tentativa

        // Agora na 6ª tentativa deve estar bloqueado
        expect(checkRateLimit(testIp, t0 + 10)).toBe(false);

        // Após 901 segundos deve desbloquear
        expect(checkRateLimit(testIp, t0 + 905)).toBe(true);
    });

    it('4. Validação de token CSRF para requisições de mutação', () => {
        const sessionCsrf = 'abcdef1234567890abcdef1234567890';

        function validateCsrf(receivedToken: string | undefined): boolean {
            return !!receivedToken && receivedToken === sessionCsrf;
        }

        expect(validateCsrf(undefined)).toBe(false);
        expect(validateCsrf('')).toBe(false);
        expect(validateCsrf('wrong_token')).toBe(false);
        expect(validateCsrf(sessionCsrf)).toBe(true);
    });

    it('5. Garante que setup_initial_admin público e token na URL estão desabilitados em admin.php', () => {
        const adminPhpPath = path.join(projectRoot, 'public', 'api', 'admin.php');
        const code = fs.readFileSync(adminPhpPath, 'utf-8');

        // Não aceita token na URL
        expect(code).not.toContain("$_GET['admin_token']");

        // setup_initial_admin retorna 403 Forbidden
        expect(code).toContain("if ($action === 'setup_initial_admin') {");
        expect(code).toContain('http_response_code(403);');

        // Não confia cegamente em X-Forwarded-For sem validação
        expect(code).not.toContain("$_SERVER['HTTP_X_FORWARDED_FOR']");
    });

    it('6. Garante que auth.php bloqueia dev_mock em produção e não expõe tokens em URL', () => {
        const authPhpPath = path.join(projectRoot, 'public', 'api', 'auth.php');
        const code = fs.readFileSync(authPhpPath, 'utf-8');

        // Não aceita token na URL
        expect(code).not.toContain("$_GET['token']");

        // Bloqueio rigoroso de dev_mock
        expect(code).toContain("if ($appEnv !== 'development') {");
        expect(code).toContain('http_response_code(403);');

        // Validação de claims do Google (aud, iss, exp)
        expect(code).toContain('$validIssuers');
        expect(code).toContain('$googleClientId');
        expect(code).toContain('exp');
    });
});
