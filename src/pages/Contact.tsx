// Página de contato do SuperExplorers.
// Permite que visitantes enviem uma mensagem diretamente para o banco de dados
// via Supabase (tabela 'contacts'). Exibe um formulário com campos de nome,
// e-mail, telefone e mensagem. Após o envio bem-sucedido, substitui o formulário
// por uma tela de confirmação.

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, Mail, Phone, MapPin, Loader2, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLocation } from 'react-router-dom';

const Contact: React.FC = () => {
  // Hook do React Router que dá acesso ao estado passado na navegação.
  // Usado para pré-preencher o campo de mensagem quando o usuário clica em
  // "Saiba Mais" ou "Garantir Vaga" em outras páginas.
  const location = useLocation();

  // Estado do formulário com todos os campos inicializados como strings vazias
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });

  // Controla a exibição do spinner enquanto o envio está em andamento
  const [loading, setLoading] = useState(false);

  // Quando true, oculta o formulário e exibe a tela de confirmação de envio
  const [success, setSuccess] = useState(false);

  // Verifica se há uma mensagem pré-preenchida no estado da navegação.
  // Exemplo: quando o usuário clica em "Saiba Mais" em um destino,
  // a página de destinos passa `{ message: "Olá, gostaria de saber sobre X" }`
  // via navigate('/contato', { state: { message: '...' } }).
  useEffect(() => {
    const prefilledMessage = (location.state as any)?.message;
    if (prefilledMessage) {
      // Mantém os demais campos e substitui apenas a mensagem
      setFormData(prev => ({ ...prev, message: prefilledMessage }));
    }
  }, [location.state]); // Re-executa sempre que o estado de rota mudar

  // Função chamada ao submeter o formulário.
  // Insere os dados na tabela 'contacts' do Supabase e trata sucesso/erro.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Impede o comportamento padrão de recarregar a página
    setLoading(true);

    try {
      // Insere um novo registro na tabela 'contacts' com os dados do formulário
      const { error } = await supabase.from('contacts').insert([formData]);

      if (error) throw error; // Propaga o erro para o bloco catch

      // Envio bem-sucedido: mostra tela de confirmação e reseta o formulário
      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      // Em caso de falha, exibe um alerta e mantém o formulário preenchido
      console.error('Erro ao enviar mensagem:', error);
      alert('Houve um erro ao enviar sua mensagem. Tente novamente.');
    } finally {
      // Sempre desativa o spinner, independentemente do resultado
      setLoading(false);
    }
  };

  return (
    <div className="bg-stone-50 py-32 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20">

        {/* ── COLUNA ESQUERDA: Informações de contato ─────────────────────── */}
        <div>
          {/* Bloco animado que entra pela esquerda ao chegar na viewport */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            {/* Eyebrow — rótulo pequeno acima do título */}
            <span className="text-orange-500 text-xs font-bold uppercase tracking-[0.4em] mb-4 block">Fale Conosco</span>

            {/* Título principal da página */}
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter uppercase text-zinc-900 mb-10 leading-[0.85]">
              VAMOS <span className="text-orange-500 font-light italic">CONVERSAR</span>
            </h1>

            {/* Parágrafo explicativo */}
            <p className="text-zinc-600 text-lg font-light mb-12 max-w-md">
              Tem uma ideia para uma expedição ou quer saber mais sobre nossos serviços personalizados? Nossa equipe está pronta para ajudar.
            </p>

            {/* Lista de canais de contato: e-mail, telefone e localização */}
            <div className="space-y-8">

              {/* Item de contato: E-mail */}
              <div className="flex items-center gap-6 group">
                {/* Ícone com efeito de hover que preenche com laranja */}
                <div className="w-14 h-14 rounded-full border border-zinc-300 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all">
                  <Mail size={24} />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Email</div>
                  <div className="text-zinc-900 font-medium">explore@superexplorers.com</div>
                </div>
              </div>

              {/* Item de contato: Telefone */}
              <div className="flex items-center gap-6 group">
                <div className="w-14 h-14 rounded-full border border-zinc-300 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all">
                  <Phone size={24} />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Telefone</div>
                  <div className="text-zinc-900 font-medium">+55 (11) 99999-9999</div>
                </div>
              </div>

              {/* Item de contato: Localização do escritório */}
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

        {/* ── COLUNA DIREITA: Formulário de contato ───────────────────────── */}
        {/* Card com glassmorphism (fundo translúcido + blur) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-white/80 backdrop-blur-xl border border-zinc-100 shadow-xl p-12 rounded-[40px]"
        >
          {/* ── Estado de sucesso: exibido após envio bem-sucedido ──────── */}
          {success ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              {/* Ícone de confirmação */}
              <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center text-white mb-8">
                <Check size={40} />
              </div>
              <h2 className="text-3xl font-bold uppercase tracking-tight text-zinc-900 mb-4">Mensagem Enviada!</h2>
              <p className="text-zinc-600 mb-10">Obrigado por nos contatar. Retornaremos em breve.</p>
              {/* Botão para enviar outra mensagem — reseta o estado success */}
              <button
                onClick={() => setSuccess(false)}
                className="px-10 py-4 border border-zinc-200 rounded-full text-xs font-bold uppercase tracking-widest text-zinc-900 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all"
              >
                Enviar nova mensagem
              </button>
            </div>
          ) : (
            /* ── Formulário de contato ─────────────────────────────────── */
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Linha com Nome e E-mail lado a lado em telas médias+ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Campo: Nome completo (obrigatório) */}
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

                {/* Campo: E-mail (obrigatório, validação nativa do browser) */}
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

              {/* Campo: Telefone / WhatsApp (opcional) */}
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

              {/* Campo: Mensagem (obrigatório, pode vir pré-preenchida via navigate state) */}
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

              {/* Botão de envio: desabilitado durante o carregamento (evita duplo envio) */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-6 bg-orange-500 text-white rounded-full font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-4 hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50"
              >
                {/* Exibe spinner enquanto o envio está em andamento; ícone de envio caso contrário */}
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
