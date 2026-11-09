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

## Operação / backups e Segurança de Produção

- **Segredo de Credenciais:** Nunca publicar `.env`, senhas, tokens de API ou chaves mestras no Git ou documentação pública.
- **Isolamento de Backups:** NUNCA armazenar backups, dumps SQL, `.zip`, `.tar.gz`, `.bak` em `public_html` ou subdiretórios publicamente acessíveis. Os arquivos de backup pré-deploy residem estritamente na pasta privada fora do webroot: `/home/u415074840/domains/_backups_todos_sites/pinut.shop/`.
- **Validação Autoritativa Google OAuth:** Eliminação permanente de qualquer bypass de autenticação (`dev_mock`, `dev_user`) em produção. Toda autenticação exige validação de assinatura e claims (`iss = accounts.google.com`, `aud = $googleClientId`, `exp`, `sub`).
- **Provisionamento Administrativo Exclusivo CLI:** Remoção de ações públicas web de setup administrativo (`setup_initial_admin` retorna HTTP 403). O superadministrador só pode ser provisionado ou redefinido via terminal CLI do servidor (`php scripts/provision-admin.php`).
- **Criptografia Forte em Repouso (AES-256-CBC):** Chaves de API de terceiros (Google AI Studio / Gemini) fornecidas pelo usuário são criptografadas antes da gravação no disco com permissões restritas `0600`. O frontend recebe e exibe apenas formatos mascarados (`AIzaSy...****`).
- **Rate-Limiting Rigoroso:** Tentativas de login administrativo incorretas ativam bloqueio de 15 minutos por endereço IP extraído com integridade de `$_SERVER['REMOTE_ADDR']`, com proteção contra forja de headers `X-Forwarded-For`.
- **Proteção CSRF & Cookies Seguros:** Sessões administrativas e de usuários utilizam cookies `HttpOnly` com flags `SameSite=Strict` e tokens CSRF de validação em operações de mutação.

## Critérios de aprovação de gasto futuro

Solicitar: serviço, custo mínimo, periodicidade, custo por uso estimado com premissas, alternativas gratuitas, risco de lock-in, licença de uso comercial, como revogar e plano de fallback. Sem esses dados, adiar.
