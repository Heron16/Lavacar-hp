import { Router } from 'express';
import { AgendamentoController } from '../controllers/AppointmentController';
import { autenticar, autorizar } from '../middlewares/auth';

const router = Router();
const controller = new AgendamentoController();

router.get('/slots', autenticar, (req, res) => controller.slotsDisponiveis(req, res));
router.get('/meus', autenticar, (req, res) => controller.listarMeus(req, res));
router.get('/', autenticar, autorizar('admin'), (req, res) => controller.listarTodos(req, res));
router.post('/', autenticar, (req, res) => controller.criar(req, res));
router.patch('/:id/status', autenticar, (req, res) => controller.atualizarStatus(req, res));
router.delete('/:id', autenticar, (req, res) => controller.excluir(req, res));

export default router;
