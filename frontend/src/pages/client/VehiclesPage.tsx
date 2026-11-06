import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Veiculo, ResultadoPaginado, TipoVeiculo, ErroApi } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Pagination } from '../../components/common/Pagination';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { usePagination } from '../../hooks/usePagination';

const labelsTipo: Record<TipoVeiculo, string> = {
  carro: 'Carro', moto: 'Moto', caminhao: 'Caminhão', suv: 'SUV',
};

const iconeTipo: Record<TipoVeiculo, string> = {
  carro: '🚗', moto: '🏍️', caminhao: '🚛', suv: '🚙',
};

interface FormVeiculo {
  marca: string; modelo: string; ano: string; placa: string; cor: string; tipo: TipoVeiculo;
}

const formVazio: FormVeiculo = { marca: '', modelo: '', ano: '', placa: '', cor: '', tipo: 'carro' };

export function VehiclesPage() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Veiculo | null>(null);
  const [form, setForm] = useState<FormVeiculo>(formVazio);
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const { page, limit, goToPage } = usePagination();

  const buscarVeiculos = () => {
    setCarregando(true);
    api.get<ResultadoPaginado<Veiculo>>(`/vehicles/meus?pagina=${page}&limite=${limit}`)
      .then((r) => {
        setVeiculos(r.data.dados);
        setTotal(r.data.total);
        setTotalPaginas(r.data.totalPaginas);
      })
      .catch(() => toast.error('Erro ao carregar veículos'))
      .finally(() => setCarregando(false));
  };

  useEffect(() => { buscarVeiculos(); }, [page]);

  const abrirCriacao = () => { setEditando(null); setForm(formVazio); setModalAberto(true); };
  const abrirEdicao = (v: Veiculo) => {
    setEditando(v);
    setForm({ marca: v.marca, modelo: v.modelo, ano: String(v.ano), placa: v.placa, cor: v.cor, tipo: v.tipo });
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    if (!form.marca || !form.modelo || !form.ano || !form.placa || !form.cor) {
      toast.error('Preencha todos os campos'); return;
    }
    setLoading(true);
    try {
      if (editando) {
        await api.put(`/vehicles/${editando.id}`, { ...form, ano: Number(form.ano) });
        toast.success('Veículo atualizado!');
      } else {
        await api.post('/vehicles', { ...form, ano: Number(form.ano) });
        toast.success('Veículo cadastrado!');
      }
      setModalAberto(false);
      buscarVeiculos();
    } catch (err: unknown) {
      toast.error((err as ErroApi)?.response?.data?.mensagem || 'Erro ao salvar');
    } finally { setLoading(false); }
  };

  const handleExcluir = async (id: string) => {
    if (!confirm('Remover veículo?')) return;
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Meus Veículos</h1>
          <p className="text-gray-500 text-sm">{total} veículo(s) cadastrado(s)</p>
        </div>
        <Button onClick={abrirCriacao} size="sm" className="sm:text-sm">
          + Adicionar
        </Button>
      </div>

      {carregando ? (
        <LoadingSpinner />
      ) : veiculos.length === 0 ? (
        <Card className="p-10 sm:p-12 text-center text-gray-400">
          <p className="text-5xl mb-3">🚗</p>
          <p className="font-medium">Nenhum veículo cadastrado</p>
          <Button onClick={abrirCriacao} className="mt-4">Adicionar primeiro veículo</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {veiculos.map((v) => (
            <Card key={v.id} className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{iconeTipo[v.tipo]}</span>
                    <h3 className="font-semibold text-gray-900 truncate">{v.marca} {v.modelo}</h3>
                  </div>
                  <p className="text-sm text-gray-500">{v.ano} · {v.cor} · {labelsTipo[v.tipo]}</p>
                  <span className="inline-block mt-2 bg-gray-100 text-gray-700 text-xs font-mono px-2 py-1 rounded">
                    {v.placa}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => abrirEdicao(v)}>Editar</Button>
                  <Button variant="danger" size="sm" onClick={() => handleExcluir(v.id)}>Remover</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPaginas} onPageChange={goToPage} />

      <Modal isOpen={modalAberto} onClose={() => setModalAberto(false)} title={editando ? 'Editar Veículo' : 'Novo Veículo'}>
        <div className="space-y-4">
          <Input label="Marca" placeholder="Toyota" value={form.marca} onChange={(e) => setForm((p) => ({ ...p, marca: e.target.value }))} />
          <Input label="Modelo" placeholder="Corolla" value={form.modelo} onChange={(e) => setForm((p) => ({ ...p, modelo: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Ano" type="number" placeholder="2022" value={form.ano} onChange={(e) => setForm((p) => ({ ...p, ano: e.target.value }))} />
            <Input label="Cor" placeholder="Prata" value={form.cor} onChange={(e) => setForm((p) => ({ ...p, cor: e.target.value }))} />
          </div>
          <Input
            label="Placa"
            placeholder="ABC1234"
            value={form.placa}
            onChange={(e) => setForm((p) => ({ ...p, placa: e.target.value.toUpperCase() }))}
            disabled={!!editando}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Tipo</label>
            <select
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm"
              value={form.tipo}
              onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value as TipoVeiculo }))}
            >
              {Object.entries(labelsTipo).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setModalAberto(false)}>Cancelar</Button>
            <Button className="flex-1" loading={loading} onClick={handleSalvar}>Salvar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
