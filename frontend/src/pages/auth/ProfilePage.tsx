import { useState, FormEvent } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { validateCPF, validatePassword, formatCPF } from '../../utils/validators';
import { FormEdicaoUsuario, Usuario, ErroApi } from '../../types';

type ErrosCampos = Partial<Record<keyof FormEdicaoUsuario, string>>;

export function ProfilePage() {
  const { usuario, atualizarUsuario } = useAuth();
  const [form, setForm] = useState<FormEdicaoUsuario>({
    nome: usuario?.nome || '',
    cpf: usuario?.cpf || '',
    telefone: usuario?.telefone || '',
    senha: '',
    confirmarSenha: '',
  });
  const [erros, setErros] = useState<ErrosCampos>({});
  const [loading, setLoading] = useState(false);

  const set = (campo: keyof FormEdicaoUsuario) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = campo === 'cpf' ? formatCPF(e.target.value) : e.target.value;
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const validar = (): boolean => {
    const novosErros: ErrosCampos = {};
    if (!form.nome.trim()) novosErros.nome = 'Nome é obrigatório';
    if (form.cpf && !validateCPF(form.cpf)) novosErros.cpf = 'CPF inválido';
    if (form.senha && !validatePassword(form.senha)) novosErros.senha = 'Senha fraca';
    if (form.senha && form.senha !== form.confirmarSenha)
      novosErros.confirmarSenha = 'Senhas não coincidem';
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validar()) return;
    setLoading(true);
    try {
      const payload: Partial<{ nome: string; telefone: string; cpf: string; senha: string }> = {
        nome: form.nome,
        telefone: form.telefone,
      };
      if (form.cpf) payload.cpf = form.cpf.replace(/\D/g, '');
      if (form.senha) payload.senha = form.senha;

      const { data } = await api.put<Usuario>(`/users/${usuario?.id}`, payload);
      atualizarUsuario({ ...data, id: data.id || usuario!.id });
      toast.success('Perfil atualizado!');
    } catch (err: unknown) {
      const msg = (err as ErroApi)?.response?.data?.mensagem || 'Erro ao atualizar';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Meu Perfil</h1>

      <Card className="p-4 sm:p-6 max-w-lg w-full">
        {/* Avatar + info */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6 pb-6 border-b">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-2xl font-bold">{usuario?.nome[0].toUpperCase()}</span>
          </div>
          <div className="text-center sm:text-left">
            <p className="font-semibold text-gray-900">{usuario?.nome}</p>
            <p className="text-sm text-gray-500">{usuario?.email}</p>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mt-1 inline-block">
              {usuario?.perfil === 'admin' ? 'Administrador' : 'Cliente'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome completo"
            value={form.nome}
            onChange={set('nome')}
            error={erros.nome}
          />
          <Input
            label="E-mail (não editável)"
            value={usuario?.email || ''}
            disabled
            className="bg-gray-50 cursor-not-allowed"
          />
          <Input
            label="CPF"
            placeholder="000.000.000-00"
            value={form.cpf}
            onChange={set('cpf')}
            error={erros.cpf}
            maxLength={14}
          />
          <Input
            label="Telefone"
            placeholder="(11) 99999-9999"
            value={form.telefone}
            onChange={set('telefone')}
          />
          <Input
            label="Nova senha (opcional)"
            type="password"
            placeholder="••••••••"
            value={form.senha}
            onChange={set('senha')}
            error={erros.senha}
          />
          <Input
            label="Confirmar nova senha"
            type="password"
            placeholder="••••••••"
            value={form.confirmarSenha}
            onChange={set('confirmarSenha')}
            error={erros.confirmarSenha}
          />
          <Button type="submit" loading={loading} className="w-full">
            Salvar alterações
          </Button>
        </form>
      </Card>
    </div>
  );
}
