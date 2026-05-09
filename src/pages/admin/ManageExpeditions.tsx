import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Edit2, Trash2, X, Check, Loader2, Calendar, MapPin, Upload, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Expedition {
  id: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  imageUrl: string;
  hotelName: string;
  hotelImages: string[];
  totalNights: number;
}

const ManageExpeditions: React.FC = () => {
  const [expeditions, setExpeditions] = useState<Expedition[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Formata data ISO (2026-10-12) → "12 Out 2026"
  const formatDateToPtBR = (isoDate: string): string => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return `${day} ${months[parseInt(month, 10) - 1]} ${year}`;
  };

  // Converte "12 Out 2026" → "2026-10-12" para popular o input type="date"
  const parsePtBRToISO = (ptDate: string): string => {
    const months: Record<string, string> = {
      'Jan':'01','Fev':'02','Mar':'03','Abr':'04','Mai':'05','Jun':'06',
      'Jul':'07','Ago':'08','Set':'09','Out':'10','Nov':'11','Dez':'12'
    };
    const parts = ptDate.split(' ');
    if (parts.length === 3 && months[parts[1]]) {
      return `${parts[2]}-${months[parts[1]]}-${parts[0].padStart(2,'0')}`;
    }
    return '';
  };
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<Expedition | null>(null);
  const [saving, setSaving] = useState(false);

  // Hotel Images State
  const [hotelFiles, setHotelFiles] = useState<File[]>([]);
  const [hotelPreviews, setHotelPreviews] = useState<string[]>([]);
  const [existingHotelImages, setExistingHotelImages] = useState<string[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    startDate: '',
    endDate: '',
    description: '',
    imageUrl: '',
    hotelName: '',
    totalNights: 0
  });

  useEffect(() => {
    fetchExpeditions();
    fetchDestinations();

    const channel = supabase
      .channel('public:expeditions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expeditions' }, () => {
        fetchExpeditions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDestinations = async () => {
    try {
      const { data } = await supabase.from('destinations').select('*').order('name');
      if (data) setDestinations(data);
    } catch (error) {
      console.error('Erro ao carregar destinos:', error);
    }
  };

  const fetchExpeditions = async () => {
    try {
      const { data, error } = await supabase
        .from('expeditions')
        .select('*')
        .order('startDate', { ascending: true });
      
      if (error) throw error;
      setExpeditions(data || []);
    } catch (error) {
      console.error('Erro ao carregar expedições:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', location: '', startDate: '', endDate: '', description: '', imageUrl: '', hotelName: '', totalNights: 0 });
    setEditingExp(null);
    setHotelFiles([]);
    setHotelPreviews([]);
    setExistingHotelImages([]);
  };

  const handleOpenModal = (exp?: Expedition) => {
    if (exp) {
      setEditingExp(exp);
      setFormData({
        title: exp.title,
        location: exp.location,
        startDate: parsePtBRToISO(exp.startDate),
        endDate: parsePtBRToISO(exp.endDate),
        description: exp.description,
        imageUrl: exp.imageUrl,
        hotelName: exp.hotelName || '',
        totalNights: exp.totalNights || 0
      });
      setExistingHotelImages(exp.hotelImages || []);
      setHotelFiles([]);
      setHotelPreviews([]);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleHotelImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setHotelFiles(prev => [...prev, ...filesArray]);
      
      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setHotelPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeHotelPreview = (index: number) => {
    setHotelFiles(prev => prev.filter((_, i) => i !== index));
    setHotelPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingHotelImage = (index: number) => {
    setExistingHotelImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação: data final não pode ser anterior à data de início
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      alert('A data de término não pode ser anterior à data de início.');
      return;
    }

    setSaving(true);
    
    try {
      // 1. Get image from selected destination
      const selectedDest = destinations.find(d => d.name === formData.location);
      const destinationImageUrl = selectedDest ? selectedDest.imageUrl : formData.imageUrl;

      // 2. Upload Hotel Images
      const uploadedHotelImages = [];
      for (const file of hotelFiles) {
        const url = await uploadFile(file, 'hotels');
        uploadedHotelImages.push(url);
      }

      // Combine existing and new hotel images
      const finalHotelImages = [...existingHotelImages, ...uploadedHotelImages];

      const finalData = { 
        ...formData,
        startDate: formatDateToPtBR(formData.startDate),
        endDate: formatDateToPtBR(formData.endDate),
        imageUrl: destinationImageUrl,
        hotelImages: finalHotelImages 
      };

      if (editingExp) {
        const { error } = await supabase.from('expeditions').update(finalData).eq('id', editingExp.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('expeditions').insert([finalData]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar expedição:', error);
      alert('Erro ao salvar expedição. Verifique se o Supabase Storage está configurado.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta expedição?')) return;
    try {
      const { error } = await supabase.from('expeditions').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao excluir expedição:', error);
    }
  };

  const filteredExpeditions = expeditions.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-sky-950 tracking-tight">Gerenciar Expedições</h1>
          <p className="text-sky-600">Crie viagens com datas marcadas e detalhes de hospedagem.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto px-6 py-3 bg-orange-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Nova Expedição
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar expedições por título ou destino..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-sky-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sky-950 placeholder-sky-300 shadow-sm"
        />
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-orange-500" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence>
            {filteredExpeditions.map((exp) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={exp.id}
                className="bg-white rounded-[32px] overflow-hidden border border-sky-100 shadow-sm hover:shadow-xl transition-all group flex flex-col md:flex-row"
              >
                <div className="md:w-2/5 h-48 md:h-auto relative overflow-hidden shrink-0">
                  <div className="absolute inset-0 bg-sky-900/20 group-hover:bg-transparent transition-all z-10" />
                  <img src={exp.imageUrl || 'https://via.placeholder.com/400x300?text=Sem+Foto'} alt={exp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute top-4 left-4 z-20">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-sky-950 text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1">
                      <MapPin size={12} /> {exp.location}
                    </span>
                  </div>
                </div>
                <div className="p-6 md:w-3/5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-sky-950 mb-2">{exp.title}</h3>
                    <div className="flex items-center gap-2 text-sky-500 text-sm mb-4">
                      <Calendar size={16} />
                      <span>{exp.startDate} - {exp.endDate}</span>
                    </div>
                    {exp.hotelName && (
                      <div className="inline-block px-2 py-1 bg-sky-50 text-sky-600 text-xs rounded-lg mb-4">
                        🏨 {exp.hotelName} • {exp.totalNights} diárias
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4">
                    <button 
                      onClick={() => handleOpenModal(exp)}
                      className="flex-1 py-3 bg-sky-50 text-sky-950 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-sky-100 transition-all flex items-center justify-center gap-2"
                    >
                      <Edit2 size={14} /> Editar
                    </button>
                    <button 
                      onClick={() => handleDelete(exp.id)}
                      className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredExpeditions.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[32px] border border-sky-100 border-dashed">
          <Calendar className="mx-auto text-sky-200 mb-4" size={48} />
          <h3 className="text-xl font-bold text-sky-950 mb-2">Nenhuma expedição encontrada</h3>
          <p className="text-sky-500">Crie sua primeira expedição ou tente buscar por outro termo.</p>
        </div>
      )}

      {/* Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-sky-950/40 backdrop-blur-sm"
              onClick={() => !saving && setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative w-full max-w-3xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
            >
              <div className="p-8 border-b border-sky-50 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-2xl font-bold text-sky-950">{editingExp ? 'Editar Expedição' : 'Nova Expedição'}</h2>
                  <p className="text-sky-500 text-sm">Preencha as informações gerais e do hotel.</p>
                </div>
                <button onClick={() => !saving && setIsModalOpen(false)} className="p-2 text-sky-300 hover:text-sky-950 hover:bg-sky-50 rounded-full transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar">
                <form id="exp-form" onSubmit={handleSave} className="space-y-8">
                  
                  {/* SEÇÃO: INFORMAÇÕES BÁSICAS */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-sky-950 border-b border-sky-50 pb-2">1. Dados da Expedição</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-2">Título</label>
                        <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-4 bg-sky-50/50 border border-sky-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sky-950" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-2">Localização (Destino)</label>
                        <select required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full p-4 bg-sky-50/50 border border-sky-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sky-950 appearance-none">
                          <option value="" disabled>Selecione um destino...</option>
                          {destinations.map(dest => (
                            <option key={dest.id} value={dest.name}>{dest.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-2">Data de Início</label>
                        <input
                          type="date"
                          required
                          value={formData.startDate}
                          onChange={e => setFormData({...formData, startDate: e.target.value})}
                          className="w-full p-4 bg-sky-50/50 border border-sky-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sky-950"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-2">Data de Término</label>
                        <input
                          type="date"
                          required
                          value={formData.endDate}
                          min={formData.startDate || undefined}
                          onChange={e => setFormData({...formData, endDate: e.target.value})}
                          className="w-full p-4 bg-sky-50/50 border border-sky-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sky-950"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-2">Descrição</label>
                      <textarea required rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 bg-sky-50/50 border border-sky-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sky-950 resize-none" />
                    </div>
                  </div>

                  {/* SEÇÃO: HOTEL */}
                  <div className="space-y-6 pt-4">
                    <h3 className="text-sm font-bold text-sky-950 border-b border-sky-50 pb-2">2. Detalhes de Hospedagem</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-1">
                        <label className="block text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-2">Nome do Hotel</label>
                        <input type="text" value={formData.hotelName} onChange={e => setFormData({...formData, hotelName: e.target.value})} className="w-full p-4 bg-sky-50/50 border border-sky-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sky-950" />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-2">Total de Diárias</label>
                        <input type="number" min="0" value={formData.totalNights} onChange={e => setFormData({...formData, totalNights: parseInt(e.target.value) || 0})} className="w-full p-4 bg-sky-50/50 border border-sky-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sky-950" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-2">Fotos do Hotel (Múltiplas)</label>
                      <div className="relative mb-4">
                        <input type="file" multiple accept="image/*" onChange={handleHotelImagesSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className="w-full py-6 bg-sky-50/50 border-2 border-sky-100 border-dashed rounded-2xl flex flex-col items-center justify-center text-sky-500 hover:bg-sky-100 transition-all">
                          <Upload size={24} className="mb-2" />
                          <span className="text-sm font-medium">Clique para selecionar várias fotos</span>
                        </div>
                      </div>

                      {/* Preview Gallery */}
                      {(existingHotelImages.length > 0 || hotelPreviews.length > 0) && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                          {existingHotelImages.map((img, i) => (
                            <div key={`ext-${i}`} className="relative aspect-square rounded-xl overflow-hidden border border-sky-100 group">
                              <img src={img} alt="Hotel" className="w-full h-full object-cover" />
                              <button type="button" onClick={() => removeExistingHotelImage(i)} className="absolute inset-0 bg-red-500/80 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={20} />
                              </button>
                            </div>
                          ))}
                          {hotelPreviews.map((img, i) => (
                            <div key={`new-${i}`} className="relative aspect-square rounded-xl overflow-hidden border border-sky-100 group">
                              <img src={img} alt="Nova" className="w-full h-full object-cover" />
                              <div className="absolute top-1 right-1 bg-orange-500 text-white text-[8px] px-1 rounded">Novo</div>
                              <button type="button" onClick={() => removeHotelPreview(i)} className="absolute inset-0 bg-red-500/80 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={20} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </form>
              </div>

              <div className="p-8 border-t border-sky-50 bg-gray-50/50 flex gap-4 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={saving} className="flex-1 py-4 bg-white border border-sky-100 text-sky-950 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-sky-50 transition-all disabled:opacity-50">
                  Cancelar
                </button>
                <button type="submit" form="exp-form" disabled={saving || !formData.location} className="flex-[2] py-4 bg-orange-500 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="animate-spin" size={16} /> : (editingExp ? 'Salvar Alterações' : 'Criar Expedição')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageExpeditions;
