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
      // Uso un proxy CORS gratuito (allorigins) poiché GitHub Pages è statico e non supporta le API in Node.js
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error('Proxy fetch failed');
      
      const data = await res.json();
      const html = data.contents;
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const getMeta = (property, name) => {
        const el = doc.querySelector(`meta[property="${property}"]`) || doc.querySelector(`meta[name="${name}"]`);
        return el ? el.getAttribute('content') : '';
      };

      let rawTitle = getMeta('og:title') || (doc.querySelector('title') ? doc.querySelector('title').textContent : '') || '';
      const image_url = getMeta('og:image') || '';
      let priceString = getMeta('product:price:amount') || getMeta('price', 'price') || '';
      let vendor = getMeta('og:site_name') || '';

      if (!priceString) {
        const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
        scripts.forEach(el => {
          try {
            const parsed = JSON.parse(el.textContent);
            const searchData = Array.isArray(parsed) ? parsed : [parsed];
            for (const item of searchData) {
              if (item['@type'] === 'Product' && item.offers) {
                if (item.offers.price) {
                  priceString = item.offers.price.toString();
                } else if (Array.isArray(item.offers) && item.offers[0]?.price) {
                  priceString = item.offers[0].price.toString();
                }
                if (priceString) return;
              }
            }
          } catch (e) {}
        });
      }

      if (url.includes('ikea.com')) {
        vendor = 'IKEA';
        if (!priceString) {
          const priceEl = doc.querySelector('.pip-temp-price__integer');
          if (priceEl) priceString = priceEl.textContent;
        }
      } else if (url.includes('poltronesofa.com')) {
        vendor = 'Poltronesofà';
        if (!priceString) {
          const priceEl = doc.querySelector('.price');
          if (priceEl) priceString = priceEl.textContent;
        }
      }

      let price = null;
      if (priceString) {
        const numericString = priceString.replace(/[^0-9.,]/g, '').replace(',', '.');
        const parsedPrice = parseFloat(numericString);
        if (!isNaN(parsedPrice)) {
          price = parsedPrice;
        }
      }

      let dimensions = '';
      const dimMatch = rawTitle.match(/(\d+)\s*[xX]\s*(\d+)/);
      if (dimMatch) {
        dimensions = `${dimMatch[1]}x${dimMatch[2]}`;
      } else {
        const desc = getMeta('og:description') || '';
        const descMatch = desc.match(/(\d+)\s*[xX]\s*(\d+)/);
        if (descMatch) {
          dimensions = `${descMatch[1]}x${descMatch[2]}`;
        }
      }

      let title = rawTitle;
      if (title.includes('- IKEA')) title = title.split('- IKEA')[0].trim();
      if (title.includes(',')) title = title.split(',')[0].trim();

      const lowerTitle = title.toLowerCase();
      let category = '';
      if (lowerTitle.includes('divano')) category = 'Divano';
      else if (lowerTitle.includes('letto')) category = 'Letto';
      else if (lowerTitle.includes('tavolo')) category = 'Tavolo';
      else if (lowerTitle.includes('sedia')) category = 'Sedia';
      else if (lowerTitle.includes('armadio')) category = 'Armadio';
      else if (lowerTitle.includes('comodino')) category = 'Comodino';
      else if (lowerTitle.includes('lampada')) category = 'Lampada';
      else if (lowerTitle.includes('tappeto')) category = 'Tappeto';

      let room = '';
      if (category === 'Divano' || category === 'Tappeto') room = 'Soggiorno';
      else if (category === 'Letto' || category === 'Comodino' || category === 'Armadio') room = 'Camera da letto';

      setItemData({
        title: title.trim() || rawTitle,
        image_url: image_url.trim(),
        price,
        vendor: vendor.trim(),
        category,
        room,
        dimensions,
        url,
        status: 'Da valutare'
      });
      
    } catch (err) {
      console.error('Scraping error:', err);
      // Fallback: se lo scraping fallisce, mostriamo comunque il modulo vuoto
      setItemData({ url, status: 'Da valutare' });
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
            
            <div className="form-row">
              <div className="flex flex-col gap-2" style={{ flex: 1 }}>
                <label>Prezzo (€)</label>
                <input name="price" type="number" step="0.01" className="glass-input" value={itemData.price || ''} onChange={handleChange} />
              </div>
              <div className="flex flex-col gap-2" style={{ flex: 1 }}>
                <label>Negozio</label>
                <input name="vendor" className="glass-input" value={itemData.vendor || ''} onChange={handleChange} />
              </div>
            </div>

            <div className="form-row">
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

            <div className="form-row">
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
