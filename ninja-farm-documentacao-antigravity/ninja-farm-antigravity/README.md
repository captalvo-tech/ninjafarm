# Projeto Fazenda Ninja — documentação para iniciar no Antigravity

**Status:** especificação e plano inicial; **não contém jogo implementado**.  
**Data-base:** 08/11/2026. **Nome do produto:** provisório.  
**Objetivo imediato:** entregar a Fase 1 — Fazenda autossustentável, em **3D real**, jogável em navegador de desktop e celular, com qualidade visual verificável.

## Início rápido para o agente

1. Leia `AGENTS.md`, `docs/00-DECISOES-E-ESCOPO.md`, `docs/01-GDD-VISAO.md` e `docs/02-ROADMAP.md`.
2. Leia `docs/03-FASE1-PRD.md`, `docs/04-ARQUITETURA.md`, `docs/05-VISUAL-CAMERA-UX.md` e `docs/06-PIPELINE-ASSETS.md`.
3. Execute as instruções em `PROMPT_ANTIGRAVITY.md` **no Antigravity**, com esta pasta como raiz ou copiando sua documentação para a raiz de um projeto novo.
4. Crie uma cena 3D mínima e demonstre qualidade visual, input móvel e performance **antes** de implementar funcionalidades grandes.
5. Registre tudo em `docs/19-LOG-IMPLEMENTACAO.md`. Não declare testado sem evidência.

## Índice

| Arquivo | Finalidade |
| --- | --- |
| `PROMPT_ANTIGRAVITY.md` | Prompt de execução imediata, pronto para colar |
| `AGENTS.md` | Regras permanentes para o agente |
| `.agents/rules/project-rules.md` | Regras de workspace para o Antigravity |
| `.agents/workflows/fase-1.md` | Workflow para implementar e verificar a etapa |
| `docs/00-DECISOES-E-ESCOPO.md` | Confirmado vs. proposto vs. em aberto |
| `docs/01-GDD-VISAO.md` | Conceito, loops e princípios de design |
| `docs/02-ROADMAP.md` | As sete etapas e seus gates de aceite |
| `docs/03-FASE1-PRD.md` | Requisitos detalhados de fazenda autossustentável |
| `docs/04-ARQUITETURA.md` | Stack, módulos, fronteiras, repositório e deploy |
| `docs/05-VISUAL-CAMERA-UX.md` | Direção visual, câmera e interação desktop/mobile |
| `docs/06-PIPELINE-ASSETS.md` | GLB, modelos, animações, licenças e otimização |
| `docs/07-SIMULACAO-RECURSOS.md` | Agricultura, animais, energia e água |
| `docs/08-DADOS-PERSISTENCIA.md` | Save, estados e futura evolução online |
| `docs/09-QA-CRITERIOS-ACEITE.md` | Matriz objetiva de testes e verificação |
| `docs/10-BACKLOG-EXECUCAO.md` | Histórias executáveis por prioridade |
| `docs/11-FASES-2-A-7.md` | Visão técnica futura sem invadir o escopo da Fase 1 |
| `docs/12-CUSTOS-LICENCAS-SEGURANCA.md` | Limites de orçamento, licenças, privacidade |
| `docs/13-DECISOES-PENDENTES.md` | Lacunas e hipóteses não confirmadas |
| `docs/14-CLIMA-REAL.md` | Integração futura de dados meteorológicos |
| `docs/15-EVENTOS-CONTRATOS.md` | APIs internas e eventos versionados |
| `docs/16-REFERENCIAS-OFICIAIS.md` | Documentação oficial para o agente |
| `docs/17-CHECKLIST-ENTREGA.md` | Como demonstrar o resultado sem promessas vazias |
| `docs/18-ORIGEM-REQUISITOS.md` | Histórico do handoff original e mudanças subsequentes |
| `docs/19-LOG-IMPLEMENTACAO.md` | Registro de trabalho e evidências |
| `schemas/farm-save.schema.json` | Esquema inicial de contrato de save, não banco de produção |
| `templates/asset-manifest.example.json` | Exemplo de catálogo de licenças/otimização |

## Restrições não negociáveis

- **Não** transformar o jogo em 2D, vista superior fixa, pixel art, tabuleiro ou protótipo de caixas como entrega final.
- Mundo **geográfico real** (Fase 2), mas **interior da fazenda fictício** em 3D.
- Fazenda de **64 × 36 células lógicas**; no celular, enquadrar adequadamente o espaço sem deformação da cena nem rotação de interface para ficar de lado.
- Gratuito / sem custos adicionais sempre que viável, **sem uso indevido de licenças**.
- Seguir as **7 etapas na ordem definida**. Apenas a primeira será executada inicialmente.
- **Não publicar** em produção e **não contratar serviço pago** sem aprovação explícita.

## O que o pacote não inclui

Modelos 3D, animações, backend, código do jogo ou assets de terceiros. O agente deverá obtê-los legalmente e implementar o código; são entregáveis futuros, não resultados já alcançados.
