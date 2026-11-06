import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ResultadoPaginado, Agendamento, Usuario, Servico } from '../../types';
import { StatusBadge } from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../utils/validators';

interface Estatisticas {
  usuarios: number;
  servicos: number;
  agendamentos: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Estatisticas>({ usuarios: 0, servicos: 0, agendamentos: 0 });
  const [recentes, setRecentes] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<ResultadoPaginado<Usuario>>('/users?limite=1'),
      api.get<ResultadoPaginado<Servico>>('/services/admin/todos?limite=1'),
      api.get<ResultadoPaginado<Agendamento>>('/appointments?limite=5'),
    ])
      .then(([u, s, a]) => {
        setStats({ usuarios: u.data.total, servicos: s.data.total, agendamentos: a.data.total });
        setRecentes(a.data.dados);
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  if (carregando) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Painel Administrativo</h1>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Usuários',      valor: stats.usuarios,     icon: '👥', color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'Serviços',      valor: stats.servicos,     icon: '🧹', color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'Agendamentos',  valor: stats.agendamentos, icon: '📅', color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((s) => (
          <Card key={s.label} className="p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.valor}</p>
              </div>
              <div className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center text-2xl`}>
                {s.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Agendamentos recentes */}
      <Card className="p-4 sm:p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Agendamentos Recentes</h2>
        {recentes.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Nenhum agendamento</p>
        ) : (
          <>
            {/* Tabela desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-3 font-medium">Serviço</th>
                    <th className="pb-3 font-medium">Data</th>
                    <th className="pb-3 font-medium">Valor</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentes.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="py-3 font-medium">{a.servico?.nome || '—'}</td>
                      <td className="py-3 text-gray-500">{formatDate(a.agendadoPara)}</td>
                      <td className="py-3 font-semibold text-blue-600">{formatCurrency(a.precoTotal)}</td>
                      <td className="py-3"><StatusBadge status={a.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Lista mobile */}
            <div className="sm:hidden space-y-3">
              {recentes.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{a.servico?.nome || '—'}</p>
                    <p className="text-xs text-gray-500">{formatDate(a.agendadoPara)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-blue-600">{formatCurrency(a.precoTotal)}</span>
                    <StatusBadge status={a.status} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
