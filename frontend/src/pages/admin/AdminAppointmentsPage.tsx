import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Agendamento, ResultadoPaginado, StatusAgendamento } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { usePagination } from '../../hooks/usePagination';
import { formatCurrency, formatDate } from '../../utils/validators';

const opcoesStatus: { value: StatusAgendamento; label: string }[] = [
  { value: 'pendente',      label: 'Pendente' },
  { value: 'em_andamento',  label: 'Em andamento' },
  { value: 'concluido',     label: 'Concluído' },
  { value: 'cancelado',     label: 'Cancelado' },
];

export function AdminAppointmentsPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const { page, limit, goToPage } = usePagination();

  const buscarAgendamentos = () => {
    setCarregando(true);
    api.get<ResultadoPaginado<Agendamento>>(`/appointments?pagina=${page}&limite=${limit}`)
      .then((r) => {
        setAgendamentos(r.data.dados);
        setTotal(r.data.total);
        setTotalPaginas(r.data.totalPaginas);
      })
      .catch(() => toast.error('Erro ao carregar agendamentos'))
      .finally(() => setCarregando(false));
  };

  useEffect(() => { buscarAgendamentos(); }, [page]);

  const handleAlterarStatus = async (id: string, status: StatusAgendamento) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      toast.success('Status atualizado');
      buscarAgendamentos();
    } catch { toast.error('Erro ao atualizar status'); }
  };

  const handleExcluir = async (id: string) => {
    if (!confirm('Remover agendamento?')) return;
    try {
      await api.delete(`/appointments/${id}`);
      toast.success('Removido');
      buscarAgendamentos();
    } catch { toast.error('Erro ao remover'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Agendamentos</h1>
          <p className="text-gray-500 text-sm">{total} agendamento(s)</p>
        </div>
      </div>

      {carregando ? (
        <LoadingSpinner />
      ) : (
        <Card>
          {/* Tabela desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-left text-gray-500">
                  <th className="px-6 py-4 font-medium">Serviço</th>
                  <th className="px-6 py-4 font-medium">Veículo</th>
                  <th className="px-6 py-4 font-medium">Data</th>
                  <th className="px-6 py-4 font-medium">Valor</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {agendamentos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      Nenhum agendamento encontrado
                    </td>
                  </tr>
                ) : (
                  agendamentos.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{a.servico?.nome || '—'}</td>
                      <td className="px-6 py-4 text-gray-500">
                        {a.veiculo?.marca} {a.veiculo?.modelo}
                        <span className="ml-1 font-mono text-xs text-gray-400">({a.veiculo?.placa})</span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{formatDate(a.agendadoPara)}</td>
                      <td className="px-6 py-4 font-semibold text-blue-600">{formatCurrency(a.precoTotal)}</td>
                      <td className="px-6 py-4">
                        <select
                          value={a.status}
                          onChange={(e) => handleAlterarStatus(a.id, e.target.value as StatusAgendamento)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1"
                        >
                          {opcoesStatus.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <Button variant="danger" size="sm" onClick={() => handleExcluir(a.id)}>
                          Remover
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Cards mobile/tablet */}
          <div className="lg:hidden divide-y divide-gray-100">
            {agendamentos.length === 0 ? (
              <p className="p-8 text-center text-gray-400">Nenhum agendamento encontrado</p>
            ) : (
              agendamentos.map((a) => (
                <div key={a.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{a.servico?.nome || '—'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        🚗 {a.veiculo?.marca} {a.veiculo?.modelo}
                        <span className="font-mono ml-1">({a.veiculo?.placa})</span>
                      </p>
                      <p className="text-xs text-gray-500">📅 {formatDate(a.agendadoPara)}</p>
                    </div>
                    <span className="font-bold text-blue-600 flex-shrink-0">
                      {formatCurrency(a.precoTotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={a.status}
                      onChange={(e) => handleAlterarStatus(a.id, e.target.value as StatusAgendamento)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 flex-1"
                    >
                      {opcoesStatus.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <StatusBadge status={a.status} />
                    <Button variant="danger" size="sm" onClick={() => handleExcluir(a.id)}>
                      Remover
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4">
            <Pagination page={page} totalPages={totalPaginas} onPageChange={goToPage} />
          </div>
        </Card>
      )}
    </div>
  );
}
