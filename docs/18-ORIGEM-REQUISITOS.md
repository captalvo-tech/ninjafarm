# Origem dos requisitos e mudanças do projeto

## Handoff inicial recebido

Arquivo original de referência: `handoff-jogo-acampamentos(1).md`, fornecido pelo criador na conversa (não incluído em seu estado bruto neste pacote). Ele definia acampamentos comunitários, ciclo Colheita Feliz, animais, clima real, stamina, defesa e infiltração; sugeria **Phaser 2D** e Node/Colyseus.

## Evolução confirmada depois

1. **Mudança de ambientação:** de acampamentos para **ninjas modernos** e fazenda com energia solar, baterias, drones e sensores.
2. **Ninjas:** 4 dentre 20 gadgets/habilidades não mágicas, troca na própria base.
3. **Saque:** peso/tempo por **saque carregado**, não cada item; risco durante longa viagem.
4. **Perseguição:** dono deve localizar ladrão no mapa geográfico; perseguidor se move automaticamente após ordem; não há teleporte, nem garantia de recuperação, nem controle manual.
5. **Geografia:** mundo/movimentação exterior em mapa GPS real; somente interior da fazenda é fictício.
6. **Dimensão lógica:** `(16×9)×4`, portanto **64×36 células**. Interface adapta câmera para formatos desktop/mobile.
7. **Regra de colisão:** armadilhas bloqueadoras afetam **todos**, inclusive o dono que deve desviar.
8. **Mudança gráfica irrenunciável:** não 2D, não top-down puro; renderização 3D de qualidade, com modelos e animações decentes. **Phaser foi descartado como motor principal**.
9. **Estratégia técnica acordada:** PlayCanvas Engine standalone, assets gratuitos/licenciados, Blender/Mixamo e Antigravity para automação/código; foco no protótipo visual 3D.
10. **Fases definidas:** fazenda → mapa global → treino → armadilhas → IAs defensivas → perseguição → IAs-jogadoras declaradas.

## Importância para o agente

**Não** reciclar o protótipo 2D anterior como ponto de partida gráfico. O documento de acampamentos é uma fonte de visão inicial, mas recomendações de Phaser/2D foram substituídas expressamente. O GDD atual prevalece.
