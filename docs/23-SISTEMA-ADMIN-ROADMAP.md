# Ninja Farm — Documentação Técnica do Painel Administrativo (/admin) e Roadmap Vivo

## 1. Visão Geral e Propósito

O painel administrativo em `/admin` e o sistema de **Roadmap Vivo** constituem a central de comando operacional, econômica, de observabilidade e de governança técnica permanente do **Ninja Farm**.

Diferente de painéis decorativos com números estáticos, o `/admin` é conectado diretamente aos saves reais em nuvem dos jogadores, à telemetria anônima, aos relatos de falhas dos testadores, ao simulador econômico temporal e aos arquivos estruturados de governança do projeto.

---

## 2. Autenticação Administrativa e Segurança

### 2.1 Separação Absoluta de Papéis

- **Jogadores:** Autenticação exclusiva via Google Identity Services (GIS), validando o token JWT pelo identificador imutável `sub`.
- **Administrador:** Autenticação independente por e-mail e senha com controle autoritativo no backend (`public/api/admin.php`).
- **Superadministrador inicial:** `mvioli7@gmail.com`.

### 2.2 Política de Senhas e Armazenamento Criptográfico

- Senhas nunca são salvas em texto plano, nem versionadas no Git, nem exibidas em logs.
- Armazenamento via `password_hash($password, PASSWORD_DEFAULT)` com salt único por credencial em `public/api/data/admin_credentials.json` (permissão restrita `0600`, ignorado pelo Git).
- **Provisionamento Exclusivo via CLI:** A rota web `admin.php?action=setup_initial_admin` é permanentemente bloqueada com **HTTP 403 Forbidden**. A criação ou redefinição de administradores só pode ser executada por um operador autenticado no console privado do servidor:
    ```bash
    php scripts/provision-admin.php
    ```
    O script foi instalado fora da raiz pública (`scripts/` no diretório privado da hospedagem) com permissões restritas `0750`.

### 2.3 Proteção Contra Força Bruta (Rate Limiting)

- Monitoramento de tentativas por endereço IP em `public/api/data/admin_rate_limit.json`.
- Ao atingir **5 tentativas incorretas**, o endereço IP é bloqueado automaticamente por **15 minutos (900 segundos)** com resposta HTTP 429.

### 2.4 Tokens e Prevenção CSRF

- Emissão de token de sessão seguro com renovação automática de 4 horas por atividade (`ninja_admin_token`).
- Token CSRF único (`X-CSRF-Token`) exigido em todas as requisições de mutação (POST), rejeitando alterações forjadas entre abas.
- Trilha de auditoria append-only gravada em `public/api/data/admin_audit/audit_YYYY_MM.log`.

---

## 3. Módulos e Funcionalidades do /admin

### 3.1 Dashboard Geral (`#/` ou `#/dashboard`)

- **Status do Sistema:** Versão deployed (`Alpha 0.1.0`), motor PlayCanvas 2.23, PHP 8.x, integridade de API e SQLite/JSON atômico.
- **Métricas de Jogadores:** Total de contas registradas, jogadores ativos nas últimas 24h, 7 dias e 30 dias.
- **Saúde das Fazendas:** Quantidade total de bases, fazendas com culturas ativas e bases com energia paralisada.
- **Frota Droid:** Contagem de robôs em trabalho, recarregando, ociosos, bateria crítica (&lt;15%) e taxa de ocupação operacional.
- **Agendador Central:** Total de tarefas físicas, tarefas agendadas, concluídas e bloqueadas por escassez de insumos.

### 3.2 Central de Alertas e Incidentes (`#/alertas`)

- Gestão centralizada de incidentes e integração automática com os relatórios enviados pelos testadores através do `BugReportModal` (`public/api/report.php`).
- **Classificação de Severidade:** Crítico, Alto, Médio, Baixo, Informativo.
- **Ciclo de Vida do Incidente:**
  `Novo` → `Em análise` → `Em correção` → `Aguardando validação` → `Resolvido` (ou `Ignorado`).
- **Inspeção Detalhada:** Modal exibindo mensagem, navegador, plataforma, tarefa ativa no momento do erro e metadados técnicos sanitizados (zero vazamento de credenciais).

### 3.3 Economia, Escassez e Simulador Temporal (`#/economia`)

