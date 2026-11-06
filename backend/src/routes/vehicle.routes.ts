import { Router } from 'express';
import { VeiculoController } from '../controllers/VehicleController';
import { autenticar, autorizar } from '../middlewares/auth';

const router = Router();
const controller = new VeiculoController();

router.get('/meus', autenticar, (req, res) => controller.listarMeus(req, res));
router.get('/', autenticar, autorizar('admin'), (req, res) => controller.listarTodos(req, res));
router.post('/', autenticar, (req, res) => controller.criar(req, res));
router.put('/:id', autenticar, (req, res) => controller.atualizar(req, res));
router.delete('/:id', autenticar, (req, res) => controller.excluir(req, res));

export default router;
