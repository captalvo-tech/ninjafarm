# Integração de clima real — planejamento (não obrigatório na Fase 1)

## Objetivo

Sincronizar **condições climáticas de uma região geográfica real** com a fazenda virtual: temperatura, chuva, vento, iluminação/horário. A simulação interna continua própria do jogo, e um provedor meteorológico apenas abastece uma fonte de dados com timestamp e validade.

## Onde aplica

- Chuvas alimentam cisterna e reduzem necessidade de rega, com regras calibradas.
- Calor aumenta demanda hídrica de plantas/animais e pode reduzir eficiência.
- Nuvens reduzem irradiância útil dos painéis; dia/noite deriva do clock/geografia apropriados.
- Ventos podem alterar vegetação/efeitos visuais, sem cálculo de física exagerado.

## Regra de arquitetura

`WeatherProvider` (fetch/cache/licença) → `WeatherObservation` normalizado → `WeatherPolicy` → `Energy/Water/Crops/Animals`.

Nunca chamar API de clima do browser por **cada objeto**. Cachear por região/intervalo no servidor quando existir, com fallback local e proteção contra outages. Armazenar `provider`, `observedAt`, `validUntil`, `region` e `quality`.

## Protótipo inicial

Fase 1: usar `SimulatedWeatherProvider` determinístico. Mostrar “clima simulado” ou ocultar alegação de clima real. Preparar interface do provider, sem API externa obrigatória.

## Custos e licença

A Open-Meteo publicou que sua API **gratuita não é autorizada para uso comercial** (serviços com anúncios/assinatura também são comerciais). Não implantar essa API em operação comercial como se fosse gratuita. Verificar preços/termos atuais e registrar consentimento antes de aderir a plano pago. Fonte: https://open-meteo.com/en/terms .

## Testes

- Noite com zero geração solar.
- Chuva aumenta captação sem exceder tanque.
- Provedor indisponível usa último valor válido ou clima simulado, sem travar simulação.
- Dados futuros/antigos não são aceitos silenciosamente.
- Falha de rede não impede abrir a fazenda.
