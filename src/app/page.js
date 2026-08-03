"use client"
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import WelcomeAnimation from '@/components/WelcomeAnimation';
import ItemCard from '@/components/ItemCard';
import AddLinkModal from '@/components/AddLinkModal';
import { Plus, Loader2 } from 'lucide-react';

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filterRoom, setFilterRoom] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAddedBy, setFilterAddedBy] = useState('');

  useEffect(() => {
    // Check if we should show animation
    const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcome');
    if (hasSeenWelcome) {
      setShowWelcome(false);
    } else {
      sessionStorage.setItem('hasSeenWelcome', 'true');
    }

    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase.from('furniture_items').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error("Error fetching items:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItem = async (itemData) => {
    try {
      if (!itemData.id) {
        // Duplicate check
        const isDuplicate = items.some(i => i.url === itemData.url);
        if (isDuplicate) {
          alert('Attenzione: un mobile con questo link è già stato inserito!');
          return;
        }
      }

      if (itemData.id) {
        // Update
        const { error } = await supabase.from('furniture_items').update(itemData).eq('id', itemData.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from('furniture_items').insert([itemData]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      setEditingItem(null);
      fetchItems();
    } catch (err) {
      console.error("Error saving item:", err);
      alert('Errore nel salvataggio.');
    }
  };

  const handleDeleteItem = async (id) => {
    if (confirm('Vuoi davvero eliminare questo mobile?')) {
      try {
        const { error } = await supabase.from('furniture_items').delete().eq('id', id);
        if (error) throw error;
        fetchItems();
      } catch (err) {
        console.error("Error deleting item:", err);
      }
    }
  };

  const handleToggleApproval = async (id, person, isApproved) => {
    try {
      const field = person === 'anna_rita' ? 'approved_by_anna_rita' : 'approved_by_pierpaolo';
      const { error } = await supabase.from('furniture_items').update({ [field]: isApproved }).eq('id', id);
      if (error) throw error;
      setItems(items.map(item => item.id === id ? { ...item, [field]: isApproved } : item));
    } catch (err) {
      console.error("Error toggling approval:", err);
    }
  };

  const filteredItems = items.filter(item => {
    if (filterRoom && item.room !== filterRoom) return false;
    if (filterCategory && item.category !== filterCategory) return false;
    if (filterAddedBy && item.added_by !== filterAddedBy) return false;
    return true;
  });
  
  const existingCategories = [...new Set(items.map(i => i.category).filter(Boolean))];
  
  const totalBudget = filteredItems.reduce((acc, curr) => acc + (curr.price || 0), 0);

  return (
    <main>
      {showWelcome && <WelcomeAnimation onComplete={() => setShowWelcome(false)} />}
      
      {!showWelcome && (
        <div className="container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
          <header className="header-container">
            <h1 style={{ color: 'var(--color-primary)', fontSize: '2rem' }}>Housing Helper</h1>
            
            <div className="header-controls">
              <select className="glass-input" value={filterRoom} onChange={e => setFilterRoom(e.target.value)}>
                <option value="">Tutte le stanze</option>
                <option value="Soggiorno">Soggiorno</option>
                <option value="Cucina">Cucina</option>
                <option value="Camera da letto">Camera da letto</option>
                <option value="Bagno">Bagno</option>
                <option value="Corridoio">Corridoio</option>
              </select>

              <select className="glass-input" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="">Tutte le categorie</option>
                {existingCategories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>

              <select className="glass-input" value={filterAddedBy} onChange={e => setFilterAddedBy(e.target.value)}>
                <option value="">Tutti (Inserito da)</option>
                <option value="Anna Rita">Anna Rita</option>
                <option value="Pierpaolo">Pierpaolo</option>
              </select>
              
              <button className="glass-button primary flex items-center gap-2" onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
                <Plus size={20} /> Aggiungi
              </button>
            </div>
          </header>

          <div className="glass budget-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'var(--color-text-light)', margin: 0, fontSize: '0.9rem' }}>Spesa Totale (Elementi filtrati)</p>
              <h2 style={{ margin: 0, fontSize: '1.8rem' }}>€{totalBudget.toFixed(2)}</h2>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center" style={{ height: '200px' }}>
              <Loader2 className="animate-spin" size={40} color="var(--color-primary)" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="glass flex flex-col items-center justify-center" style={{ height: '300px', textAlign: 'center' }}>
              <h3 className="mb-4">Nessun mobile trovato</h3>
              <p style={{ color: 'var(--color-text-light)' }}>Clicca su "Aggiungi" per iniziare a riempire la casa!</p>
            </div>
          ) : (
            <div className="grid-cards">
              {filteredItems.map(item => (
                <ItemCard 
                  key={item.id} 
                  item={item} 
                  onDelete={handleDeleteItem} 
                  onEdit={(item) => { setEditingItem(item); setIsModalOpen(true); }}
                  onToggleApproval={handleToggleApproval}
                />
              ))}
            </div>
          )}

          {isModalOpen && (
            <AddLinkModal 
              onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
              onSave={handleSaveItem}
              editingItem={editingItem}
              existingCategories={existingCategories}
            />
          )}
        </div>
      )}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
