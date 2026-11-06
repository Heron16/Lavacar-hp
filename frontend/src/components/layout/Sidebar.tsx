import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ItemNav {
  to: string;
  label: string;
  icon: string;
}

const navCliente: ItemNav[] = [
  { to: '/dashboard', label: 'Início', icon: '🏠' },
  { to: '/dashboard/veiculos', label: 'Meus Veículos', icon: '🚗' },
  { to: '/dashboard/agendamentos', label: 'Agendamentos', icon: '📅' },
  { to: '/dashboard/perfil', label: 'Meu Perfil', icon: '👤' },
];

const navAdmin: ItemNav[] = [
  { to: '/admin', label: 'Dashboard', icon: '📊' },
  { to: '/admin/usuarios', label: 'Usuários', icon: '👥' },
  { to: '/admin/servicos', label: 'Serviços', icon: '🧹' },
  { to: '/admin/veiculos', label: 'Veículos', icon: '🚗' },
  { to: '/admin/agendamentos', label: 'Agendamentos', icon: '📅' },
];

interface SidebarProps {
  onNavClick?: () => void;
}

export function Sidebar({ onNavClick }: SidebarProps) {
  const { usuario } = useAuth();
  const itens = usuario?.perfil === 'admin' ? navAdmin : navCliente;

  return (
    <aside className="w-64 bg-white border-r border-gray-100 min-h-full p-4 shadow-lg lg:shadow-none">
      <div className="mb-6 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold">{usuario?.nome[0].toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{usuario?.nome}</p>
            <p className="text-xs text-gray-500">
              {usuario?.perfil === 'admin' ? 'Administrador' : 'Cliente'}
            </p>
          </div>
        </div>
      </div>

      <nav className="space-y-1">
        {itens.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard' || item.to === '/admin'}
            onClick={onNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
