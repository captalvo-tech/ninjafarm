# Game Design Document (GDD) — visão de produto

## Premissa

Um jogador monta uma **fazenda/vila tecnológica autossustentável** em uma instância 3D própria. Cultiva recursos, alimenta animais, gera energia solar, armazena água, constrói equipamentos e eventualmente contrata/treina um ninja com habilidades táticas não mágicas. As vilas existem num **mapa geográfico real**; a disposição interna de cada uma é fictícia. O tempo investido na fazenda e nas viagens importa.

## Fantasia central

- **Construtor:** “Minha fazenda produz mesmo quando não estou olhando, e cada decisão de engenharia faz diferença.”
- **Estrategista:** “Ninguém tem defesa perfeita; minha proteção funciona pelas camadas e rotas de desvio.”
- **Infiltrador:** “Só tenho 4 ferramentas e preciso escolher quando roubar, quanto carregar e como fugir.”
- **Perseguidor:** “Se vir meu ladrão no mapa, posso arriscar meu tempo tentando recuperar o saque, sem garantia de sucesso.”

## Fluxo de longo prazo — fases completas

`produzir → desenvolver base → treinar ninja → configurar defesas → explorar/visitar/invadir → transportar saque → fuga/possível perseguição → melhorar base`

Produção e infiltração devem ser divertidas separadamente. A stamina limita construção/produção conforme regras finais; **não impede** o jogador de se interessar por invasões quando já gastou suas ações de melhoria.

## Fase 1: loop autossustentável

`planejar o terreno → colocar estrutura → plantar/criar animal → prover água/energia → aguardar tempo → colher/coletar → realimentar produção → expandir`.

A Fazenda tem núcleo funcional de **água, alimento, energia e armazenamento**. A progressão econômica será calibrada depois do vertical slice, nunca inventar tabela de balanceamento como definitiva.

## Identidade

- Rural contemporâneo / tecnologia acessível: galpões, estufas, cisternas, tanques, painéis solares, baterias, cabeamento e sensores.
- Ninja tático moderno: personagem ágil, sem poderes mágicos; gadgets credíveis; 4 de 20 slots escolhíveis na própria base (Fase 3).
- Visualmente, preferir estética **3D estilizada com materiais críveis**, rica em profundidade, volumetria leve, iluminação diurna/noturna e animações de qualidade.
- Sem UI de cassino, popups agressivos ou pay-to-win como premissa.

## Sistemas de alta prioridade (Fase 1)

1. Mundo interno 3D e câmera adaptável.
2. Caminhar e interagir com objetos.
3. Construção respeitando ocupação/rotas.
4. Produção agrícola + criação inicial de animais.
5. Energia solar, bateria e abastecimento de água.
6. Temporização, armazenamento e save/restauração.
7. Feedback visual e sonoro coerentes.

## Fora de escopo (Fase 1)

Mapa global, GPS em tempo real, saque real, combate, multiplayer público, IA de defesa, vigilância por drones, 20 habilidades completas, pagamento ou economia premium, IA agentiva controlando outras fazendas. Podem existir pontos de extensão vazios sem botões ativos.

## Experiência do usuário

A primeira sessão deve ter um cenário 3D atrativo imediatamente. Em poucos passos o usuário deve conseguir colocar uma estrutura, plantar, ver o recurso responder e salvar a fazenda. O jogador precisa entender o que está produzindo e o que consome energia/água. Os modelos devem ser animados e visivelmente 3D, não sprites sempre virados para a câmera.

## Métricas de produto a instrumentar localmente (opcional, sem analytics externo)

Tempo até cena interativa, FPS estimado, erros de assets, ação de construir, produção iniciada/concluída, save e load, modo retrato/paisagem. Nenhum rastreamento pessoal externo sem decisão específica.
