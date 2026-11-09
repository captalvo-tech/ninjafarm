# Checklist de entrega — preencha com evidências

## Antes de declarar um marco entregue

- [ ] Projeto abre com `npm run dev` após `npm install` em ambiente limpo.
- [ ] `npm run build` passa (registrar saída) e `npm run typecheck` passa.
- [ ] Testes automatizados rodados e erros corrigidos ou documentados.
- [ ] Console do navegador verificado.
- [ ] Imagens reais da aplicação 3D: desktop, portrait e landscape.
- [ ] Vídeo ou gravação de interação/animações, quando possível.
- [ ] Inputs desktop/mobile testados; emulação ≠ celular físico.
- [ ] Arquivo de assets com origem/licença para cada modelo/textura/animação.
- [ ] Relatório de medidas de desempenho sem dados inventados.
- [ ] Lista de features funcionando e não funcionando, separadas.
- [ ] Instruções atualizadas de instalação/execução.
- [ ] Custos adicionados = R$ 0, a menos que aprovados expressamente.
- [ ] Nenhuma credencial, arquivo .env ou backup público no repositório/build.
- [ ] `docs/19-LOG-IMPLEMENTACAO.md` atualizado.

## Evidência para M1

1. Ninja com malha 3D, rig e animação locomotora real.
2. Casas/vegetação/solo com materiais e luz, não wireframe ou UI simulando 3D.
3. Câmera de construção oblíqua e câmera exploratória, ambas funcionais.
4. PC e mobile portrait/landscape com horizonte/controles coerentes.
5. Medição real mínima de FPS em pelo menos um navegador; indicar qual.

## Critério de não aprovação

Uma cena que carrega mas tem aparência de caixas cinzas, sprite 2D ou screenshot não conclui M1. Sem M1, não afirmar que a Fase 1 está concluída.
