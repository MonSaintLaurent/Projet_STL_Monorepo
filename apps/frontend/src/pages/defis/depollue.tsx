import {useRef, useState, useEffect} from "react";
import DeckGL from "@deck.gl/react";
import {Map} from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {TextLayer} from "@deck.gl/layers";
import {Button} from "@heroui/button";
import DefaultLayout from "@/layouts/default";
import {defis} from "@/data/defis.json"
import Objectif from "@/components/objective";

type DepollueMap = {
  id: number;
  name: string;
  initial_view_state: any;
  timer: number;
  nb_pollutants: number;
  nb_allowedObjects: number;
  spawn_points: [number, number][];
};

type defiObject = {
  id: string;
  emoji: string;
  name: string;
  description?: string;
};


// Type pour un objet spawné
type SpawnedObject = {
  position: [number, number];
  type: "pollutant" | "allowed";
  object: defiObject; // Emoji et un nom
};


// Générer objets sur la carte
function generateObjectsOnMap(map: DepollueMap,pollutants: defiObject[], allowedObjects: defiObject[]): SpawnedObject[] {

  const {spawn_points, nb_allowedObjects, nb_pollutants} = map;

  const totalToSpawn = nb_allowedObjects + nb_pollutants;
  if (totalToSpawn > spawn_points.length) {
    throw new Error(
      `Trop d'objets à générer (${totalToSpawn}) pour le nombre de spawn points (${spawn_points.length})`
    );
  }

  const shuffledPoints = [...spawn_points].sort(() => Math.random() - 0.5);
  const spawnedObjects: SpawnedObject[] = [];

  // Autorisés
  for (let i = 0; i < nb_allowedObjects; i++) {
    const point = [...shuffledPoints[i]] as [number, number];
    const obj = allowedObjects[Math.floor(Math.random() * allowedObjects.length)];
    spawnedObjects.push({ position: point, type: "allowed", object: obj });
  }

  // Polluants
  for (let i = 0; i < nb_pollutants; i++) {
    const point = [...shuffledPoints[nb_allowedObjects + i]] as [number, number];
    const obj = pollutants[Math.floor(Math.random() * pollutants.length)];
    spawnedObjects.push({ position: point, type: "pollutant", object: obj });
  }

  return spawnedObjects;
}

// Formatter en mm:ss
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

// Calcul du multiplicateur : 80-100% du temps restant donne x2, 60-79% xx1.7, 40-59% x1.4, 20-39% x1.2, 0-19%x1
function getTimeMultiplier(percentRemaining: number) {
  if (percentRemaining >= 80) return 2.0;
  if (percentRemaining >= 60) return 1.7;
  if (percentRemaining >= 40) return 1.4;
  if (percentRemaining >= 20) return 1.2;
  return 1.0;
}


