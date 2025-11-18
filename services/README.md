# Serviços Moleculer + NATS (podman-compose)

Ambiente com NATS central e três serviços Moleculer (`gateway`, `ping`, `pong`). A `gateway` expõe HTTP e o WebSocket `/ws`; os serviços falam entre si via NATS interno.

## Visão Geral
- NATS: broker central (JetStream habilitado), sem portas externas.
- Gateway: única porta pública (`3000`), roteando `/api/*` e servindo WebSocket em `/ws` (interno à gateway).
- Ping/Pong: serviços internos, conectados ao NATS.

## Pré‑requisitos
- Podman 4+ (`podman --version`)
- podman-compose (`podman-compose --version`)

Instalação (exemplos):
- Fedora/RHEL/CentOS: `sudo dnf install podman podman-compose`
- Debian/Ubuntu: `sudo apt-get install podman python3-pip && pip3 install --user podman-compose`

## Subir o ambiente
1) Entre na pasta dos serviços (este diretório):
```
cd services
```

2) Construa e suba com o podman-compose:
```
podman-compose up -d --build
```

Isso cria a rede `eng-quiz-net`, sobe `nats`, depois `gateway`, `ping` e `pong`.

## Verificar execução
- Listar containers:
```
podman ps --filter label=io.podman.compose.project
```

- Acompanhar logs da gateway:
```
podman-compose logs -f gateway
```

## Testes rápidos da API
A `gateway` publica a API em `http://localhost:3000/api`.

- Hello (greeter):
```
curl http://localhost:3000/api/greeter/hello
```

- Welcome com parâmetro:
```
curl "http://localhost:3000/api/greeter/welcome?name=Matheus"
```

Se tudo estiver ok, você deve ver respostas simples em texto.

## Parar e limpar
- Parar e remover containers, mantendo imagens:
```
podman-compose down
```

- Remover também imagens criadas (opcional):
```
podman image rm services_gateway services_ping services_pong || true
```

## Variáveis de ambiente
O `docker-compose.yml` já define o essencial para rodar:
- `TRANSPORTER=nats://nats:4222` para todos os serviços
- `PORT=3000` na `gateway`

Por padrão, os serviços usam adapter em memória (sem MongoDB). Caso queira usar Mongo, adicione um serviço `mongo` no compose e defina `MONGO_URI` em cada serviço (ex.: `mongodb://mongo/gateway`).

## Notas sobre Podman (rootless)
- As portas expostas funcionam em `localhost` via redirecionamento de usuário.
- Em sistemas com SELinux, não há bind mounts neste setup; nada extra é necessário.
- Os nomes de host no compose (ex.: `nats`) são resolvidos via a rede `eng-quiz-net`.

## Estrutura dos serviços
- `gateway/`: expõe a API HTTP (moleculer-web) e rotea para os demais serviços.
- `ping/` e `pong/`: serviços internos; comunicam via NATS.
- `docker-compose.yml`: orquestração para Podman/Docker Compose.

## Problemas comuns
- Porta 3000 já em uso: pare o processo que usa a porta ou altere o mapeamento em `docker-compose.yml`.
- `podman-compose` não encontrado: instale via gerenciador de pacotes ou `pip3 install podman-compose`.
- Serviços não se descobrem: verifique logs e se a variável `TRANSPORTER` está presente nos serviços.

## Fluxo Ping → WS
1. Requisição HTTP na `gateway` para `GET /ping`.
2. `gateway` emite evento `ping.trigger` no NATS.
3. Serviço `ping` recebe, adiciona `receivedAt` e repassa com evento `pong.trigger`.
4. Serviço `pong` recebe e transmite como evento `ws.broadcast`.
5. Gateway envia a todos os clientes conectados via WebSocket.

## Endpoints e WebSocket
- HTTP
  - `GET /api/greeter/hello`
  - `GET /api/greeter/welcome?name=SeuNome`
  - `GET /ping` → inicia o fluxo Ping → WS

- WebSocket (via proxy da gateway)
  - URL: `ws://localhost:3000/ws`
  - Mensagens recebidas têm o formato:
    ```json
    { "type": "broadcast", "payload": { ... }, "ts": "ISO-8601" }
    ```

## Testar WebSocket via terminal
Você pode usar `wscat` (Node.js) ou `websocat` (binário).

- Usando wscat:
  - Instale: `npm i -g wscat`
  - Conecte: `wscat -c ws://localhost:3000/ws`
  - Em outro terminal, dispare: `curl http://localhost:3000/ping`
  - Observe no wscat a mensagem broadcast com timestamps.

- Usando websocat:
  - Instale (Linux): `curl -L https://github.com/vi/websocat/releases/latest/download/websocat.x86_64-linux -o websocat && chmod +x websocat && sudo mv websocat /usr/local/bin/`
  - Conecte: `websocat ws://localhost:3000/ws`
  - Em outro terminal: `curl http://localhost:3000/ping`
  - Veja a mensagem recebida no terminal.
