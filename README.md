# 🌙 Bot de Controle Menstrual

Bot de Discord para acompanhar o ciclo menstrual, com previsões determinísticas e uma assistente (Gemini Flash) que responde com base no seu próprio histórico.

> Este projeto segue **SDD (Spec-Driven Development)**. Requisitos, design e etapas estão em [`SPEC.md`](./SPEC.md).

## ✨ Funcionalidades

| Comando | O que faz |
|---------|-----------|
| `/ciclo inicio [data]` | Marca o início da menstruação (padrão: hoje) |
| `/ciclo fim [data]` | Marca o fim da menstruação |
| `/registrar` | Registro diário de sintomas, muco cervical e corrimento |
| `/previsao` | Próxima menstruação, período fértil e ovulação estimada |
| `/historico` | Últimos ciclos e médias |
| `/pergunta <texto>` | Pergunta à Luna (Gemini) usando seu histórico como contexto |
| `/ping` | Checagem de saúde do bot |

Todas as respostas com dados de saúde são **efêmeras** (só você vê).

## 🧱 Stack

- **Node.js + TypeScript** (`discord.js` v14)
- **Prisma ORM + PostgreSQL** (Railway)
- **Gemini Flash** (`@google/genai`)
- **Railway** para deploy

## 🚀 Setup local

### 1. Instalar dependências

```bash
npm install
```

### 2. Criar o bot no Discord

1. Acesse o [Discord Developer Portal](https://discord.com/developers/applications) e crie uma **New Application**.
2. Em **Bot**, clique em **Reset Token** e copie o token → `DISCORD_TOKEN`.
3. Em **General Information**, copie o **Application ID** → `DISCORD_CLIENT_ID`.
4. Em **Installation → Installation Contexts**, marque **Guild Install** e use o link de convite com os escopos `bot` + `applications.commands`.
5. Intents necessários: apenas **Guilds** (não requer intents privilegiadas).

### 3. Criar a chave do Gemini

Gere uma API key no [Google AI Studio](https://aistudio.google.com/apikey) → `GEMINI_API_KEY`.

### 4. Banco de dados

Suba um **PostgreSQL** (local, Docker ou Railway) e configure `DATABASE_URL` no `.env`.

```bash
npm run db:push   # cria as tabelas
```

### 5. Variáveis de ambiente

```bash
cp .env.example .env
```

Preencha:

| Variável | Descrição |
|----------|-----------|
| `DISCORD_TOKEN` | Token do bot |
| `DISCORD_CLIENT_ID` | Application ID |
| `DISCORD_GUILD_ID` | (Opcional) ID do servidor p/ registro instantâneo em dev |
| `GEMINI_API_KEY` | Chave da API do Gemini |
| `DATABASE_URL` | String de conexão do PostgreSQL |

### 6. Rodar

```bash
npm run dev        # inicia o bot em modo watch
```

O bot **registra os slash commands automaticamente** ao iniciar. (Opcional: `npm run register` faz o mesmo sem subir o bot, útil para forçar o registro.)

## 🧪 Testes

```bash
npm test           # vitest (lógica de previsão e utilidades de data)
npm run build      # checagem de tipos / build de produção
```

## ☁️ Deploy no Railway

1. Crie um projeto no [Railway](https://railway.app) e adicione o plugin **PostgreSQL**.
2. Faça o deploy deste repositório (GitHub) no mesmo projeto.
3. Configure as variáveis `DISCORD_TOKEN`, `DISCORD_CLIENT_ID` e `GEMINI_API_KEY`.
   - `DATABASE_URL`: referencie a do plugin Postgres (`${{Postgres.DATABASE_URL}}`).
4. O [railway.json](./railway.json) define build (`npm run build`) e start (`npm run start:prod`).
   O Nixpacks roda `npm ci` (com devDependencies) na fase de install.
5. No start, o bot executa `prisma migrate deploy` automaticamente — as tabelas são criadas/atualizadas a cada deploy.
6. Os slash commands são registrados automaticamente quando o bot inicia. Deixe `DISCORD_GUILD_ID` definido para registro instantâneo no seu servidor; sem ele o registro é global (até ~1h para propagar).

> Novas alterações de schema: crie a migração localmente com `npx prisma migrate dev --name <nome>`, commite `prisma/migrations/` e faça push — o deploy aplica sozinho.

## 📁 Estrutura

```
src/
  commands/        # slash commands (/ciclo, /registrar, /previsao, /pergunta...)
  services/        # regras de negócio (ciclos, logs, previsão, Gemini)
  utils/dates.ts   # datas em UTC puro
  db/client.ts     # Prisma client (singleton)
  env.ts           # carregamento/validação de env
  index.ts         # bootstrap do bot
  registerCommands.ts
prisma/schema.prisma
tests/
```

## 🔒 Privacidade

Dados de saúde são sensíveis: respostas são efêmeras por padrão e o bot só usa os dados do próprio usuário. Considere excluir os dados mediante solicitação (LGPD).

## ⚠️ Aviso

Este bot **não fornece aconselhamento médico**. As previsões são estimativas baseadas no histórico registrado.
