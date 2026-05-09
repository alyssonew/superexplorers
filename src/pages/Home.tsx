// Página inicial (Home) do SuperExplorers.
// Exibe: hero animado, destinos em destaque buscados do Supabase,
// barra de estatísticas e seção de call-to-action.

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, MapPin, Calendar, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Home: React.FC = () => {
  // Estado que armazenará os destinos em destaque buscados do banco de dados
  const [featuredDestinations, setFeaturedDestinations] = useState<any[]>([]);

  // Ao montar o componente, busca os 3 destinos mais recentes no Supabase
  useEffect(() => {
    const fetchDestinations = async () => {
      // Consulta a tabela 'destinations', ordenando do mais novo para o mais antigo,
      // limitando a 3 resultados para exibir na seção de destaques
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      // Só atualiza o estado se não houver erro e se dados foram retornados
      if (!error && data) {
        setFeaturedDestinations(data);
      }
    };

    fetchDestinations();
  }, []); // Array vazio: executa apenas na montagem inicial do componente

  return (
    <div className="bg-stone-50">

      {/* ── SEÇÃO HERO ──────────────────────────────────────────────────────── */}
      {/* Ocupa 100% da altura da tela com imagem de fundo animada e texto principal */}
      <section className="relative min-h-screen flex items-center overflow-hidden">

        {/* Camada de fundo: imagem hero com sobreposição de gradiente e blur leve */}
        <div className="absolute inset-0 z-0">
          {/* Overlay semitransparente que suaviza a imagem de fundo */}
          <div className="absolute inset-0 bg-stone-50/40 backdrop-blur-[2px] z-10" />
          {/* Gradiente de cima para baixo que faz a imagem fundir com o fundo da página */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-50 via-transparent to-stone-50/30 z-10" />
          {/* Imagem hero com animação de zoom-out na entrada da página */}
          <motion.img
            initial={{ scale: 1.15, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 3, ease: "easeOut" }}
            src="/hero-bg.png"
            alt="Hero Expedition"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Conteúdo principal do hero: título, subtítulo e botões de CTA */}
        <div className="relative z-20 max-w-7xl mx-auto px-6 w-full pb-24">
          {/* Animação de entrada do bloco de texto (sobe de baixo e aparece) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Eyebrow — rótulo pequeno acima do título */}
            <span className="text-orange-500 text-xs font-bold uppercase tracking-[0.4em] mb-4 block">
              Travel Experiences
            </span>

            {/* Título principal da página */}
            <h1 className="text-6xl md:text-9xl font-bold tracking-tighter leading-[0.85] mb-8 uppercase text-zinc-900">
              JORNADAS <br />
              <span className="font-light italic text-zinc-800">SOB MEDIDA</span>
            </h1>

            {/* Parágrafo de subtítulo com barra laranja à esquerda */}
            <div className="border-l-4 border-orange-500 pl-8 mb-12">
              <p className="text-zinc-700 max-w-2xl text-xl md:text-2xl font-medium leading-relaxed">
                Não vendemos pacotes pré-fabricados. Desenhamos viagens exclusivas e experiências totalmente personalizadas para exploradores exigentes.
              </p>
            </div>

            {/* Botões de ação: primário (contato) e secundário (ver destinos) */}
            <div className="flex flex-col md:flex-row gap-6">
              {/* Botão primário: leva à página de contato */}
              <Link
                to="/contato"
                className="group px-10 py-5 bg-orange-500 text-white rounded-full text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-4 transition-all hover:bg-orange-600 active:scale-95 shadow-xl shadow-orange-500/20"
              >
                Consultoria Especializada
                {/* Ícone que desloca levemente para a direita no hover */}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Botão secundário: leva à lista de destinos */}
              <Link
                to="/destinos"
                className="px-10 py-5 border border-zinc-300 rounded-full text-sm font-bold uppercase tracking-widest flex items-center justify-center hover:bg-zinc-100 transition-all text-zinc-900"
              >
                Ver Destinos
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Indicador de scroll animado (bola que sobe e desce infinitamente) */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Scroll</span>
          {/* Linha vertical com gradiente laranja → transparente */}
          <div className="w-px h-12 bg-gradient-to-b from-orange-500 to-transparent" />
        </motion.div>
      </section>

      {/* ── SEÇÃO: DESTINOS EM DESTAQUE ─────────────────────────────────────── */}
      {/* Exibe os 3 destinos mais recentes buscados do Supabase em grade de cards */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">

          {/* Cabeçalho da seção com título e link "Ver todos" */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div>
              <span className="text-orange-500 text-[10px] font-bold uppercase tracking-widest mb-4 block">Próximas Fronteiras</span>
              <h2 className="text-4xl md:text-6xl font-light tracking-tighter text-zinc-900 uppercase italic">
                Destinos <span className="font-bold underline decoration-orange-500">Inspiradores</span>
              </h2>
            </div>
            {/* Link para a página completa de destinos */}
            <Link to="/destinos" className="text-sm font-bold uppercase tracking-widest text-zinc-500 hover:text-orange-500 transition-colors flex items-center gap-2">
              Ver todos <ArrowRight size={16} />
            </Link>
          </div>

          {/* Grade de cards dos destinos em destaque */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {featuredDestinations.map((dest, i) => (
              // Cada card anima a entrada quando entra na viewport (scroll reveal)
              <motion.div
                key={dest.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} // Executa a animação apenas uma vez
                transition={{ duration: 0.6, delay: i * 0.1 }} // Delay escalonado por índice
                className="group relative h-[600px] rounded-[40px] overflow-hidden cursor-pointer"
              >
                {/* Gradiente sobre a imagem para garantir legibilidade do texto */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-zinc-900/20 to-transparent z-10" />

                {/* Imagem do destino com efeito de zoom no hover */}
                <img
                  src={dest.imageUrl || 'https://via.placeholder.com/800x1000?text=Sem+Foto'}
                  alt={dest.name}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />

                {/* Texto sobreposto no rodapé do card: categoria e nome do destino */}
                <div className="absolute bottom-10 left-10 z-20">
                  <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mb-2 block">{dest.category}</span>
                  <h3 className="text-3xl font-bold text-white uppercase tracking-tighter">{dest.name}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEÇÃO: ESTATÍSTICAS / POR QUE NÓS ──────────────────────────────── */}
      {/* Barra com 4 números de credibilidade da empresa */}
      <section className="bg-white py-32 border-y border-zinc-100">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 text-center md:text-left">
          {/* Estatística 1: anos de experiência */}
          <div>
            <div className="text-5xl font-bold text-orange-500 mb-2">15+</div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Anos de Curadoria</div>
          </div>
          {/* Estatística 2: personalização total */}
          <div>
            <div className="text-5xl font-bold text-orange-500 mb-2">100%</div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Jornadas Personalizadas</div>
          </div>
          {/* Estatística 3: abrangência global */}
          <div>
            <div className="text-5xl font-bold text-orange-500 mb-2">40+</div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Países Catalogados</div>
          </div>
          {/* Estatística 4: suporte contínuo */}
          <div>
            <div className="text-5xl font-bold text-orange-500 mb-2">24/7</div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Suporte Especializado</div>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO: CALL TO ACTION FINAL ─────────────────────────────────────── */}
      {/* Bloco central que convida o visitante a entrar em contato */}
      <section className="py-40 relative overflow-hidden">
        {/* Fundo levemente colorido para diferenciar visualmente a seção */}
        <div className="absolute inset-0 bg-stone-100 z-0 opacity-50" />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          {/* Animação de escala ao entrar na viewport */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
          >
            {/* Ícone decorativo de bússola */}
            <Compass size={80} className="mx-auto text-orange-500 mb-10" />

            {/* Título de chamada para ação */}
            <h2 className="text-5xl md:text-7xl font-bold text-zinc-900 uppercase tracking-tighter mb-10">
              PRONTO PARA A SUA <br /> PRÓXIMA JORNADA?
            </h2>

            {/* Botão que leva à página de contato */}
            <Link
              to="/contato"
              className="inline-flex px-12 py-6 bg-zinc-900 text-white rounded-full text-sm font-bold uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all active:scale-95 shadow-xl shadow-zinc-900/10"
            >
              Fale com um Especialista
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
