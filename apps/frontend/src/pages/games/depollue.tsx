import {useRef, useState, useEffect} from "react";
import DeckGL from "@deck.gl/react";
import {Map} from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {TextLayer} from "@deck.gl/layers";
import {Button} from "@heroui/button";
import DefaultLayout from "@/layouts/default";
import {games} from "@/data/games.json"
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

type GameObject = {
  id: string;
  emoji: string;
  name: string;
  description?: string;
};


// Type pour un objet spawné
type SpawnedObject = {
  position: [number, number];
  type: "pollutant" | "allowed";
  object: GameObject; // Emoji et un nom
};

// Générer objets sur la carte
function generateObjectsOnMap(map: DepollueMap,pollutants: GameObject[], allowedObjects: GameObject[]): SpawnedObject[] {

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


export default function DepollueGame() {
  const deckRef = useRef<any>(null);

  const [spawnedObjects, setSpawnedObjects] = useState<SpawnedObject[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [endTimeLeft, setEndTimeLeft] = useState<number | null>(null);
  const [timeUp, setTimeUp] = useState(false);
  const [collectedCount, setCollectedCount] = useState(0);
  const [removedAllowed, setRemovedAllowed] = useState(0);

  const [maps, setMaps] = useState<DepollueMap[]>([]);
  const [currentMap, setCurrentMap] = useState<DepollueMap | null>(null);

  const [pollutants, setPollutants] = useState<GameObject[]>([]);
  const [allowedObjects, setAllowedObjects] = useState<GameObject[]>([]);

  // Récupérer l'objectif depuis games.json
  const gameData = games.find(g => g.id === 1);
  const objective = gameData?.objective || "Retirer les objets dangereux pour l'environnement dans le Saint-Laurent";


  // Load maps et objets
  useEffect(() => {
    async function loadGameData() {
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
    }

    loadGameData();
  }, []);


  // Générer les objets au montage
  useEffect(() => {
    if (!currentMap || pollutants.length === 0 || allowedObjects.length === 0 || !currentMap.spawn_points) return ;

    const objects = generateObjectsOnMap(currentMap, pollutants, allowedObjects);

    setSpawnedObjects(objects);
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
  function endGame() {
    if (!timeUp) {
      setEndTimeLeft(timeLeft); // figer le temps restant
      setTimeUp(true);
    }
  }

  // Chargement
  if (!currentMap || !currentMap.spawn_points || pollutants.length === 0 || allowedObjects.length === 0) {
    return <div>Chargement du jeu...</div>;
  }

  // Score : 100pts par polluants trouvés, 50 pts enlevés par mauvais objet enlevé, et multiplicateur de score suivant le temps restant à la fin de la game
  const points_per_pollutants = 100;
  const penalty_allowedObjects = 50;
  const max_time_multiplier = getTimeMultiplier(100);
  const max_score = 1000; // Normaliser, à voir après mais peut être pratique pour normaliser tous les jeux à 1000 ? Pour qu'lis aient le même poids dans le score user ?
  const mapMaxScore = currentMap.nb_pollutants * points_per_pollutants * max_time_multiplier; // Score max réel possible, s'adapte au nb de pollutants défini dans le dico de la map
  
  const effectiveTimeLeft = endTimeLeft ?? timeLeft;
  const timePercentRemaining = (effectiveTimeLeft / currentMap.timer) * 100;

  const multiplicateur = getTimeMultiplier(timePercentRemaining);

  const init_scorePlayer = collectedCount * points_per_pollutants - removedAllowed * penalty_allowedObjects; // Score brut avant ajout du multiplicateur et des malus : nb_objets_polluants*points_polluants - nb_objets_pasPolluantsCliqués*malus_erreur_NonPolluant
  const scoreWithMultiplier = Math.max(0, init_scorePlayer * multiplicateur); // Score après application du multiplicateur
  const final_scorePlayer = Math.min(max_score, Math.round((scoreWithMultiplier/Math.max(1, mapMaxScore)) * max_score)); // Score final normalisé vers 1000

  const progressPercent = Math.min(100, (final_scorePlayer/max_score) * 100);

  // Layer DeckGL pour les emojis
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
        // Supprimer l'objet cliqué
        setSpawnedObjects((prev) =>
          prev.filter((o) => o !== info.object)
        );

        // Si polluant, augmenter compteur
        if (info.object.type === "pollutant") {
          setCollectedCount((prev) => {
            const newCount = prev + 1;

            if (newCount >= currentMap.nb_pollutants) { // Check si tous les polluants sont collectés
              endGame();
            }

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
          }}
        >
          <Objectif objective={objective} mode="fin"/>

          {/* Section déchets et autres */}
          <div style={{display: "flex", gap: 80, marginBottom: 20}}>
            <div style={{textAlign: "center" }}>
              <div style={{fontSize: 24, fontWeight: "bold", marginBottom: 10}}>Déchets</div>
              <div style={{display: "flex", gap: 15, fontSize: 40 }}>
                {pollutants.map((obj: GameObject, idx: number) => (
                  <span key={idx}>{obj.emoji}</span>
                ))}
              </div>
            </div>
            <div style={{textAlign: "center" }}>
              <div style={{fontSize: 24, fontWeight: "bold", marginBottom: 10}}>Poissons</div>
              <div style={{display: "flex", gap: 15, fontSize: 40}}>
                {allowedObjects.map((obj: GameObject, idx: number) => (
                  <span key={idx}>{obj.emoji}</span>
                ))}
              </div>
            </div>
          </div>

          
          {/* Score */}
          <div style={{fontSize: 48, fontWeight: "bold", color: "#22c55e"}}>
            {final_scorePlayer}/{max_score} points
          </div>

          {/* Barre de progression */}
          <div style={{width: "400px", height: "20px", background: "#e5e7eb", borderRadius: 10, overflow: "hidden"}}>
            <div style={{width: `${progressPercent}%`, height: "100%", background: "#22c55e", transition: "width 0.5s ease"}} />
          </div>

          {/* Multiplicateur gris */}
          <div
            style={{
              background: "#f3f4f6",
              padding: "12px 24px",
              borderRadius: 8,
              fontSize: 18,
            }}
          >
            <strong>x{multiplicateur.toFixed(2)}</strong> pour avoir fini avec un timer restant de {formatTime(timeLeft)}
          </div>

          {/* Polluants retirés, vert */}
          <div
            style={{
              background: "#dcfce7",
              padding: "12px 24px",
              borderRadius: 8,
              fontSize: 18,
              color: "#166534",
            }}
          >
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
            <Button
              size="lg"
              className="bg-gray-300 text-black font-bold hover:bg-gray-400"
              onPress={() => {
                window.location.href = "/";
              }}
            >
              Retour à l'accueil
            </Button>

            <Button
              size="lg"
              className="bg-purple-600 text-white font-bold hover:bg-purple-700"
              onPress={() => {
                window.location.href = "/jeux";
              }}
            >
              Jouer à un autre Jeu
            </Button>

            <Button
              size="lg"
              className="bg-blue-600 text-white font-bold hover:bg-blue-700"
              // onPress={() => {
              //   alert("Partager !");
              // }}
              onPress={() => {
                window.location.href = "/jeux/depollue"; // Actuellement en mode rejouer, TODO à changer après
              }}
            >
              Partager 🔗
            </Button>
          </div>
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
            position: "fixed", // Hors du flux
            top: 65,              // hauteur navbar sticky
            left: 20,
            zIndex: 2000,         // Sur la navbar
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
      </div>
    </DefaultLayout>
  );
}