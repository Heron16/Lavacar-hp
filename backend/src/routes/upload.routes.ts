import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { autenticar, autorizar } from '../middlewares/auth';
import { uploadPerfil, uploadServico, UPLOADS_DIR, validarMagicBytesArquivo } from '../middlewares/upload';
import { UserModel } from '../models/UserModel';
import { ServiceModel } from '../models/ServiceModel';
import { AuthRequest } from '../middlewares/auth';
import { MulterError } from 'multer';

const router = Router();

function tratarErroMulter(err: unknown, res: Response): boolean {
  if (!err) return false;
  if (err instanceof MulterError && err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ mensagem: 'Arquivo muito grande. Tamanho máximo: 5 MB.' });
    return true;
  }
  if (err instanceof Error) {
    res.status(400).json({ mensagem: err.message });
    return true;
  }
  return false;
}

function removerArquivoSeguro(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {}
}

router.post('/foto-perfil', autenticar, (req: Request, res: Response) => {
  uploadPerfil.single('foto')(req, res, async (err) => {
    if (tratarErroMulter(err, res)) return;

    if (!req.file) {
      res.status(400).json({ mensagem: 'Nenhum arquivo enviado.' });
      return;
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!validarMagicBytesArquivo(req.file.path, ext)) {
      removerArquivoSeguro(req.file.path);
      res.status(400).json({ mensagem: `Conteúdo do arquivo não corresponde à extensão "${ext}".` });
      return;
    }

    try {
      const authReq = req as AuthRequest;
      const usuario = await UserModel.findByPk(authReq.usuario!.usuarioId);
      if (!usuario) {
        removerArquivoSeguro(req.file.path);
        res.status(404).json({ mensagem: 'Usuário não encontrado.' });
        return;
      }

      if (usuario.fotoPerfil) {
        removerArquivoSeguro(path.join(UPLOADS_DIR, 'perfil', usuario.fotoPerfil));
      }

      await usuario.update({ fotoPerfil: req.file.filename });

      res.status(200).json({
        mensagem: 'Foto de perfil atualizada com sucesso.',
        fotoPerfil: req.file.filename,
        url: `/uploads/perfil/${req.file.filename}`,
      });
    } catch {
      if (req.file) removerArquivoSeguro(req.file.path);
      res.status(500).json({ mensagem: 'Erro ao salvar foto de perfil.' });
    }
  });
});

router.delete('/foto-perfil', autenticar, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const usuario = await UserModel.findByPk(authReq.usuario!.usuarioId);
    if (!usuario) {
      res.status(404).json({ mensagem: 'Usuário não encontrado.' });
      return;
    }

    if (usuario.fotoPerfil) {
      removerArquivoSeguro(path.join(UPLOADS_DIR, 'perfil', usuario.fotoPerfil));
      await usuario.update({ fotoPerfil: null });
    }

    res.status(200).json({ mensagem: 'Foto de perfil removida.' });
  } catch {
    res.status(500).json({ mensagem: 'Erro ao remover foto.' });
  }
});

router.post('/servico/:id/imagem', autenticar, autorizar('admin'), (req: Request, res: Response) => {
  uploadServico.single('imagem')(req, res, async (err) => {
    if (tratarErroMulter(err, res)) return;

    if (!req.file) {
      res.status(400).json({ mensagem: 'Nenhuma imagem enviada.' });
      return;
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!validarMagicBytesArquivo(req.file.path, ext)) {
      removerArquivoSeguro(req.file.path);
      res.status(400).json({ mensagem: `Conteúdo do arquivo não corresponde à extensão "${ext}".` });
      return;
    }

    try {
      const servico = await ServiceModel.findByPk(req.params.id);
      if (!servico) {
        removerArquivoSeguro(req.file.path);
        res.status(404).json({ mensagem: 'Serviço não encontrado.' });
        return;
      }

      if (servico.imagemUrl) {
        removerArquivoSeguro(path.join(UPLOADS_DIR, 'servico', servico.imagemUrl));
      }

      await servico.update({ imagemUrl: req.file.filename });

      res.status(200).json({
        mensagem: 'Imagem do serviço atualizada com sucesso.',
        imagemUrl: req.file.filename,
        url: `/uploads/servico/${req.file.filename}`,
      });
    } catch {
      if (req.file) removerArquivoSeguro(req.file.path);
      res.status(500).json({ mensagem: 'Erro ao salvar imagem do serviço.' });
    }
  });
});

router.delete('/servico/:id/imagem', autenticar, autorizar('admin'), async (req: Request, res: Response) => {
  try {
    const servico = await ServiceModel.findByPk(req.params.id);
    if (!servico) {
      res.status(404).json({ mensagem: 'Serviço não encontrado.' });
      return;
    }

    if (servico.imagemUrl) {
      removerArquivoSeguro(path.join(UPLOADS_DIR, 'servico', servico.imagemUrl));
      await servico.update({ imagemUrl: null });
    }

    res.status(200).json({ mensagem: 'Imagem do serviço removida.' });
  } catch {
    res.status(500).json({ mensagem: 'Erro ao remover imagem.' });
  }
});

export default router;
