# Arquitetura técnica e fronteiras

## Decisão inicial

**Cliente:** PlayCanvas Engine standalone, TypeScript, Vite. **Armazenamento de protótipo:** IndexedDB (adaptador; fallback e exportação de save sob teste). **3D:** GLB/glTF 2.0 e materiais PBR; otimização de texturas, instâncias e LOD. **Testes:** unitários sobre simulação independente do browser, testes E2E/visuais quando ferramentas estiverem disponíveis.

PlayCanvas Engine suporta WebGL 2/WebGPU e pode ser usado sem Editor. O scaffold oficial atual é `npm create playcanvas@latest my-app -- -f engine`. Verifique requisitos de Node no guia oficial, inclusive a versão do `create-playcanvas`, antes de rodar.

## Princípio principal

**A simulação não depende do renderizador.** Modelos TypeScript de água, produção, células e inventário podem rodar sem WebGL. A UI recebe estado de leitura; comandos validados atualizam estado; eventos notificam cena/HUD. Isso permitirá migração para simulação server-side na Fase 2+.

```text
Browser desktop/mobile
 ├─ Input: mouse/teclado/toque
 ├─ UI: HUD de recursos, construção, feedback
 ├─ PlayCanvas: terrain, camera, models, animation, VFX
 └─ Application/Core (TS, sem engine)
      ├─ FarmMap 64×36 / occupancy / navigation
      ├─ Building catalog & commands
      ├─ Farming / animals / resources
      ├─ EnergyWaterSimulation / GameClock
      ├─ Domain events / selectors
      └─ PersistencePort
           └─ IndexedDB adapter (Fase 1)

Fase 2+ (FUTURO): servidor autoritativo + banco + cartografia real.
```

## Estrutura sugerida de repositório **após** scaffold

```text
project-root/
  README.md                    (documentação principal)
  AGENTS.md
  docs/
  public/assets/              (GLB, texturas KTX2, áudio autorizado)
  src/
    main.ts
    app/bootstrap.ts
    core/
      config.ts
      grid.ts
      commands.ts
      events.ts
      types.ts
    simulation/
      clock.ts
      crops.ts
      animals.ts
      energy.ts
      water.ts
      inventory.ts
      placement.ts
      navigation.ts
    rendering/
      scene.ts
      asset-loader.ts
      environment.ts
      animations.ts
      cameras.ts
    input/
      pointer.ts
      touch.ts
      keyboard.ts
    ui/
      hud.ts
      panels.ts
      responsive.ts
    persistence/
      port.ts
      indexeddb.ts
      migrations.ts
  tests/unit/
  tests/e2e/
  scripts/                     (JS/TS/Python, nunca .ps1)
  package.json
  vite.config.ts
```

Nenhuma estrutura proposta substitui o scaffold se a versão atual usar nomes diferentes; preserve as convenções válidas.

## Contratos de módulo

- `FarmMap`: dimensão fixa 64×36, `isInside()`, `getCellsInFootprint()`, `canPlace()`, `isWalkable()`. Nunca usar índice de matriz sem bounds checking.
- `PlaceBuildingCommand`: idempotência via `commandId`; valida recursos, footprint, colisões e condições; emite `building.placed`.
- `Navigation`: caminho determinístico no grid ocupacional; independência do modelo visual. Não diferenciar proprietário/invasor em obstáculos físicos, apenas permissões e armadilhas detectáveis nas fases correspondentes.
- `Energy`: produção solar/consumo/armazenamento, com unidades consistentes e clamping.
- `Water`: captação/armazenamento/consumo, com balanços testáveis.
- `SaveRepository`: `save/load/export/import/migrate`; mudanças de versão controladas.
- `AssetManifest`: id → url/path, origem, licença, formato, número de triângulos/texturas quando medidos.

## Início proposto — terminal

```powershell
# Execute em um diretório escolhido; em Windows, preferir D:\ quando possível.
node --version
npm --version
npm create playcanvas@latest ninja-farm -- -f engine
cd ninja-farm
npm install
npm run dev
npm run build
```

O agente deve ler o `package.json` gerado, criar scripts de `typecheck/test` se ausentes e conferir o guia oficial do scaffold. **Não** copiar inadvertidamente arquivos do pacote de documentação sobre `src` gerado; mesclar docs e código conscientemente.

## Renderização e otimização

- Usar WebGPU quando suportado; **fallback real** para WebGL 2, sem assumir WebGPU no mobile.
- Preferir materiais PBR, normal/roughness, light baking quando pertinente, sombras com qualidade escalonada, texture atlas, instancing de culturas e vegetação e simplificação por distância.
- Procedural para distribuição de plantações, mas modelos 3D de origem real em vez de “primitivas como arte final”.
- Limitar pixel ratio dinâmico, densidade de sombras, partículas e draw calls conforme preset.
- Não usar texturas 4K repetidas por planta; catálogo de tamanhos e compactação deve ser inspecionado.

## Servidor e implantação

Fase 1 pode ser build estático servido em subdiretório, sujeito a regras de cache e SPA. Não presumir que hospedagem compartilhada/Cloud Startup permita processos persistentes de Node necessários ao multiplayer. Na Fase 2, validar VPS, serviços gerenciados ou runtime de backend antes de contratar. Não implantar sem confirmação.

## Segurança futura

Cliente é não confiável. Ao existir multiplayer, servidor valida tempos, economia, movimentos, saques, stamina, inventário e autorização. Salvar local não é antifraude. Nunca usar posição GPS real ao vivo como destino visível de outros usuários.
