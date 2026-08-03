"use client"
import { ExternalLink, Edit2, Trash2, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
        
        {item.added_by && (
          <div style={{ 
            position: 'absolute', top: 12, right: 12, 
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
            padding: '4px 12px', borderRadius: '16px', fontSize: '0.75rem',
            color: '#fff', fontWeight: '600', border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            {item.added_by}
          </div>
        )}      </div>
      
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
        
        <div style={{ marginTop: '12px', borderTop: '1px solid var(--color-glass-border)', paddingTop: '16px', paddingBottom: '4px' }}>
          <motion.div 
            layout
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: (item.approved_by_anna_rita && item.approved_by_pierpaolo) ? '12px' : '24px' 
            }}
          >
            <motion.button
              layout
              onClick={() => onToggleApproval(item.id, 'anna_rita', !item.approved_by_anna_rita)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: item.approved_by_anna_rita ? '#e91e63' : 'var(--color-glass-border)',
                background: item.approved_by_anna_rita ? 'linear-gradient(135deg, #f48fb1, #e91e63)' : 'rgba(255,255,255,0.05)',
                color: item.approved_by_anna_rita ? '#fff' : 'var(--color-text-light)',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                boxShadow: item.approved_by_anna_rita ? '0 4px 12px rgba(233, 30, 99, 0.3)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                zIndex: 2
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Anna Rita
            </motion.button>
            
            <AnimatePresence>
              {(item.approved_by_anna_rita && item.approved_by_pierpaolo) && (
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ 
                    scale: [0, 1.2, 1], 
                    rotate: 0,
                    filter: ['hue-rotate(0deg)', 'hue-rotate(360deg)'] 
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    type: 'spring', 
                    bounce: 0.6,
                    filter: { repeat: Infinity, duration: 4, ease: "linear" }
                  }}
                  style={{ zIndex: 1 }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  >
                    <Heart size={24} fill="#e91e63" color="#e91e63" style={{ filter: 'drop-shadow(0 0 8px rgba(233,30,99,0.5))' }} />
                  </motion.div>
                  
                  {/* Coriandoli */}
                  {[...Array(12)].map((_, i) => {
                    const angle = (i * 30) * (Math.PI / 180);
                    const distance = 30 + (i % 3) * 15;
                    const targetX = Math.cos(angle) * distance;
                    const targetY = Math.sin(angle) * distance;
                    const colors = ['#e91e63', '#3b82f6', '#facc15', '#10b981', '#a855f7'];
                    
                    return (
                      <motion.div
                        key={`confetti-${i}`}
                        initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                        animate={{ 
                          scale: [0, 1, 0], 
                          x: targetX, 
                          y: targetY - 10,
                          rotate: i * 45 + 180,
                          opacity: [1, 1, 0]
                        }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                        style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10px',
                          width: '6px',
                          height: '6px',
                          backgroundColor: colors[i % colors.length],
                          borderRadius: i % 2 === 0 ? '50%' : '1px',
                          zIndex: 0,
                          pointerEvents: 'none'
                        }}
                      />
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              layout
              onClick={() => onToggleApproval(item.id, 'pierpaolo', !item.approved_by_pierpaolo)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: item.approved_by_pierpaolo ? '#3b82f6' : 'var(--color-glass-border)',
                background: item.approved_by_pierpaolo ? 'linear-gradient(135deg, #93c5fd, #3b82f6)' : 'rgba(255,255,255,0.05)',
                color: item.approved_by_pierpaolo ? '#fff' : 'var(--color-text-light)',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                boxShadow: item.approved_by_pierpaolo ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                zIndex: 2
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Pierpaolo
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