export default function Depolluedefi() {
  const deckRef = useRef<any>(null);

  const [spawnedObjects, setSpawnedObjects] = useState<SpawnedObject[]>([]);
  const [allSpawnedObjects, setAllSpawnedObjects] = useState<SpawnedObject[]>([]); // <-- Tous les objets spawnés
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [endTimeLeft, setEndTimeLeft] = useState<number | null>(null);
  const [timeUp, setTimeUp] = useState(false);
  const [collectedCount, setCollectedCount] = useState(0);
  const [removedAllowed, setRemovedAllowed] = useState(0);

  const [maps, setMaps] = useState<DepollueMap[]>([]);
  const [currentMap, setCurrentMap] = useState<DepollueMap | null>(null);

  const [pollutants, setPollutants] = useState<defiObject[]>([]);
  const [allowedObjects, setAllowedObjects] = useState<defiObject[]>([]);

  const [mapReady, setMapReady] = useState(false);

  // --- Fun facts et infos recyclage
  const [funFact, setFunFact] = useState<{id: number, fact_type: string, text: string} | null>(null);
  const [moreInfoVisible, setMoreInfoVisible] = useState(false);
  const [recyclageFact, setRecyclageFact] = useState<{id: number, fact_type: string, text: string} | null>(null);

  // Récupérer l'objectif depuis defis.json
  const defiData = defis.find(d => d.id === 1);
  const objective = defiData?.objective || "Retirer les objets dangereux pour l'environnement dans le Saint-Laurent";


  // Load maps et objets
  useEffect(() => {
    async function loaddefiData() {
      const [mapsRes, objectsRes] = await Promise.all([
        fetch("http://localhost:8000/depollue/maps"),
        fetch("http://localhost:8000/depollue/objects"),
      ]);

      const mapsData = await mapsRes.json();
      const objectsData = await objectsRes.json();

      setMaps(mapsData.maps);
      setCurrentMap(mapsData.maps[0]); // map 1 par défaut

      setPollutants(objectsData.pollutants);
      setAllowedObjects(objectsData.allowedObjects);

      setTimeout(() => setMapReady(true), 100);
    } 

    loaddefiData();
  }, []);


  // Générer les objets au montage
  useEffect(() => {
    if (!currentMap || pollutants.length === 0 || allowedObjects.length === 0 || !currentMap.spawn_points) return ;

    const objects = generateObjectsOnMap(currentMap, pollutants, allowedObjects);

    setSpawnedObjects(objects);
    setAllSpawnedObjects(objects); // <-- stocker tous les objets spawnés pour "Plus d'infos"
  }, [currentMap, pollutants, allowedObjects]);


  // Timer
  useEffect(() => {
    if (timeUp) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setTimeUp(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeUp]);


  // Initial time
  useEffect(() => {
    if (currentMap) setTimeLeft(currentMap.timer);
  }, [currentMap]);


  // Fin de jeu
  function enddefi() {
    if (!timeUp) {
      setEndTimeLeft(timeLeft);
      setTimeUp(true);
    }
  }

  // --- Récupérer fun fact et recyclage quand le jeu est terminé
  useEffect(() => {
    if (!timeUp) return;

    async function fetchFunFact() {
      const res = await fetch("http://localhost:8000/depollue/random-fact?fact_type=funfact");
      const data = await res.json();
      setFunFact(data);

      const res2 = await fetch("http://localhost:8000/depollue/random-fact?fact_type=recyclage");
      const data2 = await res2.json();
      setRecyclageFact(data2);
    }

    fetchFunFact();
  }, [timeUp]);

  if (!mapReady || !currentMap || !currentMap.spawn_points || pollutants.length === 0 || allowedObjects.length === 0) {
    return <div>Chargement du jeu...</div>;
  }

  // Score
  const points_per_pollutants = 100;
  const penalty_allowedObjects = 50;
  const max_time_multiplier = getTimeMultiplier(100);
  const max_score = 1000;
  const mapMaxScore = currentMap.nb_pollutants * points_per_pollutants * max_time_multiplier;

  const effectiveTimeLeft = endTimeLeft ?? timeLeft;
  const timePercentRemaining = (effectiveTimeLeft / currentMap.timer) * 100;

  const multiplicateur = getTimeMultiplier(timePercentRemaining);

  const init_scorePlayer = collectedCount * points_per_pollutants - removedAllowed * penalty_allowedObjects;
  const scoreWithMultiplier = Math.max(0, init_scorePlayer * multiplicateur);
  const final_scorePlayer = Math.min(max_score, Math.round((scoreWithMultiplier/Math.max(1, mapMaxScore)) * max_score));

  const progressPercent = Math.min(100, (final_scorePlayer/max_score) * 100);

  // Layer DeckGL
  const objectLayer = new TextLayer({
    id: "object-layer",
    data: spawnedObjects,
    pickable: true,
    getPosition: (d: SpawnedObject) => d.position,
    getText: (d: SpawnedObject) => d.object.emoji ?? "❓",
    getSize: 40,
    getColor: (d: SpawnedObject) => (d.type === "pollutant" ? [255, 0, 0] : [0, 128, 0]),
    getTextAnchor: "middle",
    getAlignmentBaseline: "center",
    onClick: (info) => {
      if (info.object) {
        setSpawnedObjects((prev) =>
          prev.filter((o) => o !== info.object)
        );
        if (info.object.type === "pollutant") {
          setCollectedCount((prev) => {
            const newCount = prev + 1;
            if (newCount >= currentMap.nb_pollutants) enddefi();
            return newCount;
          });
        } else {
          setRemovedAllowed((prev) => prev + 1);
        }
      }
    },
  });

  // Render
  if (timeUp) {
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
            overflowY: "auto" // <-- permet de scroller si "Plus d'infos" est grand
          }}
        >
          <Objectif objective={objective} mode="fin"/>

          {/* Section déchets et autres */}
          <div style={{display: "flex", gap: 80, marginBottom: 20}}>
            <div style={{textAlign: "center" }}>
              <div style={{fontSize: 24, fontWeight: "bold", marginBottom: 10}}>Déchets</div>
              <div style={{display: "flex", gap: 15, fontSize: 40 }}>
                {pollutants.map((obj: defiObject, idx: number) => (
                  <span key={idx}>{obj.emoji}</span>
                ))}
              </div>
            </div>
            <div style={{textAlign: "center" }}>
              <div style={{fontSize: 24, fontWeight: "bold", marginBottom: 10}}>Poissons</div>
              <div style={{display: "flex", gap: 15, fontSize: 40}}>
                {allowedObjects.map((obj: defiObject, idx: number) => (
                  <span key={idx}>{obj.emoji}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Fun fact */}
          {funFact && (
            <div
              style={{
                maxWidth: 600,
                padding: "20px",
                borderRadius: 12,
                background: "#fef3c7",
                color: "#92400e",
                fontSize: 20,
                fontWeight: "medium",
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              💡 Fun fact : {funFact.text}
            </div>
          )}

          {/* Score */}
          <div style={{fontSize: 48, fontWeight: "bold", color: "#22c55e"}}>
            {final_scorePlayer}/{max_score} points
          </div>

          {/* Barre de progression */}
          <div style={{width: "400px", height: "20px", background: "#e5e7eb", borderRadius: 10, overflow: "hidden"}}>
            <div style={{width: `${progressPercent}%`, height: "100%", background: "#22c55e", transition: "width 0.5s ease"}} />
          </div>

          {/* Multiplicateur gris */}
          <div style={{background: "#f3f4f6", padding: "12px 24px", borderRadius: 8, fontSize: 18}}>
            <strong>x{multiplicateur.toFixed(2)}</strong> pour avoir fini avec un timer restant de {formatTime(timeLeft)}
          </div>

          {/* Polluants retirés */}
          <div style={{background: "#dcfce7", padding: "12px 24px", borderRadius: 8, fontSize: 18, color: "#166534"}}>
            Vous avez retiré <strong>{collectedCount} polluants</strong> du fleuve
          </div>

          {/* Attention si objets autorisés retirés */}
          {removedAllowed > 0 && (
            <div style={{fontSize: 16, color: "#dc2626" }}>
              ⚠️ Attention, vous avez retiré {removedAllowed} objet(s) non polluant(s) du fleuve !
            </div>
          )}

          {/* Boutons */}
          <div style={{display: "flex", gap: 20, marginTop: 20}}>
            <Button size="lg" className="bg-gray-300 text-black font-bold hover:bg-gray-400" onPress={() => { window.location.href = "/"; }}>Retour à l'accueil</Button>
            <Button size="lg" className="bg-purple-600 text-white font-bold hover:bg-purple-700" onPress={() => { window.location.href = "/defis"; }}>Jouer à un autre Jeu</Button>
            <Button size="lg" className="bg-blue-600 text-white font-bold hover:bg-blue-700" onPress={() => { window.location.href = "/defis/depollue"; }}>Partager 🔗</Button>
          </div>

          {/* Bouton Plus d'infos */}
          <Button size="md" className="bg-yellow-500 text-white font-bold hover:bg-yellow-600" onPress={() => setMoreInfoVisible(!moreInfoVisible)}>
            {moreInfoVisible ? "Fermer les infos" : "Plus d'infos"}
          </Button>

          {/* Menu infos */}
          {moreInfoVisible && (
            <div
              style={{
                maxWidth: 700,
                marginTop: 16,
                background: "#f0fdf4",
                borderRadius: 12,
                padding: 20,
                color: "#065f46",
                fontSize: 16,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                maxHeight: 400,
                overflowY: "auto" // scroll si trop grand
              }}
            >
              {recyclageFact && <div>{recyclageFact.text}</div>}

              <div>
                <strong>Objets collectés cette partie :</strong>
                <ul style={{marginTop: 8, paddingLeft: 20}}>
                  {allSpawnedObjects.map(o => (
                    <li key={o.object.id}>
                      {o.object.emoji} {o.object.name} ({o.type === "pollutant" ? "polluant" : "non polluant"})
                      {o.object.description && (
                        <div style={{fontSize: 14, opacity: 0.85}}>
                          {" — "}{o.object.description}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout fullScreen>
      <div>
        {/* Composant Objectif bulles*/}
        <Objectif
          objective={objective}
          mode="jeu"
          style={{
            position: "fixed",
            top: 65,
            left: 20,
            zIndex: 2000,
          }}
        />
      </div>
      
      <div style={{width: "100%", height: "100%", overflow: "hidden", position: "relative"}}>
        
        {/* Timer + compteur*/}
        <div
          style={{
            position: "absolute",
            top: 70,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            display: "flex",
            flexWrap: "wrap",
            background: "white",
            padding: "10px 20px",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: 12,
            fontWeight: "bold",
            fontSize: 20,
            boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
            gap: 12,
          }}
        >
          ⏱️ {formatTime(timeLeft)} | 🗑️ {collectedCount}/{currentMap.nb_pollutants}
        </div>

        <div style={{position: "absolute", top: 0, left: 0, right: 0, height: 40, background: "white", zIndex: 1500}} />
        {mapReady && (
          <DeckGL
            ref={deckRef}
            initialViewState={currentMap.initial_view_state}
            controller={false}
            getCursor={() => 'pointer'}
            layers={[objectLayer]}
            style={{position: "absolute", top: "0", left: "0", width: "100%", height: "100%"}}
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
                  {id: "osm", type: "raster", source: "osm", minzoom: 0, maxzoom: 22},
                ],
              }}
            />
          </DeckGL>
        )}
      </div>
    </DefaultLayout>
  );
}
