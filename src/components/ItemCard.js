"use client"
import { ExternalLink, Edit2, Trash2 } from 'lucide-react';

export default function ItemCard({ item, onDelete, onEdit }) {
  const formatPrice = (price) => {
    return price ? `€${parseFloat(price).toFixed(2)}` : 'Prezzo n.d.';
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Da valutare': return 'badge-da-valutare';
      case 'Scelto': return 'badge-scelto';
      case 'Comprato': return 'badge-comprato';
      default: return 'badge-da-valutare';
    }
  };

  return (
    <div className="glass flex flex-col" style={{ overflow: 'hidden' }}>
      <div style={{ height: '200px', width: '100%', backgroundColor: 'rgba(0,0,0,0.05)', position: 'relative' }}>
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div className="flex items-center justify-center" style={{ height: '100%', color: 'var(--color-text-light)' }}>
            Nessuna immagine
          </div>
        )}
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <span className={`badge ${getStatusClass(item.status)}`}>{item.status}</span>
        </div>
      </div>
      
      <div className="flex flex-col gap-2" style={{ padding: '16px', flex: 1 }}>
        <div className="flex justify-between items-start gap-2">
          <h3 style={{ fontSize: '1.1rem', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.title}
          </h3>
          <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text-light)' }}>
            <ExternalLink size={18} />
          </a>
        </div>
        
        <div className="flex justify-between items-center mt-auto" style={{ paddingTop: '12px' }}>
          <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--color-primary)' }}>
            {formatPrice(item.price)}
          </span>
          <span style={{ fontSize: '0.9rem', color: 'var(--color-text-light)' }}>
            {item.vendor || 'Sconosciuto'}
          </span>
        </div>
        
        <div className="flex justify-between items-center" style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', borderTop: '1px solid var(--color-glass-border)', paddingTop: '12px', marginTop: '4px' }}>
          <span>{item.room || 'Stanza non assegnata'} {item.category ? `• ${item.category}` : ''} {item.dimensions ? `• ${item.dimensions} cm` : ''}</span>
          <div className="flex gap-2">
            <button onClick={() => onEdit(item)}><Edit2 size={16} /></button>
            <button onClick={() => onDelete(item.id)}><Trash2 size={16} color="#E29578" /></button>
          </div>
        </div>
        
        {item.notes && (
          <div style={{ fontSize: '0.85rem', fontStyle: 'italic', background: 'rgba(255,255,255,0.3)', padding: '8px', borderRadius: '4px', marginTop: '8px' }}>
            {item.notes}
          </div>
        )}
      </div>
    </div>
  );
}
