import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

const UPLOADS_DIR = path.resolve(__dirname, '..', '..', 'uploads');

const SUBPASTAS = {
  perfil: path.join(UPLOADS_DIR, 'perfil'),
  servico: path.join(UPLOADS_DIR, 'servico'),
} as const;

export type CategoriaUpload = keyof typeof SUBPASTAS;

Object.values(SUBPASTAS).forEach((pasta) => {
  if (!fs.existsSync(pasta)) fs.mkdirSync(pasta, { recursive: true });
});

const EXTENSOES_PERMITIDAS = ['.jpg', '.jpeg', '.png', '.webp'];
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;

const MAGIC_BYTES: Record<string, number[][]> = {
  '.jpg':  [[0xFF, 0xD8, 0xFF]],
  '.jpeg': [[0xFF, 0xD8, 0xFF]],
  '.png':  [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  '.webp': [[0x52, 0x49, 0x46, 0x46]],
};

export function validarMagicBytes(buffer: Buffer, ext: string): boolean {
  const assinaturas = MAGIC_BYTES[ext];
  if (!assinaturas) return false;
  return assinaturas.some((assinatura) =>
    assinatura.every((byte, i) => buffer[i] === byte),
  );
}

export function validarMagicBytesArquivo(filePath: string, ext: string): boolean {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(12);
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);
    return validarMagicBytes(buffer, ext);
  } catch {
    return false;
  }
}

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!EXTENSOES_PERMITIDAS.includes(ext)) {
    cb(new Error(`Extensão não permitida: "${ext}". Use: ${EXTENSOES_PERMITIDAS.join(', ')}`));
    return;
  }
  cb(null, true);
};

function criarStorage(categoria: CategoriaUpload) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, SUBPASTAS[categoria]),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}${ext}`);
    },
  });
}

export const uploadPerfil = multer({
  storage: criarStorage('perfil'),
  fileFilter,
  limits: { fileSize: TAMANHO_MAXIMO_BYTES },
});

export const uploadServico = multer({
  storage: criarStorage('servico'),
  fileFilter,
  limits: { fileSize: TAMANHO_MAXIMO_BYTES },
});

export { UPLOADS_DIR, SUBPASTAS, EXTENSOES_PERMITIDAS, TAMANHO_MAXIMO_BYTES };
