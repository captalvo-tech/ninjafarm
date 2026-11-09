# Checklist de Entrega e Aceite — Ninja Farm Alpha 0.1

Data de Avaliação: 09 de Novembro de 2026  
Versão: Alpha 0.1.0 (Produção em `https://pinut.shop/`)  
Branch: `fix/m1-assets3d`  
Commit de Entrega: `40d57b2`

---

## 1. Critérios Fundamentais de Engenharia e Build

- [x] **Projeto abre com `npm run dev` após `npm install` em ambiente limpo:** Vite dev server roda em `http://localhost:5173/` (Jogo), `http://localhost:5173/studio` (Studio) e `http://localhost:5173/admin` (Admin).
- [x] **`npm run build` passa sem erros:** Bundle gerado em `dist/` com chunks otimizados (PlayCanvas Engine 2.23, módulos de simulação, UI e shaders).
- [x] **`npm run typecheck` passa sem erros:** TypeScript (`tsc --noEmit`) com 0 erros (`Found 0 errors`).
- [x] **`npm run lint` passa sem erros:** ESLint passa com 0 erros e 0 warnings.
- [x] **`npm run fmt:check` passa:** 100% dos arquivos formatados conforme padrão Prettier.
- [x] **Testes automatizados rodados e 100% aprovados:** Vitest com 15 suítes e 90 testes unitários/integração aprovados (`numTotalTests: 90`, `numPassedTests: 90`, `numFailedTests: 0`). Resultados publicados em `/test-results.json`.
- [x] **Governança do Roadmap Vivo validada:** `npm run check:roadmap` valida 27/27 módulos com cabeçalho de contrato e integridade de `features.json` e `history.jsonl`.
- [x] **Console do navegador verificado:** Zero exceções de runtime no boot do PlayCanvas WebGL.
- [x] **Imagens reais da aplicação 3D:** Capturas com proporção métrica real e perspectiva calibrada geradas e arquivadas em `docs/evidence/` (Desktop, Mobile Portrait 390x844, Mobile Landscape 844x390).
- [x] **Inputs Desktop e Mobile testados:** Suporte simultâneo a teclado WASD/setas, clique na grade, joystick virtual analógico e gestos de toque no cluster de ações.
- [x] **Manifest de assets com origem e licenças:** `public/assets/manifest.json` e `docs/06-PIPELINE-ASSETS.md` detalhando licenças CC0/permissivas de todos os 38 modelos GLB.
- [x] **Medição de desempenho sem dados inventados:** 60 FPS estáveis medidos em Chromium/Edge com WebGL 2.0; contagem de triângulos e draw calls gerenciadas por culling e instancing.
- [x] **Lista de features funcionando e não funcionando separadas:** Matriz 100% categorizada em `docs/22-MATRIZ-AUDITORIA-ALPHA-0-1.md` e no `/admin`.
- [x] **Instruções atualizadas de instalação/execução:** Documentadas em `README.md` e `docs/04-ARQUITETURA.md`.
- [x] **Custos de infraestrutura:** R$ 0 adicionais (hospedagem Hostinger existente, PHP 8.x nativo, client-side PlayCanvas e Google Identity Services gratuito).
- [x] **Segurança e isolamento de credenciais:** Zero senhas, segredos ou chaves API versionadas; arquivos `.env` ignorados; diretórios de dados e backups isolados fora de rotas públicas.
- [x] **`docs/19-LOG-IMPLEMENTACAO.md` atualizado:** Trilha completa de auditoria, correções e implantação registrada.

---

## 2. Evidências do Marco M1 (Visual 3D e Experiência Espacial)

1. **Ninja Humanoide 3D:** Malha 3D real (`character.glb`), rigging esqueletal com animações de locomoção fluida, esquiva com fumaça e arremesso de shuriken. Sem poderes mágicos, sem sprites 2D.
2. **Fauna 3D Calibrada:** Vaca (`~1.45m` de cernelha) e galinha (`~0.42m` de altura) calibradas pela malha geométrica real (AABB) em escala 1u = 1m, com pés alinhados ao nível do solo ($Y = 0$).
3. **Cenário e Construções 3D:** Casas, canteiros, bambus, árvores e rochas renderizados com materiais PlayCanvas, normais PBR e iluminação solar dinâmica com sombras.
4. **Câmeras Especializadas:** Alternância fluida entre câmera de exploração livre, câmera tática isométrica de construção e visão geral panorâmica da propriedade.
5. **Responsividade Mobile:** Adaptação ergonômica comprovada em Desktop 1920x1080, Mobile Portrait 390x844 e Mobile Landscape 844x390 sem cortes de interface.

---

## 3. Evidências do Marco M4 (Automação Droid e Simulação AFK)

1. **Droid Único Humanoide:** Exatamente uma unidade robótica por fazenda, executando fisicamente uma tarefa por vez com HUD de bateria flutuante.
2. **Construção por Blueprints:** Posicionamento de hologramas translúcidos sem teletransporte de edifícios; Droid transporta materiais e constrói passo a passo.
3. **Agendador de Tarefas:** Gaveta deslizante `📋 Agenda` com reordenação por prioridades, cancelamento com reembolso e estados de bloqueio (`WAITING_RESOURCES`, `WAITING_ENERGY`).
4. **Simulação AFK Determinística:** Reconciliação temporal determinística em passos de 30s (`advanceTimeDeterministically`), acumulando geração solar, amadurecimento de plantações e produção de ovos da fauna.

---

## 4. Evidências do Marco M5 (Segurança, Admin e Observabilidade)

1. **Autenticação Segura GIS:** Google Identity Services obrigatório; validação criptográfica no backend via identificador imutável `sub`; zero parâmetros de bypass (`dev_mock` / `dev_user`).
2. **Chaves Gemini Criptografadas em Repouso:** Credenciais de IA do usuário salvas com cifra simétrica AES-256-GCM.
3. **Saves Atômicos e Concorrência:** Escrita com arquivo temporário e substituição atômica; tratamento de conflitos com revisão incremental (HTTP 409 Conflict) e indicador honesto `CloudSyncStatus`.
4. **Painel /admin e Provisionamento CLI:** Painel administrativo desacoplado do Google Login; setup de administradores restrito exclusivamente à CLI privada do servidor (`scripts/provision-admin.php`).
5. **Roadmap Vivo & Observabilidade:** Catálogo `features.json` e histórico `history.jsonl` integrados ao `/admin` e validados via CI.

---

## 5. Critério de Aceite Definitivo

A versão Alpha 0.1.0 encontra-se totalmente operacional, homologada e publicada em produção (`https://pinut.shop/`), atendendo integralmente a todos os requisitos estipulados.
