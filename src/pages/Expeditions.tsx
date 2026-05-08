import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Compass, Calendar, MapPin, Loader2, Bed, Navigation, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
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

// Lightbox Component
const Lightbox: React.FC<{
  images: string[];
  initialIndex: number;
  hotelName: string;
  onClose: () => void;
}> = ({ images, initialIndex, hotelName, onClose }) => {
  const [current, setCurrent] = useState(initialIndex);

  const prev = useCallback(() => setCurrent(i => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setCurrent(i => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, prev, next]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-sky-950/95 backdrop-blur-md p-4"
      onClick={onClose}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 z-10">
        <div>
          <p className="text-orange-500 text-[10px] font-bold uppercase tracking-widest">Fotos do Hotel</p>
          <h3 className="text-white font-bold text-lg">{hotelName}</h3>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sky-300 text-sm font-bold">{current + 1} / {images.length}</span>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Image */}
      <motion.div
        key={current}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="relative max-w-5xl w-full max-h-[75vh] flex items-center justify-center"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={images[current]}
          alt={`${hotelName} - foto ${current + 1}`}
          className="max-w-full max-h-[75vh] object-contain rounded-3xl shadow-2xl"
        />
      </motion.div>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); prev(); }}
            className="absolute left-4 md:left-8 p-3 rounded-full bg-white/10 text-white hover:bg-orange-500 transition-all backdrop-blur-sm"
          >
            <ChevronLeft size={28} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); next(); }}
            className="absolute right-4 md:right-8 p-3 rounded-full bg-white/10 text-white hover:bg-orange-500 transition-all backdrop-blur-sm"
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 px-6" onClick={e => e.stopPropagation()}>
          <div className="flex gap-2 overflow-x-auto max-w-full pb-1">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                  i === current ? 'border-orange-500 opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

const Expeditions: React.FC = () => {
  const [expeditions, setExpeditions] = useState<Expedition[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number; hotelName: string } | null>(null);

  const openLightbox = (images: string[], index: number, hotelName: string) => {
    setLightbox({ images, index, hotelName });
  };

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
                              <button
                                key={i}
                                onClick={() => openLightbox(exp.hotelImages!, i, exp.hotelName!)}
                                className="aspect-square rounded-2xl overflow-hidden relative group/img cursor-zoom-in"
                              >
                                <img
                                  src={img}
                                  alt="Hotel"
                                  className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500"
                                />
                                {/* Overlay on hover */}
                                <div className="absolute inset-0 bg-sky-950/0 group-hover/img:bg-sky-950/40 transition-all flex items-center justify-center">
                                  <ZoomIn size={20} className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity" />
                                </div>
                                {/* +N badge on last visible */}
                                {i === 2 && exp.hotelImages!.length > 3 && (
                                  <div className="absolute inset-0 bg-sky-950/60 flex items-center justify-center text-white font-bold text-lg">
                                    +{exp.hotelImages!.length - 3}
                                  </div>
                                )}
                              </button>
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

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <Lightbox
            images={lightbox.images}
            initialIndex={lightbox.index}
            hotelName={lightbox.hotelName}
            onClose={() => setLightbox(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Expeditions;
