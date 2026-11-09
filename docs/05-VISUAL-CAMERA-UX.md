# Direção visual, câmera, orientação e interação

## Padrão visual a atingir

O criador rejeitou expressamente o protótipo com gráficos 2D/pixel art/top-down. **A aprovação visual é um gate obrigatório**. O objetivo inicial é um **3D estilizado-realista de qualidade consistente**, com sensação de profundidade, vegetação volumétrica, iluminação, sombras, materiais e personagens/animais animados. Não se pode chamar um screenshot gerado por IA de protótipo do jogo.

## Referência de câmera

1. **Modo construir:** câmera 3D oblíqua, inclinada e orbitável, visão ampla da fazenda; pan, zoom e rotação horizontal (yaw), sem ângulo 90° vertical permanente. Seleção de células por raycast; ghost da estrutura snap no terreno.
2. **Modo explorar:** câmera em terceira pessoa acompanhando ninja 3D, ângulo levemente elevado; controle por teclado e toque, sem impedir observar edifícios e defesas.
3. **Modo visão geral:** comando “enquadrar fazenda” calcula distância/target para ver os 64×36 espaços quando for confortável. No smartphone pequeno os detalhes podem ficar diminutos; permitir zoom sem prometer legibilidade de cada objeto na visão total.

## 64×36 / retrato vs paisagem

- As **64×36 células são coordenadas internas**, não 2.304 pixels nem projeção ortográfica obrigatória.
- Desktop horizontal: enquadramento em perspectiva favorecendo eixo principal da fazenda.
- Mobile paisagem: preservar FOV e HUD reduzido; suportar safe-area.
- Mobile retrato: ajustar yaw, pivot, distância/FOV, altura e HUD para mostrar mais do espaço vertical disponível; o usuário pode fazer zoom/pan. **Não girar a projeção em roll 90°** (que tornaria personagens/horizonte tortos) e **não girar o HUD**.
- Calcular `aspect = width/height` e viewport no resize/orientationchange; sem CSS scaling de screenshot ou deformação.
- Fullscreen somente mediante interação do usuário e se permitido pelo browser; caso contrário ocupar área visível com layout responsivo.
- Uma única base de dados/scene; trocar câmera ou orientação não altera coordenadas, colisões ou estado do save.

## Controles

| Ação                         | Desktop                                            | Mobile                                                          |
| ---------------------------- | -------------------------------------------------- | --------------------------------------------------------------- |
| Andar/correr (exploração)    | WASD / teclas conforme implementação               | joystick virtual ou tap-to-move com feedback claro              |
| Olhar/orbitar                | arrastar botão apropriado; scroll para zoom        | arraste 1 dedo para orbit/pan, pinça para zoom                  |
| Selecionar/interagir         | click e raycast                                    | toque e raycast com hit area ampliada                           |
| Construir                    | selecionar ferramenta, preview, confirmar/cancelar | botão contextual, preview com deslocamento sem ocultar sob dedo |
| Alternar câmera              | tecla/botão                                        | botão de HUD acessível                                          |
| Ver estado de infraestrutura | painel compacto                                    | painel deslizante que não cobre cena                            |

Gestos exatos e sensibilidades são **propostas a ajustar em testes com usuários**.

## Elementos visuais M1

- Terreno com relevo suave, texturas naturais e borda definida; não usar cubos texturizados como solo final.
- Sede 3D, estruturas agrícolas com proporções coerentes, painel solar e poste/luminária; sombras visíveis.
- Ninja humanoide rigado com locomotion/idle corretos, sem sliding evidente, foot placement quando viável.
- Vegetação 3D variada, grama com instanciamento e distância de desenho inteligente.
- Iluminação natural convincente, atmosfera sem efeitos pesados que prejudiquem mobile; presets ajustáveis.
- Ao menos um animal animado no slice e textura/rig testados, quando disponíveis legalmente.

## UI e acessibilidade

- HUD conciso, alto contraste e fontes legíveis em 360px de largura útil. Safe area, botões com área tocável >=44px recomendada.
- Descrições de estado e motivos de erro (falta recurso, colisão, sem caminho) em português claro.
- Sem popup obrigatório em cada ação; animações de transição curtas e opcionais por preferência de acessibilidade.
- Não reduzir toda a fazenda a miniatura ilegível para prometer “100% do mapa sempre visível” no retrato.

## Critério de reprovação visual

Se no teste real o resultado ainda aparentar top-down 2D, primitivas não substituídas, modelos desconexos/sem textura, animação quebrada ou baixa legibilidade móvel, **não avançar** para sistemas econômicos; refazer o vertical slice antes.
