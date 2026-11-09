# Instruções persistentes — agente de desenvolvimento

Você é o agente técnico principal do projeto **Fazenda Ninja (nome provisório)**. Trabalhe diretamente com a árvore real de arquivos. Nunca informe conclusão baseada apenas em planos, screenshots artificiais ou códigos não executados.

## Ordem de leitura

`docs/00-DECISOES-E-ESCOPO.md` > `docs/03-FASE1-PRD.md` > `docs/04-ARQUITETURA.md` > `docs/05-VISUAL-CAMERA-UX.md` > `docs/06-PIPELINE-ASSETS.md` > demais documentos. Se houver contradição, preserve a decisão do usuário, abra registro em `docs/13-DECISOES-PENDENTES.md` e escolha a opção reversível de menor custo.

## Regras de execução

1. Comece somente pela **Fase 1**. Não implementar mapa GPS, PvP, captura, economia de ouro, armadilhas funcionais ou NPCs atacantes agora; documentar interfaces de evolução é permitido.
2. Usar **PlayCanvas Engine standalone**, TypeScript e Vite; **não exigir o PlayCanvas Editor pago**. Consulte documentação e exemplos atuais antes de usar APIs.
3. Provar **qualidade 3D** primeiro: modelos reais GLB, iluminação/sombras, materiais, vegetação e ninja animado. Primitivas geométricas são permitidas só durante diagnóstico temporário.
4. Construir para **desktop e navegador móvel**, incluindo toque, retrato/paisagem e resize. Nunca fazer rotação visual que deixe o horizonte tombado ou o HUD ilegível.
5. Guardar dados em módulos separados da renderização. Nada de valores de recursos como propriedades da malha/câmera.
6. Catalogar e verificar licença de **cada asset externo**. CC0 preferencial; Mixamo para humanoides conforme seus termos. Não incluir assets com direitos desconhecidos ou extraídos de jogos.
7. Não ativar APIs pagas, cartões, chaves ou contas sem solicitação. Sem cobrança recorrente adicional no MVP.
8. Não criar arquivos `.ps1`; para Windows, comandos diretos de terminal. Respeitar preferência por pastas em `D:\` quando executando localmente no Windows, se ambiente comportar.
9. Comandos, dependências, licenças, dispositivos testados, limitações e evidências vão para `docs/19-LOG-IMPLEMENTACAO.md`.
10. Não tocar projetos existentes ou infraestrutura de produção. Nunca armazenar dumps e backups em diretórios servidos na web; nunca versionar segredos ou dados reais de usuários.
11. Criar commits pequenos e legíveis se houver repositório disponível, mas não criar/push em repositório pessoal sem autorização e confirmação do destino.
12. Se um recurso não estiver funcional, mostre seu estado de indisponibilidade; não exiba botões decorativos que anunciam função inexistente.
13. Não simular testes, desempenho, compatibilidade, acesso a ferramentas nem geração de assets. Verificar realmente.
14. **Originalidade Total e Zero Referências a Naruto (IP Limpa)**: Proibido copiar nomes, termos, graduações ou conceitos de Naruto ou de terceiros com direitos autorais (ex: *Genin*, *Chunin*, *Jonin*, *Kage*, *Hokage*, *Suiton*, *Kage Bunshin*, *Chakra*, bandanas de aldeias). Todo o universo do jogo deve ser 100% autoral, original e seguro contra disputas de direitos autorais e marcas.
15. **Ninja Humano Sem Magia**: O protagonista é estritamente um ser humano engenhoso. Não possui poderes mágicos, elementais ou sobrenaturais. Todas as suas ações utilizam ferramentas físicas históricas shinobi (foice/kama, shuriken de treino, bomba de fumaça, roldanas, bambu) e tecnologias agrárias plausíveis (reservatórios, bombas d'água, energia solar fotovoltaica).
16. **Timeout Máximo de 10 minutos no Terminal**: Qualquer comando, script, teste ou processo disparado no terminal (Java, Python, Node, Vite, Vitest, Playwright, etc.) deve obrigatoriamente possuir um timeout máximo de 10 minutos (600 segundos). Nunca encerrar turnos com comandos pendentes sem timeout.
17. **Commit e Push por Etapa**: A cada etapa ou funcionalidade concluída e validada com testes, realizar obrigatoriamente commit e push para o repositório remoto.

## Critério de entrega de cada marco

- `npm install`, `npm run dev`, `npm run build`, `npm run typecheck` e testes automatizados reais devem ter instruções reproduzíveis.
- A aplicação deve abrir em browser real, apresentar a cena 3D e registrar erros de console.
- Fornecer registro de teste em desktop e mobile; se não houver dispositivo mobile físico, indicar explicitamente que só houve emulação e que validação física está pendente.
- Preferir métricas concretas: FPS, chamadas de desenho, uso de memória aproximado, tamanho transferido e tempo de carregamento quando medidos.
- Não substituir recursos faltantes por uma imagem de cenário e chamá-la de jogo.
