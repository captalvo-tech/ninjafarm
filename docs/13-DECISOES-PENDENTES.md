# Registro de decisões pendentes (não são bloqueios automáticos)

Não pedir dezenas de perguntas ao criador antes de produzir o M1 visual. Trabalhar com defaults **explicitamente provisórios, centralizados e reversíveis**, e elevar perguntas só quando tiver efeito material.

| ID   | Tema                                       | Impacto               | Default reversível para desenvolvimento        | Quando decidir        |
| ---- | ------------------------------------------ | --------------------- | ---------------------------------------------- | --------------------- |
| D-01 | Nome definitivo                            | marca/repositório     | Fazenda Ninja (provisório)                     | antes da divulgação   |
| D-02 | Estilo 3D                                  | assets/performance    | estilizado-realista com materiais PBR          | **gate M1 visual**    |
| D-03 | Metros por célula                          | escala física         | variável de configuração; não fixar decisão    | M2 placement          |
| D-04 | Câmera principal                           | UX                    | modo construção oblíquo + exploração 3ª pessoa | M1 testes reais       |
| D-05 | Foco no celular portrait                   | layout/enquadramento  | yaw e FOV responsivos sem roll 90°             | M1                    |
| D-06 | Regras de stamina                          | economia              | política isolada/temporária                    | antes de balancear M3 |
| D-07 | Duração de cultivos e alimentação          | engajamento           | fixtures de teste sem monetização              | M3                    |
| D-08 | Progressão offline                         | economia e fraude     | intervalo máximo configurável                  | M5                    |
| D-09 | Clima real e provedor                      | custo/licenças        | clima simulado Fase 1                          | extensão futura       |
| D-10 | Estradas vs livre movimento no mapa        | geografia/roteamento  | não implementar ainda                          | Fase 2                |
| D-11 | Ladrão perde habilidade por 24h sem ouro?  | punição               | aberto, evitar penalidade no MVP               | Fase 3/6              |
| D-12 | Captura automática + detecção              | PvP                   | estados separados, detalhes abertos            | Fase 6                |
| D-13 | Quantidade de unidades de saque permitidas | balanceamento         | nenhuma regra final                            | Fase 4/6              |
| D-14 | Regras de comunidade e permissões          | segurança             | dono único no MVP local                        | Fase 2                |
| D-15 | Backend e hospedagem online                | custos/escalabilidade | cliente local para Fase 1                      | antes de multiplayer  |

## Como registrar decisão

```markdown
### D-XX — Tema

- Status: aberto / confirmado / substituído
- Decidido por: criador / teste técnico / restrição de licença
- Data:
- Decisão:
- Alternativas consideradas:
- Efeito em dados, UI, assets e testes:
```

Se uma escolha do agente contrariar uma decisão expressa pelo criador, **não escondê-la em commit**: interromper essa modificação e apresentar alternativas.
