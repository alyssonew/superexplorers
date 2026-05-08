import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Destination {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  featured: boolean;
}

const Destinations: React.FC = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDestinations();

    const channel = supabase
      .channel('public:destinations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'destinations' }, () => {
        fetchDestinations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDestinations = async () => {
    try {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      setDestinations(data || []);
    } catch (error) {
      console.error('Erro ao buscar destinos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-stone-50 py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-20">
          <span className="text-orange-500 text-xs font-bold uppercase tracking-[0.4em] mb-4 block">Exploração Global</span>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter uppercase text-zinc-900 mb-6 leading-[0.85]">
            NOSSOS <span className="text-orange-500 font-light italic">DESTINOS</span>
          </h1>
          <div className="h-px w-20 bg-orange-500 mb-10" />
          <p className="text-zinc-600 text-xl font-light max-w-2xl leading-relaxed">
            Curadoria rigorosa de lugares remotos e experiências transformadoras. Escolha seu próximo horizonte.
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-orange-500" size={48} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {destinations.map((dest, i) => (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                key={dest.id}
                className="group relative h-[700px] rounded-[50px] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent z-10" />
                <img
                  src={dest.imageUrl}
                  alt={dest.name}
                  className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 z-20 p-12 flex flex-col justify-end">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    <span className="text-[10px] text-white font-bold uppercase tracking-[0.3em]">{dest.category}</span>
                  </div>
                  <h2 className="text-5xl font-bold text-white uppercase tracking-tighter mb-6 group-hover:text-orange-500 transition-colors">
                    {dest.name}
                  </h2>
                  <p className="text-white/80 text-lg font-light mb-10 max-w-md line-clamp-3 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                    {dest.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <button className="px-8 py-4 border border-white/30 rounded-full text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white hover:text-zinc-900 transition-all">
                      Saiba Mais
                    </button>
                    <div className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center text-orange-500 transform rotate-[-45deg] group-hover:rotate-0 transition-transform duration-500">
                      <ArrowRight />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

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
