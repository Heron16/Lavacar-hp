import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Veiculo, Servico, ResultadoPaginado, ErroApi, TipoVeiculo } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { formatCurrency } from '../../utils/validators';

function validarHorario(dataStr: string): string | null {
  const data = new Date(dataStr);
  const dia = data.getDay();
  const hora = data.getHours();
  const min = data.getMinutes();
  const totalMin = hora * 60 + min;

  if (dia === 0) return 'Não atendemos aos domingos';

  if (dia === 6) {
    if (totalMin < 480 || totalMin >= 720) return 'Sábado: atendemos das 08:00 às 12:00';
    return null;
  }

  const dentroManha = totalMin >= 480 && totalMin < 720;
  const dentroTarde = totalMin >= 810 && totalMin < 1080;
  if (!dentroManha && !dentroTarde)
    return 'Atendemos de segunda a sexta das 08:00 às 12:00 e das 13:30 às 18:00';

  return null;
}

/** Retorna true se o serviço atende o tipo de veículo informado */
function servicoAtendeVeiculo(servico: Servico, tipoVeiculo: TipoVeiculo): boolean {
  const tipos = Array.isArray(servico.tiposVeiculo)
    ? servico.tiposVeiculo
    : (servico.tiposVeiculo as unknown as string).split(',');
  return tipos.map((t) => t.trim()).includes(tipoVeiculo);
}

export function NewAppointmentPage() {
  const navigate = useNavigate();
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [todosServicos, setTodosServicos] = useState<Servico[]>([]);
  const [veiculoId, setVeiculoId] = useState('');
  const [servicoId, setServicoId] = useState('');
  const [agendadoPara, setAgendadoPara] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [erroHorario, setErroHorario] = useState('');
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    Promise.all([
      api.get<ResultadoPaginado<Veiculo>>('/vehicles/meus?limite=50'),
      api.get<ResultadoPaginado<Servico>>('/services?limite=50'),
    ])
      .then(([v, s]) => {
        setVeiculos(v.data.dados);
        setTodosServicos(s.data.dados);
      })
      .catch(() => toast.error('Erro ao carregar dados'))
      .finally(() => setCarregando(false));
  }, []);

  // Veículo selecionado (para exibir o tipo e filtrar serviços)
  const veiculoSelecionado = veiculos.find((v) => v.id === veiculoId);

  // Serviços filtrados pelo tipo do veículo selecionado
  const servicosFiltrados = veiculoSelecionado
    ? todosServicos.filter((s) => servicoAtendeVeiculo(s, veiculoSelecionado.tipo))
    : todosServicos;

  // Ao trocar o veículo, limpa o serviço se o atual não atende o novo tipo
  const handleVeiculoChange = (novoVeiculoId: string) => {
    setVeiculoId(novoVeiculoId);
    const novoVeiculo = veiculos.find((v) => v.id === novoVeiculoId);
    if (novoVeiculo && servicoId) {
      const servicoAtual = todosServicos.find((s) => s.id === servicoId);
      if (servicoAtual && !servicoAtendeVeiculo(servicoAtual, novoVeiculo.tipo)) {
        setServicoId('');
      }
    }
  };

  const servicoSelecionado = servicosFiltrados.find((s) => s.id === servicoId);

  const handleDataChange = (valor: string) => {
    setAgendadoPara(valor);
    setErroHorario(validarHorario(valor) || '');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!veiculoId || !servicoId || !agendadoPara) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    const erroHora = validarHorario(agendadoPara);
    if (erroHora) { toast.error(erroHora); return; }
    setLoading(true);
    try {
      await api.post('/appointments', { veiculoId, servicoId, agendadoPara, observacoes });
      toast.success('Agendamento realizado!');
      navigate('/dashboard/agendamentos');
    } catch (err: unknown) {
      toast.error((err as ErroApi)?.response?.data?.mensagem || 'Erro ao agendar');
    } finally { setLoading(false); }
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-500 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Novo Agendamento</h1>
      <p className="text-sm text-gray-500 mb-6">
        Horários: Seg–Sex 08:00–12:00 e 13:30–18:00 | Sáb 08:00–12:00
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Veículo */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Veículo *</label>
                <select
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm"
                  value={veiculoId}
                  onChange={(e) => handleVeiculoChange(e.target.value)}
                >
                  <option value="">Selecione um veículo</option>
                  {veiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.marca} {v.modelo} — {v.placa} ({v.tipo})
                    </option>
                  ))}
                </select>
                {veiculos.length === 0 && (
                  <p className="text-xs text-orange-500">Cadastre um veículo primeiro</p>
                )}
              </div>

              {/* Serviço — filtrado pelo tipo do veículo */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Serviço *
                  {veiculoSelecionado && (
                    <span className="ml-2 text-xs text-blue-500 font-normal">
                      (compatíveis com {veiculoSelecionado.tipo})
                    </span>
                  )}
                </label>
                <select
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm disabled:bg-gray-50 disabled:text-gray-400"
                  value={servicoId}
                  onChange={(e) => setServicoId(e.target.value)}
                  disabled={!veiculoId}
                >
                  <option value="">
                    {veiculoId ? 'Selecione um serviço' : 'Selecione um veículo primeiro'}
                  </option>
                  {servicosFiltrados.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome} — {formatCurrency(s.preco)} ({s.duracao} min)
                    </option>
                  ))}
                </select>
                {veiculoId && servicosFiltrados.length === 0 && (
                  <p className="text-xs text-orange-500">
                    Nenhum serviço disponível para este tipo de veículo
                  </p>
                )}
              </div>

              {/* Data e hora */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Data e Hora *</label>
                <input
                  type="datetime-local"
                  className={`w-full px-4 py-2.5 rounded-lg border text-sm ${erroHorario ? 'border-red-400' : 'border-gray-300'}`}
                  value={agendadoPara}
                  onChange={(e) => handleDataChange(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
                {erroHorario && <p className="text-xs text-red-500">{erroHorario}</p>}
              </div>

              {/* Observações */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Observações</label>
                <textarea
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm resize-none"
                  rows={3}
                  placeholder="Alguma observação especial?"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => navigate('/dashboard/agendamentos')}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  loading={loading}
                  disabled={!!erroHorario}
                >
                  Confirmar Agendamento
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Resumo lateral */}
        {servicoSelecionado && (
          <Card className="p-6 h-fit">
            <h3 className="font-semibold text-gray-900 mb-4">Resumo</h3>
            <div className="space-y-3">
              {veiculoSelecionado && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Veículo</span>
                  <span className="font-medium text-right">
                    {veiculoSelecionado.marca} {veiculoSelecionado.modelo}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Serviço</span>
                <span className="font-medium text-right">{servicoSelecionado.nome}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Duração</span>
                <span>{servicoSelecionado.duracao} min</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-blue-600 text-lg">
                  {formatCurrency(servicoSelecionado.preco)}
                </span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
