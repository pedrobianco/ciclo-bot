import type { Command } from "../types";
import { command as ping } from "./ping";
import { command as ciclo } from "./ciclo";
import { command as registrar } from "./registrar";
import { command as previsao } from "./previsao";
import { command as historico } from "./historico";
import { command as pergunta } from "./pergunta";

// Registro explícito de comandos (type-safe, funciona após tsc)
export const commands: Command[] = [ping, ciclo, registrar, previsao, historico, pergunta];
