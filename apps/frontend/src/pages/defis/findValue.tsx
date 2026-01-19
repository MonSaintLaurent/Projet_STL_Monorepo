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

const mapsConfig = {
  1: {
    name: "Carte 1 - Vitesse t=1",
    geojsonPath: "/data/points_v4_allveltime.geojson",
    initialViewState: {
      longitude: -70.9082,
      latitude: 47.0139,
      zoom: 9,
      pitch: 0,
      bearing: 0,
    },
    "timer": 20
  },

  2: {
    name: "Carte 2 - Ex",
    geojsonPath: "/data/gngn.geojson",
    initialViewState: {
      longitude: -73.5617,
      latitude: 45.5089,
      zoom: 11,
      pitch: 0,
      bearing: 0,
    },
    "timer": 90
  },
};

export default function FindValuedefi() {
  const defi_ID = 2; // Pour la réutilisation écran de fin par ex, ID du jeu

  const [currentMap, setCurrentMap] = useState<1 | 2>(1); // Choix carte/niveau
  const [geojsonData, setGeojsonData] = useState<any>(null);
  const [thresholds, setThresholds] = useState<number[]>([]);
  const [maxDisplay, setMaxDisplay] = useState<number>(0);
  const [selectedPoint, setSelectedPoint] = useState<any>(null);

  const deckRef = useRef<any>(null);
  const timeIndex = 1; // t=1, fixe, à voir avec slider de Richard après

  const mapConfig = mapsConfig[currentMap];

  const [timeLeft, setTimeLeft] = useState<number>(mapConfig.timer);
  const [timeUp, setTimeUp] = useState(false);

  const resetdefi = () => {
    setSelectedPoint(null);
    setTimeUp(false);
    setTimeLeft(mapConfig.timer);

    fetch(mapConfig.geojsonPath)
    .then((res) => res.json())
    .then((json) => setGeojsonData(json))
    .catch((err) => console.error("Erreur fetch GeoJSON:", err)); // Sinon pb plus de points
  };

  const tickAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    tickAudio.current = new Audio(tickSound);
  }, []);

  useEffect(() => {
    if (timeLeft <= 10 && timeLeft > 0) {
      tickAudio.current?.play().catch(() => {});
    }
  }, [timeLeft]);

  // Logique Timer
  useEffect(() => {
    if (timeUp) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
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


  // Charger le GeoJSON
  useEffect(() => {
    fetch(mapConfig.geojsonPath)
      .then((res) => res.json())
      .then((json) => {
        setGeojsonData(json);

        // Récupérer toutes les velocities pour le temps t
        const allVelocities = json.features
          .map((f: any) => f.properties.velocity[timeIndex])
          .filter((v: number) => v !== undefined && v > 0)
          .sort((a: number, b: number) => a - b);

        if (allVelocities.length > 0) {
          // Prendre le 99e percentile comme max visuel (plus de points rouges, et 95e trop de points)
          const percentile99 = allVelocities[Math.floor(allVelocities.length * 0.995)];
          const maxAbsolu = allVelocities[allVelocities.length-1];
          
          // Pour la légende, on affiche le max absolu
          setMaxDisplay(maxAbsolu);

          // Vieille version : max fixé à 1.7 ici
          
          // Mais pour les thresholds, on utilise le 95e percentile
          const thresholdsForTime = [
            percentile99 * 0.25,
            percentile99 * 0.5,
            percentile99 * 0.75
          ];
          
          // console.log("99e percentile:", percentile99);
          // console.log("Max absolu:", maxAbsolu);
          // console.log("Thresholds:", thresholdsForTime);
          
          setThresholds(thresholdsForTime);
        }
      })
      .catch((err) => console.error("Erreur chargement GeoJSON:", err));
  }, [currentMap]);

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
        const velocity = f.properties?.velocity?.[timeIndex] ?? 0;
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
              Vous êtes à{" "}
              {selectedPoint
                ? selectedPoint.properties.velocity[timeIndex].toFixed(2)
                : "X"}{" "}
              m/s de la réponse.
            </p>

            <div className="result-buttons">
              <button onClick={resetdefi}>Réessayer</button>
              <button
                onClick={() => {
                  window.location.href = "/";
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
        <div className={`defi-timer ${timeLeft <= 10 ? 'alert' : ''}`}>
          ⏱️ {formatTime(timeLeft)}
        </div>

        <DeckGL
          ref={deckRef}
          initialViewState={mapConfig.initialViewState}
          controller={true}
          layers={geojsonData ? layers : []}  // asser que si geojsonData est prêt
          style={{position: "absolute", top: "0", left: "0", width: "100%", height: "100%" }}
          getTooltip={({ object }) => {
            if (!object) return null;
            const velocity = object.properties?.velocity?.[timeIndex] ?? 0;
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