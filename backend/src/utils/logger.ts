type Nivel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

function formatar(nivel: Nivel, modulo: string, mensagem: string, meta?: unknown): string {
  const ts = new Date().toISOString();
  const base = `${ts} [${nivel.padEnd(5)}] [${modulo}] ${mensagem}`;
  if (meta !== undefined) {
    return `${base} | ${typeof meta === 'object' ? JSON.stringify(meta) : String(meta)}`;
  }
  return base;
}

export function criarLogger(modulo: string) {
  return {
    info:  (msg: string, meta?: unknown) => console.log(formatar('INFO',  modulo, msg, meta)),
    warn:  (msg: string, meta?: unknown) => console.warn(formatar('WARN',  modulo, msg, meta)),
    error: (msg: string, meta?: unknown) => console.error(formatar('ERROR', modulo, msg, meta)),
    debug: (msg: string, meta?: unknown) => {
      if (process.env.NODE_ENV !== 'production') {
        console.debug(formatar('DEBUG', modulo, msg, meta));
      }
    },
  };
}
