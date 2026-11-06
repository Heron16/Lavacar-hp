import { Router } from 'express';
import { ServicoController } from '../controllers/ServiceController';
import { autenticar, autorizar } from '../middlewares/auth';

const router = Router();
const controller = new ServicoController();

router.get('/', (req, res) => controller.listar(req, res));
router.get('/admin/todos', autenticar, autorizar('admin'), (req, res) => controller.listarAdmin(req, res));
router.post('/', autenticar, autorizar('admin'), (req, res) => controller.criar(req, res));
router.put('/:id', autenticar, autorizar('admin'), (req, res) => controller.atualizar(req, res));
router.delete('/:id', autenticar, autorizar('admin'), (req, res) => controller.excluir(req, res));

export default router;
