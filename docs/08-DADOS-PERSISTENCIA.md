# Modelo de dados, contratos e persistência

## Estado de domínio: princípios

- Definir tipos claros e imutabilidade controlada; a renderização usa IDs para consultar entidades do domínio.
- IDs estáveis UUID/ULID ou identificador local seguro, não índices de array como identidade.
- Coordenadas da fazenda: `[x,z]` com `0≤x<64`, `0≤z<36`; altura e rotação do modelo são propriedades de render/cena, não posição GPS.
- GPS e localização real do humano NÃO pertencem ao save da Fase 1.
- Saves devem ter `schemaVersion`, `createdAt`, `lastSimulatedAt`, `seed`, `farm`, `inventory`, `resources`, `clock`.
- `schemas/farm-save.schema.json` é **contrato inicial para validação**; ampliar conforme estados forem implementados e manter migrações.

## Entidades principais

`Farm`: id, dimensions, placed objects, cells/occupancy (derivado quando possível), ownership local.  
`Building`: instance id, catalog id, x, z, rotation quarter-turn, condition, state.  
`CropPlot`: id, building id, crop id, planted time, growth status, irrigation status.  
`Animal`: id, species id, pen id, hunger/thirst normalized, production counter, animation hint.  
`Inventory`: mapping `itemId → quantity`, capacity by storage building.  
`EnergyNetwork`: generators, batteries, consumers, totals persisted at step boundary.  
`WaterNetwork`: storage, rainfall collection, consumers.  
`PlayerAvatar`: world-local transform, current action; no GPS real.  
`TimeState`: gameClock, lastSimulatedAt UTC, lastSaveAt UTC; not substitute for authoritative server time later.

## Camadas de persistência e Integridade Atômica

1. **Serialização Completa Centralizada (`serializeCompleteFarmState`):** Toda operação de persistência (salvamento manual pelo botão do HUD, autosave periódico de 30 segundos e encerramento de aba no `beforeunload`) utiliza a rotina centralizada em [`main.ts`](file:///Z:/AI/Ninja_Farm_Project/src/main.ts). O snapshot agrega de forma indissociável:
    - Inventário consolidado de 6 recursos essenciais.
    - Construções e footprints na grade 64x36.
    - Canteiros de cultivo, estágios e níveis de irrigação.
    - Instâncias da fauna (saúde, fome e postura de ovos).
    - Estado completo do **Droid Único** (posição, nível de bateria, máquina de estados).
    - **Agendador de Tarefas** (lista ordenada de tarefas físicas, status e progresso em segundos).
    - Diário cronológico de eventos (`EventJournal`).
2. **Escrita Atômica no Servidor (`save.php`):** A gravação do save no disco utiliza técnica de arquivo temporário seguido de `rename(LOCK_EX)`, impedindo concorrência, leituras durante escritas e corrupção de arquivos por encerramento abrupto do processo PHP.
3. **Status de Sincronização Honesto (`CloudSyncStatus`):** A classe [`CloudSaveManager`](file:///Z:/AI/Ninja_Farm_Project/src/persistence/cloud-save.ts) não retorna sucesso fictício quando há queda de rede. O status informa com transparência se a operação foi confirmada na nuvem (`SERVER_CONFIRMED`), armazenada provisoriamente em cache local (`LOCAL_CACHE_ONLY`) ou bloqueada por revisão conflitante (`CONFLICT`).
4. **Backend Autoritativo em Nuvem (`/api/save.php`):** Saves vinculados obrigatoriamente à conta Google autenticada via `sub` imutável. Utiliza versionamento sequencial (`revision`), relógio UTC autoritativo do servidor e controle otimista de concorrência (`409 Conflict`) para impedir duplicação de itens ou sobrescrita indevida entre múltiplos dispositivos.
5. **Criptografia de Credenciais de IA em Repouso:** Chaves pessoais do Google Gemini configuradas no jogo são enviadas exclusivamente via HTTPS para `/api/ai.php?action=set_key`, encriptadas com AES-256-CBC e armazenadas em `api/data/users/<userHash>_gemini.enc` com permissões `0600`. O cliente não retém a chave original no navegador.
6. **Reset de Progresso Seguro:** Endpoint de reinicialização atômica para começar a fazenda do zero com confirmação explícita do usuário, mantendo apenas a identidade Google.
7. **Migração:** Funções puras de migração versionadas (`schemaVersion`). Ao detectar versão anterior ou save local legado sem vínculo na nuvem, solicita confirmação para migrar com segurança para o backend.

## Colisões e células

- Grid 64×36 lógico com flags de ocupação e bloqueio de passagem, derivadas do footprint de edificações.
- `canPlace` verifica limites, colisão, permissões e conectividade mínima definida. Testar rota de saída da sede.
- A Fase 4 deve adicionar `trap.blockMovement` no mesmo mecanismo global de ocupação para TODOS os personagens; não inventar um atalho específico para dono.

## Integridade e segurança

- Custo de construção e incremento de inventário na mesma operação. Estado só salva após comando validado.
- Proteção contra corrupção: snapshot atual + última versão válida se viável; assinatura local não previne trapaça — não alegar o contrário.
- Não salvar email, nome real, GPS exato ou token de API no save local desta fase.
- Não registrar coordenadas reais de pessoas em logs ou telemetria sem consentimento e necessidade explícita.

## Exemplo de save

```json
{
    "schemaVersion": 1,
    "saveId": "test-save-001",
    "createdAt": "2026-11-08T00:00:00.000Z",
    "lastSimulatedAt": "2026-11-08T00:05:00.000Z",
    "seed": 12345,
    "farm": { "width": 64, "height": 36, "buildings": [] },
    "inventory": { "wood": 50, "metal": 10 },
    "resources": { "waterLiters": 100, "storedEnergyWh": 200 },
    "clock": { "elapsedGameSeconds": 300 }
}
```

Este JSON é ilustrativo, mínimo, e segue o schema básico. Campos de crop/animal serão acrescentados por versão/migração. Não tratá-lo como save completo de fazenda em produção.
