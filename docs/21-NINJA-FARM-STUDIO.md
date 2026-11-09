# Ninja Farm Studio (Dev Suite V1.0)

O **Ninja Farm Studio** é o ambiente integrado de desenvolvimento e autoria visual 3D do Ninja Farm. Ele permite selecionar, inspecionar, personalizar materiais, calibrar animações, ajustar câmeras, iluminação e transformações de modelos GLB em tempo real, eliminando a necessidade de alterações manuais no código fonte para cada ajuste visual.

---

## 1. Arquitetura e Princípios

- **Sem Duplicação de Motor:** Compartilha o PlayCanvas Engine (`AppBase`, `GlbAssetLoader`, `BuildingModelFactory`) e os módulos existentes do repositório.
- **Separação de Responsabilidades:** Parâmetros visuais desacoplados na estrutura versionada `VisualConfig` ([`src/core/visual-config.ts`](file:///Z:/AI/Ninja_Farm_Project/src/core/visual-config.ts)). A lógica de simulação, economia e agricultura consome essas configurações sem ser modificada.
- **Sincronização em Tempo Real:** O jogo em execução escuta alterações via `onVisualConfigChange()` e atualiza materiais, escala e animações instantaneamente sem reiniciar a cena.
- **Proteção de Acesso:** O Studio possui barreira de autenticação por senha (`auth-gate-modal`) para qualquer ambiente fora de `localhost` / `127.0.0.1`, impedindo que usuários em produção acessem ferramentas de desenvolvimento.
- **Custo Adicional Zero:** Utiliza exclusivamente modelos 3D sob licença Creative Commons Zero (CC0) do catálogo Quaternius e Poly Haven.

---

## 2. Recursos do Ninja Farm Studio

| Módulo | Descrição |
| :--- | :--- |
| **Biblioteca de Assets** | Painel lateral esquerdo com categorização (`Characters`, `Animals`, `Buildings`, `Crops & Nature`), busca em tempo real, tamanho do arquivo e licença. |
| **Viewport 3D com Órbita** | Renderização com PlayCanvas: botão esquerdo para orbitar, botão direito/dois dedos para deslocar (pan), roda do mouse para zoom. Atalhos de câmera rápida (Frontal, Lateral, Topo, Isométrica). |
| **Inspetor de Transformações** | Controle numérico e por slider para escala uniforme, rotação em Y, elevação em Y e velocidade de caminhada/corrida. |
| **Prévia de Animações** | Barra de tempo inferior com seleção de clipes, reprodução contínua, pausa, scrub temporal e multiplicador de velocidade (0.5x, 1x, 1.5x). Testador de transições suaves com crossfade entre *Idle*, *Walk* e *Run*. |
| **Inspetor de Materiais PBR** | Paletas de cores para vestimenta principal e juntas/detalhes cibernéticos, controle de rugosidade e metalicidade. |
| **Editor de Luz e Câmera** | Intensidade do sol, intensidade do céu, tom de cor ambiente e distância de exploração da câmera. |
| **Prévia Responsiva** | Alternância instantânea entre visualização `🖥️ Desktop`, `📱 Mobile Retrato` e `📱 Mobile Paisagem` com moldura simulada de smartphone. |
| **Diagnóstico de Performance** | Leitura contínua de FPS, contagem de triângulos, draw calls, dimensões do bounding box e contagem de joints do esqueleto. |
| **Presets Versionados** | Botões para **Salvar no Jogo** (`localStorage`), **Exportar JSON**, **Importar JSON** e **Restaurar Padrões**. |
| **Alternância Jogo / Studio** | Botão `🎮 Test in Farm` abre o jogo; dentro da fazenda, o botão `🛠️ Studio [F1]` no canto inferior esquerdo abre o Studio. |

---

## 3. Instruções de Execução

### Execução Local com Vite Dev Server
```bash
npm run dev
```
- Acesse o Jogo Principal: `http://localhost:5173/` (ou porta indicada no terminal).
- Acesse o Ninja Farm Studio: `http://localhost:5173/studio.html`.
- Atalho dentro do jogo: Pressione `F1` ou clique no botão `🛠️ Studio [F1]` no canto inferior esquerdo.

### Compilação de Produção
```bash
npm run build
```
Os arquivos otimizados são gerados em `dist/index.html` e `dist/studio.html`.
