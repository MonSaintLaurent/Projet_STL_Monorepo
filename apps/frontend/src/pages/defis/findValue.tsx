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
import {useAuth0} from "@auth0/auth0-react";
import Objectif from "@/components/objective";
import {defis} from "@/data/defis.json";

export default function FindValuedefi() {
  const [maps, setMaps] = useState<any[]>([]);
  const [currentMapId, setCurrentMapId] = useState<number | null>(null); // Null au départ
  const [geojsonData, setGeojsonData] = useState<any>(null);
  const [thresholds, setThresholds] = useState<number[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<any>(null);

  const mapConfig = maps.find(m => m.id === currentMapId);
  
  const deckRef = useRef<any>(null);

  const [timeLeft, setTimeLeft] = useState(90); // Valeur par défaut fixe mais vraie valeur dans DB après
  const [timeUp, setTimeUp] = useState(false);

  const [validationResult, setValidationResult] = useState<any>(null);
  const {isAuthenticated, getAccessTokenSilently} = useAuth0();

  const [deckKey, setDeckKey] = useState(0);

  // Récupérer l'objectif depuis defis.json pour le défi FindValue (id = 2)
  const defiData = defis.find(d => d.id === 2);
  const objective = defiData?.objective || "Trouver l'emplacement où la vitesse est la plus grande";

  // Charger les maps au démarrage
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

  // Créer session si user connecté
  useEffect(() => {
    async function prepareDefi() {
      if (!mapConfig || !isAuthenticated) return;

      try {
        const token = await getAccessTokenSilently();
        await fetch(`http://localhost:8000/defi_sessions/start/${mapConfig.id}`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${token}` 
          },
        });
      } catch (err) {
        console.error("Erreur création session:", err);
      }
    }

    prepareDefi();
  }, [mapConfig, isAuthenticated, getAccessTokenSilently]);


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

    if (currentMapId) {
      fetch(`http://localhost:8000/data/findvalue/map/${currentMapId}`)
        .then(res => res.json())
        .then(json => setGeojsonData(json))
        .catch(err => console.error("Erreur fetch GeoJSON:", err));
    }
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

  // Soumettre le score
  useEffect(() => {
    if (!timeUp || !validationResult || !isAuthenticated || !mapConfig) return;

    async function submitScore() {
      try {
        const token = await getAccessTokenSilently();
        const response = await fetch(`http://localhost:8000/defi_sessions/finish`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            defi_id: 2,
            score: validationResult.final_score,
            time_spent: mapConfig.timer - timeLeft,
            completed: validationResult.won,
            metadata: { 
              distance_m: validationResult.distance_m,
              distance_score: validationResult.distance_score,
              time_bonus: validationResult.time_bonus
            },
          }),
        });

        const result = await response.json();
        if (result.is_new_record) {
          console.log("Nouveau record !", result.record.best_score);
        }
      } catch (err) {
        console.error("Erreur soumission score:", err);
      }
    }

    submitScore();
  }, [timeUp, validationResult, isAuthenticated, mapConfig, timeLeft, getAccessTokenSilently]);

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
        getPointRadius: 250,
        getFillColor: [0, 0, 0, 255],
        getLineColor: [255, 255, 255, 255],
        lineWidthMinPixels: 3,
      });

    return selectionLayer ? [baseLayer, selectionLayer] : [baseLayer];
  }, [geojsonData, thresholds, selectedPoint]);

  // Afficher un loading si mapConfig n'est pas encore chargé
  if (!mapConfig) {
    return (
      <DefaultLayout fullScreen>
        <div style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px"
        }}>
          Chargement...
        </div>
      </DefaultLayout>
    );
  }

  if (timeUp) {
    const imageUrl = "http://localhost:8000/static/defis/findValueImage.png";

    const progressPercent = validationResult 
      ? Math.min(100, (validationResult.final_score / validationResult.max_score) * 100)
      : 0;

    return (
      <DefaultLayout fullScreen>
        <div
          style={{
            width: "100%",
            minHeight: "calc(100vh - 64px)",
            background: "white",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 32,
            padding: "40px 20px",
            overflowY: "auto"
          }}
        >
          {/* Objectif */}
          <Objectif objective={objective} mode="fin"/>

          {/* Image du défi */}
          {imageUrl && (
            <div style={{
              width: "250px",
              height: "250px",
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
            <div style={{fontSize: "48px", fontWeight: "bold", color: "#22c55e"}}>
              {isAuthenticated ? (
                <>{validationResult.final_score}/{validationResult.max_score} points</>
              ) : (
                <>{validationResult.final_score} points (anonyme)</>
              )}
            </div>
          )}

          {/* Barre de progression */}
          {validationResult && (
            <div style={{
              width: "400px",
              height: "20px",
              backgroundColor: "#e5e7eb",
              borderRadius: "10px",
              overflow: "hidden"
            }}>
              <div style={{
                width: `${progressPercent}%`,
                height: "100%",
                background: "#22c55e",
                transition: "width 0.5s ease"
              }} />
            </div>
          )}

          {/* Distance */}
          <div style={{
            background: "#dcfce7",
            padding: "12px 24px",
            borderRadius: 8,
            fontSize: 18,
            color: "#166534"
          }}>
            {validationResult 
              ? `📍 Vous étiez à ${validationResult.distance_m.toFixed(0)} mètres du point optimal`
              : selectedPoint
                ? `Vous avez sélectionné un point à ${selectedPoint?.properties.velocity?.toFixed(2)} m/s`
                : "Aucun point sélectionné"
            }
          </div>

          {/* Détails du score */}
          {validationResult && (
            <div style={{
              background: "#f3f4f6",
              padding: "12px 24px",
              borderRadius: 8,
              fontSize: 16,
              color: "#374151"
            }}>
              <div>📍 Score distance: {validationResult.distance_score} pts</div>
              <div>⏱️ Bonus temps: {validationResult.time_bonus} pts</div>
            </div>
          )}

          {/* Boutons */}
          <div style={{display: "flex", gap: 20, marginTop: 20}}>
            <Button 
              size="lg" 
              className="bg-gray-300 text-black font-bold hover:bg-gray-400"
              onPress={() => window.location.href = mapConfig?.home_url ?? "/"}
            >
              Retour à l'accueil
            </Button>
            <Button 
              size="lg" 
              className="bg-purple-600 text-white font-bold hover:bg-purple-700"
              onPress={() => window.location.href = "/defis"}
            >
              Jouer à un autre Jeu
            </Button>
            <Button 
              size="lg" 
              className="bg-blue-600 text-white font-bold hover:bg-blue-700"
              onPress={resetdefi}
            >
              Rejouer
            </Button>
          </div>
        </div>
      </DefaultLayout>
    );
  }


  return (
    <DefaultLayout fullScreen>
      <div>
        {/* Composant Objectif bulle */}
        <Objectif
          objective={objective}
          mode="jeu"
          style={{
            position: "fixed",
            top: 50,
            left: 20,
            zIndex: 2000,
          }}
        />
      </div>

      <div style={{width: "100vw", height: "100vh", position: "relative"}}>
        <div className={`defi-timer ${timeLeft > 0 && timeLeft <= (mapConfig.tick_alert ?? 10) ? "alert" : ""}`}>
          ⏱️ {formatTime(timeLeft)}
        </div>

        <DeckGL
          ref={deckRef}
          key={deckKey}
          initialViewState={mapConfig.initial_view_state}
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
              if (!selectedPoint || !currentMapId) return;

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