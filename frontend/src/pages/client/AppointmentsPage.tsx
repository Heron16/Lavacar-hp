import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Agendamento, ResultadoPaginado } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { usePagination } from '../../hooks/usePagination';
import { formatCurrency, formatDate } from '../../utils/validators';

export function AppointmentsPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const { page, limit, goToPage } = usePagination();

  const buscarAgendamentos = () => {
    setCarregando(true);
    api.get<ResultadoPaginado<Agendamento>>(`/appointments/meus?pagina=${page}&limite=${limit}`)
      .then((r) => {
        setAgendamentos(r.data.dados);
        setTotalPaginas(r.data.totalPaginas);
        setTotal(r.data.total);
      })
      .catch(() => toast.error('Erro ao carregar agendamentos'))
      .finally(() => setCarregando(false));
  };

  useEffect(() => { buscarAgendamentos(); }, [page, limit]);

  const handleCancelar = async (id: string) => {
    if (!confirm('Cancelar agendamento?')) return;
    try {
      await api.patch(`/appointments/${id}/status`, { status: 'cancelado' });
      toast.success('Agendamento cancelado');
      buscarAgendamentos();
    } catch { toast.error('Erro ao cancelar'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Meus Agendamentos</h1>
          <p className="text-gray-500 text-sm">{total} agendamento(s)</p>
        </div>
        <Link to="/dashboard/agendamentos/novo">
          <Button size="sm">+ Novo</Button>
        </Link>
      </div>

      {carregando ? (
        <LoadingSpinner />
      ) : agendamentos.length === 0 ? (
        <Card className="p-10 sm:p-12 text-center text-gray-400">
          <p className="text-5xl mb-3">📅</p>
          <p className="font-medium">Nenhum agendamento</p>
          <Link to="/dashboard/agendamentos/novo">
            <Button className="mt-4">Agendar agora</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {agendamentos.map((a) => (
            <Card key={a.id} className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-900">{a.servico?.nome || 'Serviço'}</span>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="text-sm text-gray-500">
                    🚗 {a.veiculo?.marca} {a.veiculo?.modelo} · {a.veiculo?.placa}
                  </p>
                  <p className="text-sm text-gray-500">📅 {formatDate(a.agendadoPara)}</p>
                  {a.observacoes && (
                    <p className="text-sm text-gray-400 italic">"{a.observacoes}"</p>
                  )}
                </div>
                <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 flex-shrink-0">
                  <span className="font-bold text-blue-600 text-lg">{formatCurrency(a.precoTotal)}</span>
                  {a.status === 'pendente' && (
                    <Button variant="danger" size="sm" onClick={() => handleCancelar(a.id)}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPaginas} onPageChange={goToPage} />
    </div>
  );
}
