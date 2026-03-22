import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background selection:bg-primary/10 selection:text-primary transition-colors duration-300">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-950/20">
          <div className="mx-auto h-full max-w-[1600px] p-8 animate-in fade-in duration-700">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
