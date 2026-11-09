// Atalho para o módulo node:crypto na versão de teste no navegador.
export const randomUUID = () => globalThis.crypto.randomUUID();
export const webcrypto = globalThis.crypto;
export default {randomUUID, webcrypto};
