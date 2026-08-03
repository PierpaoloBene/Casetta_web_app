"use client"
import { ExternalLink, Edit2, Trash2 } from 'lucide-react';

export default function ItemCard({ item, onDelete, onEdit, onToggleApproval }) {
  const formatPrice = (price) => {
    return price ? `€${parseFloat(price).toFixed(2)}` : 'Prezzo n.d.';
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
        
        <div style={{ marginTop: '12px', borderTop: '1px solid var(--color-glass-border)', paddingTop: '12px' }}>
          {item.added_by && (
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginBottom: '8px' }}>
              Inserito da: <strong style={{ color: 'var(--color-text)' }}>{item.added_by}</strong>
            </div>
          )}
          <div className="flex justify-between items-center" style={{ fontSize: '0.9rem' }}>
            <label className="flex items-center gap-2 cursor-pointer" style={{ opacity: item.approved_by_anna_rita ? 1 : 0.6 }}>
              <input 
                type="checkbox" 
                checked={!!item.approved_by_anna_rita}
                onChange={() => onToggleApproval(item.id, 'anna_rita', !item.approved_by_anna_rita)}
                style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px' }}
              />
              Anna Rita
            </label>
            <label className="flex items-center gap-2 cursor-pointer" style={{ opacity: item.approved_by_pierpaolo ? 1 : 0.6 }}>
              <input 
                type="checkbox" 
                checked={!!item.approved_by_pierpaolo}
                onChange={() => onToggleApproval(item.id, 'pierpaolo', !item.approved_by_pierpaolo)}
                style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px' }}
              />
              Pierpaolo
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
