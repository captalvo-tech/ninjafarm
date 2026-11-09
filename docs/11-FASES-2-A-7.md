# Especificação de alto nível — Fases 2 a 7 (não implementar agora)

## 2. Mapa global geográfico real

- Cartografia do planeta real com coordenadas GPS, ruas, geografia e distâncias, preferencialmente MapLibre GL JS + provedor de tiles licenciado.
- A base interna é **fictícia**, mas seu marcador ocupa posição geográfica virtual ancorada em região real. Distância no mundo externo influencia tempo de viagem.
- Cadastro/posição: GPS físico do usuário é **opcional e consentido**, sugestão de região, não exposição de residência exata. Jogadores poderão operar avatares virtualmente; mostrar apenas dados não sensíveis.
- Guardar dados geográficos em serviço autorizado; tiles gratuitos de demonstração não são infraestrutura gratuita de produção.
- O navegador não precisa renderizar simultaneamente toda a fazenda 3D e o planeta: modos/telas separados conservam memória.

## 3. Treinamento ninja

- Catálogo de 20 técnicas/gadgets **não mágicos**; quatro equipados; mudanças só na própria base.
- Exemplos dados pelo usuário: vareta/hook, shuriken, decoy, roupa camuflada. Outros candidatos são propostas e devem ser balanceados.
- Uma habilidade funciona bem contra tipos específicos de defesa, jamais todas.
- Treino consome tempo; perda/bloqueio de habilidade e resgate em ouro na captura são conceitos a calibrar (não implementar penalidade arbitrária sem validação).
- Exigir animações e interações reais, não ícones com efeitos fictícios.

## 4. Armadilhas e invasão

- Câmeras/sensores/fios/cercas e armadilhas mecânicas/eletrônicas; combinações em camadas permitem “armadilha da armadilha”.
- Armadilha que bloqueia caminho ocupa footprint e é **obstáculo também para o dono**; navmesh/grid nunca cria exceção de passagem por relação de propriedade.
- O invasor pode encontrar pistas, contornar, desarmar ou cair; o sistema distingue ser caminhável de ser detectado.
- Saque define **unidade de carga** (não quantidade de itens), com peso estratégico e extração até a própria base.
- Proteções anti-abuso e limite de perdas em ataques repetidos precisam de design aprovado antes de PvP real.

## 5. IAs defensivas

- Cães, drones, vigias, sensores e câmeras operam offline com objetivos e condições claros; não é necessário LLM para cada NPC.
- Árvores de comportamento / máquinas de estado / planejamento por objetivos; detecção baseada em percepção e recursos, não onisciência.
- Drones exigem energia; cães exigem cuidados; câmeras cobrem cones e podem perder contato.
- Alertas e registros explicam o que foi observado, sem inventar posição do adversário.

## 6. Perseguição global

- Dono recebe alerta de invasão/roubo, mas NÃO tracker gratuito do ladrão.
- Precisa **encontrar o ninja no mapa** e clicar para emitir ordem `ChaseTarget`. A partir daí o ninja do proprietário se move autonomamente; o humano acompanha e não o dirige.
- O sucesso é **desconhecido** antecipadamente; tempo perdido indo, falhando e retornando é custo real. Objetivo máximo: recuperar o próprio saque, sem prêmio adicional.
- Se inimigo é perdido do campo visual/sensores, seguir última observação/conhecimento conforme regra a aprovar. O personagem não é teletransportado ao alvo.
- Exemplo de regra discutida: `T_withLoot = T_base * 2^(lootUnits)`, e **lootUnits** é carga/saques, não número de objetos. Exposição cresce exponencialmente; limites serão balanceados.
- Ao perder alvo, é possível tentar outra ação ou retornar; comportamento offline de volta à base foi solicitado, a natureza exata da mudança de alvo exige regras mais precisas.

## 7. IAs-jogadoras

- Agentes não humanos são **explicitamente identificados** para jogadores reais (não fingem ser humanos).
- Constroem fazendas, coletam, reinvestem, planejam viagens e invadem usando as **mesmas regras** de tempo, estoque, custo, stamina e detecção.
- Simulação majoritariamente por sistemas determinísticos e planners/behavior trees; modelo de linguagem opcional e apenas se justificado financeiramente.
- Logs auditáveis, teto de consumo/CPU e proteção contra comportamento exploratório abusivo. Não dar vantagens invisíveis que humilhem humanos.

## Principal dependência entre fases

A simulação deverá migrar para **servidor autoritativo** no início das interações multiplayer. O save local da Fase 1 não pode ser aceito cegamente como saldo válido na Fase 2. Planejar um processo de migração com validação e regras justas.
