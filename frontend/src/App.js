import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import MapComponent from './MapComponent';

function App() {
    const [plots, setPlots] = useState([]);
    const [selectedPlot, setSelectedPlot] = useState(null);
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [tempPlotData, setTempPlotData] = useState(null);
    const [formData, setFormData] = useState({
        name: '', cultureType: 'Blé', description: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchPlots();
    }, []);

    const fetchPlots = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/plots/');
            setPlots(response.data);
        } catch (err) {
            console.error("Erreur lors de la récupération des parcelles", err);
        }
    };

    const handleInitiateSave = (geometry, area) => {
        setTempPlotData({ geometry, area });
        setIsFormOpen(true);
        setIsDrawingMode(false);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        
        const newPlot = {
            name: formData.name,
            description: formData.description || "Aucune description",
            culture_type: formData.cultureType, 
            surface: tempPlotData.area,        
            geometry: tempPlotData.geometry
        };

        try {
            await axios.post('http://localhost:8000/api/plots/', newPlot);
            fetchPlots(); 
            setIsFormOpen(false);
            setFormData({ name: '', cultureType: 'Blé', description: '' });
            setTempPlotData(null);
        } catch (err) {
            console.error("Erreur lors de l'enregistrement de la parcelle", err);
        }
    };

    const handleStartDrawing = () => {
        setIsDrawingMode(true);
        setSelectedPlot(null);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const geojson = JSON.parse(text);
            
            // Gérer Feature et FeatureCollection
            let geometry;
            if (geojson.type === 'FeatureCollection' && geojson.features?.length > 0) {
                geometry = geojson.features[0].geometry;
            } else if (geojson.type === 'Feature') {
                geometry = geojson.geometry;
            } else if (geojson.type === 'Polygon' || geojson.type === 'MultiPolygon') {
                geometry = geojson;
            } else {
                alert('Format GeoJSON invalide. Veuillez importer un polygone valide.');
                return;
            }

            // Calcul simple de la surface (approximation en m²)
            const area = calculatePolygonArea(geometry);
            
            setTempPlotData({ geometry, area });
            setIsFormOpen(true);
        } catch (err) {
            console.error('Erreur lors de la lecture du GeoJSON :', err);
            alert('Échec de la lecture du fichier GeoJSON. Veuillez vérifier le format.');
        }

        // Réinitialiser le champ de fichier
        e.target.value = '';
    };

    const calculatePolygonArea = (geometry) => {
        if (geometry.type !== 'Polygon') return 0;
        
        const coords = geometry.coordinates[0];
        let area = 0;
        
        for (let i = 0; i < coords.length - 1; i++) {
            const [x1, y1] = coords[i];
            const [x2, y2] = coords[i + 1];
            area += x1 * y2 - x2 * y1;
        }
        
        // Conversion des degrés vers une approximation en m²
        area = Math.abs(area / 2) * 111320 * 111320 * Math.cos((coords[0][1] * Math.PI) / 180);
        return area;
    };

    const cultureColors = {
        'Blé': { bg: 'rgba(251, 191, 36, 0.15)', text: '#d97706', border: 'rgba(251, 191, 36, 0.4)' },
        'Maïs': { bg: 'rgba(239, 68, 68, 0.15)', text: '#dc2626', border: 'rgba(239, 68, 68, 0.4)' },
        'Oliviers': { bg: 'rgba(34, 197, 94, 0.15)', text: '#16a34a', border: 'rgba(34, 197, 94, 0.4)' },
        'Maraîchage': { bg: 'rgba(168, 85, 247, 0.15)', text: '#9333ea', border: 'rgba(168, 85, 247, 0.4)' }
    };

    const filteredPlots = plots.filter(plot => {
        const term = searchTerm.toLowerCase();
        const culture = (plot.cultureType || plot.culture_type || '').toLowerCase();
        return plot.name.toLowerCase().includes(term) || culture.includes(term);
    });

    return (
        <div style={{ 
            display: 'flex', 
            height: '100vh', 
            width: '100vw', 
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            background: '#f5f5f5'
        }}>
            
            {/* Champ de fichier caché pour l'import */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".json,.geojson"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
            />

            {/* Barre latérale */}
            <div style={{ 
                width: '400px', 
                background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)', 
                display: 'flex', 
                flexDirection: 'column', 
                zIndex: 2,
                borderRight: '1px solid rgba(0,0,0,0.08)'
            }}>
              
                                <div style={{ 
                                    padding: '24px 28px', 
                                    borderBottom: '1px solid rgba(0,0,0,0.08)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <div style={{ 
                                            width: '80px', height: '80px', 
                                            borderRadius: '14px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '24px',
                                            overflow: 'hidden',
                                            background: '#fff'
                                        }}>
                                            <img
                                                src={require('./assets/logo/logo.png')}
                                                alt="SOWIT"
                                                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                                            />
                                        </div>
                                        <div>
                                            <p style={{ 
                                                margin: 0, 
                                                fontSize: '13px', 
                                                color: 'rgba(0,0,0,0.5)',
                                                fontWeight: '400'
                                            }}>Gestionnaire de parcelles agricoles</p>
                                        </div>
                                    </div>
                                </div>
                <div style={{ 
                    padding: '20px 28px 12px',
                    display: 'flex',
                    gap: '10px'
                }}>
                    <button
                        onClick={handleStartDrawing}
                        style={{
                            flex: 1,
                            padding: '14px 16px',
                            background: isDrawingMode 
                                ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                                : '#ffffff',
                            color: isDrawingMode ? '#ffffff' : '#1a1a1a',
                            border: isDrawingMode 
                                ? 'none' 
                                : '1px solid rgba(0,0,0,0.15)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease',
                            boxShadow: isDrawingMode 
                                ? '0 8px 24px rgba(34, 197, 94, 0.3)' 
                                : '0 2px 8px rgba(0,0,0,0.04)'
                        }}
                        onMouseEnter={e => {
                            if (!isDrawingMode) {
                                e.currentTarget.style.background = '#f5f5f5';
                                e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.5)';
                            }
                        }}
                        onMouseLeave={e => {
                            if (!isDrawingMode) {
                                e.currentTarget.style.background = '#ffffff';
                                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)';
                            }
                        }}
                    >
                        <span style={{ fontSize: '16px' }}>➕</span>
                        {isDrawingMode ? 'Dessin en cours...' : 'Ajouter une parcelle'}
                    </button>
                </div>

                {/* Barre de recherche */}
                <div style={{ padding: '8px 28px 16px' }}>
                    <div style={{ position: 'relative' }}>
                        <span style={{ 
                            position: 'absolute', 
                            left: '16px', 
                            top: '50%', 
                            transform: 'translateY(-50%)',
                            color: 'rgba(0,0,0,0.4)',
                            fontSize: '16px'
                        }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Rechercher une parcelle..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '14px 16px 14px 48px',
                                background: 'rgba(0,0,0,0.04)',
                                border: '1px solid rgba(0,0,0,0.1)',
                                borderRadius: '12px',
                                color: '#1a1a1a',
                                fontSize: '14px',
                                outline: 'none',
                                boxSizing: 'border-box',
                                transition: 'all 0.2s ease'
                            }}
                            onFocus={e => {
                                e.target.style.background = '#ffffff';
                                e.target.style.borderColor = 'rgba(34, 197, 94, 0.5)';
                                e.target.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)';
                            }}
                            onBlur={e => {
                                e.target.style.background = 'rgba(0,0,0,0.04)';
                                e.target.style.borderColor = 'rgba(0,0,0,0.1)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>
                </div>

                {/* Cartes de statistiques */}
                <div style={{ 
                    padding: '0 28px 20px',
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px'
                }}>
                    <div style={{ 
                        padding: '20px',
                        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.06) 100%)',
                        borderRadius: '16px',
                        border: '1px solid rgba(34, 197, 94, 0.2)'
                    }}>
                        <div style={{ 
                            fontSize: '32px', 
                            fontWeight: '700', 
                            color: '#16a34a',
                            letterSpacing: '-1px'
                        }}>{plots.length}</div>
                        <div style={{ 
                            fontSize: '12px', 
                            color: 'rgba(0,0,0,0.5)', 
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginTop: '4px'
                        }}>Parcelles totales</div>
                    </div>
                    <div style={{ 
                        padding: '20px',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.06) 100%)',
                        borderRadius: '16px',
                        border: '1px solid rgba(59, 130, 246, 0.2)'
                    }}>
                        <div style={{ 
                            fontSize: '32px', 
                            fontWeight: '700', 
                            color: '#2563eb',
                            letterSpacing: '-1px'
                        }}>
                            {(plots.reduce((acc, p) => acc + (p.surface || 0), 0) / 10000).toFixed(1)}
                        </div>
                        <div style={{ 
                            fontSize: '12px', 
                            color: 'rgba(0,0,0,0.5)', 
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginTop: '4px'
                        }}>Hectares</div>
                    </div>
                </div>

                {/* Titre de section */}
                <div style={{ 
                    padding: '0 28px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span style={{ 
                        fontSize: '12px', 
                        color: 'rgba(0,0,0,0.5)', 
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        fontWeight: '600'
                    }}>Vos parcelles</span>
                    <span style={{ 
                        fontSize: '12px', 
                        color: 'rgba(0,0,0,0.4)'
                    }}>{filteredPlots.length} éléments</span>
                </div>

                {/* Liste des parcelles */}
                <div style={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    padding: '0 28px 28px',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(0,0,0,0.15) transparent'
                }}>
                    {filteredPlots.length === 0 && (
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '60px 20px', 
                            color: 'rgba(0,0,0,0.4)'
                        }}>
                            <div style={{ 
                                width: '80px', 
                                height: '80px', 
                                margin: '0 auto 20px',
                                background: 'rgba(0,0,0,0.05)',
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '36px'
                            }}>🗺️</div>
                            <p style={{ margin: 0, fontWeight: '500', color: 'rgba(0,0,0,0.6)' }}>Aucune parcelle trouvée</p>
                            <p style={{ margin: '8px 0 0', fontSize: '13px' }}>Cliquez sur "Dessiner une parcelle" ou importez un fichier GeoJSON.</p>
                        </div>
                    )}
                    
                    {filteredPlots.map(plot => {
                        const culture = plot.cultureType || plot.culture_type;
                        const colors = cultureColors[culture] || { bg: 'rgba(120,120,120,0.15)', text: '#666', border: 'rgba(120,120,120,0.3)' };
                        const isSelected = selectedPlot?.id === plot.id;
                        
                        return (
                            <div 
                                key={plot.id} 
                                onClick={() => setSelectedPlot(plot)}
                                style={{
                                    background: isSelected 
                                        ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.06) 100%)' 
                                        : '#ffffff',
                                    padding: '20px', 
                                    marginBottom: '10px',
                                    borderRadius: '16px', 
                                    cursor: 'pointer',
                                    border: isSelected 
                                        ? '1px solid rgba(34, 197, 94, 0.4)' 
                                        : '1px solid rgba(0,0,0,0.08)',
                                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: isSelected ? '0 4px 12px rgba(34, 197, 94, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)'
                                }}
                                onMouseEnter={e => {
                                    if (!isSelected) {
                                        e.currentTarget.style.background = '#fafafa';
                                        e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)';
                                        e.currentTarget.style.transform = 'translateX(4px)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!isSelected) {
                                        e.currentTarget.style.background = '#ffffff';
                                        e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)';
                                        e.currentTarget.style.transform = 'translateX(0)';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                                    }
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ 
                                            margin: 0, 
                                            fontSize: '15px', 
                                            color: '#1a1a1a', 
                                            fontWeight: '600',
                                            letterSpacing: '-0.2px'
                                        }}>{plot.name}</h3>
                                        <div style={{ 
                                            marginTop: '8px', 
                                            display: 'flex', 
                                            alignItems: 'center',
                                            gap: '6px',
                                            fontSize: '13px', 
                                            color: 'rgba(0,0,0,0.5)' 
                                        }}>
                                            <span style={{ fontSize: '14px' }}>📐</span>
                                            <span>{(plot.surface/10000).toFixed(2)} ha</span>
                                        </div>
                                    </div>
                                    <span style={{ 
                                        fontSize: '11px', 
                                        padding: '6px 12px', 
                                        borderRadius: '20px',
                                        background: colors.bg,
                                        color: colors.text,
                                        fontWeight: '600',
                                        border: `1px solid ${colors.border}`,
                                        letterSpacing: '0.2px'
                                    }}>
                                        {plot.cultureType || plot.culture_type}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Section carte */}
            <div style={{ flex: 1, position: 'relative' }}>
                <MapComponent 
                    onSave={handleInitiateSave} 
                    selectedPlot={selectedPlot}
                    plots={plots}
                    isDrawingMode={isDrawingMode}
                    onCancelDrawing={() => setIsDrawingMode(false)}
                />

                {/* Indicateur de mode dessin */}
                {isDrawingMode && (
                    <div style={{
                        position: 'absolute',
                        top: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        color: 'white',
                        padding: '12px 24px',
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(34, 197, 94, 0.3)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}>
                        <span style={{ fontSize: '18px' }}>✏️</span>
                        Mode dessin - Cliquez sur la carte pour tracer un polygone
                        <button
                            onClick={() => setIsDrawingMode(false)}
                            style={{
                                marginLeft: '12px',
                                padding: '6px 12px',
                                background: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.3)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '500'
                            }}
                        >
                            Annuler
                        </button>
                    </div>
                )}

                {/* Fenêtre modale du formulaire */}
                {isFormOpen && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.4)', 
                        backdropFilter: 'blur(8px)',
                        zIndex: 1000,
                        display: 'flex', justifyContent: 'center', alignItems: 'center'
                    }}>
                        <div style={{ 
                            backgroundColor: '#ffffff', 
                            padding: '36px', 
                            borderRadius: '24px', 
                            width: '440px',
                            boxShadow: '0 32px 64px rgba(0,0,0,0.2)',
                            border: '1px solid rgba(0,0,0,0.08)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.1))',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '20px'
                                }}>💾</div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1a1a1a', letterSpacing: '-0.3px' }}>
                                        Enregistrer une nouvelle parcelle
                                    </h3>
                                    <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'rgba(0,0,0,0.5)' }}>
                                        Ajoutez des détails sur votre parcelle
                                    </p>
                                </div>
                            </div>
                            
                            <div style={{ 
                                marginBottom: '28px', 
                                padding: '20px', 
                                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.06) 100%)', 
                                borderRadius: '16px',
                                border: '1px solid rgba(34, 197, 94, 0.2)'
                            }}>
                                <div style={{ fontSize: '12px', color: '#16a34a', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Surface calculée</div>
                                <div style={{ fontSize: '36px', fontWeight: '700', color: '#16a34a', letterSpacing: '-1px' }}>
                                    {(tempPlotData?.area / 10000).toFixed(2)} <span style={{ fontSize: '18px', fontWeight: '500' }}>ha</span>
                                </div>
                                <div style={{ fontSize: '13px', color: 'rgba(0,0,0,0.5)', marginTop: '4px' }}>{tempPlotData?.area?.toLocaleString()} m²</div>
                            </div>

                            <form onSubmit={handleFormSubmit}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: 'rgba(0,0,0,0.7)' }}>
                                    Nom de la parcelle
                                </label>
                                <input 
                                    required 
                                    type="text" 
                                    placeholder="Saisissez le nom de la parcelle..."
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    style={{
                                        width: '100%', padding: '14px 18px', marginBottom: '20px', 
                                        boxSizing: 'border-box', 
                                        border: '1px solid rgba(0,0,0,0.15)', 
                                        borderRadius: '12px',
                                        fontSize: '14px', 
                                        transition: 'all 0.2s ease',
                                        outline: 'none',
                                        background: '#ffffff',
                                        color: '#1a1a1a'
                                    }}
                                    onFocus={e => {
                                        e.target.style.borderColor = 'rgba(34, 197, 94, 0.5)';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)';
                                    }}
                                    onBlur={e => {
                                        e.target.style.borderColor = 'rgba(0,0,0,0.15)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />

                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: 'rgba(0,0,0,0.7)' }}>
                                    Type de culture
                                </label>
                                <select 
                                    value={formData.cultureType}
                                    onChange={e => setFormData({...formData, cultureType: e.target.value})}
                                    style={{
                                        width: '100%', padding: '14px 18px', marginBottom: '20px', 
                                        boxSizing: 'border-box', 
                                        border: '1px solid rgba(0,0,0,0.15)', 
                                        borderRadius: '12px',
                                        fontSize: '14px', 
                                        backgroundColor: '#ffffff', 
                                        color: '#1a1a1a',
                                        cursor: 'pointer',
                                        appearance: 'none',
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 12px center',
                                        backgroundSize: '18px'
                                    }}
                                >
                                    <option style={{ background: '#ffffff' }}>Blé</option>
                                    <option style={{ background: '#ffffff' }}>Maïs</option>
                                    <option style={{ background: '#ffffff' }}>Maïs</option>
                                    <option style={{ background: '#ffffff' }}>Oliviers</option>
                                    <option style={{ background: '#ffffff' }}>Maraîchage</option>
                                </select>

                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: 'rgba(0,0,0,0.7)' }}>
                                    Description <span style={{ color: 'rgba(0,0,0,0.4)' }}>(optional)</span>
                                </label>
                                <textarea 
                                    placeholder="Add notes about this plot..."
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    style={{
                                        width: '100%', padding: '14px 18px', marginBottom: '28px', 
                                        boxSizing: 'border-box', 
                                        border: '1px solid rgba(0,0,0,0.15)', 
                                        borderRadius: '12px',
                                        fontSize: '14px', 
                                        height: '100px', 
                                        resize: 'none', 
                                        fontFamily: 'inherit',
                                        background: '#ffffff',
                                        color: '#1a1a1a',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onFocus={e => {
                                        e.target.style.borderColor = 'rgba(34, 197, 94, 0.5)';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)';
                                    }}
                                    onBlur={e => {
                                        e.target.style.borderColor = 'rgba(0,0,0,0.15)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            setIsFormOpen(false);
                                            setTempPlotData(null);
                                        }} 
                                        style={{
                                            padding: '14px 28px', 
                                            background: '#f5f5f5', 
                                            color: 'rgba(0,0,0,0.7)',
                                            border: '1px solid rgba(0,0,0,0.1)', 
                                            borderRadius: '12px', 
                                            cursor: 'pointer',
                                            fontSize: '14px', 
                                            fontWeight: '500', 
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={e => {
                                            e.target.style.background = '#eeeeee';
                                            e.target.style.borderColor = 'rgba(0,0,0,0.15)';
                                        }}
                                        onMouseLeave={e => {
                                            e.target.style.background = '#f5f5f5';
                                            e.target.style.borderColor = 'rgba(0,0,0,0.1)';
                                        }}
                                    >
                                        Annuler
                                    </button>
                                    <button 
                                        type="submit" 
                                        style={{
                                            padding: '14px 32px', 
                                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', 
                                            color: 'white',
                                            border: 'none', 
                                            borderRadius: '12px', 
                                            cursor: 'pointer',
                                            fontSize: '14px', 
                                            fontWeight: '600', 
                                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: '0 8px 32px rgba(34, 197, 94, 0.3)',
                                            letterSpacing: '0.2px'
                                        }}
                                        onMouseEnter={e => { 
                                            e.target.style.transform = 'translateY(-2px) scale(1.02)'; 
                                            e.target.style.boxShadow = '0 12px 40px rgba(34, 197, 94, 0.4)'; 
                                        }}
                                        onMouseLeave={e => { 
                                            e.target.style.transform = 'translateY(0) scale(1)'; 
                                            e.target.style.boxShadow = '0 8px 32px rgba(34, 197, 94, 0.3)'; 
                                        }}
                                    >
                                        Sauvegarder
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;