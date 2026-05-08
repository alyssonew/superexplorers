import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, Mail, Phone, MapPin, Loader2, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLocation } from 'react-router-dom';

const Contact: React.FC = () => {
  const location = useLocation();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const prefilledMessage = (location.state as any)?.message;
    if (prefilledMessage) {
      setFormData(prev => ({ ...prev, message: prefilledMessage }));
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('contacts').insert([formData]);
      if (error) throw error;
      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Houve um erro ao enviar sua mensagem. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-stone-50 py-32 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-orange-500 text-xs font-bold uppercase tracking-[0.4em] mb-4 block">Fale Conosco</span>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter uppercase text-zinc-900 mb-10 leading-[0.85]">
              VAMOS <span className="text-orange-500 font-light italic">CONVERSAR</span>
            </h1>
            <p className="text-zinc-600 text-lg font-light mb-12 max-w-md">
              Tem uma ideia para uma expedição ou quer saber mais sobre nossos serviços personalizados? Nossa equipe está pronta para ajudar.
            </p>

            <div className="space-y-8">
              <div className="flex items-center gap-6 group">
                <div className="w-14 h-14 rounded-full border border-zinc-300 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all">
                  <Mail size={24} />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Email</div>
                  <div className="text-zinc-900 font-medium">explore@superexplorers.com</div>
                </div>
              </div>
              <div className="flex items-center gap-6 group">
                <div className="w-14 h-14 rounded-full border border-zinc-300 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all">
                  <Phone size={24} />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Telefone</div>
                  <div className="text-zinc-900 font-medium">+55 (11) 99999-9999</div>
                </div>
              </div>
              <div className="flex items-center gap-6 group">
                <div className="w-14 h-14 rounded-full border border-zinc-300 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all">
                  <MapPin size={24} />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Escritório</div>
                  <div className="text-zinc-900 font-medium">São Paulo, Brasil</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-white/80 backdrop-blur-xl border border-zinc-100 shadow-xl p-12 rounded-[40px]"
        >
          {success ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center text-white mb-8">
                <Check size={40} />
              </div>
              <h2 className="text-3xl font-bold uppercase tracking-tight text-zinc-900 mb-4">Mensagem Enviada!</h2>
              <p className="text-zinc-600 mb-10">Obrigado por nos contatar. Retornaremos em breve.</p>
              <button
                onClick={() => setSuccess(false)}
                className="px-10 py-4 border border-zinc-200 rounded-full text-xs font-bold uppercase tracking-widest text-zinc-900 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all"
              >
                Enviar nova mensagem
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Seu Nome</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-white border border-zinc-200 rounded-2xl p-5 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all font-light"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Seu Email</label>
                  <input
                    required
                    type="email"
                    className="w-full bg-white border border-zinc-200 rounded-2xl p-5 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all font-light"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Telefone / WhatsApp</label>
                <input
                  type="text"
                  className="w-full bg-white border border-zinc-200 rounded-2xl p-5 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all font-light"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+55"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Sua Mensagem</label>
                <textarea
                  required
                  rows={4}
                  className="w-full bg-white border border-zinc-200 rounded-2xl p-5 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all font-light"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Conte-nos sobre sua próxima aventura..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-6 bg-orange-500 text-white rounded-full font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-4 hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Enviar Solicitação</>}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;
