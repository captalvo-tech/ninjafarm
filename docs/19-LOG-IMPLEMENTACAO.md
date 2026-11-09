# Log de implementação — Ninja Farm (Fazenda Ninja)

## Registro de Sessões

### 2026-11-08 — Melhorias de Gameplay, Áudio Procedural, Fauna e Mobile
- **Status:** Implementado, testado e publicado em `https://pinut.shop/`.
- **Novas Funcionalidades Entregues:**
  1. **Áudio Procedural Web Audio API ([`src/audio/sound.ts`](file:///Z:/AI/Ninja_Farm_Project/src/audio/sound.ts)):**
     - Sem dependência de arquivos de áudio externos.
     - Som de passos rítmicos do ninja na grama/terra durante locomoção.
     - Som de impacto e confirmação harmônica ao construir.
     - Arpejo pentatônico brilhante ao colher safras.
     - Som de demolição com serra harmônica.
     - Botão de Mudo/Ativo no HUD (🔊 / 🔇).
  2. **Fauna Animada e Vida na Fazenda ([`src/rendering/fauna.ts`](file:///Z:/AI/Ninja_Farm_Project/src/rendering/fauna.ts)):**
     - Galinhas com IA autônoma perambulando pelo terreiro, alternando entre caminhada ondulante, descanso e bicadas no solo.
     - Raposa estilizada patrulhando a periferia e árvores da base.
  3. **Sistema de Interação de Proximidade ([`src/gameplay/interaction.ts`](file:///Z:/AI/Ninja_Farm_Project/src/gameplay/interaction.ts)):**
     - Balão flutuante contextual no rodapé indicando ações disponíveis (`[E] Colher Plantação Pronta`, `[E] Plantar Nova Safra`, `[E] Inspecionar Painel Solar`).
     - Executável tanto via tecla `E` no desktop quanto por clique/toque no próprio balão.
  4. **Virtual Joystick para Dispositivos Móveis ([`src/input/touch-joystick.ts`](file:///Z:/AI/Ninja_Farm_Project/src/input/touch-joystick.ts)):**
     - Analógico virtual translúcido com stick direcional dinâmico na base esquerda.
     - Detecção automática de telas de toque e viewports mobile.
     - Botões dedicados `⚡ Correr` e `🎯 Ação` para telas touch.
  5. **Modo Demolição com Reembolso de Recursos:**
     - Botão `🔨 Demolir` na barra de ferramentas.
     - Permite desmontar estruturas existentes liberando células na grade e devolvendo 60% dos materiais ao inventário (sede HQ protegida contra demolição).
  6. **Missões do Ninja — Guia de Objetivos ([`src/ui/objectives.ts`](file:///Z:/AI/Ninja_Farm_Project/src/ui/objectives.ts)):**
     - Painel superior esquerdo com checklist de objetivos da Fase 1 (Explorar base, Colher arroz, Construir estrutura, Salvar progresso).
- **Testes & Qualidade:**
  - `npm run typecheck`: 0 erros.
  - `npm run test`: 11 testes unitários aprovados no Vitest.
  - `npm run build`: 1.275 módulos transformados, gerando bundle `dist/assets/index-Dxz1muVH.js` (1.21 MB).
  - Deploy em `domains/pinut.shop/public_html/` via SCP com permissões 755.
  - Smoke tests HTTP 200 confirmados.

### 2026-11-08 — Expansão Ninja Jutsu, Clima Sakura, Alvo de Treino e Progressão
- **Status:** Implementado, testado e publicado em `https://pinut.shop/`.
- **Novas Funcionalidades Entregues:**
  1. **Habilidades Ninja (Jutsus e Táticas):**
     - **Lançamento de Shuriken 3D (`Tecla F` / Botão Mobile `🗡️`):** Projétil giratório tridimensional com física vetorial em alta velocidade, som cortante e impacto em alvos e obstáculos.
     - **Salto com Fumaça / Shunshin no Jutsu (`Tecla Q` / Botão Mobile `💨`):** Evasão rápida que gera nuvem de fumaça translúcida, impulsiona o ninja 4.2m na direção frontal com checagem de colisão e som característico.
     - **Suiton: Jutsu de Liberação de Água (`Tecla C`):** Onda de água expansiva circular no solo que irriga canteiros próximos e concede EXP ao jogador.
  2. **Alvo de Treino do Dojo ([`src/rendering/training-dummy.ts`](file:///Z:/AI/Ninja_Farm_Project/src/rendering/training-dummy.ts)):**
     - Boneco de treino tradicional de palha e madeira com chapéu cônico kasa e alvo concêntrico carmesim localizado na área de treino (grade 20, 10).
     - Detecção de colisão 3D com shurikens, animação de oscilação amortecida ao ser atingido, fagulhas visuais, efeito sonoro de impacto de madeira seca e concedendo +15 EXP.
  3. **Sistema de Progressão Ninja & EXP ([`src/gameplay/progression.ts`](file:///Z:/AI/Ninja_Farm_Project/src/gameplay/progression.ts)):**
     - 5 patamares de graduação (Genin Farmer -> Chunin Cultivator -> Jonin Harvester -> Sannin Agricultor -> Kage of the Harvest).
     - Barra de EXP e indicador de nível integrados ao topo do HUD.
     - Banner triunfante com fanfarra harmônica na subida de nível.
  4. **Atmosfera & Clima de Cerejeiras ([`src/rendering/weather.ts`](file:///Z:/AI/Ninja_Farm_Project/src/rendering/weather.ts)):**
     - Pétalas de Sakura (cerejeira japonesa) caindo suavemente do céu com oscilação aerodinâmica e dinâmica de vento.
  5. **Céu Celestial 3D e Lanternas Noturnas ([`src/rendering/celestial.ts`](file:///Z:/AI/Ninja_Farm_Project/src/rendering/celestial.ts)):**
     - Orbes 3D do Sol e da Lua em órbita realista ao longo do ciclo diário/noturno.
     - Campo de 60 estrelas visíveis durante a noite.
     - Iluminação pontual acolhedora nas lanternas da sede principal que se acendem automaticamente ao anoitecer.
  6. **Grade Holográfica Tática ([`src/rendering/grid-overlay.ts`](file:///Z:/AI/Ninja_Farm_Project/src/rendering/grid-overlay.ts)):**
     - Projeção de grade modular 64×36 ativável/desativável com a `Tecla G`.
  7. **Legenda Rápida de Comandos no HUD:**
     - Guia fixo e discreto no rodapé exibindo os atalhos de teclado `[WASD] Mover | [Shift] Correr | [E] Ação | [F] Shuriken | [Q] Salto Fumaça | [C] Jutsu de Água | [G] Grade | [R] Girar`.
- **Testes & Qualidade:**
  - `npm run typecheck`: 0 erros.
  - `npm run test`: 15 testes unitários aprovados no Vitest (3 suítes: `grid.test.ts`, `simulation.test.ts`, `progression.test.ts`).
  - `npm run build`: bundle `dist/assets/index-CHiT8f4y.js` (1.24 MB).
  - Deploy completo em `hostinger-prod:domains/pinut.shop/public_html/` com permissões `755`.
  - Smoke tests HTTP 200 confirmados em `https://pinut.shop/` e `https://pinut.shop/index.html`.

### 2026-11-08 — Postes de Iluminação Noturna (Tōrō / Lantern Posts)
- **Status:** Implementado, testado e publicado em `https://pinut.shop/`.
- **Novas Funcionalidades Entregues:**
  1. **Poste de Iluminação 3D ([`BuildingModelFactory.createLampPost`](file:///Z:/AI/Ninja_Farm_Project/src/rendering/models.ts)):**
     - Estrutura tradicional japonesa de poste de madeira nobre de cedro, suporte horizontal, telhadinho pagoda e câmara de lanterna translúcida com brilho emissivo âmbar.
     - Fonte de luz pontual omnidirecional (`range: 16m`, `intensity: 1.4`) proporcionando iluminação quente e nítida ao redor da fazenda, caminhos e plantações durante a noite.
  2. **Ciclo Noturno Automático ([`CelestialSkyManager`](file:///Z:/AI/Ninja_Farm_Project/src/rendering/celestial.ts)):**
     - Sincronização inteligente com o relógio do jogo: os postes permanecem apagados de dia e acendem automaticamente com o cair da noite.
     - Métodos de registro e cancelamento dinâmico (`registerLantern` / `unregisterLantern`) para suporte à construção e demolição.
  3. **Consumo Elétrico Realista ([`EnergySystem`](file:///Z:/AI/Ninja_Farm_Project/src/simulation/energy.ts)):**
     - O poste de iluminação consome 1 W apenas durante a noite quando a lâmpada está acesa, mantendo o consumo em 0 W durante o dia.
  4. **Catálogo de Construção e HUD ([`FarmHUD`](file:///Z:/AI/Ninja_Farm_Project/src/ui/hud.ts)):**
     - Novo botão `🏮 Poste de Luz` adicionado à barra de ferramentas de construção.
     - Custo acessível (8 madeiras, 4 metais), footprint compacto de 1x1 célula (2m x 2m), permitindo colocar postes ao longo de caminhos, canteiros e cercas.
  5. **Instalação Padrão de Assentamento:**
     - Dois postes de luz adicionados por padrão na vila inicial (grade `13, 14` e `19, 14`) iluminando o pátio central da Sede HQ e o canteiro principal.
- **Testes & Qualidade:**
  - `npm run typecheck`: 0 erros.
  - `npm run test`: 16 testes unitários aprovados no Vitest (novo teste de consumo noturno de postes adicionado em `simulation.test.ts`).
  - `npm run build`: bundle `dist/assets/index-DPTv73d_.js` (1.24 MB).
  - Deploy completo via SCP no servidor Hostinger (`domains/pinut.shop/public_html`) com permissões `755`.
  - Smoke tests HTTP 200 confirmados em `https://pinut.shop/assets/index-DPTv73d_.js` e `https://pinut.shop/index.html`.

### 2026-11-08 — Expansão Kage Bunshin, Portal Torii, Interatividade com Animais e Poeira Dinâmica
- **Status:** Implementado, testado e publicado em `https://pinut.shop/`.
- **Novas Funcionalidades Entregues:**
  1. **Kage Bunshin no Jutsu / Clone das Sombras ([`ShadowCloneManager`](file:///Z:/AI/Ninja_Farm_Project/src/gameplay/shadow-clone.ts)):**
     - Ativado via **`Tecla B`** no teclado ou botão touch **`👥`** no mobile.
     - Invoca um clone 3D translúcido em uma nuvem de fumaça com efeito sonoro de selo ninja (`sound.playCloneSpawn()`).
     - **IA Autônoma de Colheita:** O clone localiza canteiros com safras prontas (`ready`), corre até eles em alta velocidade (5.2 m/s), colhe automaticamente concedendo alimentos e EXP ao jogador e se dissipa em fumaça após 18s.
  2. **Portal Torii Sagrado Japonês ([`BuildingModelFactory.createToriiGate`](file:///Z:/AI/Ninja_Farm_Project/src/rendering/models.ts)):**
     - Estrutura monumental clássica carmesim com pilares circulares (*hashira*), bases de pedra preta (*kamebara*), vigas duplas (*nuki* e *kasagi* curvada), placa central (*gakuzuka*) e duas lanternas ornamentais.
     - Adicionado ao catálogo de construções (3x1 células = 6m x 2m) e posicionado como portal de entrada da fazenda no caminho sul (grade `20, 31`).
  3. **Interatividade com Animais da Fazenda ([`ProximityInteractionManager`](file:///Z:/AI/Ninja_Farm_Project/src/gameplay/interaction.ts)):**
     - **Alimentar Galinhas:** Ao se aproximar de uma galinha no terreiro, surge o balão `[E] Alimentar Galinha (+10 🥚 Alimento)`. O jogador alimenta a ave, toca som dócil (`sound.playAnimalPet()`) e coleta ovo fresco (+10 Alimento, +15 EXP) com coração flutuante.
     - **Acariciar a Raposa:** Ao se aproximar da raposa da base, surge o balão `[E] Acariciar Raposa Shinobi (+35 XP 🦊)`. A raposa abana a cauda e concede amizade e bônus de EXP.
  4. **Partículas de Poeira de Corrida (Sprint Dust) ([`VisualEffectsManager`](file:///Z:/AI/Ninja_Farm_Project/src/rendering/vfx.ts)):**
     - Pequenas nuvens de poeira e terra geradas dinamicamente sob os pés do ninja ao correr em velocidade máxima (`Shift`).
  5. **Ambiência Sonora Noturna com Grilos do Japão ([`SoundManager`](file:///Z:/AI/Ninja_Farm_Project/src/audio/sound.ts)):**
     - Grilos noturnos sintetizados via oscilador senoidal suave em alta frequência (4.6 kHz) que cantam periodicamente durante a noite junto às notas meditativas de koto.
- **Testes & Qualidade:**
  - `npm run typecheck`: 0 erros.
  - `npm run test`: 16 testes unitários aprovados no Vitest.
  - `npm run build`: bundle `dist/assets/index-BHPZMoc3.js` (1.25 MB).
  - Deploy completo via SCP em `hostinger-prod:domains/pinut.shop/public_html/` com permissões `755`.
  - Smoke tests HTTP 200 confirmados em `https://pinut.shop/assets/index-BHPZMoc3.js` e `https://pinut.shop/index.html`.

### 2026-11-08 — Arquitetura Mobile-First & Ergonomia Touch Nativa
- **Status:** Implementado, testado e publicado em `https://pinut.shop/`.
- **Reformulação Direcionada ao Mobile:**
  1. **Remoção de Poluição Visual de Teclado:**
     - Eliminada completamente a barra de legendas de atalhos de PC (`.hud-legend-pill`).
     - Balões de interação simplificados para toque direto (`Toque`).
  2. **Controle Ergonômico de 2 Polegares (Mobile-First):**
     - **Polegar Esquerdo (Analógico Fluido com Auto-Sprint):** Ao movimentar suavemente, o ninja caminha; ao puxar o analógico além de 60%, a corrida ativa automaticamente com poeira nos pés, sem necessidade de segurar um botão extra.
     - **Polegar Direito (Botão Contextual Inteligente de 74px):** Um único botão principal proeminente e tátil que adapta seu ícone e função em tempo real conforme o ninja se aproxima de elementos:
       - Próximo a canteiro pronto ➔ `🌾 Colher`
       - Próximo a canteiro vazio ➔ `🌱 Plantar`
       - Próximo a galinha ➔ `🥚 Alimentar`
       - Próximo a raposa ➔ `🦊 Acariciar`
       - Próximo a estruturas ➔ `🔍 Inspecionar`
       - Livre no terreno ➔ `💨 Esquiva / Dash`
     - **Botão Secundário de Jutsu (54px):** Botão satélite limpo para disparo de Shuriken.
  3. **Otimizações para Navegadores Mobile (iOS e Android):**
     - `viewport-fit=cover` e `user-scalable=no` no `index.html` para prevenir zoom acidental.
     - Suporte a entalhes de tela (`env(safe-area-inset-top)` e `env(safe-area-inset-bottom)`).
     - `touch-action: none` e supressão de seleção de texto e pull-to-refresh.
     - Ocultação inteligente dos controles virtuais no Modo Construção para dar espaço total à manipulação touch do terreno.
  4. **Top Bar Compacta e Responsiva:**
     - Em telas compactas (< 900px), a barra superior preserva apenas os indicadores vitais (Alimento, Água, Energia, Dia e Hora), liberando o campo de visão.
- **Testes & Qualidade:**
  - `npm run typecheck`: 0 erros.
  - `npm run test`: 16 testes unitários aprovados no Vitest.
  - `npm run build`: bundle `dist/assets/index-COYvTLKH.js` (1.25 MB).
  - Deploy completo via SCP em `hostinger-prod:domains/pinut.shop/public_html/` com permissões `755`.
  - Smoke tests HTTP 200 confirmados em `https://pinut.shop/assets/index-COYvTLKH.js` e `https://pinut.shop/index.html`.

### 2026-11-08 — Gestos Multi-Touch, Motor Háptico, Cluster de Jutsus & Botânica 3D
- **Status:** Implementado, testado e publicado em `https://pinut.shop/`.
- **Evolução Mobile-First Avançada:**
  1. **Motor de Gestos Multi-Touch no Canvas ([`src/main.ts`](file:///Z:/AI/Ninja_Farm_Project/src/main.ts)):**
     - **Pinch-to-Zoom Nativo:** Rastreamento simultâneo de múltiplos ponteiros touch. O gesto de pinça com 2 dedos aproxima ou afasta suavemente a câmera sem solavancos.
     - **Órbita Touch Unimanual:** Deslizar 1 dedo na tela gira a câmera livremente pelo cenário 3D.
     - **Tap-to-Move com Indicador Holográfico:** Tocar em qualquer célula livre do terreno exibe um anel verde esmeralda em expansão (`vfx.spawnMoveBeacon`) e move o ninja suavemente até o destino (o analógico virtual cancela automaticamente o destino ao ser tocado).
     - **Tap-to-Interact:** Tocar diretamente no boneco do dojo lança um shuriken; tocar em animais ou canteiros próximos executa a ação correspondente imediatamente.
  2. **Motor de Feedback Háptico Nativo ([`src/input/haptics.ts`](file:///Z:/AI/Ninja_Farm_Project/src/input/haptics.ts)):**
     - Integração com a `navigator.vibrate` API para micro-vibrações táteis sincronizadas:
       - Toques de interface: pulso ultraleve de 12ms.
       - Lançamento de Shuriken e impactos: pulso de 24ms.
       - Colheita abundante e afagos em animais: pulso duplo tátil `[18ms, 30ms, 24ms]`.
       - Lançamento de Jutsus elementais: padrão sincopado `[22ms, 18ms, 30ms]`.
       - Subida de Nível (Level Up): vibração triunfante `[40ms, 50ms, 40ms, 50ms, 80ms]`.
  3. **Cluster de Jutsus Ninjas no Polegar Direito ([`src/input/touch-joystick.ts`](file:///Z:/AI/Ninja_Farm_Project/src/input/touch-joystick.ts)):**
     - Acabou a dependência de teclas de computador (`F`, `Q`, `C`, `B`). Todos os 4 jutsus ninjas agora estão na ponta do polegar direito em botões circulares translúcidos:
       - `🗡️ Shuriken`: Disparo rápido 3D com colisão física.
       - `💨 Shunshin`: Dash e evasão veloz com fumaça.
       - `🌊 Suiton`: Chuva de irrigação em raio de 6.5m.
       - `👤 Kage Bunshin`: Invocação do clone autônomo colhedor.
  4. **Seletor Rápido de Sementes Mobile (Fast-Plant Thumb Pill):**
     - Ao se aproximar de um canteiro vazio, uma barra flutuante centralizada e arredondada surge suavemente acima da área de ação com as 3 culturas disponíveis:
       - `🌾 Arroz` (Ciclo de 45s, 25 alimento)
       - `🥕 Cenoura` (Ciclo curto de 25s, 15 alimento)
       - `🪷 Lótus` (Ciclo nobre de 55s, 50 alimento)
     - O jogador pode alternar a semente com 1 toque no polegar e plantar diretamente.
  5. **Modelagem e Renderização 3D Distinta para Cada Planta ([`src/rendering/models.ts`](file:///Z:/AI/Ninja_Farm_Project/src/rendering/models.ts)):**
     - `rice`: Hastes delgadas verdes que se curvam com espigas douradas radiantes ao amadurecer.
     - `vegetable`: Folhagem plumosa densa com a coroa das cenouras laranjas despontando na terra arada.
     - `lotus`: Almofadas de vitória-régia verde esmeralda no leito com flores de lótus desabrochadas em rosa místico e núcleo brilhante.
- **Testes & Qualidade:**
  - `npm run typecheck`: 0 erros (TypeScript estrito).
  - `npm run test`: 16 testes unitários aprovados no Vitest com nova verificação de culturas.
  - `npm run build`: bundle otimizado `dist/assets/index--S6lx311.js` (1.26 MB).
  - Deploy completo via SCP em `hostinger-prod:domains/pinut.shop/public_html/` com permissões `755`.
  - Smoke tests HTTP 200 confirmados em `https://pinut.shop/assets/index--S6lx311.js` e `https://pinut.shop/index.html`.

### 2026-11-08 — Almanaque Shinobi, Terra Irrigada, Vagalumes Noturnos & Combos de Colheita
- **Status:** Implementado, testado e publicado em `https://pinut.shop/`.
- **Novidades e Polimento Adicional:**
  1. **Almanaque Shinobi / Menu Deslizante ([`src/ui/hud.ts`](file:///Z:/AI/Ninja_Farm_Project/src/ui/hud.ts)):**
     - Botão `📜` no topo que abre uma gaveta modal com visual glassmorphism desenvolvida para navegação fluida com polegar.
     - **Aba Culturas:** Guia com tempo de maturação, consumo hídrico e rendimento de Arroz, Cenoura e Lótus Sagrada.
     - **Aba Graduações:** Visualização dos 5 patamares ninja (Genin até Kage).
     - **Aba Ajustes:** Alternadores diretos para som (SFX), vibração háptica, idioma (Português / Inglês) e salvar jogo manual.
  2. **Terra Irrigada Dinâmica (Visual PBR de Umidade) ([`src/rendering/materials.ts`](file:///Z:/AI/Ninja_Farm_Project/src/rendering/materials.ts), [`src/rendering/models.ts`](file:///Z:/AI/Ninja_Farm_Project/src/rendering/models.ts)):**
     - Canteiros abastecidos com água (ou após o uso do `🌊 Suiton Jutsu`) alteram dinamicamente a terra de marrom seco para terra preta fértil com brilho acetinado e especular de umidade.
  3. **Vagalumes Cintilantes Noturnos / Hotaru ([`src/rendering/weather.ts`](file:///Z:/AI/Ninja_Farm_Project/src/rendering/weather.ts)):**
     - Ao cair da noite, 25 vagalumes emitem luz verde-esmeralda cintilante e flutuam suavemente sobre os canteiros e arredores do lago, sumindo gradualmente ao amanhecer.
  4. **Sequência e Combo de Colheita Ninja ([`src/main.ts`](file:///Z:/AI/Ninja_Farm_Project/src/main.ts)):**
     - Colheitas encadeadas em até 4.5 segundos disparam combos progressivos: `🌾 COMBO x2!`, `⚡ COMBO x3!` e `🔥 COLHEITA FRENÉTICA!` com bônus de EXP e popups flutuantes dourados.
  5. **Reações Animadas da Fauna ([`src/rendering/fauna.ts`](file:///Z:/AI/Ninja_Farm_Project/src/rendering/fauna.ts)):**
     - Ao alimentar a galinha ou acariciar a raposa, os animais dão um salto de alegria e balançam a cauda com feedback sonoro e háptico.
  6. **Salvamento Automático Silencioso em Segundo Plano:**
     - A cada 30 segundos, o progresso é persistido no IndexedDB sem travar a renderização, garantindo que o jogador mobile não perca nada ao alternar de aplicativo.
- **Testes & Qualidade:**
  - `npm run typecheck`: 0 erros.
  - `npm run test`: 16 testes unitários aprovados no Vitest.
  - `npm run build`: bundle gerado `dist/assets/index-Bt6ph-1i.js` (1.28 MB).
  - Deploy completo via SCP em `hostinger-prod:domains/pinut.shop/public_html/` com permissões `755`.
  - Smoke tests HTTP 200 confirmados em `https://pinut.shop/assets/index-Bt6ph-1i.js` e `https://pinut.shop/index.html`.

### 2026-11-08 — Pesca de Carpas Koi, Fogueira Shinobi & Expansão de Construções
- **Status:** Implementado, testado e publicado em `https://pinut.shop/`.
- **Novidades de Gameplay e Expansão:**
  1. **Pesca no Lago de Carpas Koi ([`src/gameplay/interaction.ts`](file:///Z:/AI/Ninja_Farm_Project/src/gameplay/interaction.ts), [`src/rendering/models.ts`](file:///Z:/AI/Ninja_Farm_Project/src/rendering/models.ts)):**
     - O Tanque de Peixes (`fish_pond`) foi enriquecido com duas carpas japonesas carmesim/laranja nadando sob a água cristalina e uma vitória-régia com flor de lótus flutuante.
     - Ao aproximar-se do lago, o botão mobile de ação adapta-se automaticamente para `🎣 Pescar`.
     - A pescaria fisga carpas douradas concedendo `+30 Alimento` e `+20 XP` com efeitos de água e som de respingo, com recarga inteligente a cada 20 segundos.
  2. **Fogueira Shinobi Aconchegante ([`src/rendering/models.ts`](file:///Z:/AI/Ninja_Farm_Project/src/rendering/models.ts)):**
     - Nova estrutura 1x1 construível com círculo de pedras de rio, troncos cruzados, labareda crepitante e luz omnidirecional quente acolhedora.
     - Ao aproximar-se da fogueira, o botão mobile adapta-se para `🔥 Descansar`. Tocar regenera +15 de Energia para o ninja e concede +15 XP com som e efeito háptico relaxante.
  3. **Expansão do Catálogo de Construções no HUD ([`src/ui/hud.ts`](file:///Z:/AI/Ninja_Farm_Project/src/ui/hud.ts), [`src/ui/i18n.ts`](file:///Z:/AI/Ninja_Farm_Project/src/ui/i18n.ts)):**
     - Adicionados ao carrossel de construção mobile:
       - 🔥 **Fogueira Shinobi** (`bonfire`) — 12 madeira, 4 metal
       - 🐟 **Lago de Carpas** (`fish_pond`) — 35 madeira, 20 metal
       - 🐔 **Galinheiro** (`chicken_coop`) — 40 madeira, 15 metal
     - Totalmente integrados ao sistema de preview com ghost material, rotação e demolição com reembolso.
- **Testes & Qualidade:**
  - `npm run typecheck`: 0 erros (TypeScript estrito).
  - `npm run test`: 16 testes unitários aprovados no Vitest.
  - `npm run build`: bundle otimizado `dist/assets/index-BDES8nmT.js` (1.28 MB).
  - Deploy completo via SCP em `hostinger-prod:domains/pinut.shop/public_html/` com permissões `755`.
  - Smoke tests HTTP 200 confirmados em `https://pinut.shop/assets/index-BDES8nmT.js` e `https://pinut.shop/index.html`.

### 2026-11-08 — Foco na Fazenda, Árvore de Missões Progressista, Realismo Agrícola e Cancelamento no Botão Direito
- **Status:** Implementado, testado e publicado em `https://pinut.shop/`.
- **Inovações de Realismo, Progresso e Controle:**
  1. **Árvore de Missões Progressista da Fazenda ([`src/ui/objectives.ts`](file:///Z:/AI/Ninja_Farm_Project/src/ui/objectives.ts), [`src/ui/i18n.ts`](file:///Z:/AI/Ninja_Farm_Project/src/ui/i18n.ts)):**
     - O sistema de objetivos foi reestruturado em **5 Capítulos Agrícolas Progressivos** de expansão do santuário:
       - **Capítulo I: Fundações Agrícolas:** Semear arroz, irrigar solo, colher safras maduras.
       - **Capítulo II: Rede Hídrica & Solar:** Construir Painel Fotovoltaico, Banco de Baterias, Bomba Hídrica e Cisterna de Reserva.
       - **Capítulo III: Diversificação Agroecológica:** Semear Cenouras de ciclo rápido, cultivar Flor de Lótus Sagrada e atingir combos de colheita.
       - **Capítulo IV: Pecuária & Aquaponia:** Construir Galinheiro sustentável, cuidar da fauna e erguer o Lago de Carpas Koi.
       - **Capítulo V: Santuário Autossustentável:** Construir Galpão de Suprimentos, Postes de Iluminação Tōrō, Fogueira da fazenda, negociar com o Mercador Itinerante e erguer o Portal Torii monumental.
     - As recompensas de cada missão concedem exatamente os materiais e suprimentos necessários para financiar a construção da próxima estrutura da fazenda!
     - Botão flutuante mobile ergonômico no topo esquerdo (`📜 Missões da Fazenda`) com badge interativo e indicador pulsante `🎁` para resgatar recompensas.
     - Totalmente acessível também dentro do Almanaque da Fazenda na aba dedicada `📜 Missões`.
  2. **Desativação Total do Botão Direito e Ação de Cancelamento Universal ([`src/main.ts`](file:///Z:/AI/Ninja_Farm_Project/src/main.ts)):**
     - Menu de contexto do navegador (`contextmenu`) 100% desativado.
     - O botão direito do mouse funciona exatamente como o `Esc`:
       - Cancela qualquer estrutura em posicionamento (fantasma de construção).
       - Desativa o modo de demolição.
       - Fecha instantaneamente qualquer modal ou diálogo aberto (Mercador, Missões, Almanaque).
       - Retorna ao modo de exploração se a câmera estiver em modo aéreo ou de construção.
       - Efeito sonoro e feedback visual discreto `❌ Ação Cancelada`.
  3. **Realismo Agrícola Aprofundado nos Canteiros e Solo ([`src/gameplay/interaction.ts`](file:///Z:/AI/Ninja_Farm_Project/src/gameplay/interaction.ts), [`src/simulation/crops.ts`](file:///Z:/AI/Ninja_Farm_Project/src/simulation/crops.ts)):**
     - **Consumo Hídrico no Plantio:** Semear um canteiro agora consome 1.5 L de água da reserva da fazenda para preparar o berço úmido da semente. Se a fazenda não tiver água, a semeadura não ocorre até que a bomba ou a chuva hidratem o reservatório.
     - **Inspeção de Maturação em Tempo Real:** Ao aproximar-se de qualquer canteiro em crescimento, a interface exibe a espécie, porcentagem exata de maturação e estado de hidratação do solo (`💧 Solo Fértil Irrigado` ou `⚠️ Solo Seco - Sem Água!`).
     - **Estagnação por Falta D'água:** Se os reservatórios esvaziarem, as plantações estagnam e o solo resseca visualmente até que nova água seja fornecida pela Bomba ou pelo jutsu Suiton.
  4. **Atmosfera Viva Noturna e Iluminação Acolhedora ([`src/rendering/celestial.ts`](file:///Z:/AI/Ninja_Farm_Project/src/rendering/celestial.ts), [`src/rendering/models.ts`](file:///Z:/AI/Ninja_Farm_Project/src/rendering/models.ts)):**
     - Postes de luz Tōrō e lanternas de papel washi da Sede HQ e do Portal Torii ganharam cintilação suave e orgânica à noite.
     - A Fogueira da Fazenda possui labaredas vivas com animação de pulso contínua e luz quente acolhedora oscilante.
- **Testes & Qualidade:**
  - `npm run typecheck`: 0 erros (TypeScript estrito).
  - `npm run test`: 24/24 testes unitários aprovados no Vitest (novos testes de construção específica, plantio e capítulos adicionados).
  - `npm run build`: bundle de produção otimizado `dist/assets/index-B2NA42bO.js` (1.33 MB).
  - Deploy completo via SCP em `hostinger-prod:domains/pinut.shop/public_html/` com permissões `755`.
  - Smoke tests HTTP 200 confirmados em `https://pinut.shop/assets/index-B2NA42bO.js`, `https://pinut.shop/` e `https://pinut.shop/index.html`.

### 2026-11-09 — IP 100% Autoral, Ninja Humano & Marco A: Núcleo Contextual
- **Status:** Implementado, testado e validado em navegador.
- **Inovações de Arquitetura e Game Design:**
  1. **Originalidade e Eliminação de IP Protegido:**
     - Remoção completa de referências a Naruto (*Genin, Chunin, Jonin, Kage, Suiton, Kage Bunshin, Chakra*).
     - Remoção de clones mágicos (`src/gameplay/shadow-clone.ts` removido do repositório) e habilidades sobrenaturais.
     - O ninja é estritamente humano, utilizando ferramentas manuais (shuriken de treino, salto com bomba de fumaça, enxada, balde, sementes) e maquinário agroecológico autossustentável plausível.
     - Patamares de graduação agro-shinobi 100% autorais: *Field Novice, Skilled Cultivator, Master Harvester, Estate Warden, Grand Agronomist*.
  2. **Marco A — Núcleo Contextual (Regra do Botão Único de Ação):**
     - O jogador **NÃO** precisa alternar manualmente ferramentas para arar, plantar, irrigar ou colher.
     - **Seleção não é execução:** clicar (desktop) ou tocar (mobile) seleciona o objeto no mundo 3D com destaque visual em anel holográfico esmeralda (`vfx.setSelectionHighlight`).
     - **Action Resolver ([`src/gameplay/actions/action-resolver.ts`](file:///Z:/AI/Ninja_Farm_Project/src/gameplay/actions/action-resolver.ts)):** Módulo puro determinístico que avalia o objeto selecionado, suas necessidades e recursos:
       - Terra cultivável bruta -> `Preparar solo`
       - Solo preparado -> `Plantar` (com verificação amigável de sementes)
       - Planta crescendo sem água -> `Regar` (com verificação de reserva hídrica)
       - Plantação madura -> `Colher`
       - Solo exaurido após 3 colheitas -> `Recuperar solo`
       - Galinha faminta -> `Alimentar`
       - Ninho com ovos -> `Coletar ovos`
       - Instalação danificada -> `Reparar`
       - Fogueira -> `Descansar`
       - Boneco de treino -> `Treinar arremesso`
       - Mercador itinerante -> `Negociar`
     - **Action Executor ([`src/gameplay/actions/action-executor.ts`](file:///Z:/AI/Ninja_Farm_Project/src/gameplay/actions/action-executor.ts)):** Execução atômica com prevenção de concorrência e duplo-clique acidental (debounce de 300ms). Se o personagem estiver afastado do alvo, aciona o pathfinding A* (`NavigationSystem`) e faz o ninja caminhar até o ponto antes de concluir a ação.
     - **Universal Context Action UI ([`src/ui/context-action.ts`](file:///Z:/AI/Ninja_Farm_Project/src/ui/context-action.ts)):** Card compacto com identificação e badge de status do alvo + Botão de ação ergonômico no centro inferior com ícone, rótulo, custo e atalho de teclado `[Espaço / E]` no desktop e touch no mobile.
  3. **Ciclo de Solo e Enriquecimento Agrícola:**
     - Estados de terra modelados com fidelidade visual (`raw` -> `tilled` -> `planted` -> `growing`/`thirsty` -> `ready` -> `exhausted`).
     - Novo material PBR de solo exaurido (`exhaustedSoil`) e feedback tátil/sonoro na transição entre etapas.
- **Testes & Qualidade:**
  - `npm run typecheck`: 0 erros (TypeScript estrito).
  - `npm run test`: 38/38 testes unitários aprovados no Vitest (10 testes cobrindo todos os cenários obrigatórios de ação contextual).
  - `npm run build`: bundle otimizado gerado com sucesso em 365ms (`dist/index.html` e `dist/studio.html`).
  - Verificação real com Playwright no navegador headless capturando visual desktop e mobile.

### 2026-11-09 — Droid Único, Agendador AFK & Fase A: Identidade Google e Persistência em Nuvem
- **Status:** Implementado, testado e validado (Fase A concluída).
- **Inovações de Arquitetura e Persistência:**
  1. **Separação de Papéis (Ninja Estrategista vs. Droid Único Operacional):**
     - O jogador é o mestre shinobi (planejamento, blueprints, exploração, missões externas).
     - O Droid é a unidade robótica única responsável por todo o trabalho físico (agricultura, construção, transporte, recarga de bateria).
     - Documentação completa registrada em [`docs/20-SISTEMA-DROID-AGENDADOR-AUTH.md`](file:///Z:/AI/Ninja_Farm_Project/docs/20-SISTEMA-DROID-AGENDADOR-AUTH.md).
  2. **Login Google Obrigatório & Sessão Segura ([`public/api/auth.php`](file:///Z:/AI/Ninja_Farm_Project/public/api/auth.php), [`src/persistence/auth.ts`](file:///Z:/AI/Ninja_Farm_Project/src/persistence/auth.ts)):**
     - Autenticação obrigatória com Google Identity Services (GIS). O jogo bloqueia acesso direto até a confirmação do login.
     - Validação autoritativa do token JWT no servidor pelo campo estável e imutável `sub` do Google.
     - Emissão de token de sessão seguro (cookie HTTP-only e Bearer token) e proteção contra acesso indevido entre contas.
     - Modal de login [`LoginModal`](file:///Z:/AI/Ninja_Farm_Project/src/ui/login-modal.ts) com suporte a GIS e modo de desenvolvimento.
  3. **Persistência Autoritativa em Nuvem ([`public/api/save.php`](file:///Z:/AI/Ninja_Farm_Project/public/api/save.php), [`src/persistence/cloud-save.ts`](file:///Z:/AI/Ninja_Farm_Project/src/persistence/cloud-save.ts)):**
     - O backend é a fonte de verdade do progresso da fazenda.
     - Controle otimista de concorrência com versionamento sequencial (`revision`). Rejeição automática de sobrescritas concorrentes (`409 Conflict`) impedindo perda de progresso ou duplicação de itens.
     - O IndexedDB atua como cache local de alta performance, sincronizado com o servidor.
  4. **Tela de Configurações da Propriedade ([`src/ui/settings-modal.ts`](file:///Z:/AI/Ninja_Farm_Project/src/ui/settings-modal.ts)):**
     - **Seção Conta:** Visualização do perfil Google autenticado, status da sessão e botão de Logout.
     - **Seção Progresso:** Função "Apagar progresso e começar do zero" com confirmação explícita de segurança (recria o estado inicial sem apagar a identidade).
     - **Seção Gemini AI:** Exibição do modo ativo (*Inteligente* vs. *Limitado*), campo seguro para chave pessoal do Google AI Studio e desconexão.
     - Botão de acesso direto `⚙️` integrado à barra superior do HUD ([`src/ui/hud.ts`](file:///Z:/AI/Ninja_Farm_Project/src/ui/hud.ts)).
- **Testes & Qualidade:**
  - `npm run typecheck`: 0 erros (TypeScript estrito).
  - `npm run test`: 44/44 testes unitários aprovados no Vitest (6 novos testes automatizados em [`tests/unit/auth-persistence.test.ts`](file:///Z:/AI/Ninja_Farm_Project/tests/unit/auth-persistence.test.ts) cobrindo sessão, saves na nuvem, conflito de versão e reinicialização de progresso).
  - `npm run build`: bundle de produção gerado com sucesso em 381ms.

### 2026-11-09 — Fases B, C, D, E, F e G: Droid Único, Agendador AFK, Blueprints, Gemini Read-Only e Balanceamento
- **Status:** Implementado, testado e validado (Fases B, C, D, E, F e G concluídas).
- **Novas Funcionalidades Entregues:**
  1. **Entidade do Droid Operacional Único ([`src/rendering/droid.ts`](file:///Z:/AI/Ninja_Farm_Project/src/rendering/droid.ts)):**
     - Exatamente um Droid por propriedade, com modelo humanoide ou chassi robótico com visor óptico ciano e reator de energia solar.
     - Barra de bateria flutuante em 3D sobre o chassi com cores dinâmicas (verde > amarelo > vermelho).
     - Máquina de estados: `idle` (ocioso), `walking` (em trânsito), `working` (trabalhando), `recharging` (recarregando), `paused` (pausado), `depleted` (sem bateria).
     - Consumo calibrado de bateria e retorno autônomo para a estação solar quando bateria < 15%.
  2. **Agendador Central de Tarefas ([`src/simulation/task-scheduler.ts`](file:///Z:/AI/Ninja_Farm_Project/src/simulation/task-scheduler.ts)):**
     - Fila sequencial de tarefas físicas com ordenação dinâmica por prioridade.
     - Suporte a tarefas: construção, preparo de solo, plantio, rega, colheita, alimentação e coleta animal.
     - Verificação de recursos prévia (marca `WAITING_RESOURCES` se faltarem materiais, passando para a próxima tarefa viável).
     - Pausa, retomada, cancelamento e reordenação com integridade de estado.
  3. **Sistema de Blueprints e Interface do Agendador ([`src/ui/scheduler-ui.ts`](file:///Z:/AI/Ninja_Farm_Project/src/ui/scheduler-ui.ts)):**
     - Posicionamento de construções gera blueprint translúcido/holográfico na grade e cria tarefa de construção na agenda do Droid.
     - Ao concluir a construção física, o blueprint se transforma na estrutura acabada com iluminação e funções ativas.
     - Interface deslizante da agenda (`📋 Agenda`) com monitor de bateria, tarefa ativa em andamento com barra de progresso, e botões de subir/descer prioridade e cancelar tarefas.
  4. **Simulação Determinística AFK Offline (Fase D):**
     - Reconciliação baseada no tempo transcorrido ($\Delta t$), simulando ciclos de trabalho, consumo de bateria, recarga solar e conclusão real de tarefas em modo offline.
  5. **Gemini AI Read-Only & Modo Duplo ([`src/ai/gemini-service.ts`](file:///Z:/AI/Ninja_Farm_Project/src/ai/gemini-service.ts), [`public/api/ai.php`](file:///Z:/AI/Ninja_Farm_Project/public/api/ai.php)):**
     - O Droid é estritamente de consulta: responde dúvidas, analisa a saúde da base e dá orientações estratégicas ao Ninja sem poderes de execução direta.
     - Modo Inteligente: dúvidas em linguagem natural via Gemini 2.0 Flash.
     - Modo Limitado / Robótico: 4 relatórios pré-programados sem chamadas de IA (Produção, Energia e Bateria, Próximos Passos, Diário de Eventos).
     - Penalidade obrigatória de 30 segundos no servidor e cliente após qualquer erro em pergunta livre.
  6. **Interface de Diálogo do Droid ([`src/ui/droid-chat.ts`](file:///Z:/AI/Ninja_Farm_Project/src/ui/droid-chat.ts)):**
     - Acessível diretamente pelo botão `🤖 Droid` no HUD ou clicando na unidade Droid no cenário.
     - Histórico de conversa, contador visual do bloqueio de 30 segundos e atalhos rápidos para relatórios diagnósticos.
  7. **Balanceamento e Polimento (Fase G):**
     - Tempos calibrados para jogabilidade ativa e AFK (atividades agrícolas rápidas de 8 a 15 segundos; construções de 30 a 300 segundos).
- **Testes & Qualidade:**
  - `npm run typecheck`: 0 erros (TypeScript estrito).
  - `npm run test`: 60/60 testes unitários aprovados no Vitest (9 testes dedicados ao Droid/Scheduler em [`tests/unit/droid-scheduler.test.ts`](file:///Z:/AI/Ninja_Farm_Project/tests/unit/droid-scheduler.test.ts) e 7 testes em [`tests/unit/gemini-ai.test.ts`](file:///Z:/AI/Ninja_Farm_Project/tests/unit/gemini-ai.test.ts)).
  - `npm run build`: bundle de produção gerado com sucesso em 387ms.

### 2026-11-09 — Auditoria Técnica Alpha 0.1, Reconciliação AFK Completa, Fauna/Galinhas, Tutorial e Instrumentação
- **Status:** Implementado, testado e validado (Alpha 0.1 pronta e íntegra).
- **Entregas Realizadas:**
  1. **Matriz Completa de Auditoria Técnica ([`docs/22-MATRIZ-AUDITORIA-ALPHA-0-1.md`](file:///Z:/AI/Ninja_Farm_Project/docs/22-MATRIZ-AUDITORIA-ALPHA-0-1.md)):**
     - Diagnóstico aprofundado dos 26 subsistemas da fazenda, classificando cada funcionalidade como FUNCIONAL, PARCIAL, AUSENTE ou DEFEITUOSA, com prioridades P0, P1 e P2 e testes de aceitação.
  2. **Reconciliação AFK Unificada de Culturas ([`src/simulation/crops.ts`](file:///Z:/AI/Ninja_Farm_Project/src/simulation/crops.ts)):**
     - Adicionado método `simulateOfflineSeconds` no `CropSystem` com consumo hídrico determinístico durante a ausência do jogador.
     - Se faltar água nos tanques, o crescimento é pausado deterministicamente sem criar recompensas gratuitas.
  3. **Ciclo Biológico Completo da Fauna & Galinhas ([`src/rendering/fauna.ts`](file:///Z:/AI/Ninja_Farm_Project/src/rendering/fauna.ts)):**
     - Instanciação de Galinhas Caipiras com ninhos e piquete ao lado do galinheiro.
     - Simulação de fome e produção de ovos com base no estado de saciedade.
     - Tarefas do Droid `feed_animal` e `collect_eggs` integradas diretamente ao estado e persistência dos animais (`FarmSaveState.animals`).
  4. **Diário de Eventos da Fazenda ([`src/simulation/event-journal.ts`](file:///Z:/AI/Ninja_Farm_Project/src/simulation/event-journal.ts)):**
     - Classe `EventJournal` com registro ring-buffer das ações concluídas (colheita, construções, recargas, pausas e catchup AFK).
     - Integração direta ao relatório de eventos do Droid Chat e persistência no save do jogador.
  5. **Tutorial Inicial Interativo ([`src/ui/tutorial.ts`](file:///Z:/AI/Ninja_Farm_Project/src/ui/tutorial.ts)):**
     - Onboarding em 8 passos práticos guiado pelo Droid (Apresentação, Seleção de Alvo, Botão Contextual, Agendamento, Agenda, Bateria, Blueprints, Trabalho AFK).
     - Funciona 100% offline sem dependência de chaves Gemini.
  6. **Simulador Administrativo de Tempo ([`src/simulation/time-simulator.ts`](file:///Z:/AI/Ninja_Farm_Project/src/simulation/time-simulator.ts)):**
     - Ferramenta dev para acelerar simulações de 1h, 12h, 24h, 7d, 30d e 365d em ambiente de teste isolado.
     - Comprovada equivalência determinística entre execução em tempo real e tempo simulado.
  7. **Relatório de Problemas pelos Testadores ([`src/ui/bug-report.ts`](file:///Z:/AI/Ninja_Farm_Project/src/ui/bug-report.ts), [`public/api/report.php`](file:///Z:/AI/Ninja_Farm_Project/public/api/report.php)):**
     - Modal discreto no menu de configurações permitindo aos testadores enviar bugs e diagnósticos técnicos diretamente ao servidor, com sanitização estrita (zero segredos ou tokens).
  8. **Telemetria Mínima da Alpha ([`src/core/telemetry.ts`](file:///Z:/AI/Ninja_Farm_Project/src/core/telemetry.ts)):**
     - Monitoramento seguro de funis de conversão e eventos críticos de ciclo de vida sem coleta de dados pessoais.
- **Testes & Qualidade:**
  - `npm run typecheck`: 0 erros (TypeScript estrito).
  - `npm run test`: **76/76 testes unitários aprovados no Vitest** (12 suítes incluindo novos testes de fauna, simulação AFK de culturas, `EventJournal`, `TimeSimulator` e testes não-negociáveis de integridade).
  - `npm run build`: bundle de produção gerado com sucesso em 377ms.
