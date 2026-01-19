// Version 0 : timer ok, légende ok, max ok, gestion par dico des différents niveaux pour le futur ok,
// Mais il faudra gérer les cartes par le BACKEND (actuellement front, dans src/data), gérer la réponse du joueur (actuellement affiche le point sélectionné), améliorer la page de fin de defi (image de la carte + "vous êtes à x de la rpéonse" dans le cas d'une fin de jeu via temps écoulé)
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

  // Contrer bug des points qui ne s'affichent plus avec une key pour reset le composant DeckGL correctement
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
  }, [timeLeft]);

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
    return (
      <DefaultLayout fullScreen>
        <div className="defi-fullscreen">
          {/* Modal central */}
          <div className="defi-result-modal">
            <h2>⏰ Temps écoulé !</h2>
            <p>
              {mapConfig?.result_phrase
                ? mapConfig.result_phrase.replace("{velocity}", selectedPoint?.properties.velocity?.toFixed(2) ?? "X")
                : `Vous êtes à ${selectedPoint?.properties.velocity?.toFixed(2) ?? "X"} m/s de la réponse.`}
            </p>

            <div className="result-buttons">
              <button onClick={resetdefi}>Réessayer</button>
              <button
                onClick={() => {
                  window.location.href = mapConfig?.home_url ?? "/";
                }}
              >
                Accueil
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
          initialViewState={mapConfig?.initial_view_state}
          controller={true}
          layers={geojsonData ? layers : []}  // asser que si geojsonData est prêt
          style={{position: "absolute", top: "0", left: "0", width: "100%", height: "100%" }}
          getTooltip={({ object }) => {
            if (!object) return null;
            const velocity = object.properties?.velocity ?? 0;
            return `Vitesse t=1: ${velocity.toFixed(2)} m/s`;
          }}
        >
          {/* Carte OSM */}
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
        <div style={{position: "absolute", bottom: 80, left: 20, zIndex: 1000}}>
          <Legend
            quantiles={thresholds}
            // maxDisplay={maxDisplay} // Pas vraiment utile, mais la carte ne s'affiche pas si on omet le const maxDisplay en haut
            colorScale={[
              [0, 0, 255],   // bleu
              [0, 255, 0],   // vert
              [255, 255, 0], // jaune
              [255, 0, 0],   // rouge
            ]}
          />
        </div>

        {/* Bouton Valider */}
        <div style={{position: "absolute", bottom: 20, left: 20, zIndex: 1000}}>
          <Button
            size="lg"
            disabled={!selectedPoint}
            className={`
              font-bold transition-all
              ${
                selectedPoint
                  ? "bg-green-500 text-white hover:bg-green-600 cursor-pointer"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed pointer-events-none"
              }
            `}
            onPress={() => {
              if (selectedPoint) {
                alert(
                  `Vous avez validé le point : ${JSON.stringify(
                    selectedPoint.properties
                  )}`
                );
              }
            }}
          >
            {selectedPoint ? "VALIDER" : "SÉLECTIONNER UN POINT"}
          </Button>
        </div>
      </div>
    </DefaultLayout>
  );
}