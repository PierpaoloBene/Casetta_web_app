"use client"
import { useState } from 'react';
import { X, ImageOff, Image } from 'lucide-react';

function getHostname(rawUrl) {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, '');
  } catch {
    return rawUrl;
  }
}

export default function AddLinkModal({ onClose, onSave, editingItem, existingCategories = [] }) {
  const [url, setUrl] = useState(editingItem?.url || '');
  const [loading, setLoading] = useState(false);
  const [loadingHost, setLoadingHost] = useState('');
  const [itemData, setItemData] = useState(editingItem || null);
  const [scrapedWithNoImage, setScrapedWithNoImage] = useState(false);

  const handleScrape = async () => {
    if (!url) return;
    setLoading(true);
    setLoadingHost(getHostname(url));
    setScrapedWithNoImage(false);
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error(`Scrape error: ${res.status}`);
      const scraped = await res.json();
      if (scraped.error) throw new Error(scraped.error);
      const data = { ...scraped, url, status: 'Da valutare' };
      setItemData(data);
      if (!scraped.image_url) setScrapedWithNoImage(true);
    } catch (err) {
      console.error('Scraping error:', err);
      setItemData({ url, status: 'Da valutare' });
      setScrapedWithNoImage(true);
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
    // Nascondi il banner appena l'utente incolla un URL immagine
    if (name === 'image_url' && value) setScrapedWithNoImage(false);
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
              disabled={loading}
            />

            {loading ? (
              <div style={{
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                padding: '16px 18px',
                overflow: 'hidden',
                position: 'relative',
              }}>
                {/* Looping progress bar */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                  background: 'linear-gradient(90deg, transparent 0%, var(--color-accent, #7c6af7) 50%, transparent 100%)',
                  animation: 'scrape-progress 1.6s ease-in-out infinite',
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Pulsing dot */}
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--color-accent, #7c6af7)',
                    flexShrink: 0,
                    animation: 'scrape-pulse 1.2s ease-in-out infinite',
                  }} />
                  <span style={{ fontSize: '0.9rem', color: 'var(--color-text-light)' }}>
                    Recupero info da{' '}
                    <strong style={{ color: 'var(--color-text)' }}>{loadingHost}</strong>
                    <span style={{ display: 'inline-flex', gap: '2px', marginLeft: '1px' }}>
                      {[0, 1, 2].map(i => (
                        <span key={i} style={{
                          animation: `scrape-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                          display: 'inline-block',
                        }}>.</span>
                      ))}
                    </span>
                  </span>
                </div>

                <style>{`
                  @keyframes scrape-progress {
                    0%   { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                  }
                  @keyframes scrape-pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50%       { opacity: 0.4; transform: scale(0.75); }
                  }
                  @keyframes scrape-dot {
                    0%, 80%, 100% { opacity: 0; transform: translateY(0); }
                    40%           { opacity: 1; transform: translateY(-3px); }
                  }
                `}</style>
              </div>
            ) : (
              <button className="glass-button primary" onClick={handleScrape} disabled={!url}>
                Avanti
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Banner avviso immagine mancante */}
            {scrapedWithNoImage && (
              <div style={{
                background: 'rgba(251, 146, 60, 0.15)',
                border: '1px solid rgba(251, 146, 60, 0.4)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
              }}>
                <ImageOff size={18} style={{ color: '#fb923c', flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: '0.85rem', lineHeight: '1.5', color: 'var(--color-text-light)' }}>
                  <strong style={{ color: '#fb923c', display: 'block', marginBottom: 4 }}>Immagine non trovata automaticamente</strong>
                  Vai sulla pagina del prodotto, clicca con il tasto destro sull&apos;immagine principale
                  → <em>&quot;Copia indirizzo immagine&quot;</em> e incollalo nel campo qui sotto.
                </div>
              </div>
            )}

            {/* Anteprima immagine + campo URL sempre modificabile */}
            {itemData?.image_url ? (
              <div style={{ position: 'relative' }}>
                <img
                  src={itemData.image_url}
                  alt="Preview"
                  style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                  onError={() => setItemData(prev => ({ ...prev, image_url: '' }))}
                />
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.65))',
                  borderRadius: '0 0 var(--radius-sm) var(--radius-sm)',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <Image size={14} style={{ color: 'rgba(255,255,255,0.7)', flexShrink: 0 }} />
                  <input
                    name="image_url"
                    className="glass-input"
                    placeholder="URL immagine..."
                    value={itemData.image_url || ''}
                    onChange={handleChange}
                    style={{ flex: 1, fontSize: '0.75rem', padding: '4px 8px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.85)' }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Image size={16} />
                  URL Immagine
                </label>
                <input
                  name="image_url"
                  placeholder="Incolla qui il link dell'immagine..."
                  className="glass-input"
                  value={itemData?.image_url || ''}
                  onChange={handleChange}
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label>Titolo</label>
              <input name="title" className="glass-input" required value={itemData?.title || ''} onChange={handleChange} />
            </div>

            <div className="form-row">
              <div className="flex flex-col gap-2" style={{ flex: 1 }}>
                <label>Prezzo (€)</label>
                <input name="price" type="number" step="0.01" className="glass-input" value={itemData?.price || ''} onChange={handleChange} />
              </div>
              <div className="flex flex-col gap-2" style={{ flex: 1 }}>
                <label>Negozio</label>
                <input name="vendor" className="glass-input" value={itemData?.vendor || ''} onChange={handleChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="flex flex-col gap-2" style={{ flex: 1 }}>
                <label>Categoria</label>
                <input
                  name="category"
                  placeholder="Es. Divano"
                  className="glass-input"
                  value={itemData?.category || ''}
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
                  value={itemData?.dimensions || ''}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="flex flex-col gap-2" style={{ flex: 1 }}>
                <label>Stanza</label>
                <select name="room" className="glass-input" value={itemData?.room || ''} onChange={handleChange}>
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
                <select name="status" className="glass-input" value={itemData?.status || 'Da valutare'} onChange={handleChange}>
                  <option value="Da valutare">Da valutare</option>
                  <option value="Scelto">Scelto</option>
                  <option value="Comprato">Comprato</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label>Note (Opzionale)</label>
              <textarea name="notes" className="glass-input" rows="2" value={itemData?.notes || ''} onChange={handleChange}></textarea>
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
