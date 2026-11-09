# Registro de decisões: confirmado / proposto / aberto

A separação abaixo impede que a IA transforme sugestões anteriores em decisões definitivas.

## CONFIRMADO pelo criador

- **Gênero:** fazenda autossustentável + construção defensiva + infiltração ninja moderna + mundo persistente; browser desktop e mobile.
- **Qualidade:** 3D real, visual decente e atraente; explicitamente rejeitados gráficos 2D, pixel art, vista superior pura e caixas simplórias como entrega.
- **Base:** área lógica de `(16×9)×4 = 64×36` células; adaptar enquadramento para tela cheia em desktop/mobile, com orientação da câmera conforme formato da tela.
- **Mapa exterior:** cartografia do mundo real baseada em GPS; só o **interior/layout da base** é fictício. O GPS do usuário não autoriza divulgar endereço real.
- **Fazenda:** agricultura e criação de peixes, galinhas, vacas, ovelhas, alpacas; energia solar, baterias, água, casas, drones/sensores em fases pertinentes.
- **Pilares:** construção/produção por um lado e invasão/ação por outro; stamina limita o trabalho de melhorar a base, não toda a diversão.
- **Ninjas:** 20 ferramentas/habilidades não mágicas; 4 equipadas; só trocam loadout na própria base. Exemplos: vareta, shuriken, decoy, camuflagem.
- **Defesas:** armadilhas têm contramedidas; defensor combina armadilha com armadilha. Onde uma armadilha bloqueia circulação, **o dono também desvia**. Interações mais finas serão especificadas na Fase 4.
- **Viagem:** ninjas percorrem trajetos virtuais entre vilas, em tempo persistente; não teleportam. A geografia é real, mas o movimento é do avatar no jogo, não da pessoa no mundo físico.
- **Carga:** lentidão cresce pelo número de **unidades de saque**, não de itens físicos. Exemplo discutido: tempo de viagem `T=T_base×2^n`; um saque dobra o tempo, dois quadruplicam.
- **Perseguição:** proprietário recebe aviso de roubo mas NÃO localização exata gratuita. Deve procurar o ladrão no mapa e escolher perseguir. Ordem automática, **sem controle manual**, e sem garantia de alcançar. Pode observar; pode perder tempo indo e voltando sem recuperar nada. Benefício máximo da captura: recuperar os próprios bens roubados.
- **IA:** agentes artificiais poderão construir bases e invadir outras bases; humanos saberão claramente que são agentes artificiais.
- **Ordem das 7 fases:** (1) Fazenda autossustentável; (2) mapa global; (3) treino; (4) armadilhas; (5) IAs de defesa; (6) perseguição; (7) IAs-jogadores.
- **Diretriz econômica:** começar com gastos adicionais próximos de zero, reutilizar ferramentas gratuitas e legais, evitar assinatura necessária ao runtime.

## PROPOSTO tecnicamente, não declarado como decisão irrevogável

- Motor **PlayCanvas Engine standalone** + TypeScript + Vite; Mixamo para animações humanoides; Blender e assets CC0.
- Dois modos de câmera: visão ampla oblíqua de construção e câmera em 3ª pessoa acompanhando ninja.
- Persistência local versionada em IndexedDB na Fase 1, migração para backend autoritativo quando houver multiplayer.
- Simulação determinística por ticks e cálculo de tempo offline com limite configurável; produção offline após validação.
- Tamanho físico da célula (metros), valores de velocidade, duração de cultivo, consumo de bateria e metas de FPS são **hipóteses** para testes, não números confirmados pelo criador.
- O clima real pode influenciar agricultura/água, mas precisa de licenciamento correto se o jogo for comercial.
- Invasão offline será resolvida por regras determinísticas e detecção, não IA paga a cada evento.

## EM ABERTO — não bloquear o M1 visual

- Nome/marca final, domínio e repositório de produção.
- Estilo visual exato (estilizado-realista vs realismo mais pesado), ângulo e amplitude da câmera; aprovar com cena executável.
- Tamanho físico de cada célula e dimensões de construções em metros.
- Regras exatas de stamina, recuperação, sazonalidade, clima e produção.
- Modo de seleção/movimentação do ninja na Fase 1 (tap-to-move e/ou joystick).
- Política de roubo, punição, ouro/resgate e possíveis treinos de 24h.
- Política de captura, linha de visão, latência, combate automático em perseguição.
- Método de pagamento/licença de mapas/tempo meteorológico para produto comercial.

## Regra de alteração

Alterações de design precisam de registro com: data, origem, decisão anterior, decisão nova, motivo e impacto. Nunca sobrescrever silenciosamente escolhas do criador.
