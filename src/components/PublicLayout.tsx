import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Instagram, Facebook, Mail } from 'lucide-react';

const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Destinos', path: '/destinos' },
    { name: 'Expedições', path: '/expedicoes' },
    { name: 'Nossa História', path: '/historia' },
    { name: 'Contato', path: '/contato' },
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-zinc-900 font-sans selection:bg-orange-500 selection:text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-stone-50/90 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="text-2xl font-light tracking-widest text-zinc-900 uppercase flex items-center gap-2">
            Super<span className="font-bold text-orange-500">Explorers</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium tracking-widest uppercase transition-colors hover:text-orange-500 ${location.pathname === item.path ? 'text-orange-500' : 'text-zinc-500'
                  }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-zinc-900" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-stone-50 pt-24 px-6 md:hidden"
          >
            <nav className="flex flex-col gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-2xl font-light tracking-widest uppercase text-zinc-900 hover:text-orange-500 transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pt-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-900 pt-20 pb-10 text-stone-300">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-3xl font-light tracking-tighter mb-6 uppercase text-white">
              Super<span className="font-bold text-orange-500">Explorers</span>
            </h3>
            <p className="text-zinc-500 max-w-sm font-light leading-relaxed">
              Curadoria de experiências extraordinárias para quem busca o incomum em cada canto do planeta.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-6 text-zinc-600">Navegação</h4>
            <ul className="space-y-3">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link to={item.path} className="text-zinc-400 hover:text-orange-500 transition-colors text-sm">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-6 text-zinc-600">Redes Sociais</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full border border-zinc-800 text-zinc-400 flex items-center justify-center hover:bg-orange-500 hover:border-orange-500 hover:text-white transition-all">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-zinc-800 text-zinc-400 flex items-center justify-center hover:bg-orange-500 hover:border-orange-500 hover:text-white transition-all">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-zinc-800 text-zinc-400 flex items-center justify-center hover:bg-orange-500 hover:border-orange-500 hover:text-white transition-all">
                <Mail size={18} />
              </a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-10 border-t border-zinc-900 text-center text-zinc-600 text-[10px] uppercase tracking-widest font-bold">
          © {new Date().getFullYear()} SuperExplorers. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
