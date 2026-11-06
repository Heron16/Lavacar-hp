import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Veiculo, ResultadoPaginado, TipoVeiculo, Usuario } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Pagination } from '../../components/common/Pagination';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { usePagination } from '../../hooks/usePagination';

const labelsTipo: Record<TipoVeiculo, string> = {
  carro: 'Carro', moto: 'Moto', caminhao: 'Caminhão', suv: 'SUV',
};

const iconeTipo: Record<TipoVeiculo, string> = {
  carro: '🚗', moto: '🏍️', caminhao: '🚛', suv: '🚙',
};

/** Veículo enriquecido com dados do dono (retornados pelo backend via include) */
interface VeiculoComDono extends Veiculo {
  usuario?: Pick<Usuario, 'nome' | 'email'>;
}

export function AdminVehiclesPage() {
  const [veiculos, setVeiculos] = useState<VeiculoComDono[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const { page, limit, goToPage } = usePagination();

  const buscarVeiculos = () => {
    setCarregando(true);
    api.get<ResultadoPaginado<VeiculoComDono>>(`/vehicles?pagina=${page}&limite=${limit}`)
      .then((r) => {
        setVeiculos(r.data.dados);
        setTotal(r.data.total);
        setTotalPaginas(r.data.totalPaginas);
      })
      .catch(() => toast.error('Erro ao carregar veículos'))
      .finally(() => setCarregando(false));
  };

  useEffect(() => { buscarVeiculos(); }, [page]);

  const handleExcluir = async (id: string) => {
    if (!confirm('Remover veículo? Esta ação não pode ser desfeita.')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      toast.success('Veículo removido');
      buscarVeiculos();
    } catch { toast.error('Erro ao remover'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Veículos</h1>
          <p className="text-gray-500 text-sm">{total} veículo(s) cadastrado(s)</p>
        </div>
      </div>

      {carregando ? (
        <LoadingSpinner />
      ) : (
        <Card>
          {/* Tabela — desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-left text-gray-500">
                  <th className="px-6 py-4 font-medium">Veículo</th>
                  <th className="px-6 py-4 font-medium">Placa</th>
                  <th className="px-6 py-4 font-medium">Tipo</th>
                  <th className="px-6 py-4 font-medium">Ano</th>
                  <th className="px-6 py-4 font-medium">Proprietário</th>
                  <th className="px-6 py-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {veiculos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      Nenhum veículo cadastrado
                    </td>
                  </tr>
                ) : (
                  veiculos.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{iconeTipo[v.tipo]}</span>
                          <div>
                            <p className="font-medium text-gray-900">{v.marca} {v.modelo}</p>
                            <p className="text-xs text-gray-400">{v.cor}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-700">{v.placa}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700">
                          {iconeTipo[v.tipo]} {labelsTipo[v.tipo]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{v.ano}</td>
                      <td className="px-6 py-4">
                        {v.usuario ? (
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{v.usuario.nome}</p>
                            <p className="text-xs text-gray-400">{v.usuario.email}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Button variant="danger" size="sm" onClick={() => handleExcluir(v.id)}>
                          Remover
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Cards — mobile */}
          <div className="md:hidden divide-y divide-gray-100">
            {veiculos.length === 0 ? (
              <p className="p-8 text-center text-gray-400">Nenhum veículo cadastrado</p>
            ) : (
              veiculos.map((v) => (
                <div key={v.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{iconeTipo[v.tipo]}</span>
                      <div>
                        <p className="font-semibold text-gray-900">{v.marca} {v.modelo}</p>
                        <p className="text-xs text-gray-400">{v.cor} · {v.ano}</p>
                      </div>
                    </div>
                    <Button variant="danger" size="sm" onClick={() => handleExcluir(v.id)}>
                      Remover
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">{v.placa}</span>
                    <span className="text-xs">{labelsTipo[v.tipo]}</span>
                  </div>
                  {v.usuario && (
                    <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                      <span className="font-medium">Proprietário: </span>
                      {v.usuario.nome} — {v.usuario.email}
                    </div>
                  )}
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
