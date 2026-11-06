import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarAberta, setSidebarAberta] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onMenuClick={() => setSidebarAberta((p) => !p)} />

      <div className="flex">
        {/* Overlay mobile */}
        {sidebarAberta && (
          <div
            className="fixed inset-0 bg-black/40 z-20 lg:hidden"
            onClick={() => setSidebarAberta(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`
            fixed top-16 left-0 h-[calc(100vh-4rem)] z-30 transition-transform duration-300
            lg:static lg:translate-x-0 lg:h-auto lg:z-auto
            ${sidebarAberta ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <Sidebar onNavClick={() => setSidebarAberta(false)} />
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 max-w-6xl">{children}</main>
      </div>
    </div>
  );
}
