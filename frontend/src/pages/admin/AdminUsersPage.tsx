import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Usuario, ResultadoPaginado } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Pagination } from '../../components/common/Pagination';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { usePagination } from '../../hooks/usePagination';

export function AdminUsersPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const { page, limit, goToPage } = usePagination();

  const buscarUsuarios = () => {
    setCarregando(true);
    api.get<ResultadoPaginado<Usuario>>(`/users?pagina=${page}&limite=${limit}`)
      .then((r) => {
        setUsuarios(r.data.dados as Usuario[]);
        setTotal(r.data.total);
        setTotalPaginas(r.data.totalPaginas);
      })
      .catch(() => toast.error('Erro ao carregar usuários'))
      .finally(() => setCarregando(false));
  };

  useEffect(() => { buscarUsuarios(); }, [page]);

  const handleExcluir = async (id: string) => {
    if (!confirm('Remover usuário? Todos os veículos e agendamentos dele serão excluídos.')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('Usuário removido');
      buscarUsuarios();
    } catch { toast.error('Erro ao remover'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-500 text-sm">{total} usuário(s) cadastrado(s)</p>
        </div>
      </div>

      {carregando ? (
        <LoadingSpinner />
      ) : (
        <Card>
          {/* Tabela desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-left text-gray-500">
                  <th className="px-6 py-4 font-medium">Nome</th>
                  <th className="px-6 py-4 font-medium">E-mail</th>
                  <th className="px-6 py-4 font-medium">Perfil</th>
                  <th className="px-6 py-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                ) : (
                  usuarios.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 text-sm font-semibold">
                              {u.nome[0].toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{u.nome}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          u.perfil === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {u.perfil === 'admin' ? 'Admin' : 'Cliente'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Button variant="danger" size="sm" onClick={() => handleExcluir(u.id)}>
                          Remover
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Cards mobile */}
          <div className="md:hidden divide-y divide-gray-100">
            {usuarios.length === 0 ? (
              <p className="p-8 text-center text-gray-400">Nenhum usuário encontrado</p>
            ) : (
              usuarios.map((u) => (
                <div key={u.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold">{u.nome[0].toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{u.nome}</p>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.perfil === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {u.perfil === 'admin' ? 'Admin' : 'Cliente'}
                    </span>
                    <Button variant="danger" size="sm" onClick={() => handleExcluir(u.id)}>
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
