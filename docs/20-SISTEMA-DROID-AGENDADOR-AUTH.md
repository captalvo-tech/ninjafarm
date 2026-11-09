# Sistema de Droid Único, Agendador AFK, Google Auth e Nuvem

Este documento estabelece a arquitetura oficial do Ninja Farm para o Droid operacional único, agendamento de tarefas, simulação AFK (offline), autenticação Google e persistência autoritativa no backend.

---

## 1. O Papel do Ninja vs. O Papel do Droid

No Ninja Farm:
- **O Jogador (Ninja):** É o arquiteto, estrategista e gestor da base. Explora o mundo, seleciona objetos, define preferências de cultivo, posiciona blueprints no terreno, gerencia o inventário, negocia com o mercador e lidera missões externas.
- **O Droid Único:** É a única unidade robótica humanoide da propriedade. Ele executa fisicamente todo o trabalho manual e de infraestrutura:
  - Preparo de solo (arar e adubar).
  - Semeadura e rega manual de canteiros.
  - Colheita e transporte da produção para o celeiro.
  - Alimentação e cuidados da fauna (galinhas, vacas, peixes).
  - Construção física e acabamento de edifícios a partir de blueprints.
  - Manutenção e reparo de estruturas danificadas.
  - Recarga de bateria na estação da base.

> [!IMPORTANT]
> **Regra do Droid Único:** Cada fazenda possui estritamente **um** Droid. Não é permitido construir, adquirir ou spawnar unidades robóticas adicionais. O Droid executa **uma única tarefa física por vez**.

---

## 2. Autenticação Obrigatória Google & Sessão Segura

O acesso à fazenda exige autenticação via **Google Identity Services (GIS)**.

```mermaid
sequenceDiagram
    autonumber
    actor Player as Jogador
    participant Client as Frontend (PlayCanvas)
    participant Google as Google Identity Services
    participant API as Backend (api/auth.php)
    participant Storage as Armazenamento Seguro

    Player->>Client: Acessa o Ninja Farm
    Client->>Client: Verifica sessão local/cookie
    alt Sem sessão ativa
        Client->>Player: Exibe tela de Login Google
        Player->>Google: Autentica com conta Google
        Google-->>Client: Retorna ID Token JWT
        Client->>API: POST /api/auth.php (action=login, id_token)
        API->>Google: Valida token e integridade (sub, aud, exp)
        Google-->>API: Dados validados (sub, email, name, picture)
        API->>Storage: Busca ou inicializa conta e fazenda pelo 'sub'
        API-->>Client: Sessão iniciada (Token de Sessão / Cookie seguro)
    end
    Client->>API: GET /api/save.php (action=load)
    API-->>Client: Estado autoritativo da fazenda e Droid
    Client->>Player: Renderiza o mundo 3D da Fazenda Ninja
```

### Princípios de Segurança da Identidade
1. **Identificador Imutável (`sub`):** A associação de saves e contas utiliza exclusivamente o identificador numérico imutável `sub` emitido pelo Google, nunca apenas o endereço de e-mail (que pode sofrer alteração).
2. **Validação no Servidor:** O backend valida o token criptograficamente junto aos servidores do Google antes de liberar qualquer estado.
3. **Isolamento de Saves:** Nenhuma requisição pode alterar ou consultar saves de outro jogador alterando parâmetros; o identificador de usuário é derivado diretamente da sessão validada.
4. **Sessão e Logout:** O encerramento de sessão revoga o token de sessão local e no backend, limpando o cache e bloqueando o canvas 3D até nova autenticação.

---

## 3. Persistência Centralizada e Controle de Concorrência

O backend é a **fonte autoritativa** de verdade. O IndexedDB do navegador funciona como cache local e buffer de segurança, mas validações econômicas, progresso de tarefas e integridade da fazenda são decididos no servidor.

### Campos do Save Centralizado
- `userId`: Hash seguro derivado do `sub` do Google.
- `revision`: Número inteiro sequencial que se incrementa a cada salvamento (controle de concorrência otimista / prevenção de sobrescrita acidental).
- `savedAt`: Timestamp UTC do servidor (nunca confiar no relógio do dispositivo cliente).
- `farm`: Dimensões da grade, lista de construções com integridade e footprints.
- `crops`: Estado detalhado de cada canteiro (solo, estágio, hidratação, progresso).
- `animals`: Estado da fauna, fome, hidratação e ovos disponíveis.
- `inventory`: Recursos disponíveis (`wood`, `metal`, `parts`, `food`, `water`, `energy`).
- `droid`: Bateria atual, capacidade máxima, consumo operacional, posição e estado.
- `scheduler`: Fila de tarefas, tarefa em execução, tempo concluído e tempo restante.
- `gemini`: Configurações de conexão, status e testes de IA.
- `events`: Histórico persistente de eventos da fazenda.

### Tratamento de Conflitos
Se dois clientes (ex.: celular e computador) tentarem sincronizar simultaneamente, a requisição que enviar uma revisão desatualizada receberá status `409 Conflict`, solicitando recarga da versão mais recente do servidor para evitar duplicação ou perda de progresso.

---

## 4. Agendador de Tarefas e Simulação AFK (Offline)

### Estados da Tarefa
- `RASCUNHO`: Em definição na interface.
- `AGENDADA`: Na fila aguardando a vez.
- `AGUARDANDO_RECURSOS`: Faltam materiais ou sementes para iniciar.
- `AGUARDANDO_ENERGIA`: Bateria do Droid ou energia da fazenda esgotada.
- `AGUARDANDO_CAMINHO`: Rota bloqueada por obstáculos.
- `EM_EXECUCAO`: Droid no local executando o trabalho físico.
- `PAUSADA`: Pausada pelo jogador ou temporariamente durante recarga.
- `CONCLUIDA`: Finalizada com sucesso e recompensas computadas.
- `CANCELADA`: Removida pelo jogador com reembolso proporcional.
- `FALHOU`: Interrompida por evento impeditivo.

### Reconciliação AFK Determinística
Ao abrir o jogo após horas offline:
$$\Delta t = t_{\text{agora}} - t_{\text{último\_tick}}$$
O servidor e o cliente simulam em etapas determinísticas:
1. Geração solar acumulada durante as horas de sol.
2. Duração da tarefa atual em execução.
3. Se a bateria esgotar: tempo de deslocamento até a base de recarga + tempo de carregamento com energia disponível.
4. Conclusão da tarefa e início da próxima tarefa da fila que tenha recursos disponíveis.
5. Crescimento biológico das plantações conforme disponibilidade de água.
6. Registro dos acontecimentos no diário de eventos da fazenda.

---

## 5. Interface de Configurações da Conta

A tela de Configurações fornece:
1. **Seção Conta:**
   - Perfil Google ativo (foto, nome, e-mail mascarado).
   - Status da conexão e última sincronização.
   - Botão **Sair da Conta** (Logout).
2. **Seção Progresso:**
   - Botão **Apagar progresso e começar do zero**:
     - Modal de confirmação explícita com aviso de perda irreversível de construções, inventário e níveis.
     - Limpa o save no servidor e reinicializa a fazenda com o lote inicial e recursos básicos.
3. **Seção Gemini:**
   - Origem da credencial (Pessoal / Padrão / Modo Limitado).
   - Teste de conexão em tempo real.
   - Campo para inserção/substituição de chave pessoal da API Gemini.
   - Opção para desconectar chave pessoal e retornar ao modo padrão ou limitado.
