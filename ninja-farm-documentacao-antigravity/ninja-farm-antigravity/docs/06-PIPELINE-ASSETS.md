# Pipeline de modelos 3D, animação e integração

## Objetivo

Criar um catálogo **jogável e legalmente utilizável** de personagens, animais, vegetação, estruturas e objetos. Geração por IA pode ajudar, mas o agente **não deve afirmar que sabe criar rig/mesh 3D complexo diretamente a partir de prompts sem ferramenta específica**. O critério de aceite é **GLB funcionando no PlayCanvas** com animações e materiais adequados.

## Ferramentas preferenciais

- **Blender:** limpar malha, ajustar escala, rig, retargeting, materiais, exportar GLB; gratuito.
- **Quaternius:** packs selecionados; confirmar licença **do pacote individual**, distribuição e termos. Alguns packs são simplificados visualmente.
- **Poly Haven:** HDRI, texturas e modelos sob CC0; registrar origem e data.
- **Adobe Mixamo:** rigging e animações de humanoides bípedes; uso comercial em videogames permitido conforme FAQ. Não utilizar para vacas/galinhas/peixes.
- **PlayCanvas Engine:** importação de GLB/glTF e estados de animação, com checagem de versões nas docs.
- **IA 3D especializada paga:** **não contratar** agora; se for necessária para recurso único, registrar proposta de custo, licença, benchmark e pedir aprovação.

## Categorias

| Categoria             | Estratégia                                        | Animação mínima                        |
| --------------------- | ------------------------------------------------- | -------------------------------------- |
| Ninja                 | humanoide rigado + retarget Mixamo                | idle, walk, run; agachar depois        |
| Galinha               | modelo rigado legal ou rig manual simples         | idle, walk, eat                        |
| Peixe                 | modelo rigado ou animação procedural da cauda     | swim, turn                             |
| Vaca, ovelha, alpaca  | adicionar após validar slice                      | idle, walk, eat                        |
| Árvore, capim, arroz  | 2–4 variações reutilizáveis e instancing          | sway leve, estágios de crescimento     |
| Casa, galpão, estufa  | estruturas modulares 3D GLB                       | portas opcionais                       |
| Painel solar, bateria | modelos estáticos 3D                              | feedback luminoso, orientação opcional |
| Terreno               | geometria procedural, mapas de altura e materiais | água e vegetação reativas              |

## Fluxo de cada asset

`descobrir → validar licença → baixar/adquirir → inspecionar no Blender → padronizar escala/eixos → texturizar/PBR → rig/animar se necessário → exportar GLB → medir → registrar manifest → integrar/testar no PlayCanvas`.

Uma IA pode automatizar scripts Blender para lote de conversões, mas inspeção visual e licenças são obrigatórias. Não incluir arquivos brutos gigantes na build pública.

## Convenções

- **Formato runtime:** `.glb` (glTF 2.0); materiais PBR, texturas compactadas quando suportadas; criar fallback de compressão se preciso.
- **Unidades:** metro no mundo 3D; orientação Y-up conforme engine e conversor; validar no browser. Ajustar valores de escala em pipeline, não hacks em cada placement.
- **Nomes:** `ninja_modern_v01.glb`, `chicken_adult_v01.glb`, `solar_panel_small_v01.glb`.
- **Anim clips:** `Idle`, `Walk`, `Run`, `Eat`, `Swim`, `Interact`; documentar duração e se são loop.
- **Rig:** preservar esqueleto comum entre animações do ninja. Testar retarget e raiz; evitar “moonwalk” e clipping no solo.
- **Origem/pivot:** base do objeto para prop; personagem com root consistente. Footprints em grid são metadados separados do mesh.
- **Licença:** link, autor, pack, licença, data, observação e permissão de redistribuir embutido na build. Não presumir que 'gratuito para baixar' = uso comercial livre.
- **LOD:** ao menos modelo simplificado para vegetação/aglomeração; instancing para elementos repetidos.
- **Otimização:** registrar tamanho GLB, triângulos/mesh, texturas, número de draw calls visíveis e uso de RAM medidos. Metas são configuráveis após benchmark, não chutes definitivos.

## Catálogo mínimo do primeiro vertical slice

1. 1 ninja moderno com idle/walk/run.
2. 1 casa rural contemporânea (modelo de fato detalhado).
3. 1 painel solar + 1 módulo de bateria.
4. 2 árvores + 3 variações de gramínea/arbusto.
5. 1 galinha animada **ou** peixe animado, conforme o primeiro asset legal com qualidade aceitável.
6. 2 materiais de terreno de boa qualidade; 1 sky/HDRI autorizado.

## Licenciamento e provas

Preencher `templates/asset-manifest.example.json` (copiar para `public/assets/manifest.json` real no projeto) para cada asset. Salvar referência legal, nunca compartilhar material de terceiro em repositório sem autorização. Testar animação na ferramenta e no navegador; screenshot PNG não comprova animação.

## Proibição

Não copiar modelos, texturas ou animações de jogos comerciais; não extrair assets de GTA, Don't Starve, etc. Não pedir a serviço de IA para reproduzir propriedade intelectual de terceiros. Não disfarçar imagem 2D como um personagem 3D.
