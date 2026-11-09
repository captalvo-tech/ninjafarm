# Estratégia de QA — critérios verificáveis

## Regra

Aprovação depende de **aplicação real** no navegador. Imagem gerada por IA, vídeo renderizado não interativo ou screenshot estático não comprovam qualidade ou FPS. Registrar problemas e evidências. Não marcar ✅ sem execução.

## M1: qualidade gráfica e adaptabilidade

| ID | Cenário | Resultado esperado |
| --- | --- | --- |
| V01 | Abrir PC em 1920×1080 | Cena 3D detalhada, material PBR, sombras, terreno e ninja real |
| V02 | Emular 390×844 portrait | Cena não distorcida, sem HUD cortado, câmera adapta yaw/FOV/distância |
| V03 | Emular 844×390 landscape | Sem stretch, controls acessíveis, sem scroll lateral |
| V04 | Alternar orientação/resize durante jogo | Não muda posições, não perde recursos nem quebra input |
| V05 | Orbit/zoom e modo follow | Horizonte correto, colisão de câmera, sem visão superior 2D como padrão |
| V06 | Reproduzir ninja idle/walk/run | Transições suaves, nenhuma malha “sem ossos”, sem sliding grosseiro |
| V07 | Inspecionar assets | Sem 404, modelo licenciado e texturas corretas, ausência de cubos finais |
| V08 | WebGPU indisponível | Fallback funcional em WebGL 2 (testado quando disponível) |

## M2: grid e construção

- `grid.width=64`, `grid.height=36`: **2.304 células**; testes de limites (0,0), (63,35), fora de bounds.
- Rotacionar footprint retangular, detectar overlap, remover e colocar novamente.
- Validar pathfinding após estrutura bloquear trecho e após remoção; ninja nunca atravessa estrutura.
- Se construir parede impossibilitar saída da sede, há reação clara (rejeitar ou avisar, conforme config).
- Verificar não duplicação de materiais após cancelar, undo e repetir click.

## M3/M4: simulação

- Plantio passa pelos estados e colhe exatamente uma vez.
- Galinha produz ovos se necessidades atendidas; peixe tem ciclo/estado animado.
- Quando falta água, irrigação/produção reage; estoque jamais negativo.
- Meio-dia: geração solar positiva se há irradiância; noite: geração solar zero; bateria descarrega dentro dos limites.
- Salvar, atualizar página e reabrir preserva ações/posição/estado e continua a simulação controlada.

## M5: estabilidade e integridade

- `npm run typecheck`, `npm run test`, `npm run build` passam. Se script ausente, criar.
- Não há `Uncaught` em console para o fluxo principal.
- Testar save corrompido, schema antigo, sem espaço para escrita, modo navegador privado (se suportado), rede offline após carregamento do app.
- Testar 50+ placements, 20+ animais (se viável) e centenas de instâncias de vegetação, medindo gargalos.

## Metas iniciais de performance — **hipóteses de engenharia**

| Perfil | Meta inicial para avaliar | Observação |
| --- | --- | --- |
| PC comum | 60 FPS típico em cena M1 | medir dispositivo e resolução reais |
| Celular intermediário | >=30 FPS típico | sem prometer em todos aparelhos |
| Primeiro carregamento | orçamento de MB definido após medir assets | reduzir tamanho antes de lançar |
| Memória | monitorar uso aproximado e context loss | registrar resultados, não assumir limites |

Se não tiver dispositivo físico, usar emulação e **escrever que teste físico permanece pendente**. Não inventar métricas. Antes de adicionar mais conteúdo à cena, fazer perfil de render/CPU/GPU.

## Ferramentas

- Unidade: Vitest/Jest conforme scaffold; simulação pura e grid sem WebGL.
- E2E: Playwright se disponível; browser real com screenshot + verificação funcional.
- Regressão visual: capturas padronizadas PC portrait/landscape comparadas manualmente.
- Diagnóstico: console, rede, WebGL/WebGPU, timing e profiler quando possível.

## Relatório mínimo por entrega

`Marco | commit/hash | navegador/versão | dispositivo/resolução | checklist executado | FPS medido | carregamento medido | screenshots/gravação | bugs | próximo passo`.
