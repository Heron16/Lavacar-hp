import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Servico, ResultadoPaginado, TipoVeiculo, ErroApi } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Pagination } from '../../components/common/Pagination';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { usePagination } from '../../hooks/usePagination';
import { formatCurrency } from '../../utils/validators';

interface FormServico {
  nome: string; descricao: string; preco: string; duracao: string;
  tiposVeiculo: TipoVeiculo[]; ativo: boolean;
}

const formVazio: FormServico = {
  nome: '', descricao: '', preco: '', duracao: '', tiposVeiculo: ['carro'], ativo: true,
};
const todosTipos: TipoVeiculo[] = ['carro', 'moto', 'caminhao', 'suv'];
const labelsTipo: Record<TipoVeiculo, string> = {
  carro: 'Carro', moto: 'Moto', caminhao: 'Caminhão', suv: 'SUV',
};

export function AdminServicesPage() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Servico | null>(null);
  const [form, setForm] = useState<FormServico>(formVazio);
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const { page, limit, goToPage } = usePagination();

  const buscarServicos = () => {
    setCarregando(true);
    api.get<ResultadoPaginado<Servico>>(`/services/admin/todos?pagina=${page}&limite=${limit}`)
      .then((r) => {
        setServicos(r.data.dados);
        setTotal(r.data.total);
        setTotalPaginas(r.data.totalPaginas);
      })
      .catch(() => toast.error('Erro ao carregar serviços'))
      .finally(() => setCarregando(false));
  };

  useEffect(() => { buscarServicos(); }, [page]);

  const abrirCriacao = () => { setEditando(null); setForm(formVazio); setModalAberto(true); };
  const abrirEdicao = (s: Servico) => {
    setEditando(s);
    const tipos = Array.isArray(s.tiposVeiculo)
      ? s.tiposVeiculo
      : (s.tiposVeiculo as unknown as string).split(',') as TipoVeiculo[];
    setForm({
      nome: s.nome, descricao: s.descricao, preco: String(s.preco),
      duracao: String(s.duracao), tiposVeiculo: tipos, ativo: s.ativo,
    });
    setModalAberto(true);
  };

  const alternarTipo = (t: TipoVeiculo) =>
    setForm((p) => ({
      ...p,
      tiposVeiculo: p.tiposVeiculo.includes(t)
        ? p.tiposVeiculo.filter((x) => x !== t)
        : [...p.tiposVeiculo, t],
    }));

  const handleSalvar = async () => {
    if (!form.nome || !form.descricao || !form.preco || !form.duracao) {
      toast.error('Preencha todos os campos'); return;
    }
    if (form.tiposVeiculo.length === 0) {
      toast.error('Selecione ao menos um tipo de veículo'); return;
    }
    setLoading(true);
    try {
      const payload = { ...form, preco: Number(form.preco), duracao: Number(form.duracao) };
      if (editando) {
        await api.put(`/services/${editando.id}`, payload);
        toast.success('Serviço atualizado!');
      } else {
        await api.post('/services', payload);
        toast.success('Serviço criado!');
      }
      setModalAberto(false);
      buscarServicos();
    } catch (err: unknown) {
      toast.error((err as ErroApi)?.response?.data?.mensagem || 'Erro ao salvar');
    } finally { setLoading(false); }
  };

  const handleExcluir = async (id: string) => {
    if (!confirm('Remover serviço?')) return;
    try {
      await api.delete(`/services/${id}`);
      toast.success('Serviço removido');
      buscarServicos();
    } catch { toast.error('Erro ao remover'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Serviços</h1>
          <p className="text-gray-500 text-sm">{total} serviço(s)</p>
        </div>
        <Button onClick={abrirCriacao} size="sm">+ Novo Serviço</Button>
      </div>

      {carregando ? (
        <LoadingSpinner />
      ) : servicos.length === 0 ? (
        <Card className="p-12 text-center text-gray-400">
          <p className="text-5xl mb-3">🧹</p>
          <p className="font-medium">Nenhum serviço cadastrado</p>
          <Button onClick={abrirCriacao} className="mt-4">Criar primeiro serviço</Button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {servicos.map((s) => (
              <Card key={s.id} className="p-4 sm:p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl">
                    🧹
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    s.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {s.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{s.nome}</h3>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{s.descricao}</p>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-blue-600">{formatCurrency(s.preco)}</span>
                  <span className="text-xs text-gray-400">{s.duracao} min</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => abrirEdicao(s)}>
                    Editar
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleExcluir(s.id)}>✕</Button>
                </div>
              </Card>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPaginas} onPageChange={goToPage} />
        </>
      )}

      <Modal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title={editando ? 'Editar Serviço' : 'Novo Serviço'}
      >
        <div className="space-y-4">
          <Input
            label="Nome"
            placeholder="Lavagem Completa"
            value={form.nome}
            onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Descrição</label>
            <textarea
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm resize-none"
              rows={3}
              value={form.descricao}
              onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Preço (R$)"
              type="number"
              placeholder="50"
              value={form.preco}
              onChange={(e) => setForm((p) => ({ ...p, preco: e.target.value }))}
            />
            <Input
              label="Duração (min)"
              type="number"
              placeholder="60"
              value={form.duracao}
              onChange={(e) => setForm((p) => ({ ...p, duracao: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Tipos de veículo</label>
            <div className="flex flex-wrap gap-2">
              {todosTipos.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => alternarTipo(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                    form.tiposVeiculo.includes(t)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {labelsTipo[t]}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => setForm((p) => ({ ...p, ativo: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Serviço ativo</span>
          </label>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" loading={loading} onClick={handleSalvar}>
              Salvar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
