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

## Camadas de persistência

1. **Fase 1:** IndexedDB; writes transacionais, autosave com debounce e save manual, exportação/importação JSON opcional. Usar `localStorage` apenas para preferências leves, não como único repositório de farm complexa.
2. **Fase 2+:** backend autêntico com armazenamento transacional e políticas de acesso, relógio servidor; cliente mantém cache e snapshots versionados sem aceitar moeda/inventário do browser como autoridade.
3. **Migração:** `v1→v2` funções puras testadas. Em erro de versão inesperada, backup/exportar local e mostrar recuperação; nunca sobrescrever save de versão mais nova silenciosamente.

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
  "farm": {"width": 64, "height": 36, "buildings": []},
  "inventory": {"wood": 50, "metal": 10},
  "resources": {"waterLiters": 100, "storedEnergyWh": 200},
  "clock": {"elapsedGameSeconds": 300}
}
```

Este JSON é ilustrativo, mínimo, e segue o schema básico. Campos de crop/animal serão acrescentados por versão/migração. Não tratá-lo como save completo de fazenda em produção.
