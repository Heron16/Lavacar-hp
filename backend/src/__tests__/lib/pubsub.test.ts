jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    publish: jest.fn().mockResolvedValue(2),
    on: jest.fn(),
  })),
}));

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

import publisher, { publicar } from '../../lib/pubsub';
import { CANAIS } from '../../types/events';

function getPublishMock(): jest.Mock {
  return (publisher as unknown as { publish: jest.Mock }).publish;
}

describe('publicar', () => {
  beforeEach(() => jest.clearAllMocks());

  it('serializa o payload como JSON e publica no canal correto', async () => {
    const publishMock = getPublishMock();

    await publicar(CANAIS.AGENDAMENTO_CRIADO, {
      agendamentoId: 'ag-1',
      usuarioId: 'u1',
    });

    expect(publishMock).toHaveBeenCalledTimes(1);
    const [canal, mensagem] = publishMock.mock.calls[0];
    expect(canal).toBe(CANAIS.AGENDAMENTO_CRIADO);

    const parsed = JSON.parse(mensagem);
    expect(parsed.canal).toBe(CANAIS.AGENDAMENTO_CRIADO);
    expect(parsed.payload).toEqual({ agendamentoId: 'ag-1', usuarioId: 'u1' });
    expect(parsed.timestamp).toEqual(expect.any(String));
    expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('não lança exceção se o publish falhar (graceful degradation)', async () => {
    getPublishMock().mockRejectedValueOnce(new Error('redis fora'));

    await expect(publicar(CANAIS.SERVICO_CRIADO, { servicoId: 's1' })).resolves.not.toThrow();
  });
});
