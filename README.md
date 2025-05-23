# Rag Agent

Instale as dependências

```bash
npm install
```

Agora, execute o comando de sincronização. Ele ficará escutando todas as inserções de interações no chat e salvará essas informações no banco, já com o embedding gerado.
Deixe esse terminal aberto, pois o processo roda continuamente.

```bash
npm run sync
```

### Tools

Nós temos 5 tools nesse agente:

1. `areYouTalkingAboutSomeoneInTheChat`: Verifica se a mensagem do usuário está falando sobre alguém no chat.

2. `banUser`: Banir um usuário do chat.

3. `liftTheBan`: Retira o banimento de um usuário do chat.

4. `liftAllBans`: Retira o banimento de todos os usuários do chat.

5. `protectUser`: Protege um usuário do chat, escrevendo uma mensagem de proteção.

Pronto, vamos iniciar o agente e fazer algums perguntas.

```bash
npm run agent
```

### Exemplo de uso

```bash
> Alguém está falando sobre o João?
> Está falando mal do João?
> Banir esse usuário.
> Retirar o banimento do usuário.
> Retirar o banimento de todos os usuários.
> Proteger o João.
```