- **Estoque Agregado:** Soma consolidada de madeira, metal, peças, alimentos, água e energia entre todas as fazendas ativas.
- **Termômetro de Escassez:** Identifica fazendas em estado de risco (recursos &le; 5.0 unidades).
- **Capacidade Solar:** Potência de pico instalada em Watts da rede fotovoltaica.
- **Simulador Temporal (Sandbox Isolado):**
    - Permite simular períodos de **1h, 12h, 24h, 7 dias, 30 dias e 365 dias** instantaneamente no navegador através da classe `TimeSimulator`.
    - Diagnostica se a economia da fazenda colapsa por sede/falta de energia ou se acumula recursos indefinidamente.
    - Suporte completo à simulação da fauna (fome, ovos nos ninhos) e ciclo dia/noite.
    - Comprovada equivalência temporal determinística nos testes automatizados.

### 3.4 Roadmap Vivo & Memória Técnica Permanente (`#/roadmap`)

- **Memória Técnica Imutável:** Fonte da verdade da evolução do Ninja Farm.
- **Catálogo de Funcionalidades (`project/roadmap/features.json`):**
    - Cada funcionalidade possui `id`, `name`, `description`, `category`, `phase`, `status`, `addedAt`, `modules` e `tests`.
    - Estados permitidos: `PLANEJADO`, `EM_DESENVOLVIMENTO`, `IMPLEMENTADO`, `VALIDADO`, `DEPRECIADO`, `REMOVIDO`.
    - **Regra de Ouro:** Funcionalidades descontinuadas NUNCA são apagadas do catálogo. Elas são marcadas como `REMOVIDO` e documentadas com `removalReason` e `removalCommit`.
- **Histórico Cronológico (`project/roadmap/history.jsonl`):**
    - Registro append-only (uma linha JSON por alteração relevante), contendo autor, data, commit e detalhes da evolução.
- **Interface Interativa:** Filtros por status, pesquisa por texto em tempo real e visualização em linha do tempo histórica.

### 3.5 Frota Droid & Monitoramento AFK (`#/droid`)

- Monitoramento da integridade do Droid Único humanoide por fazenda.
- Telemetria de bateria, tempos de recarga e regras de retorno autônomo à base solar ao atingir 15% de carga residual.

### 3.6 Gemini AI & Observabilidade Cognitiva (`#/gemini`)

- Governança estrita: o Gemini 2.0 Flash opera em modo **100% Read-Only** (orientação e diagnóstico ao ninja mestre, sem permissão de alterar saves ou criar itens diretamente).
- Suporte ao **Modo Limitado / Robótico** nativo: 4 relatórios pré-programados offline sem consumo de API.
- Criptografia em repouso com padrão **AES-256-GCM** para chaves pessoais fornecidas pelos jogadores.
- Monitoramento da penalidade de 30 segundos em caso de falha de conexão ou erro do jogador.

### 3.7 Qualidade & Testes Automatizados (`#/qualidade`)

- Integração dinâmica com `test-results.json` gerado pelo Vitest em cada execução do pipeline de testes.
- Exibição de **15 suítes ativas** e **90 testes unitários e de integração** 100% aprovados, sem dados simulados.
- Monitoramento de tipagem estrita com TypeScript (`tsc --noEmit`) com 0 erros.
- Verificação automatizada de conformidade de governança em 27 módulos core (`scripts/validate-roadmap.ts`).

### 3.8 Configurações & Auditoria de Acessos (`#/config`)

- Exibição da trilha de eventos administrativos (`admin_audit`), endereços IP de origem e ações executadas pelo superadministrador.

---

## 4. Governança de Código: Contrato Obrigatório do Roadmap

### 4.1 Cabeçalho Obrigatório em Módulos Core

Todos os módulos essenciais do projeto devem conter o seguinte cabeçalho de governança:

```ts
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
```

### 4.2 Validação Automatizada Contínua

Foi criado o script `scripts/validate-roadmap.ts`, acionado via:

```bash
npm run check:roadmap
```

O validador verifica:

1. Validade estrutural de `project/roadmap/features.json` e `project/roadmap/history.jsonl`.
2. Integridade dos identificadores `feat_*` e conformidade com o vocabulário de estados.
3. Garantia de que nenhuma funcionalidade do histórico foi excluída do catálogo.
4. Presença obrigatória de justificativa (`removalReason`) e commit (`removalCommit`) em funcionalidades removidas.
5. Presença do cabeçalho de contrato em todos os 27 módulos essenciais do backend e frontend.
