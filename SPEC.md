# SPEC — Bot de Controle Menstrual (Discord + Gemini + Railway)

> Metodologia: SDD (Spec-Driven Development) — este documento define requisitos, design e tarefas.
> Toda implementação deve ser rastreável a um requisito (RF) aqui listado.

## 1. Requisitos

### 1.1 Requisitos Funcionais

| ID | Requisito | Comando |
|----|-----------|---------|
| RF1 | Registrar início e fim do período menstrual | `/ciclo inicio [data]` / `/ciclo fim [data]` |
| RF2 | Log diário de sintomas, muco cervical e corrimento | `/registrar` |
| RF3 | Prever data da próxima menstruação (média dos ciclos) | `/previsao` |
| RF4 | Prever período fértil (ovulação = próxima menstruação − 14 dias; janela de −5 a +1) | `/previsao` |
| RF5 | Consultar histórico de ciclos e médias | `/historico` |
| RF6 | Perguntar ao Gemini com o contexto do histórico do usuário | `/pergunta <texto>` |

### 1.2 Requisitos Não-Funcionais

| ID | Requisito |
|----|-----------|
| RNF1 | Respostas com dados de saúde sempre `ephemeral` (visíveis só ao usuário) |
| RNF2 | Toda resposta do Gemini inclui disclaimer: não é aconselhamento médico |
| RNF3 | TypeScript `strict`, sem `any` |
| RNF4 | Lógica de previsão 100% determinística e coberta por testes unitários |
| RNF5 | Datas tratadas em UTC puro (dias civis, sem hora) p/ evitar drift de fuso |
| RNF6 | Secrets via variáveis de ambiente (`DISCORD_TOKEN`, `GEMINI_API_KEY`, `DATABASE_URL`) |

## 2. Design

### 2.1 Arquitetura
- Processo único (worker) conectado ao Discord via websocket (Gateway)
- PostgreSQL via Prisma ORM
- Gemini chamado somente em `/pergunta`; previsões são cálculo local

```
Discord Gateway ⇄ bot (discord.js)
                    ├─ services/cycleService.ts    (regras de negócio de ciclos/logs)
                    ├─ services/predictionService.ts (cálculos determinísticos)
                    └─ services/geminiService.ts   (LLM com contexto)
                    ⇅
                PostgreSQL (Prisma)
```

### 2.2 Modelo de dados

```prisma
User      id (Discord user id)  createdAt
Cycle     id  userId  startDate  endDate?  createdAt
DailyLog  id  userId  date  symptoms[]  cervicalMucus?  discharge?  notes?  createdAt
          @@unique([userId, date])
```

Enums de muco cervical: `SECO`, `PEGAJOSO`, `CREMOSO`, `CLARA_DE_OVO`, `AQUOSO`.
Corrimento/discharge: campo de texto livre curto.

### 2.3 Fórmulas de previsão (determinísticas)
- `mediaCiclo` = média de `(start[i+1] − start[i])` dos ciclos ordenados (padrão 28 se < 2 ciclos)
- `mediaPeriodo` = média de `(end − start)` (padrão 5)
- `proximaMenstruacao` = ultimo inicio + mediaCiclo
- `ovulacao` = proximaMenstruacao − 14 dias
- `periodoFertil` = [ovulacao − 5, ovulacao + 1]

### 2.4 Comandos (todos ephemeral)
| Comando | Parâmetros |
|---------|-----------|
| `/ciclo inicio` | `data?` (AAAA-MM-DD, padrão = hoje) |
| `/ciclo fim` | `data?` |
| `/registrar` | `sintomas?` (csv genérico), `muco?` (enum), `corrimento?` (texto), `data?` |
| `/previsao` | — |
| `/historico` | — |
| `/pergunta` | `texto` (obrigatório) |

## 3. Tarefas (Etapas)

1. SPEC.md (este arquivo) ✅
2. Scaffold: package.json, tsconfig, .gitignore, .env.example ✅
3. Prisma schema + db client singleton ✅
4. Bootstrap: registro de comandos + `/ping` ✅
5. `/ciclo inicio|fim` (RF1) ✅
6. `/registrar` (RF2) ✅
7. predictionService + `/previsao` (RF3, RF4) ✅
8. `/historico` (RF5) ✅
9. geminiService + `/pergunta` (RF6, RNF2) ✅
10. Testes unitários da predictionService (RNF4) + build limpo ✅
11. README: setup Discord + Railway + checklist de deploy ✅
