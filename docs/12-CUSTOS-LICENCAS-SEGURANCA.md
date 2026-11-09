# Política de custos, licenças e segurança

## Princípio financeiro

Começar com **R$ 0 em contratações novas**, usando software livre/gratuito, packs autorizados e máquina/hospedagem já disponíveis, **sem prometer que a operação pública crescerá com custo zero**. O agente nunca deve contratar plano, integrar cobrança, consumir créditos de IA paga ou aceitar termos em nome do usuário sem autorização.

## Matriz de serviços

| Recurso                      | Estratégia inicial                                         | Atenção                                                                                                      |
| ---------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| PlayCanvas Engine standalone | MIT, gratuito para uso comercial                           | Editor hospedado é produto diferente; não exigir assinatura                                                  |
| TypeScript / Vite            | npm local, open source                                     | Versionar lockfile e auditar dependências                                                                    |
| Blender                      | gratuito                                                   | Exportações precisam QA                                                                                      |
| Mixamo                       | gratuito com Adobe ID; FAQ permite vídeos/jogos comerciais | Humanoides bípedes; distribuição de assets em jogo deve respeitar termos                                     |
| Poly Haven                   | CC0                                                        | Guardar evidência e origem                                                                                   |
| Quaternius                   | packs com condições específicas, verificar cada um         | Não assumir catálogo inteiro igual nem qualidade AAA                                                         |
| Tripo / Meshy / DeepMotion   | Não necessários agora                                      | Créditos, limites, uso comercial e automação sujeitos a plano                                                |
| Open-Meteo                   | Avaliação/dev **não comercial** quando permitido           | API grátis **não permite uso comercial**; contratar licença ou trocar provider antes do lançamento comercial |
| MapLibre GL JS               | biblioteca open source                                     | Tiles e geocoding/routing não ficam gratuitos automaticamente                                                |
| Hostinger já contratada      | build estático local ou ambiente isolado quando aprovado   | Multiplayer e workers persistentes podem exigir infraestrutura adicional                                     |

## Política de assets

- Registrar URL, autor, licença, data, versão, limites de uso e se pode incluir arquivos dentro de um jogo distribuído.
- Rejeitar conteúdo de origem obscura, scrape de jogos pagos, música/sons sem licença e modelos que imitam marca/obra protegida.
- Não misturar assets com estilos desconexos sem adequação artística de materiais, escala e luz.
- Não aplicar marca comercial real do usuário em assets compartilhados sem necessidade.

## Privacidade GPS e segurança (fases futuras)

- GPS real pode servir para sugerir localização aproximada, com consentimento; **não divulgar** casa, trajeto físico ou coordenadas precisas do jogador.
- Posição do **ninja virtual** e posição física da **pessoa** são dados diferentes; não correlacioná-los publicamente.
- Ao implementar mapa real, considerar anti-stalking, obscurecimento de endereços, cooldown de rastreamento, report/block e minimização de retenção.
- Não transmitir coordenadas ao modelo de IA externo sem base legal e necessidade.

## Operação / backups

- Nunca publicar `.env`, tokens, dumps ou dados de clientes.
- NUNCA armazenar backups, dumps SQL, `.zip`, `.tar.gz`, `.bak` em `public_html` ou subdiretórios publicamente acessíveis. Guardar na área privada de backups configurada na conta, fora de raiz web.
- Antes de publicar em domínio existente, usar ambiente isolado de teste e obter aprovação expressa. Não alterar outros sites ou projetos.
- Não inventar integração para Hostinger ou GitHub: descobrir permissões e testar em ambiente isolado.

## Critérios de aprovação de gasto futuro

Solicitar: serviço, custo mínimo, periodicidade, custo por uso estimado com premissas, alternativas gratuitas, risco de lock-in, licença de uso comercial, como revogar e plano de fallback. Sem esses dados, adiar.
