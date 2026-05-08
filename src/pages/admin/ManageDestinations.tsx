import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Edit2, Trash2, X, Image as ImageIcon, Check, Loader2, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Destination {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  featured: boolean;
}

interface Category {
  id: string;
  name: string;
}

const ManageDestinations: React.FC = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  const [editingDest, setEditingDest] = useState<Destination | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Category State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    imageUrl: '',
    featured: false
  });

  useEffect(() => {
    fetchDestinations();
    fetchCategories();

    const channelDest = supabase
      .channel('public:destinations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'destinations' }, () => fetchDestinations())
      .subscribe();

    const channelCat = supabase
      .channel('public:categories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => fetchCategories())
      .subscribe();

    return () => {
      supabase.removeChannel(channelDest);
      supabase.removeChannel(channelCat);
    };
  }, []);

  const fetchDestinations = async () => {
    try {
      const { data, error } = await supabase.from('destinations').select('*').order('name', { ascending: true });
      if (error) throw error;
      setDestinations(data || []);
    } catch (error) {
      console.error('Erro ao carregar destinos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('name', { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', category: categories[0]?.name || '', imageUrl: '', featured: false });
    setEditingDest(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleOpenModal = (dest?: Destination) => {
    if (dest) {
      setEditingDest(dest);
      setFormData({
        name: dest.name,
        description: dest.description,
        category: dest.category,
        imageUrl: dest.imageUrl,
        featured: dest.featured
      });
      setImagePreview(dest.imageUrl);
      setImageFile(null);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImageToSupabase = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `destinations/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      let finalImageUrl = formData.imageUrl;

      if (imageFile) {
        setUploadingImage(true);
        finalImageUrl = await uploadImageToSupabase(imageFile);
        setUploadingImage(false);
      }

      const finalData = { ...formData, imageUrl: finalImageUrl };

      if (editingDest) {
        const { error } = await supabase.from('destinations').update(finalData).eq('id', editingDest.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('destinations').insert([finalData]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar destino:', error);
      alert('Erro ao salvar. Verifique se configurou o Storage no Supabase.');
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este destino?')) return;
    try {
      const { error } = await supabase.from('destinations').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao excluir destino:', error);
    }
  };

  // Funções de Categoria
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setSavingCategory(true);
    try {
      const { error } = await supabase.from('categories').insert([{ name: newCategoryName.trim() }]);
      if (error) throw error;
      setNewCategoryName('');
    } catch (error) {
      console.error('Erro ao adicionar categoria', error);
      alert('Erro ao adicionar categoria. O nome pode já existir.');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if(!window.confirm('Excluir esta categoria? Destinos existentes não serão apagados, mas ficarão sem categoria.')) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao excluir categoria', error);
    }
  };

  const filteredDestinations = destinations.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-sky-950 tracking-tight">Gerenciar Destinos</h1>
          <p className="text-sky-600">Adicione, edite ou remova destinos disponíveis para os clientes.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex-1 sm:flex-none px-6 py-3 bg-sky-100 text-sky-900 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-sky-200 transition-all active:scale-95 text-center"
          >
            Categorias
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex-1 sm:flex-none px-6 py-3 bg-orange-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Novo
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar destinos por nome ou categoria..." 
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredDestinations.map((dest) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={dest.id}
                className="bg-white rounded-[32px] overflow-hidden border border-sky-100 shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="h-48 relative overflow-hidden">
                  <div className="absolute inset-0 bg-sky-900/20 group-hover:bg-transparent transition-all z-10" />
                  <img src={dest.imageUrl || 'https://via.placeholder.com/400x300?text=Sem+Foto'} alt={dest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute top-4 left-4 z-20 flex gap-2">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-sky-950 text-[10px] font-bold uppercase tracking-widest rounded-full">
                      {dest.category}
                    </span>
                    {dest.featured && (
                      <span className="px-3 py-1 bg-orange-500/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                        Destaque
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-sky-950 mb-2">{dest.name}</h3>
                  <p className="text-sky-600 text-sm line-clamp-2 mb-6">{dest.description}</p>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenModal(dest)}
                      className="flex-1 py-3 bg-sky-50 text-sky-950 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-sky-100 transition-all flex items-center justify-center gap-2"
                    >
                      <Edit2 size={14} /> Editar
                    </button>
                    <button 
                      onClick={() => handleDelete(dest.id)}
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
      {!loading && filteredDestinations.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[32px] border border-sky-100 border-dashed">
          <ImageIcon className="mx-auto text-sky-200 mb-4" size={48} />
          <h3 className="text-xl font-bold text-sky-950 mb-2">Nenhum destino encontrado</h3>
          <p className="text-sky-500">Adicione novos destinos ou tente buscar por outro termo.</p>
        </div>
      )}

      {/* Destination Modal */}
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
              className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-sky-50 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-2xl font-bold text-sky-950">{editingDest ? 'Editar Destino' : 'Novo Destino'}</h2>
                  <p className="text-sky-500 text-sm">Preencha as informações abaixo.</p>
                </div>
                <button onClick={() => !saving && setIsModalOpen(false)} className="p-2 text-sky-300 hover:text-sky-950 hover:bg-sky-50 rounded-full transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar">
                <form id="dest-form" onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-2">Nome</label>
                      <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-sky-50/50 border border-sky-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sky-950" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-2">Categoria</label>
                      <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-4 bg-sky-50/50 border border-sky-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sky-950 appearance-none">
                        <option value="" disabled>Selecione...</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-2">Descrição</label>
                    <textarea required rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 bg-sky-50/50 border border-sky-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sky-950 resize-none" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-2">Upload de Imagem</label>
                    <div className="flex items-center gap-4">
                      {imagePreview ? (
                        <div className="relative w-32 h-24 rounded-xl overflow-hidden border border-sky-100 shrink-0">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-32 h-24 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                          <ImageIcon className="text-sky-300" />
                        </div>
                      )}
                      
                      <div className="flex-1 relative">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="w-full p-4 bg-white border border-sky-200 border-dashed rounded-2xl flex items-center justify-center gap-2 text-sky-600 hover:bg-sky-50 transition-all">
                          <Upload size={18} />
                          <span className="text-sm font-medium">Clique para escolher uma foto</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center gap-3 p-4 bg-sky-50/30 rounded-2xl border border-sky-50 cursor-pointer hover:bg-sky-50 transition-all">
                    <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${formData.featured ? 'bg-orange-500 border-orange-500 text-white' : 'border-sky-200 bg-white'}`}>
                      {formData.featured && <Check size={14} />}
                    </div>
                    <input type="checkbox" className="hidden" checked={formData.featured} onChange={e => setFormData({...formData, featured: e.target.checked})} />
                    <span className="text-sm font-bold text-sky-950 uppercase tracking-widest">Destacar este destino na página inicial</span>
                  </label>
                </form>
              </div>

              <div className="p-8 border-t border-sky-50 bg-gray-50/50 flex gap-4 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={saving} className="flex-1 py-4 bg-white border border-sky-100 text-sky-950 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-sky-50 transition-all disabled:opacity-50">
                  Cancelar
                </button>
                <button type="submit" form="dest-form" disabled={saving || (!imageFile && !formData.imageUrl)} className="flex-[2] py-4 bg-orange-500 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="animate-spin" size={16} /> : (uploadingImage ? 'Enviando Imagem...' : (editingDest ? 'Salvar Alterações' : 'Criar Destino'))}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-sky-950/40 backdrop-blur-sm"
              onClick={() => setIsCategoryModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-sky-50 flex items-center justify-between shrink-0">
                <h2 className="text-xl font-bold text-sky-950">Categorias</h2>
                <button onClick={() => setIsCategoryModalOpen(false)} className="p-2 text-sky-300 hover:text-sky-950 hover:bg-sky-50 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8">
                <div className="flex gap-2 mb-6">
                  <input 
                    type="text" 
                    value={newCategoryName} 
                    onChange={e => setNewCategoryName(e.target.value)} 
                    placeholder="Nova categoria..." 
                    className="flex-1 p-3 bg-sky-50/50 border border-sky-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-sky-950" 
                  />
                  <button 
                    onClick={handleAddCategory}
                    disabled={savingCategory || !newCategoryName.trim()}
                    className="px-4 bg-sky-950 text-white rounded-xl text-xs font-bold uppercase disabled:opacity-50 hover:bg-orange-500 transition-colors"
                  >
                    Adicionar
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-sky-50/30 border border-sky-50 rounded-xl">
                      <span className="text-sm font-medium text-sky-950">{cat.name}</span>
                      <button 
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-red-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {categories.length === 0 && <p className="text-sm text-sky-400 text-center py-4">Nenhuma categoria cadastrada.</p>}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageDestinations;
