# PROMPT PRINCIPAL PARA COLAR NO ANTIGRAVITY

Atue como engenheiro-chefe de um novo jogo de navegador 3D chamado provisoriamente **Fazenda Ninja**. Esta pasta contém documentação de produto, arte, arquitetura e qualidade. **Leia todos os documentos relevantes antes de escrever código**, começando por `AGENTS.md`, `docs/00-DECISOES-E-ESCOPO.md`, `docs/03-FASE1-PRD.md`, `docs/04-ARQUITETURA.md`, `docs/05-VISUAL-CAMERA-UX.md`, `docs/06-PIPELINE-ASSETS.md`, `docs/09-QA-CRITERIOS-ACEITE.md` e `docs/10-BACKLOG-EXECUCAO.md`.

**Missão atual:** implementar a **Fase 1: Fazenda autossustentável** como jogo 3D real, não uma aplicação 2D/visão superior. A fazenda ocupa uma grade lógica de 64×36, com cena visual totalmente tridimensional. O jogador deve conseguir construir uma pequena fazenda, mover o ninja, cuidar de recursos e salvar o progresso. O mundo geográfico real, invasões, armadilhas e perseguições pertencem a fases futuras e NÃO devem ser implementados agora.

**Stack obrigatória:** PlayCanvas Engine standalone + TypeScript + Vite, sem pagar pelo PlayCanvas Editor. Integrar modelos GLB legais, animação de humanoide, materiais de qualidade, sombras, vegetação e controles desktop/mobile. Priorizar asset packs CC0 de qualidade e uso gratuito de Mixamo para humanoides, registrando licenças e autoria; não tentar 'gerar 3D' com simples imagens ou CSS. Caso falte asset crucial, liste o impedimento exato e implemente um substituto temporário marcado visivelmente como provisório.

**Procedimento de implementação:**

1. Inspecione o ambiente (Node, npm, ferramentas e permissões), sem presumir apps instalados. Garanta que qualquer instalação local respeite a preferência por `D:\` quando disponível. Não crie `.ps1`.
2. Faça o scaffold oficial PlayCanvas Engine + TypeScript/Vite e configure `dev`, `build`, `typecheck`, `test`. Se o CLI do scaffold exigir interação, use a rota oficial sem improvisar APIs obsoletas.
3. Construa PRIMEIRO a prova visual 3D do `Milestone M1`: terreno com elevação suave, materiais e iluminação, casa/galpão real em 3D, vegetação, ninja com animação idle/walk/run e câmera oblíqua/terceira pessoa. Capture evidência de funcionamento em browser, não arte conceitual.
4. Torne a câmera adaptável ao aspect ratio; no mobile retrato reoriente enquadramento/yaw, distância e interface, **não gire a imagem da cena de lado**. Garantir modo visão geral da base e modo seguir ninja. Não use visão vertical top-down como modo principal.
5. Antes de avançar, valide M1 segundo `docs/09-QA-CRITERIOS-ACEITE.md`, com medições reais onde possível. Se ainda não estiver convincente, melhore a cena antes de expandir gameplay.
6. Implemente sequencialmente os marcos seguintes: construção modular 64×36 e pathfinding, agricultura + animais, água + energia solar/bateria, ciclo temporal e persistência local. Use somente os valores identificados como **parâmetros propostos** nas especificações, centralizados em configuração.
7. Em cada etapa, rode os testes e atualize `docs/19-LOG-IMPLEMENTACAO.md` com comandos, provas, problemas e pendências. Não diga que executou um teste se não executou.
8. Entregue ao final um resumo curto com os arquivos alterados, funcionalidades realmente completas, como rodar localmente, evidências, custos, problemas e próximo marco.

**Restrições:** sem APIs pagas, sem copiar conteúdo de jogos comerciais, sem push/produção sem confirmação, sem expor chaves, sem backup em diretório público. Não presumir um servidor multiplayer existente. Não avançar para Fase 2 antes de fechar os critérios de aceite da Fase 1. **Execute efetivamente; não pare num documento de planejamento.**
