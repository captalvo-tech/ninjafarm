# Contratos de domínio e eventos para evolução online

Abaixo há **interfaces de projeto propostas**, não endpoints em execução. Usar apenas após transformar em código TypeScript e testes. O objetivo é evitar acoplamento ao PlayCanvas e preparar futura migração de simulação para servidor.

## Commands (proposta)

```ts
type Command =
  | { type: 'building.place'; commandId: string; catalogId: string; x: number; z: number; rotation: 0|90|180|270 }
  | { type: 'building.remove'; commandId: string; buildingId: string }
  | { type: 'crop.plant'; commandId: string; plotId: string; cropId: string }
  | { type: 'crop.harvest'; commandId: string; plotId: string }
  | { type: 'animal.feed'; commandId: string; animalId: string; amount: number }
  | { type: 'simulation.advance'; commandId: string; elapsedSeconds: number };
```

`simulation.advance` é comando interno do modo local, não endpoint público futuro. Em servidor, tempo é controlado pelo próprio backend.

## Resultados

`CommandResult = {ok:true, stateVersion:number, events:DomainEvent[]} | {ok:false, reason:ErrorCode}`; códigos estáveis `OUT_OF_BOUNDS`, `CELL_OCCUPIED`, `INSUFFICIENT_RESOURCES`, `NO_ACCESS`, `NOT_READY`, `INVALID_STATE`, `VERSION_CONFLICT`, `PATH_BLOCKED`.

## Eventos mínimos

`building.placed`, `building.removed`, `crop.planted`, `crop.ready`, `crop.harvested`, `animal.fed`, `animal.productReady`, `energy.shortage`, `water.shortage`, `save.written`, `save.migrated`.

Cada evento contém `{eventId, type, schemaVersion, occurredAt, farmId, payload}`. Não usar timestamps para sequência autoritativa; servidor deverá gerar `sequence` transacional.

## API futura (NÃO implementar Fase 1)

- `GET /api/farms/:id/snapshot` com autorização;
- `POST /api/farms/:id/commands` com validação de permissão e idempotência;
- `GET /api/world/regions/:id` para metadados públicos não sensíveis;
- canal tempo real apropriado a definir para estado de deslocamento/alertas.

Inventário, stamina, tempo de viagem, criação de itens e interceptações não devem ser confiados a dados enviados livremente pelo cliente. Localização GPS física nunca pertence aos endpoints de outros jogadores.

## Versões

Versionar tipos de comando/evento e snapshots. Migrações devem ser testáveis. Segurança deve preceder publicar comandos online. Coloque limites de taxa e payload quando houver servidor.
