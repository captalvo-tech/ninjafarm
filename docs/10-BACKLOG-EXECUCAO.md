# Backlog executável da Fase 1

Todas as tarefas devem gerar código real + teste/prova de funcionamento. Não abrir um epic de IA do mundo antes de completar o slice.

## P0 — inicialização e prova visual

- **NF-001** Criar projeto PlayCanvas standalone TS/Vite e scripts de execução/build/typecheck/test. **Aceite:** roda local, build consistente.
- **NF-002** Implementar scena/terreno 3D e iluminação/sombras. **Aceite:** terreno tridimensional com materiais de verdade, na janela do navegador.
- **NF-003** Criar sistema de catálogo/carregamento de GLB, manifest de licenças e fallback explícito. **Aceite:** asset válido abre, erro de URL gera aviso.
- **NF-004** Importar ninja rigado e animações idle/walk/run. **Aceite:** transição funcionando em browser, em PC e modo mobile.
- **NF-005** Construir duas câmeras (build oblíqua e explore terceira pessoa), orbit/zoom/resize. **Aceite:** portrait/landscape sem distorção nem rotação sideways.
- **NF-006** Controles de toque e desktop com HUD responsivo. **Aceite:** percorrer cenário e operar câmera; botões acessíveis.
- **NF-007** Benchmark visual/funcional M1. **Aceite:** evidências + registro de problemas, decisão de prosseguir condicionada.

## P1 — grade e construção

- **NF-008** Representar 64×36 células, bounds e footprints rotacionáveis. **Aceite:** tests para limites e rotação.
- **NF-009** Ferramentas de placement/preview verde/vermelho, custos e cancelamento. **Aceite:** não ocupar célula já usada e não duplicar estoque.
- **NF-010** Depósito, casa, canteiro e painel/bateria com IDs consistentes. **Aceite:** adicionar/remover/refletir no save.
- **NF-011** Pathfinding e colisão de construções. **Aceite:** ninja encontra rota alternativa, nunca atravessa objeto sólido.

## P2 — fazenda viva

- **NF-012** Culturas de teste com ciclo e 2+ estados visuais. **Aceite:** plantar/colher com recursos consistentes.
- **NF-013** Galinha (render animado e comportamento básico) e ovos. **Aceite:** fome/produção/saldo testados.
- **NF-014** Tanque com peixe, nado e produção. **Aceite:** estado visual + recurso após manejo.
- **NF-015** Sistema de inventário e depósito. **Aceite:** capacity e recebimentos atômicos.

## P3 — autossuficiência e tempo

- **NF-016** Simulação solar e consumo elétrico, bateria. **Aceite:** sol/noite, charge/discharge/clamping.
- **NF-017** Cisterna, irrigação, prioridades de consumo. **Aceite:** falta de água interrompe consumidor.
- **NF-018** Clock + ciclo dia/noite + clima simulado local; sem serviço pago. **Aceite:** luz e recursos coerentes.
- **NF-019** Save versionado IndexedDB, import/export opcional, migrações. **Aceite:** salvar e restaurar sem perda/duplicação.
- **NF-020** Offline catchup seguro no modo local (limitado e explícito). **Aceite:** relógio negativo, período longo, reabertura.
- **NF-021** QA completo e entrega Fase 1. **Aceite:** `09` e `17` preenchidos, limitações escritas.

## Política de bloqueio

- NF-007 é um **gate**: não iniciar agricultura pesada quando o 3D ainda tiver aparência descartável.
- Se não houver ninja 3D autorizado disponível, escrever impeditivo concreto, não anunciar concluído.
- Implementar em pedaços de tamanho razoável, sem reformulação geral da stack durante o fluxo.
