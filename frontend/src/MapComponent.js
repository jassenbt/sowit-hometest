import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/area';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1IjoieWFzc2luZWJ0IiwiYSI6ImNtbDlncXMwdTAycTczZ3F1enB6YmVnb3kifQ.aGfNK7Yj53NNoPHUcB_-ig';

const fixedDrawStyles = [
    {
        id: 'gl-draw-line-active',
        type: 'line',
        filter: ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#ff9d00', 'line-dasharray': ['literal', [0.2, 2]], 'line-width': 2 }
    },
    {
        id: 'gl-draw-polygon-fill',
        type: 'fill',
        filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
        paint: { 'fill-color': '#fbb03b', 'fill-outline-color': '#fbb03b', 'fill-opacity': 0.1 }
    },
    {
        id: 'gl-draw-polygon-midpoint',
        type: 'circle',
        filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
        paint: { 'circle-radius': 3, 'circle-color': '#fbb03b' }
    },
    {
        id: 'gl-draw-polygon-and-line-vertex-active',
        type: 'circle',
        filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
        paint: { 'circle-radius': 5, 'circle-color': '#fbb03b' }
    },
    {
        id: 'gl-draw-line-static',
        type: 'line',
        filter: ['all', ['==', '$type', 'LineString'], ['==', 'mode', 'static']],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#404040', 'line-width': 2 }
    }
];

const getRandomColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 55%)`;
};

// 1. AJOUTER 'isDrawingMode' AUX PROPS
const MapComponent = ({ onSave, selectedPlot, plots, isDrawingMode }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const draw = useRef(null);

    useEffect(() => {
        if (map.current) return;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/satellite-streets-v12',
            center: [-7.6, 33.5],
            zoom: 11
        });

        draw.current = new MapboxDraw({
            displayControlsDefault: false, // Masquer les boutons par défaut car nous utilisons le bouton de la barre latérale
            controls: { polygon: true, trash: true },
            styles: fixedDrawStyles
        });
        map.current.addControl(draw.current, 'top-left');

        map.current.on('draw.create', (e) => {
            const feature = e.features[0];
            const calculatedArea = Math.round(turf.default(feature));
            onSave(feature.geometry, calculatedArea);
            draw.current.deleteAll();
        });

        map.current.on('load', () => {
            map.current.addSource('saved-plots', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });

            map.current.addLayer({
                id: 'saved-plots-fill',
                type: 'fill',
                source: 'saved-plots',
                paint: {
                    'fill-opacity': 0.7,
                    'fill-color': ['get', 'fillColor']
                }
            });

            map.current.addLayer({
                id: 'saved-plots-outline',
                type: 'line',
                source: 'saved-plots',
                paint: { 'line-color': '#ffffff', 'line-width': 2 }
            });

            map.current.on('click', 'saved-plots-fill', (e) => {
                if (!e.features.length) return;

                const feature = e.features[0];
                const props = feature.properties;
                const surfaceSqM = parseFloat(props.surface);
                const surfaceHa = (surfaceSqM / 10000).toFixed(2);

                new mapboxgl.Popup({ closeButton: true, offset: 16 })
                    .setLngLat(e.lngLat)
                    .setHTML(`
                        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#1f2933; min-width:180px;">
                            <div style="font-size:11px; text-transform:uppercase; letter-spacing:.06em; color:#9fa6b2; margin-bottom:4px;">
                                Parcelle
                            </div>
                            <h3 style="margin:0 0 6px 0; font-size:16px; font-weight:600;">${props.name}</h3>
                            <div style="font-size:12px; margin-bottom:4px; color:#52606d;">
                                <strong>Culture :</strong> ${props.culture_type}
                            </div>
                            <div style="margin-top:6px; padding:6px 8px; border-radius:6px; background:rgba(46, 204, 113, 0.08); border:1px solid rgba(39, 174, 96, 0.35);">
                                <div style="font-size:11px; text-transform:uppercase; letter-spacing:.08em; color:#27ae60;">
                                    Surface
                                </div>
                                <div style="font-size:14px; font-weight:600; color:#1b5e20;">
                                    ${surfaceHa} ha <span style="font-size:11px; color:#7b8794;">(${Math.round(surfaceSqM)} m²)</span>
                                </div>
                            </div>
                        </div>
                    `)
                    .addTo(map.current);
            });

            map.current.on('mouseenter', 'saved-plots-fill', () => {
                map.current.getCanvas().style.cursor = 'pointer';
            });
            map.current.on('mouseleave', 'saved-plots-fill', () => {
                map.current.getCanvas().style.cursor = '';
            });
        });
    }, [onSave]);

    // 2. AJOUTER CET EFFET POUR ÉCOUTER LE CLIC SUR LE BOUTON
    useEffect(() => {
        if (!draw.current) return;

        if (isDrawingMode) {
            // Activer l'outil polygone de manière programmatique
            draw.current.changeMode('draw_polygon');
        } else {
            // Revenir au mode de sélection simple
            draw.current.changeMode('simple_select');
        }
    }, [isDrawingMode]);

    useEffect(() => {
        if (!map.current || !map.current.isStyleLoaded()) return;

        const source = map.current.getSource('saved-plots');
        if (source && plots) {
            const geoJsonData = {
                type: 'FeatureCollection',
                features: plots.map((p) => {
                    const fillColor = p.fillColor || getRandomColor();
                    return {
                        type: 'Feature',
                        geometry: p.geometry,
                        properties: {
                            id: p.id,
                            name: p.name,
                            culture_type: p.culture_type || p.cultureType || 'Inconnu',
                            surface: p.surface || 0,
                            fillColor
                        }
                    };
                })
            };
            source.setData(geoJsonData);
        }
    }, [plots]);

    useEffect(() => {
        if (selectedPlot && map.current) {
            const firstCoord = selectedPlot.geometry.coordinates[0][0];
            map.current.flyTo({ center: firstCoord, zoom: 16, speed: 1.5, essential: true });
        }
    }, [selectedPlot]);

    return (
        <div style={{ position: 'relative', height: '100%', width: '100%' }}>
            <div
                style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    zIndex: 10,
                    backgroundColor: 'rgba(15,23,42,0.9)',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#e5e7eb',
                    boxShadow: '0 10px 25px rgba(15,23,42,0.35)',
                    maxWidth: 240,
                    backdropFilter: 'blur(6px)'
                }}
            >
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                    Parcelles
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                    <span
                        style={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            marginRight: 8,
                            background:
                                'conic-gradient(from 0deg, #e74c3c, #f1c40f, #2ecc71, #3498db, #9b59b6, #e67e22, #e74c3c)'
                        }}
                    ></span>
                    <span>Chaque parcelle possède une couleur unique aléatoire.</span>
                </div>
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
                    Cliquez sur une parcelle pour voir le détail de la culture et de la surface.
                </div>
            </div>

            <div
                ref={mapContainer}
                style={{
                    height: '100%',
                    width: '100%',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 12px 30px rgba(15,23,42,0.35)'
                }}
            />
        </div>
    );
};

export default MapComponent;