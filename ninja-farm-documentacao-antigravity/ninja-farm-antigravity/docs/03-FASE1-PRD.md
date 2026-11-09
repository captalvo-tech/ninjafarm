# PRD — Fase 1: Fazenda autossustentável

**Prioridade máxima:** entregar um jogo **3D realmente executável**, não uma ilustração nem um menu com cubos. Este documento especifica a Fase 1. Os números de balanceamento abaixo são exemplos configuráveis, não decisões definitivas.

## 1. Contexto

O jogo será usado em **navegadores desktop e mobile**. A fazenda é uma instância 3D fictícia com **64 colunas × 36 linhas** de células lógicas. O terreno pode ter relevo, grama e estradas internas; uma grade discreta apenas guia posicionamento/colisões. Não exibir grade como mundo principal. Em portrait, a câmera se adapta ao viewport: rotação de **yaw**/enquadramento da câmera, sem rotação lateral do horizonte/HUD.

## 2. Personagem do jogador

- Um ninja moderno humanoide 3D, com esqueleto e ao menos estados `idle`, `walk`, `run`, e transições suaves.
- Posicionamento inicial em local livre junto à casa/sede.
- Controle do ninja em **modo exploração** por teclado no desktop e toque/joystick virtual no mobile (proposta reversível); em **modo construção**, seleção por raycast/tap e confirmação.
- Não usar animação como mera rotação de sprite. Controlar movimento por delta time e colisão.
- Impedir atravessar construções; rotas de navegação devem ser recalculadas se uma nova estrutura bloqueia o destino.
- Stage 4: armadilhas bloqueadoras afetarão também o dono; o pathfinding deve trabalhar com mapa universal de células transitáveis, não exceções “dono ignora”.

## 3. Terreno e colocação

- Grid 64×36, mundo visual em unidades configuráveis; `cellSizeMeters` é parâmetro em discussão.
- Casas, galpões, canteiros, cercas, tanques e painéis solares possuem **footprint** com tamanho e orientação.
- Preview de colocação: verde/válido e vermelho/bloqueado; mostrar motivos como colisão, fora da área ou falta de recursos.
- Não permitir ocupar fora dos limites, sobre outra construção ou bloquear toda saída da sede sem estratégia (regra de conectividade configurável e testável).
- O jogador pode mover/remover construções próprias, com custo/reembolso definido posteriormente; nunca duplicar itens por undo/redo.
- O terreno renderizado pode ter elevações suaves, mas células de construção devem ter regra de nivelamento/snap consistente.

## 4. Produção agrícola

- Construir canteiro, escolher cultura, plantar, regar (manual/automático após sistema hídrico), aguardar crescimento e colher.
- Estados: `empty → planted → growing → ready → harvested/empty`; pausa por falta de água, quando aplicável.
- Recursos produzidos vão para depósito com capacidade limitada e sem números negativos.
- Visual para **pelo menos dois estágios** de crescimento, preferivelmente mais, sem exigir 3D distinto para cada planta individual.
- Culturas iniciais recomendadas para testar: arroz e uma hortaliça de ciclo mais curto (propostas, não tabela econômica final).
- Animar crescimento com etapas discretas e efeitos breves, não crescimento de malha de alto custo por frame.

## 5. Criação animal

- Visão completa inclui peixes, galinhas, vacas, ovelhas, alpacas. Primeiro slice: **galinhas e um tanque de peixes**; criar arquitetura extensível para outras espécies.
- Animais 3D reais com estados animados: `idle`, `move`, `eat` e para peixes `swim`. Necessidades: alimento, água (quando pertinente), abrigo/capacidade e produção.
- Galinhas podem produzir ovos; peixes crescem e geram recurso mediante manejo. Não modelar sofrimento realista.
- Simular por estado/tempo, com renderização desacoplada. Não executar IA de todos os animais a cada frame.
- Um animal nunca deve atravessar cerca, estrutura ou obstáculo rígido. Se preso sem rota, mostrar diagnóstico, não teleportar silenciosamente.

## 6. Energia, água e infraestrutura

- Construções base: painel solar, bateria, cisterna/tanque, bomba ou irrigação (a definir), depósito, casa e canteiros.
- Painéis geram energia em função do período diurno e futuramente do clima. Durante a noite, produção solar vai a zero; baterias atendem consumo até esgotar.
- Água é acumulada e consumida por culturas e animais. Não permitir saldos negativos; desativar consumidores por prioridade configurável se faltar recurso.
- UI apresenta `geração / consumo / armazenamento / autonomia estimada` (autonomia é estimativa, não promessa matemática).
- Diagramas de dependência e medidores devem ser claros no mobile; nada de painéis gigantes tapando cenário.

## 7. Tempo, clima e progresso

- Simulação com **passo fixo** para economia; renderização desacoplada com dt variável.
- No MVP local, o progresso de tempo offline é calculado a partir do save e limite `offlineCatchupCapHours` configurável. Detectar relógio adulterado e registrar aviso, sem afirmar segurança anti-cheat offline.
- Dia/noite visual com luz solar, céu e sombras ajustados ao horário de jogo. Clima real é extensão posterior e exige licenças adequadas; Fase 1 terá ciclo climático simulado para teste, claramente indicado.
- Mostrar feedback de colheita, produção e alertas de falta de água/energia.

## 8. Recursos e construção

- Recursos candidatos: madeira, metal, peças, alimentos, água e energia; manter catálogo central.
- Estoque baseado em unidades explicitadas (`unit`), receitas e custo para cada construção. Os valores são configuráveis.
- Sem monetização, compra de créditos, lootboxes ou tokens blockchain.
- A stamina que limita melhoria da base existe no GDD, mas a fórmula final não está definida. No MVP, isolar `ActionCostPolicy` e testar com valores hipotéticos, sem criar grind irreversível.

## 9. Interface e controles

- HUD: saldo resumido, construir, inventário, missão/tarefas, alternância câmera, configurações, salvar/voltar.
- Em retrato: controles no rodapé e HUD compacto, safe area respeitada. Em paisagem/desktop: HUD lateral ou cantos sem cobrir player.
- Interações: hover no PC, toque/press no mobile, feedback háptico apenas se suportado, sem depender dele.
- Ações críticas com confirmação (remover estrutura, substituir save). Salvar sem interromper gameplay.
- Full-screen **quando permitido pelo browser**; não prometer fullscreen forçado no iOS ou travamento de orientação sempre disponível.

## 10. Critérios de pronto da Fase 1

1. Um browser desktop e ao menos um perfil móvel renderizam modelos e animações 3D reais.
2. Navegação e construção são funcionais; grid de 2.304 células; objetos não se sobrepõem.
3. Canteiro conclui um ciclo de produção; galinha gera produto e peixe demonstra ciclo simplificado.
4. Energia/bateria e água influenciam produção; energia solar cai à noite.
5. Save/load recupera a mesma fazenda (com inventário e estados), inclusive após atualizar a página.
6. Interface utilizável em viewport retrato e paisagem, sem scroll horizontal involuntário nem elementos inacessíveis.
7. Console sem erros de execução em fluxo principal, sem assets 404, licenças catalogadas.
8. Desempenho medido em equipamento real; metas propostas em `09-QA-CRITERIOS-ACEITE.md`.

## 11. Não fazer nesta fase

Mapa GPS, sincronização multiplayer, invasão, sensores/drone de defesa real, 20 habilidades, ouro, perseguição, agentes automáticos simulando outros jogadores. Um objeto decorativo de drone só poderá existir se não sugerir função real inexistente.
