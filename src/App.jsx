import { useState, useEffect, useRef } from 'react';
import { Home, ExternalLink, Trash2, Plus, Download, Upload, Edit2, MapPin, Loader2, Save, X, Phone, RefreshCw } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from './supabaseClient';

// Fix for default marker icon in leaflet with React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const MONZA_STATION = { lat: 45.5786, lon: 9.2747 };

// Funzione matematica per calcolare la distanza in linea d'aria tra due coordinate (Formula di Haversine)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raggio della terra in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; // Ritorna distanza in km
}

function App() {
  const [houses, setHouses] = useState([]);
  const [isSyncing, setIsSyncing] = useState(true);

  const [formData, setFormData] = useState({
    link: '',
    price: '',
    address: '',
    agency: false,
    toCall: false,
    appointment: '',
    notes: ''
  });

  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef(null);

  // Load from Supabase on mount
  useEffect(() => {
    fetchHouses();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'houses' },
        (payload) => {
          console.log('Change received!', payload);
          if (payload.eventType === 'INSERT') {
            setHouses(prev => {
              if (prev.find(h => h.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
          } else if (payload.eventType === 'UPDATE') {
            setHouses(prev => prev.map(h => h.id === payload.new.id ? payload.new : h));
          } else if (payload.eventType === 'DELETE') {
            setHouses(prev => prev.filter(h => h.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchHouses = async () => {
    setIsSyncing(true);
    const { data, error } = await supabase
      .from('houses')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching houses:', error);
      // Fallback to local storage if DB fails or table doesn't exist
      const saved = localStorage.getItem('casetta-tracker-data');
      if (saved) setHouses(JSON.parse(saved));
    } else if (data) {
      setHouses(data);
      // Also save to local storage as backup
      localStorage.setItem('casetta-tracker-data', JSON.stringify(data));
    }
    setIsSyncing(false);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(houses, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'casetta-tracker-data.json';

    let linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedHouses = JSON.parse(event.target.result);
        if (Array.isArray(importedHouses)) {
          // Upload to Supabase
          setIsSyncing(true);
          const { error } = await supabase.from('houses').upsert(importedHouses);
          if (error) {
            alert('Errore durante il salvataggio sul cloud. Controlla che la tabella esista.');
          } else {
            alert('Dati importati con successo!');
            fetchHouses();
          }
        } else {
          alert('Il file non è nel formato corretto.');
        }
      } catch (err) {
        alert('Errore durante la lettura del file.');
      }
      e.target.value = null; // reset input
      setIsSyncing(false);
    };
    reader.readAsText(file);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const geocodeAndRoute = async (address) => {
    try {
      // 1. Geocode with Nominatim
      // Aggiunge 'Monza' automaticamente se l'utente non lo ha specificato
      let searchQuery = address;
      if (!searchQuery.toLowerCase().includes('monza')) {
        searchQuery = `${searchQuery}, Monza`;
      }
      const geocodeRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      const geocodeData = await geocodeRes.json();
      
      if (!geocodeData || geocodeData.length === 0) {
        return { lat: null, lon: null, distance: null, duration: null };
      }

      const lat = parseFloat(geocodeData[0].lat);
      const lon = parseFloat(geocodeData[0].lon);

      // 2. Calcolo distanza in linea d'aria e minuti
      const distanceKm = getDistanceFromLatLonInKm(lat, lon, MONZA_STATION.lat, MONZA_STATION.lon);
      const distanceMeters = Math.round(distanceKm * 1000);
      
      // Velocità media di passeggiata: 75 metri al minuto
      const durationMins = Math.round(distanceMeters / 75);

      return {
        lat,
        lon,
        distance: distanceMeters,
        duration: durationMins
      };

    } catch (err) {
      console.error("Error geocoding/routing:", err);
      return { lat: null, lon: null, distance: null, duration: null };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.link || !formData.address) return;

    setIsLoading(true);

    let locationData = { lat: null, lon: null, distance: null, duration: null };
    
    // Check if address changed during edit, or if it's a new entry
    const existingHouse = editingId ? houses.find(h => h.id === editingId) : null;
    const isAddressChanged = existingHouse ? existingHouse.address !== formData.address : true;

    if (isAddressChanged) {
      locationData = await geocodeAndRoute(formData.address);
    } else if (existingHouse) {
      locationData = { 
        lat: existingHouse.lat, 
        lon: existingHouse.lon, 
        distance: existingHouse.distance, 
        duration: existingHouse.duration 
      };
    }

    if (editingId) {
      const updatedHouse = { ...existingHouse, ...formData, ...locationData };
      setHouses(prev => prev.map(house => house.id === editingId ? updatedHouse : house));
      
      // Update in Supabase
      const { error } = await supabase.from('houses').update(updatedHouse).eq('id', editingId);
      if (error) console.error("Error updating", error);
      
      setEditingId(null);
    } else {
      const newHouse = {
        id: crypto.randomUUID(),
        ...formData,
        ...locationData,
        created_at: new Date().toISOString()
      };
      setHouses(prev => [...prev, newHouse]);
      
      // Insert in Supabase
      const { error } = await supabase.from('houses').insert([newHouse]);
      if (error) {
        console.error("Error inserting", error);
        alert("Salvataggio fallito sul cloud. I dati sono stati salvati solo localmente. Hai creato la tabella su Supabase?");
        // fallback local storage
        localStorage.setItem('casetta-tracker-data', JSON.stringify([...houses, newHouse]));
      }
    }
    
    setFormData({
      link: '',
      price: '',
      address: '',
      agency: false,
      toCall: false,
      appointment: '',
      notes: ''
    });
    setIsLoading(false);
  };

  const handleEdit = (house) => {
    setFormData({
      link: house.link,
      price: house.price || '',
      address: house.address,
      agency: house.agency || false,
      toCall: house.toCall || false,
      appointment: house.appointment || '',
      notes: house.notes || ''
    });
    setEditingId(house.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      link: '',
      price: '',
      address: '',
      agency: false,
      toCall: false,
      appointment: '',
      notes: ''
    });
  };

  const handleDelete = async (id) => {
    if(confirm('Sei sicuro di voler eliminare questa casa?')) {
      setHouses(prev => prev.filter(house => house.id !== id));
      if(editingId === id) cancelEdit();
      
      const { error } = await supabase.from('houses').delete().eq('id', id);
      if (error) console.error("Error deleting", error);
    }
  };

  const getDomainName = (url) => {
    try {
      const { hostname } = new URL(url);
      if (hostname.includes('immobiliare.it')) return 'Immobiliare.it';
      if (hostname.includes('idealista.it')) return 'Idealista';
      return hostname.replace('www.', '');
    } catch {
      return 'Link Casa';
    }
  };

  const housesWithCoords = houses.filter(h => h.lat && h.lon);

  return (
    <div className="app-container">
      <header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Casetta Tracker</h1>
            {isSyncing && <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><RefreshCw size={12} className="animate-spin" /> Sincronizzazione in corso...</span>}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-outline" onClick={handleExport} title="Esporta Dati">
              <Download size={18} />
              Esporta
            </button>
            <button className="btn-outline" onClick={() => fileInputRef.current?.click()} title="Importa Dati">
              <Upload size={18} />
              Importa
            </button>
            <input 
              type="file" 
              accept=".json" 
              style={{ display: 'none' }} 
              ref={fileInputRef}
              onChange={handleImport}
            />
          </div>
        </div>
      </header>

      <main>
        {housesWithCoords.length > 0 && (
          <section className="map-container">
            <MapContainer center={[MONZA_STATION.lat, MONZA_STATION.lon]} zoom={14} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {/* Station Marker */}
              <Marker position={[MONZA_STATION.lat, MONZA_STATION.lon]}>
                <Popup>
                  <strong>Stazione di Monza</strong><br/>
                  Punto di riferimento
                </Popup>
              </Marker>
              
              {/* House Markers */}
              {housesWithCoords.map(house => (
                <Marker key={house.id} position={[house.lat, house.lon]}>
                  <Popup>
                    <strong>{house.address}</strong><br/>
                    Prezzo: {house.price ? `€${house.price}` : 'N/A'}<br/>
                    Distanza staz: {house.duration ? `${house.duration} min a piedi` : 'N/A'}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </section>
        )}

        <section className="glass-panel">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="link">Link Annuncio (Immobiliare, Idealista, etc.)</label>
                <input 
                  type="url" 
                  id="link" 
                  name="link" 
                  value={formData.link} 
                  onChange={handleInputChange} 
                  placeholder="https://www..." 
                  required 
                />
              </div>

              <div className="form-group">
                <label htmlFor="address">Indirizzo o Zona</label>
                <input 
                  type="text" 
                  id="address" 
                  name="address" 
                  value={formData.address} 
                  onChange={handleInputChange} 
                  placeholder="Es: Via Roma 10, Monza" 
                  required 
                />
              </div>

              <div className="form-group">
                <label htmlFor="price">Prezzo (€)</label>
                <input 
                  type="number" 
                  id="price" 
                  name="price" 
                  value={formData.price} 
                  onChange={handleInputChange} 
                  placeholder="Es: 1200" 
                />
              </div>

              <div className="form-group">
                <label htmlFor="appointment">Data Appuntamento</label>
                <input 
                  type="datetime-local" 
                  id="appointment" 
                  name="appointment" 
                  value={formData.appointment} 
                  onChange={handleInputChange} 
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="notes">Note</label>
                <textarea 
                  id="notes" 
                  name="notes" 
                  value={formData.notes} 
                  onChange={handleInputChange} 
                  placeholder="Es: Da ristrutturare, 2 bagni, ecc." 
                  rows="2"
                />
              </div>

              <div className="form-group checkbox-group" style={{ gridColumn: '1 / -1' }}>
                <input 
                  type="checkbox" 
                  id="agency" 
                  name="agency" 
                  checked={formData.agency} 
                  onChange={handleInputChange} 
                />
                <label htmlFor="agency" style={{ marginRight: '1.5rem' }}>Tramite Agenzia?</label>

                <input 
                  type="checkbox" 
                  id="toCall" 
                  name="toCall" 
                  checked={formData.toCall} 
                  onChange={handleInputChange} 
                />
                <label htmlFor="toCall">Da chiamare?</label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : (editingId ? <Save size={20} /> : <Plus size={20} />)}
                {isLoading ? 'Calcolo in corso...' : (editingId ? 'Salva Modifiche' : 'Aggiungi Casa')}
              </button>
              {editingId && (
                <button type="button" className="btn-secondary" onClick={cancelEdit}>
                  <X size={20} />
                  Annulla
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          {houses.length === 0 ? (
            <div className="empty-state">
              <Home className="empty-icon" />
              <h2>Nessuna casa salvata</h2>
              <p>Inizia ad aggiungere i link delle case che vi piacciono!</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Annuncio</th>
                    <th>Indirizzo & Distanza</th>
                    <th>Prezzo</th>
                    <th>Agenzia</th>
                    <th>Appuntamento</th>
                    <th>Note</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {houses.map(house => (
                    <tr key={house.id} style={editingId === house.id ? { backgroundColor: 'rgba(59, 130, 246, 0.05)' } : {}}>
                      <td>
                        <a href={house.link} target="_blank" rel="noopener noreferrer" className="link-icon">
                          <ExternalLink size={16} />
                          {getDomainName(house.link)}
                        </a>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{house.address}</div>
                        {house.duration != null && (
                          <div className="distance-info">
                            <span className="distance-time">
                              <MapPin size={12} style={{ display: 'inline', marginRight: '2px' }}/>
                              {house.duration} min
                            </span>
                            <span className="distance-meters">({house.distance} m)</span>
                          </div>
                        )}
                        {house.duration == null && house.lat == null && (
                          <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>Indirizzo non trovato</span>
                        )}
                      </td>
                      <td>{house.price ? `€${Number(house.price).toLocaleString('it-IT')}` : '-'}</td>
                      <td>
                        <span className={`status-badge ${house.agency ? 'status-yes' : 'status-no'}`}>
                          {house.agency ? 'SÌ' : 'NO'}
                        </span>
                        {house.toCall && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <span className="status-badge" style={{ background: '#fef08a', color: '#854d0e', border: '1px solid #fde047', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                              <Phone size={12} />
                              Da chiamare
                            </span>
                          </div>
                        )}
                      </td>
                      <td>
                        {house.appointment ? new Date(house.appointment).toLocaleString('it-IT', { 
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                        }) : '-'}
                      </td>
                      <td className="notes-cell">
                        {house.notes || '-'}
                      </td>
                      <td>
                        <div className="actions">
                          <button 
                            type="button" 
                            className="btn-outline" 
                            style={{ padding: '0.5rem' }}
                            onClick={() => handleEdit(house)}
                            title="Modifica"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            type="button" 
                            className="btn-danger" 
                            style={{ padding: '0.5rem' }}
                            onClick={() => handleDelete(house.id)}
                            title="Elimina"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
