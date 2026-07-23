"use client"
import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

export default function AddLinkModal({ onClose, onSave, editingItem, existingCategories = [] }) {
  const [url, setUrl] = useState(editingItem?.url || '');
  const [loading, setLoading] = useState(false);
  const [itemData, setItemData] = useState(editingItem || null);

  const handleScrape = async () => {
    if (!url) return;
    setLoading(true);
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      if (res.ok) {
        const data = await res.json();
        setItemData({ ...data, url, status: 'Da valutare' });
      } else {
        alert('Errore nello scraping del link.');
      }
    } catch (err) {
      console.error(err);
      alert('Errore nello scraping del link.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (itemData) {
      onSave(itemData);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setItemData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)'
    }}>
      <div className="glass" style={{ width: '90%', maxWidth: '500px', padding: '24px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        <button type="button" onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, color: 'var(--color-text-light)' }}>
          <X size={24} />
        </button>
        
        <h2 className="mb-4">{editingItem ? 'Modifica Mobile' : 'Aggiungi Mobile'}</h2>

        {!itemData && !editingItem ? (
          <div className="flex flex-col gap-4">
            <p>Incolla il link del mobile che ti piace (IKEA, Poltronesofà, ecc.)</p>
            <input 
              className="glass-input" 
              placeholder="https://..." 
              value={url} 
              onChange={e => setUrl(e.target.value)}
            />
            <button className="glass-button primary" onClick={handleScrape} disabled={loading || !url}>
              {loading ? <Loader2 className="animate-spin" size={20} style={{ margin: '0 auto' }}/> : 'Avanti'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {itemData.image_url && (
              <img src={itemData.image_url} alt="Preview" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
            )}
            
            <div className="flex flex-col gap-2">
              <label>Titolo</label>
              <input name="title" className="glass-input" required value={itemData.title || ''} onChange={handleChange} />
            </div>
            
            <div className="flex gap-4">
              <div className="flex flex-col gap-2" style={{ flex: 1 }}>
                <label>Prezzo (€)</label>
                <input name="price" type="number" step="0.01" className="glass-input" value={itemData.price || ''} onChange={handleChange} />
              </div>
              <div className="flex flex-col gap-2" style={{ flex: 1 }}>
                <label>Negozio</label>
                <input name="vendor" className="glass-input" value={itemData.vendor || ''} onChange={handleChange} />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col gap-2" style={{ flex: 1 }}>
                <label>Categoria</label>
                <input 
                  name="category" 
                  placeholder="Es. Divano" 
                  className="glass-input" 
                  value={itemData.category || ''} 
                  onChange={handleChange} 
                  list="categories-list"
                />
                <datalist id="categories-list">
                  {existingCategories.map((cat, idx) => (
                    <option key={idx} value={cat} />
                  ))}
                </datalist>
              </div>
              <div className="flex flex-col gap-2" style={{ flex: 1 }}>
                <label>Dimensioni (cm)</label>
                <input 
                  name="dimensions" 
                  placeholder="Es. 160x235" 
                  className="glass-input" 
                  value={itemData.dimensions || ''} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col gap-2" style={{ flex: 1 }}>
                <label>Stanza</label>
                <select name="room" className="glass-input" value={itemData.room || ''} onChange={handleChange}>
                  <option value="">Seleziona...</option>
                  <option value="Soggiorno">Soggiorno</option>
                  <option value="Cucina">Cucina</option>
                  <option value="Camera da letto">Camera da letto</option>
                  <option value="Bagno">Bagno</option>
                  <option value="Corridoio">Corridoio</option>
                </select>
              </div>
               <div className="flex flex-col gap-2" style={{ flex: 1 }}>
                <label>Stato</label>
                <select name="status" className="glass-input" value={itemData.status || 'Da valutare'} onChange={handleChange}>
                  <option value="Da valutare">Da valutare</option>
                  <option value="Scelto">Scelto</option>
                  <option value="Comprato">Comprato</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label>Note (Opzionale)</label>
              <textarea name="notes" className="glass-input" rows="2" value={itemData.notes || ''} onChange={handleChange}></textarea>
            </div>

            <button type="submit" className="glass-button primary mt-4">
              Salva
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
