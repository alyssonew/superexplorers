import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Compass, Calendar, MapPin, Loader2, ArrowRight, Bed, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

interface Expedition {
  id: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  imageUrl: string;
  hotelName?: string;
  hotelImages?: string[];
  totalNights?: number;
}

const Expeditions: React.FC = () => {
  const [expeditions, setExpeditions] = useState<Expedition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpeditions = async () => {
      try {
        const { data, error } = await supabase
          .from('expeditions')
          .select('*')
          .order('startDate', { ascending: true });
        
        if (error) throw error;
        setExpeditions(data || []);
      } catch (error) {
        console.error('Erro ao buscar expedições', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpeditions();

    const channel = supabase.channel('public:expeditions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expeditions' }, () => {
        fetchExpeditions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-24 bg-sky-50 min-h-screen">
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <Compass className="w-16 h-16 text-orange-500 mx-auto mb-6" />
          <h1 className="text-4xl md:text-6xl font-light text-sky-950 tracking-tight mb-6">
            Expedições <span className="font-bold">Especiais</span>
          </h1>
          <p className="text-lg text-sky-600">
            Jornadas completas com datas pré-definidas, grupos exclusivos e experiências de hospedagem premium selecionadas a dedo.
          </p>
        </motion.div>

        <div className="space-y-16">
          <AnimatePresence>
            {expeditions.map((exp, index) => (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                key={exp.id}
                className="bg-white rounded-[40px] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-sky-100 flex flex-col lg:flex-row group"
              >
                <div className="lg:w-1/2 relative min-h-[400px] overflow-hidden">
                  <img src={exp.imageUrl} alt={exp.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-sky-950/80 via-sky-950/20 to-transparent" />
                  
                  <div className="absolute bottom-8 left-8 right-8">
                    <div className="flex gap-4 mb-4">
                      <span className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-2xl text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <MapPin size={14} /> {exp.location}
                      </span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{exp.title}</h2>
                  </div>
                </div>

                <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 text-sky-500 mb-6 bg-sky-50 inline-flex px-4 py-2 rounded-2xl">
                      <Calendar size={18} />
                      <span className="font-bold uppercase tracking-widest text-xs">
                        {exp.startDate} — {exp.endDate}
                      </span>
                    </div>

                    <p className="text-sky-600 leading-relaxed mb-8">
                      {exp.description}
                    </p>

                    {exp.hotelName && (
                      <div className="mb-8 p-6 bg-sky-50/50 rounded-[32px] border border-sky-100">
                        <div className="flex items-center gap-3 mb-4 text-sky-950">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
                            <Bed size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm uppercase tracking-widest">{exp.hotelName}</h4>
                            <p className="text-xs text-sky-500 uppercase tracking-widest">{exp.totalNights} Diárias Inclusas</p>
                          </div>
                        </div>
                        
                        {exp.hotelImages && exp.hotelImages.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mt-4">
                            {exp.hotelImages.slice(0, 3).map((img, i) => (
                              <div key={i} className="aspect-square rounded-2xl overflow-hidden relative group/img">
                                <img src={img} alt="Hotel" className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500" />
                                {i === 2 && exp.hotelImages!.length > 3 && (
                                  <div className="absolute inset-0 bg-sky-950/60 flex items-center justify-center text-white font-bold">
                                    +{exp.hotelImages!.length - 3}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Link 
                    to="/contato"
                    className="mt-8 w-full py-5 bg-sky-950 text-white rounded-[24px] font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-4 hover:bg-orange-500 transition-all group/btn"
                  >
                    Garantir Vaga 
                    <Navigation size={18} className="group-hover/btn:translate-x-2 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {expeditions.length === 0 && (
            <div className="text-center py-20 text-sky-500">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Não há expedições agendadas no momento.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Expeditions;
