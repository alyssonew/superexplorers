import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, MapPin, Compass, MessageSquare, TrendingUp, ArrowUpRight, Loader2, Database, X } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    destinations: 0,
    expeditions: 0,
    contacts: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentContacts, setRecentContacts] = useState<any[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);

  useEffect(() => {
    fetchData();

    // Listeners for realtime counts
    const channel = supabase.channel('public:dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'destinations' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expeditions' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [{ count: destCount }, { count: expCount }, { count: contactCount }, { data: contactsData }] = await Promise.all([
        supabase.from('destinations').select('*', { count: 'exact', head: true }),
        supabase.from('expeditions').select('*', { count: 'exact', head: true }),
        supabase.from('contacts').select('*', { count: 'exact', head: true }),
        supabase.from('contacts').select('*').order('created_at', { ascending: false }).limit(5)
      ]);

      setStats({
        destinations: destCount || 0,
        expeditions: expCount || 0,
        contacts: contactCount || 0
      });

      setRecentContacts(contactsData || []);
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { name: 'Destinos', value: stats.destinations, icon: MapPin, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: 'Expedições', value: stats.expeditions, icon: Compass, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { name: 'Mensagens', value: stats.contacts, icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { name: 'Acessos/Mês', value: '1.2k', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-sky-950 tracking-tight">Dashboard</h1>
        <p className="text-sky-600">Bem-vindo(a) ao painel de controle SuperExplorers.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.name}
            className="bg-white p-8 rounded-[32px] border border-sky-100 shadow-sm hover:shadow-xl transition-all group"
          >
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6`}>
              <stat.icon size={24} />
            </div>
            <div className="text-4xl font-bold text-sky-950 mb-2">{stat.value}</div>
            <div className="text-xs font-bold uppercase tracking-widest text-sky-500">{stat.name}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Message Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-sky-950">Mensagens Recentes</h2>
            <button className="text-[10px] font-bold uppercase tracking-widest text-orange-500 hover:underline">Ver tudo</button>
          </div>
          <div className="space-y-4">
            {recentContacts.length === 0 ? (
              <div className="bg-white p-10 rounded-[32px] border border-sky-100 text-center text-sky-400 italic">
                Nenhuma mensagem recebida ainda.
              </div>
            ) : recentContacts.map((contact, i) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + (i * 0.1) }}
                key={contact.id}
                onClick={() => setSelectedMessage(contact)}
                className="bg-white p-6 rounded-[32px] border border-sky-100 flex items-center justify-between group hover:border-orange-500/20 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center text-sky-500 group-hover:bg-orange-500 group-hover:text-white transition-all">
                    <Users size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-sky-950">{contact.name}</div>
                    <div className="text-xs text-sky-400">{contact.email}</div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-sky-300">
                    {new Date(contact.created_at).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="text-sm text-sky-500 max-w-[200px] truncate">{contact.message}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Ler mensagem completa
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-sky-950">Ações Rápidas</h2>
          <div className="space-y-3">
            <Link to="/admin/destinos" className="w-full p-6 bg-sky-950 text-white rounded-[32px] font-bold uppercase tracking-widest text-[10px] flex items-center justify-between group hover:bg-orange-500 transition-all">
              Novo Destino <ArrowUpRight size={16} className="text-orange-500 group-hover:text-white" />
            </Link>
            <Link to="/admin/expedicoes" className="w-full p-6 bg-sky-50 text-sky-950 rounded-[32px] font-bold uppercase tracking-widest text-[10px] flex items-center justify-between group hover:bg-sky-100 transition-all">
              Nova Expedição <Compass size={16} className="text-sky-400" />
            </Link>
            
            <button 
              onClick={async () => {
                if(!window.confirm('Isto irá inserir os dados iniciais. Deseja continuar?')) return;
                const dests = [
                  { name: 'Jalapão, TO', category: 'Aventura & Natureza', description: 'Mergulhe em fervedouros de águas cristalinas, explore dunas douradas e sinta a energia intocada do coração do Brasil. Uma jornada rústica e transformadora.', imageUrl: 'https://images.unsplash.com/photo-1698711673892-b4c414902cd5?q=80&w=1000&auto=format&fit=crop', featured: true },
                  { name: 'Bonito, MS', category: 'Ecoturismo Premium', description: 'Flutue em rios de transparência irreal, adentre cavernas milenares e conecte-se com a vida selvagem de forma sustentável e luxuosa.', imageUrl: 'https://images.unsplash.com/photo-1688008007621-e8d1976a445e?q=80&w=1000&auto=format&fit=crop', featured: true },
                  { name: 'Maceió, AL', category: 'Paraíso Tropical', description: 'Relaxe nas praias que formam o Caribe Brasileiro. Desfrute de resorts boutique exclusivos, gastronomia local requintada e um mar de tons infinitos de azul.', imageUrl: 'https://images.unsplash.com/photo-1590209678456-4b2195f00e99?q=80&w=1000&auto=format&fit=crop', featured: true },
                  { name: 'Gramado, RS', category: 'Charme & Gastronomia', description: 'Encante-se com a arquitetura europeia, vinhos premiados e a exclusividade da Serra Gaúcha. Uma experiência aconchegante desenhada para o seu conforto.', imageUrl: 'https://images.unsplash.com/photo-1616422285623-13861c8a14b6?q=80&w=1000&auto=format&fit=crop', featured: true }
                ];
                const exps = [
                  { title: 'Travessia do Jalapão', location: 'Jalapão, TO', startDate: '12 Out 2026', endDate: '19 Out 2026', description: 'Uma expedição fotográfica imersiva pelos fervedouros e dunas douradas, com acampamento premium de luxo e guias locais especializados.', imageUrl: 'https://images.unsplash.com/photo-1698711673892-b4c414902cd5?q=80&w=1000&auto=format&fit=crop', hotelName: 'Glamping Korubo', totalNights: 7, hotelImages: ['https://images.unsplash.com/photo-1504280390267-331f28b7e7ab?q=80&w=1000&auto=format&fit=crop'] },
                  { title: 'Ecoturismo de Imersão', location: 'Bonito, MS', startDate: '05 Nov 2026', endDate: '10 Nov 2026', description: 'Flutuação em rios cristalinos e observação da vida selvagem. Inclui hospedagem em lodge exclusivo e jantares harmonizados com a culinária regional.', imageUrl: 'https://images.unsplash.com/photo-1688008007621-e8d1976a445e?q=80&w=1000&auto=format&fit=crop', hotelName: 'Zagaia Eco Resort', totalNights: 5, hotelImages: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000&auto=format&fit=crop'] },
                  { title: 'Escapada Caribenha', location: 'Maceió, AL', startDate: '20 Nov 2026', endDate: '27 Nov 2026', description: 'Navegação privativa pelas piscinas naturais, dias de relaxamento em resort boutique pé na areia e experiências gastronômicas à beira-mar.', imageUrl: 'https://images.unsplash.com/photo-1590209678456-4b2195f00e99?q=80&w=1000&auto=format&fit=crop', hotelName: 'Salinas Maragogi', totalNights: 7, hotelImages: ['https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=1000&auto=format&fit=crop'] },
                  { title: 'Rota dos Vinhos & Charme', location: 'Gramado, RS', startDate: '01 Dez 2026', endDate: '08 Dez 2026', description: 'Uma jornada sensorial pelos vales e vinícolas exclusivas da Serra Gaúcha, com degustações privadas e noites aconchegantes com vista para os cânions.', imageUrl: 'https://images.unsplash.com/photo-1616422285623-13861c8a14b6?q=80&w=1000&auto=format&fit=crop', hotelName: 'Colline de France', totalNights: 7, hotelImages: ['https://images.unsplash.com/photo-1542314831-c6a4d14d837e?q=80&w=1000&auto=format&fit=crop'] }
                ];
                await supabase.from('destinations').insert(dests);
                await supabase.from('expeditions').insert(exps);
                alert('Dados semeados com sucesso no Supabase!');
              }}
              className="w-full p-6 bg-orange-50 text-orange-600 rounded-[32px] font-bold uppercase tracking-widest text-[10px] flex items-center justify-between group hover:bg-orange-100 transition-all"
            >
              Popular Banco de Dados <Database size={16} className="text-orange-500" />
            </button>
          </div>

          <div className="bg-sky-950 p-8 rounded-[32px] text-white">
            <div className="text-orange-500 mb-4"><Compass size={32} /></div>
            <div className="text-lg font-bold mb-2 uppercase tracking-tighter">Status do Sistema</div>
            <p className="text-xs text-sky-200/60 leading-relaxed">Todos os serviços estão operacionais. Sincronização com Supabase PostgreSQL ativa.</p>
          </div>
        </div>
      </div>

      {/* Modal de Mensagem */}
      {selectedMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-sky-950/80 backdrop-blur-sm" onClick={() => setSelectedMessage(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[32px] p-8 w-full max-w-lg shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedMessage(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-sky-50 text-sky-400 hover:text-sky-600 transition-colors"
            >
              <X size={24} />
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-sky-50 rounded-full flex items-center justify-center text-sky-500">
                <Users size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-sky-950">{selectedMessage.name}</h3>
                <div className="flex flex-col text-sm text-sky-500 mt-1">
                  <span>{selectedMessage.email}</span>
                  {selectedMessage.phone && (
                    <span className="text-sky-400">{selectedMessage.phone}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-sky-50/50 rounded-2xl p-6 border border-sky-100">
              <div className="text-[10px] font-bold uppercase tracking-widest text-sky-400 mb-4">
                Enviada em {new Date(selectedMessage.created_at).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}
              </div>
              <p className="text-sky-950 leading-relaxed whitespace-pre-wrap">
                {selectedMessage.message}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
