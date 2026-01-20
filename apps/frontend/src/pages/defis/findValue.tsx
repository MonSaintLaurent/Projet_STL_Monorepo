// Version 1 : Interface de fin améliorée avec image, score basé sur distance + temps
import { useEffect, useState, useMemo, useRef } from "react";
import DeckGL from "@deck.gl/react";
import { GeoJsonLayer } from "@deck.gl/layers";
import { Map } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import Legend from "@/components/legend";
import maplibregl from "maplibre-gl";
import { Button } from "@heroui/button";
import DefaultLayout from "@/layouts/default";
import "@/styles/inDefi.css";
import tickSound from "@/sounds/tick.mp3";

export default function FindValuedefi() {
  const [maps, setMaps] = useState<any[]>([]);
  const [currentMapId, setCurrentMapId] = useState<number>(maps[0]?.id ?? 1);

  const [currentMap, setCurrentMap] = useState<1 | 2>(1); // Choix carte/niveau
  const [geojsonData, setGeojsonData] = useState<any>(null);
  const [thresholds, setThresholds] = useState<number[]>([]);
  const [maxDisplay, setMaxDisplay] = useState<number>(0);
  const [selectedPoint, setSelectedPoint] = useState<any>(null);

  const mapConfig = maps.find(m => m.id === currentMapId);
  
  const deckRef = useRef<any>(null);

  const [timeLeft, setTimeLeft] = useState(mapConfig?.timer ?? 90);
  const [timeUp, setTimeUp] = useState(false);

  const [validationResult, setValidationResult] = useState<any>(null);

  const [deckKey, setDeckKey] = useState(0);

  useEffect(() => {
    fetch("http://localhost:8000/data/findvalue/maps")
      .then(res => res.json())
      .then(json => {
        setMaps(json);

        if (json.length > 0) {
          const firstMap = json[0];
          setCurrentMapId(firstMap.id);       // init currentMapId
          setTimeLeft(firstMap.timer);        // init timer depuis DB
          setThresholds(firstMap.thresholds); // init seuils depuis DB
        }
      })
      .catch(err => console.error("Erreur fetch maps:", err));
  }, []);


  const resetdefi = () => {
    setSelectedPoint(null);
    setTimeUp(false);
    setValidationResult(null);

    // retrouver la map actuelle
    const map = maps.find(m => m.id === currentMapId);
    if (map) {
      setTimeLeft(map.timer);       // reset timer depuis DB
      setThresholds(map.thresholds); // reset seuils depuis DB
    }

    setDeckKey(prev => prev + 1);

    fetch(`http://localhost:8000/data/findvalue/map/${currentMapId}`)
      .then(res => res.json())
      .then(json => setGeojsonData(json))
      .catch(err => console.error("Erreur fetch GeoJSON:", err));
  };


  const tickAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    tickAudio.current = new Audio(tickSound);
  }, []);

  useEffect(() => {
    if (mapConfig && timeLeft <= (mapConfig.tick_alert ?? 10) && timeLeft > 0) {
      tickAudio.current?.play().catch(() => {});
    }
  }, [timeLeft, mapConfig]);

  // Logique Timer
  useEffect(() => {
    if (timeUp) return;

    const interval = setInterval(() => {
      setTimeLeft((prev: number) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeUp]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };


  // Charger les points GeoJSON pour la map actuelle
  useEffect(() => {
    if (!currentMapId) return;

    fetch(`http://localhost:8000/data/findvalue/map/${currentMapId}`)
      .then(res => res.json())
      .then(json => setGeojsonData(json))
      .catch(err => console.error("Erreur chargement GeoJSON:", err));
  }, [currentMapId]);


  // Layers DeckGL
  const layers = useMemo(() => {
    if (!geojsonData) return [];

    const baseLayer = new GeoJsonLayer({
      id: "geojson-points",
      data: geojsonData,
      pointType: "circle",
      filled: true,
      stroked: false,
      pickable: true,
      getPointRadius: 100,
      getFillColor: (f: any) => {
        if (!thresholds || thresholds.length < 3) return [0, 0, 255, 200]; // par défaut bleu
        const velocity = f.properties?.velocity ?? 0;
        if (velocity < thresholds[0]) return [0, 0, 255, 200];
        if (velocity < thresholds[1]) return [0, 255, 0, 200];
        if (velocity < thresholds[2]) return [255, 255, 0, 200];
        return [255, 0, 0, 200];
      },
      onClick: (info: any) => {
        if (info.object) setSelectedPoint(info.object);
      },
    });

    const selectionLayer =
      selectedPoint &&
      new GeoJsonLayer({
        id: "selection-layer",
        data: { type: "FeatureCollection", features: [selectedPoint] },
        pointType: "circle",
        filled: true,
        stroked: true,
        getPointRadius: 120,
        getFillColor: [0, 0, 0, 255],
        getLineColor: [255, 255, 255, 255],
        lineWidthMinPixels: 2,
      });

    return selectionLayer ? [baseLayer, selectionLayer] : [baseLayer];
  }, [geojsonData, thresholds, selectedPoint]);


  if (timeUp) {
    const imageUrl = "http://localhost:8000/static/defis/findValueImage.png";

    const progressPercent = validationResult 
      ? Math.min(100, (validationResult.final_score / validationResult.max_score) * 100)
      : 0;

    return (
      <DefaultLayout fullScreen>
        <div className="defi-fullscreen" style={{backgroundColor: "#f3f4f6"}}>
          <div className="defi-result-modal" style={{maxWidth: "600px"}}>
            {/* Badge RÉSULTATS */}
            <div style={{
              position: "absolute",
              top: "-20px",
              left: "20px",
              backgroundColor: "#1e40af",
              color: "white",
              padding: "8px 24px",
              borderRadius: "1.5rem",
              fontSize: "0.875rem",
              fontWeight: "bold",
              letterSpacing: "0.05em"
            }}>
              RÉSULTATS
            </div>

            {/* Titre du défi avec image */}
            <div style={{
              backgroundColor: "#2563eb",
              color: "white",
              padding: "20px",
              borderRadius: "1.5rem 1.5rem 0 0",
              fontSize: "1.25rem",
              fontWeight: "bold",
              textAlign: "center",
              marginTop: "20px"
            }}>
              {mapConfig?.name || "Trouver l'emplacement ou la vitesse est la plus grande"}
            </div>

            {/* Image du défi */}
            {imageUrl && (
              <div style={{
                width: "200px",
                height: "200px",
                margin: "20px auto",
                backgroundColor: "#e5e7eb",
                borderRadius: "1rem",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <img 
                  src={imageUrl} 
                  alt={mapConfig?.name}
                  style={{width: "100%", height: "100%", objectFit: "cover"}}
                />
              </div>
            )}

            {/* Score */}
            {validationResult && (
              <div style={{fontSize: "3rem", fontWeight: "bold", color: "#22c55e", margin: "20px 0"}}>
                {validationResult.final_score}/{validationResult.max_score} points
              </div>
            )}

            {/* Barre de progression */}
            {validationResult && (
              <div style={{
                width: "100%",
                height: "30px",
                backgroundColor: "#e5e7eb",
                borderRadius: "1rem",
                overflow: "hidden",
                marginBottom: "20px"
              }}>
                <div style={{
                  width: `${progressPercent}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)",
                  transition: "width 1s ease-out"
                }} />
              </div>
            )}

            {/* Détails */}
            <p style={{fontSize: "1rem", color: "#374151", margin: "10px 0"}}>
              {validationResult 
                ? `Vous étiez à ${validationResult.distance_m.toFixed(0)} mètres du point d'aujourd'hui`
                : selectedPoint
                  ? `Vous avez sélectionné un point à ${selectedPoint?.properties.velocity?.toFixed(2)} m/s`
                  : "Aucun point sélectionné"
              }
            </p>

            {validationResult && (
              <div style={{fontSize: "0.875rem", color: "#6b7280", marginTop: "10px"}}>
                <div>📍 Score distance: {validationResult.distance_score} pts</div>
                <div>⏱️ Bonus temps: {validationResult.time_bonus} pts</div>
              </div>
            )}

            {/* Boutons */}
            <div className="result-buttons" style={{marginTop: "30px"}}>
              <button onClick={resetdefi}>Réessayer</button>
              <button onClick={() => window.location.href = mapConfig?.home_url ?? "/"}>
                Retour à l'accueil
              </button>
              <button 
                style={{backgroundColor: "#2563eb"}}
                onClick={() => {/* TODO: Partager */}}
              >
                Partager 🔗
              </button>
            </div>
          </div>
        </div>
      </DefaultLayout>
    );
  }


  return (
    <DefaultLayout fullScreen>
      <div style={{width: "100vw", height: "100vh", position: "relative"}}>
        <div className={`defi-timer ${mapConfig && timeLeft > 0 && timeLeft <= mapConfig.tick_alert ? "alert" : ""}`}>
          ⏱️ {formatTime(timeLeft)}
        </div>

        <DeckGL
          ref={deckRef}
          key={deckKey}
          initialViewState={mapConfig?.initial_view_state}
          controller={true}
          layers={geojsonData ? layers : []}
          style={{position: "absolute", top: "0", left: "0", width: "100%", height: "100%" }}
          getTooltip={({ object }) => {
            if (!object) return null;
            const velocity = object.properties?.velocity ?? 0;
            return `Vitesse t=1: ${velocity.toFixed(2)} m/s`;
          }}
        >
          <Map
            mapLib={maplibregl}
            mapStyle={{
              version: 8,
              sources: {
                osm: {
                  type: "raster",
                  tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
                  tileSize: 256,
                  attribution: "&copy; OpenStreetMap Contributors",
                  maxzoom: 19,
                },
              },
              layers: [
                {
                  id: "osm",
                  type: "raster",
                  source: "osm",
                  minzoom: 0,
                  maxzoom: 22,
                },
              ],
            }}
          />
        </DeckGL>

        {/* Légende */}
        <div style={{position: "absolute", bottom: 140, left: 53, zIndex: 1000}}>
          <Legend
            quantiles={thresholds}
            colorScale={[
              [0, 0, 255],   // bleu
              [0, 255, 0],   // vert
              [255, 255, 0], // jaune
              [255, 0, 0],   // rouge
            ]}
          />
        </div>

        {/* Bouton Valider */}
        <div style={{position: "absolute", bottom: 60, left: 20, zIndex: 1000}}>
          <Button
            size="lg"
            disabled={!selectedPoint}
            className="defi-validate-btn"
            onPress={() => {
              if (!selectedPoint) return;

              fetch(`http://localhost:8000/data/findvalue/map/${currentMapId}/validate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                  longitude: selectedPoint.geometry.coordinates[0],
                  latitude: selectedPoint.geometry.coordinates[1],
                  time_left: timeLeft
                })
              })
              .then(res => res.json())
              .then(json => {
                setTimeUp(true);
                setValidationResult(json);
              })
              .catch(err => console.error("Erreur validation:", err));
            }}
          >
            {selectedPoint ? "VALIDER" : "SÉLECTIONNER UN POINT"}
          </Button>
        </div>
      </div>
    </DefaultLayout>
  );
}