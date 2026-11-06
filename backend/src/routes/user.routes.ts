import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { autenticar, autorizar } from '../middlewares/auth';

const router = Router();
const controller = new UserController();

router.post('/cadastrar', (req, res) => controller.cadastrar(req, res));
router.get('/', autenticar, autorizar('admin'), (req, res) => controller.listarTodos(req, res));
router.get('/:id', autenticar, (req, res) => controller.buscarPorId(req, res));
router.put('/:id', autenticar, (req, res) => controller.atualizar(req, res));
router.delete('/:id', autenticar, autorizar('admin'), (req, res) => controller.excluir(req, res));

export default router;
