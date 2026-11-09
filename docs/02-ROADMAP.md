# Roadmap oficial — ordem de desenvolvimento

**Não saltar fases.** Um marco posterior pode influenciar a arquitetura de dados de outro, mas não justifica implementar sistemas inteiros antecipadamente.

| Fase | Produto jogável obrigatório | Critério de conclusão |
| --- | --- | --- |
| **1. Fazenda autossustentável** | Ambiente 3D de qualidade, construção, animais/plantas, energia solar/bateria, água, save e ciclo temporal | Aceites e evidências em `03`/`09`; celular + desktop |
| **2. Mapa global** | Mapa terrestre cartográfico com GPS, posições virtuais, deslocamento e entrada em fazendas 3D | Distâncias e trajetos reais, privacidade segura, latência controlada |
| **3. Treinamento ninja** | Progressão do ninja, 20 gadgets/técnicas e loadout de 4 alterável na base | Persistência e restrições de troca; ações não mágicas |
| **4. Armadilhas** | Peças, sensores/armadilhas e defesas combinadas, infiltração e saque | Proprietário e outros personagens não atravessam célula bloqueada; contramedidas possíveis |
| **5. IAs de defesa** | Câmeras, cães, drones e vigias configuráveis funcionando offline | Simulação server-side validada e registros para o dono |
| **6. Perseguição no mapa** | Alertas, busca, seleção manual de alvo, perseguição automática, retorno | Sem localização grátis, sem teleporte e sem garantia de captura; recuperação limitada ao saque |
| **7. IAs jogadoras** | Agentes visivelmente identificados que constroem/produzem/invadem | Agentes obedecem às mesmas regras, são auditáveis e não simulam pessoas reais |

## Submarcos da Fase 1

**M0 — Fundamentos**: repositório, scaffold, qualidade, scripts de validação, asset manifest, configuração.  
**M1 — Vertical slice visual 3D**: terreno, vegetação, iluminação, construções, personagem e animações, câmera responsiva, input; gate de aprovação visual **antes** de expandir.  
**M2 — Construção espacial**: grade 64×36 interna, ocupação, prévia, rotação, remoção e pathfinding sem atravessar obstáculo.  
**M3 — Fazenda viva**: plantio/colheita, tanque de peixes + galinhas como primeiro recorte; vacas, ovelhas e alpacas entram no backlog quando modelos e comportamentos comprovarem desempenho.  
**M4 — Autossuficiência**: painéis, baterias, água, consumidores, medidores, interrupções por falta de insumos.  
**M5 — Progresso persistente**: save versionado, tempo offline, instruções, validação completa em celular e desktop.

Os marcos são sequenciais por prova, mas pequenos subitens de infraestrutura podem ser desenvolvidos conjuntamente. Não estimar prazos sem dados de equipe e dispositivo.

## Gate de avanço

Para cada M: teste automatizado relevante + execução real + evidência visual + registro de custo/licença + lista explícita do que NÃO está pronto. Uma falha no gate bloqueia apenas o avanço irresponsável, não impede correções.

## Futuro multiplayer

Ao entrar em Fase 2, migrar fonte da verdade das ações econômicas para servidor, sem confiar no relógio ou nas alterações locais. O armazenamento local da Fase 1 é um protótipo, não segurança contra trapaças.
