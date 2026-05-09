// Página pública de listagem de destinos do SuperExplorers.
// Busca todos os destinos cadastrados no Supabase (tabela 'destinations'),
// exibe-os em cards de altura fixa com imagem, categoria, nome e botão de ação.
// Usa Realtime do Supabase para atualizar automaticamente a lista quando
// qualquer alteração ocorrer na tabela 'destinations'.

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

// Tipagem do objeto destino retornado pelo Supabase
interface Destination {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  featured: boolean; // Indica se o destino deve aparecer em destaque na Home
}

const Destinations: React.FC = () => {
  // Lista de destinos carregados do banco de dados
  const [destinations, setDestinations] = useState<Destination[]>([]);

  // Controla a exibição do spinner enquanto os dados ainda estão sendo carregados
  const [loading, setLoading] = useState(true);

  // Hook de navegação programática do React Router
  const navigate = useNavigate();

  // Navega para a página de contato passando uma mensagem pré-preenchida
  // com o nome do destino selecionado. O estado é lido no componente Contact.
  const goToContact = (destName: string) => {
    navigate('/contato', { state: { message: `Olá, gostaria de conversar com vocês sobre ${destName}` } });
  };

  // Ao montar o componente: carrega os destinos e ativa o listener Realtime
  useEffect(() => {
    fetchDestinations(); // Carrega os dados iniciais

    // Inscreve-se no canal Realtime da tabela 'destinations'.
    // Qualquer INSERT, UPDATE ou DELETE na tabela dispara um novo fetch
    // para manter a listagem sincronizada sem precisar recarregar a página.
    const channel = supabase
      .channel('public:destinations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'destinations' }, () => {
        fetchDestinations();
      })
      .subscribe();

    // Cleanup: cancela a inscrição Realtime ao desmontar o componente
    // para evitar vazamentos de memória e chamadas desnecessárias
    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Array vazio: executa apenas na montagem inicial

  // Busca todos os destinos ordenados alfabeticamente pelo nome
  const fetchDestinations = async () => {
    try {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .order('name', { ascending: true }); // Ordem A → Z pelo nome

      if (error) throw error; // Propaga o erro para o bloco catch

      // Atualiza o estado com os dados recebidos (ou array vazio como fallback)
      setDestinations(data || []);
    } catch (error) {
      console.error('Erro ao buscar destinos:', error);
    } finally {
      // Desativa o loading independentemente do resultado (sucesso ou erro)
      setLoading(false);
    }
  };

  return (
    <div className="bg-stone-50 py-32 px-6">
      <div className="max-w-7xl mx-auto">

        {/* ── CABEÇALHO DA PÁGINA ───────────────────────────────────────────── */}
        <header className="mb-20">
          {/* Eyebrow — rótulo pequeno de identificação da seção */}
          <span className="text-orange-500 text-xs font-bold uppercase tracking-[0.4em] mb-4 block">Exploração Global</span>

          {/* Título principal (h1 único na página para SEO) */}
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter uppercase text-zinc-900 mb-6 leading-[0.85]">
            NOSSOS <span className="text-orange-500 font-light italic">DESTINOS</span>
          </h1>

          {/* Separador visual laranja */}
          <div className="h-px w-20 bg-orange-500 mb-10" />

          {/* Subtítulo descritivo */}
          <p className="text-zinc-600 text-xl font-light max-w-2xl leading-relaxed">
            Curadoria rigorosa de lugares remotos e experiências transformadoras. Escolha seu próximo horizonte.
          </p>
        </header>

        {/* ── ESTADO DE CARREGAMENTO ────────────────────────────────────────── */}
        {/* Exibido enquanto a requisição ao Supabase ainda não foi concluída */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-orange-500" size={48} />
          </div>
        ) : (
          /* ── GRADE DE CARDS DOS DESTINOS ──────────────────────────────── */
          /* Cada card ocupa toda a largura em mobile e metade em telas médias+ */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {destinations.map((dest, i) => (
              // Card de destino com animação de scroll reveal (entra de baixo)
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} // Animação dispara apenas uma vez
                transition={{ delay: i * 0.1 }} // Delay escalonado para efeito cascata
                key={dest.id}
                className="group relative h-[700px] rounded-[50px] overflow-hidden"
              >
                {/* Gradiente sobre a imagem para garantir contraste do texto */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent z-10" />

                {/* Imagem do destino com efeito de zoom lento no hover (2 segundos) */}
                <img
                  src={dest.imageUrl}
                  alt={dest.name}
                  className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />

                {/* Conteúdo de texto e botões posicionado sobre a imagem */}
                <div className="absolute inset-0 z-20 p-12 flex flex-col justify-end">

                  {/* Indicador de categoria com bolinha laranja */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    <span className="text-[10px] text-white font-bold uppercase tracking-[0.3em]">{dest.category}</span>
                  </div>

                  {/* Nome do destino: muda para laranja no hover do card */}
                  <h2 className="text-5xl font-bold text-white uppercase tracking-tighter mb-6 group-hover:text-orange-500 transition-colors">
                    {dest.name}
                  </h2>

                  {/* Descrição: aparece com animação de slide-up ao fazer hover no card */}
                  <p className="text-white/80 text-lg font-light mb-10 max-w-md line-clamp-3 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                    {dest.description}
                  </p>

                  {/* Área de botões: "Saiba Mais" e ícone de seta diagonal */}
                  <div className="flex items-center justify-between">
                    {/* Botão primário: navega para contato com mensagem pré-preenchida */}
                    <button
                      onClick={() => goToContact(dest.name)}
                      className="px-8 py-4 border border-white/30 rounded-full text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white hover:text-zinc-900 transition-all"
                    >
                      Saiba Mais
                    </button>

                    {/* Botão ícone: seta que gira de diagonal para reto no hover */}
                    <button
                      onClick={() => goToContact(dest.name)}
                      className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center text-orange-500 transform rotate-[-45deg] group-hover:rotate-0 transition-transform duration-500"
                    >
                      <ArrowRight />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── ESTADO VAZIO ──────────────────────────────────────────────────── */}
        {/* Exibido quando a busca concluiu mas não há destinos cadastrados */}
        {destinations.length === 0 && !loading && (
          <div className="text-center py-20 border border-zinc-200 rounded-[50px]">
            <p className="text-zinc-500 uppercase tracking-widest text-sm font-bold">Nenhum destino encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Destinations;
