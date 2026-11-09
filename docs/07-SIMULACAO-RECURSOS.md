# Design da simulação: recursos, tempo, produção e infraestrutura

Este documento descreve uma base de implementação **parametrizável**; valores concretos são proposições de teste, não balanceamento aprovado.

## Fundamentos

- **Tempo:** ticks discretos (`stepSeconds` configurável) para simulação, não aplicar produção em cada frame renderizado. Reproduzir mesmas entradas com mesmo seed e tick para testes.
- **Estado:** quantidades não negativas e com unidades explícitas; arredondamento consistente na exibição e no armazenamento.
- **Comandos:** `PlantCrop`, `HarvestCrop`, `PlaceBuilding`, `CollectEggs`, `FeedAnimal`, `AllocatePower` podem falhar com motivos previsíveis; nunca mutar parcialmente inventário em falha.
- **Eventos:** eventos versionados criados após transação completa; usados para UI e logs, não como fontes de verdade duplicadas.
- **Sem rede Fase 1:** a simulação local não promete prevenir alteração de save ou relógio pelo usuário.

## Recursos candidatos (propostos)

| ID           | Unidade de sistema  | Uso                     |
| ------------ | ------------------- | ----------------------- |
| `wood`       | unidade             | construir               |
| `metal`      | unidade             | fabricar/infraestrutura |
| `parts`      | unidade             | baterias e eletrônica   |
| `rice`       | unidade de alimento | alimento e futura carga |
| `vegetables` | unidade de alimento | consumo/venda futura    |
| `eggs`       | unidade             | produto da galinha      |
| `fish`       | unidade             | produto do tanque       |
| `feed`       | unidade             | alimentar animais       |
| `water_l`    | litro               | irrigação/animais       |
| `energy_wh`  | Wh                  | armazenamento elétrico  |

Valores iniciais para jogabilidade são **fixtures do protótipo**, centralizados em `data/balance/*.json` ou `src/core/config.ts`. Não codificar números diretamente em animação/UI.

## Plantações

Estados: `empty`, `planted`, `growing`, `ready`. Cada espécie define `growthSeconds`, `waterPerTickL`, `yieldUnits`, `visualStageIds` e condições mínimas. Atualizar crescimento no tick; se água faltar, pausar/reduzir progressão segundo regra configurável. Harvest só se `ready` e estoque tem espaço; caso contrário, resposta explícita.

### Máquina de estado

`empty --plant--> planted --tick suficientes recursos--> growing --maturidade--> ready --harvest--> empty`.

Registrar `plantedAt`, `growthProgress` e `cropId`. Crescimento visual pode interpolar entre modelos/escala, sem interpolar recursos fora da simulação.

## Animais

Estrutura: `speciesId`, `penId`, `hunger`, `thirst`, `health/condition` (se usado), `productionProgress`, `state`. Estado vivo visual é aproximado por animation controller, não pelo cálculo do recurso. Regra inicial simples: consumir `feed` e `water_l` a cada período; se faltar, produção pausa, com aviso. Não exigir mortalidade no protótipo.

- Galinha: pode gerar `eggs` após alimentação e tempo suficientes.
- Tanque de peixes: populações/biomassa simplificadas; consumo e colheita de `fish` conforme duração.
- Vaca/ovelha/alpaca: arquitetura prevê, mas implementação após aprovação de escopo/asset.

## Energia solar / bateria

Proposta de equação, respeitando unidades:

`generationWh = ratedPowerW × irradianceFactor(0..1) × efficiency(0..1) × (tickSeconds/3600)`

`storedNextWh = clamp(storedWh + chargeWh - dischargeWh, 0, capacityWh)`

Não considerar energia solar à noite. Irradiância simulada na Fase 1, eventualmente mapeada do clima real em etapa futura. Aplicar limite de carga/descarga da bateria e perdas via parâmetros; jamais gerar energia do nada. Se consumo total excede geração+bateria, consumidores de menor prioridade param e emitem alerta.

## Água / cisterna

`volumeNextL = clamp(volumeL + captureL + pumpL - irrigationL - animalUseL, 0, capacityL)`.

A chuva do provedor real **não** entra em produção na Fase 1 como dependência obrigatória. Usar gerador climático local determinístico e depois integrar provedor com política de licença.

## Estoques e construção

- Alteração de recursos deve ser atômica: débito de custo e instalação do prédio juntos.
- Capacidade física do depósito limita itens guardados; decidir se itens colhidos aguardam sem coletar ou são perdidos — recomendação inicial: **aguardam**, nunca desaparecem silenciosamente.
- Remoção/reembolso deve ser idempotente e testado contra duplicação.
- Stamina: arquitetura com política `canPerform(action, state)`, `consume(action)`, `recover(time)`; parâmetros exatos pendentes.

## Offline progress e Simulação Autoritativa de Servidor

Ao reabrir save, a progressão offline é calculada de forma autoritativa pelo backend (`public/api/save.php` na ação `action=load`):

- `elapsed = max(0, serverNow - lastSavedAt)` com teto máximo de proteção (`MAX_AFK_SECONDS = 86400 * 7`, 7 dias).
- **Cálculo Solar Determinístico:** A irradiação solar acumulada integra o seno do ciclo diurno/noturno ($T = 1200\text{s}$ no jogo), sendo estritamente zero durante os períodos noturnos ($0.75 \le \text{fase} \le 1.0$ ou $0.0 \le \text{fase} \le 0.25$).
- **Reconciliação Biológica e Hídrica:** Culturas amadurecem consumindo água da cisterna de forma proporcional. Se a reserva de água esgotar, o crescimento é interrompido sem matar a planta.
- **Fauna e Postura de Ovos:** As galinhas acumulam fome gradualmente (+15/h). Enquanto a fome estiver controlada ($< 70$), produzem ovos determinísticos a cada 2 horas que aguardam coleta nos ninhos.
- **Equivalência Temporal Comprovada:** O simulador administrativo [`time-simulator.ts`](file:///Z:/AI/Ninja_Farm_Project/src/simulation/time-simulator.ts) executa em passos de 30 segundos acoplado a instâncias reais de `FarmGrid`, `CropSystem`, `EnergySystem`, `FaunaManager` e `TaskScheduler`, comprovando em testes que duas execuções isoladas com mesmos parâmetros produzem 100% de equivalência matemática.

## Testes fundamentais

- Massa/conservação: recursos não nascem sem evento produtor, consumo não deixa saldo negativo.
- Duas execuções determinísticas com mesmo estado/semente e 1h simulada geram o mesmo estado.
- `battery=0`, `water=0`, `storage=full`, `no feed`, `night`: sistemas em pausa/alerta coerentes.
- Colher duas vezes não duplica itens; importar save repetido não multiplica inventário.
