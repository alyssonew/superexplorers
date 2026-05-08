import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn, Loader2, Compass, Mail, Lock } from 'lucide-react';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) throw signInError;

      // Verification if user is admin is handled by AuthContext,
      // but we can fast-track navigation here since signIn succeeded.
      if (data.session) {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      setError('Credenciais inválidas. Verifique seu e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col items-center justify-center p-6 text-sky-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-sky-200 shadow-xl p-10 rounded-[40px] text-center"
      >
        <Compass size={64} className="text-orange-500 mx-auto mb-8" />
        <h1 className="text-3xl font-light tracking-widest uppercase mb-2 text-sky-950">Painel Admin</h1>
        <p className="text-sky-600 text-sm mb-10 font-medium uppercase tracking-widest">Super Explorers</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-xs mb-8">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400" size={20} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              required
              className="w-full pl-12 pr-4 py-4 bg-sky-50/50 border border-sky-100 rounded-2xl text-sky-950 placeholder-sky-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400" size={20} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              required
              className="w-full pl-12 pr-4 py-4 bg-sky-50/50 border border-sky-100 rounded-2xl text-sky-950 placeholder-sky-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 mt-4 bg-sky-950 text-white rounded-[20px] font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-4 hover:bg-orange-500 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <LogIn size={20} />
                Entrar
              </>
            )}
          </button>
        </form>

        <p className="mt-10 text-[10px] text-sky-500 uppercase tracking-widest leading-relaxed">
          O acesso é restrito a administradores autorizados. <br />
          Todas as ações são monitoradas.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
