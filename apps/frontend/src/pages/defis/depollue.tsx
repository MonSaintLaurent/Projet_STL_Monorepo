import {useRef, useState, useEffect} from "react";
import DeckGL from "@deck.gl/react";
import {Map} from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {IconLayer} from "@deck.gl/layers";
import {Button} from "@heroui/button";
import DefaultLayout from "@/layouts/default";
import {defis} from "@/data/defis.json"
import Objectif from "@/components/objective";
import {useAuth0} from "@auth0/auth0-react";
import {useLocation} from "react-router-dom";
import PouleEndScreen from "./pouleEndScreen";

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
  image: string;
  name: string;
  description?: string;
};


// Type pour un objet spawné
type SpawnedObject = {
  id: string;
  position: [number, number];
  type: "pollutant" | "allowed";
  object: defiObject; // Image et un nom
};


// Générer objets sur la carte
function generateObjectsOnMap(
  map: DepollueMap,
  pollutants: defiObject[],
  allowedObjects: defiObject[]
): SpawnedObject[] {

  const { spawn_points, nb_allowedObjects, nb_pollutants } = map;

  const totalToSpawn = nb_allowedObjects + nb_pollutants;
  if (totalToSpawn > spawn_points.length) {
    throw new Error(
      `Trop d'objets à générer (${totalToSpawn}) pour le nombre de spawn points (${spawn_points.length})`
    );
  }

  if (nb_pollutants > pollutants.length) {
    throw new Error("Pas assez de polluants uniques disponibles");
  }

  if (nb_allowedObjects > allowedObjects.length) {
    throw new Error("Pas assez d’objets autorisés uniques disponibles");
  }

  const shuffledPoints = [...spawn_points].sort(() => Math.random() - 0.5);

  const shuffledPollutants = [...pollutants].sort(() => Math.random() - 0.5);
  const shuffledAllowed = [...allowedObjects].sort(() => Math.random() - 0.5);

  const spawnedObjects: SpawnedObject[] = [];

  // Autorisés, pas de doublons
  for (let i = 0; i < nb_allowedObjects; i++) {
    spawnedObjects.push({
      id: crypto.randomUUID(),
      position: [...shuffledPoints[i]] as [number, number],
      type: "allowed",
      object: shuffledAllowed[i],
    });
  }

  // Polluants, pas de doublons
  for (let i = 0; i < nb_pollutants; i++) {
    spawnedObjects.push({
      id: crypto.randomUUID(),
      position: [...shuffledPoints[nb_allowedObjects + i]] as [number, number],
      type: "pollutant",
      object: shuffledPollutants[i],
    });
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
  const {isAuthenticated, getAccessTokenSilently} = useAuth0();

  const [sessionId, setSessionId] = useState<number | null>(null);

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

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const pouleId = params.get("poule_id");

  // --- Fun facts et infos recyclage
  const [funFact, setFunFact] = useState<{id: number, fact_type: string, text: string} | null>(null);
  const [moreInfoVisible, setMoreInfoVisible] = useState(false);
  const [recyclageFact, setRecyclageFact] = useState<{id: number, fact_type: string, text: string} | null>(null);

  // Récupérer l'objectif depuis defis.json
  const defiData = defis.find(d => d.id === 1);
  const objective = defiData?.objective || "Retirer les objets dangereux pour l'environnement dans le Saint-Laurent";

  const [pouleInfo, setPouleInfo] = useState<{
    name: string;
    emoji: string;
    attempts_left: number;
    my_rank: number;
    is_new_best: boolean;
  } | null>(null);

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
      const defaultMap =
      mapsData.maps.find((m: DepollueMap) => m.id === 1) ?? mapsData.maps[0];

      setCurrentMap(defaultMap);


      setPollutants(objectsData.pollutants);
      setAllowedObjects(objectsData.allowedObjects);

      setTimeout(() => setMapReady(true), 100);
    } 

    loaddefiData();
  }, []);


  // Créer session si connecté et sinon non
    useEffect(() => {
      async function prepareDefi() {
        if (!defiData) return;

        if (isAuthenticated) {
          const token = await getAccessTokenSilently();
          const response = await fetch(`http://localhost:8000/defi_sessions/start/${defiData.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          });
          const data = await response.json();
          if (data.session_id) setSessionId(data.session_id);
        } 
      }

      prepareDefi();
    }, [defiData, isAuthenticated]);

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

  // Tirage sans doublon objects
  function shuffle<T>(array: T[]): T[] {
    return [...array].sort(() => Math.random() - 0.5);
  }


  // --- Soumettre le score si connecté et récupérer fun facts
  useEffect(() => {
    if (!timeUp) return;

    // Calcul du score
    const effectiveTimeLeft = endTimeLeft ?? timeLeft;
    const timePercentRemaining = (effectiveTimeLeft / (currentMap?.timer ?? 1)) * 100;
    const multiplicateur = getTimeMultiplier(timePercentRemaining);

    const points_per_pollutants = 100;
    const penalty_allowedObjects = 50;
    const max_time_multiplier = getTimeMultiplier(100);
    const max_score = 1000;
    const mapMaxScore = (currentMap?.nb_pollutants ?? 0) * points_per_pollutants * max_time_multiplier;

    const init_scorePlayer = collectedCount * points_per_pollutants - removedAllowed * penalty_allowedObjects;
    const scoreWithMultiplier = Math.max(0, init_scorePlayer * multiplicateur);
    const final_scorePlayer = Math.min(max_score, Math.round((scoreWithMultiplier / Math.max(1, mapMaxScore)) * max_score));

    async function submitScore() {
      if (!isAuthenticated) {
        console.log("Utilisateur anonyme : score non enregistré");
        return;
      }

      const token = await getAccessTokenSilently();

      // Soumettre score normal
      const response = await fetch(`http://localhost:8000/defi_sessions/finish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          score: final_scorePlayer,
          time_spent: currentMap?.timer ? currentMap.timer - effectiveTimeLeft : 0,
          completed: collectedCount >= (currentMap?.nb_pollutants ?? 0),
          metadata: { collectedCount, removedAllowed, multiplicateur },
        }),
      });

      const result = await response.json();
      if (result.is_new_record) console.log("Nouveau record !", result.record.best_score);

      // Soumettre score à la poule si pouleId et sessionId existent
      if (sessionId && pouleId) {
        try {
          const res = await fetch("http://localhost:8000/poules/submit-score", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json", 
              "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({
              session_id: sessionId,
              poule_id: parseInt(pouleId),
            }),
          });

          const data = await res.json();
          if (!res.ok) {
            console.error("Impossible de soumettre le score à la poule", data.detail);
          } else {
            console.log("Score envoyé à la poule ! Rang actuel :", data.rank);
            
            // Récupérer les infos de la poule
            const pouleRes = await fetch(`http://localhost:8000/poules/${pouleId}/ranking`, {
              headers: { "Authorization": `Bearer ${token}` }
            });
            
            if (pouleRes.ok) {
              const pouleData = await pouleRes.json();
              setPouleInfo({
                name: pouleData.poule.name,
                emoji: pouleData.poule.emoji,
                attempts_left: pouleData.poule.attempts_left,
                my_rank: data.rank,
                is_new_best: data.is_new_best
              });
            }
          }
        } catch (err) {
          console.error("Erreur soumission score poule", err);
        }
      }
    }


    submitScore();

    async function fetchFunFact() {
      const res = await fetch("http://localhost:8000/depollue/random-fact?fact_type=funfact");
      const data = await res.json();
      setFunFact(data);

      const res2 = await fetch("http://localhost:8000/depollue/random-fact?fact_type=recyclage");
      const data2 = await res2.json();
      setRecyclageFact(data2);
    }

    fetchFunFact();
  }, [timeUp, isAuthenticated, sessionId, collectedCount, removedAllowed, currentMap, endTimeLeft, timeLeft]);

  if (!mapReady || !currentMap || !currentMap.spawn_points || pollutants.length === 0 || allowedObjects.length === 0) {
    return <div>Chargement du jeu...</div>;
  }

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
  const objectLayer = new IconLayer({
    id: "object-layer",
    data: spawnedObjects,
    pickable: true,

    getId: (d: SpawnedObject) => d.id,

    getPosition: (d: SpawnedObject) => d.position,

    getIcon: (d: SpawnedObject) => ({
      url: `http://localhost:8000/static/depollue/${d.object.image}`,
      width: 128,
      height: 128,
      anchorY: 128,
    }),

    sizeScale: 1,
    getSize: 80, // Taille affichage objets sur carte
    sizeUnits: "pixels",
    

    onClick: (info) => {
      if (info.object) {
        const clickedId = info.object.id;

        setSpawnedObjects((prev) =>
          prev.filter((o) => o.id !== clickedId)
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
    // Si on est en mode Poule ET qu'on a les infos de la poule
    if (pouleId && pouleInfo) {
      return (
        <DefaultLayout fullScreen>
          <PouleEndScreen
            objective={objective}
            pouleInfo={pouleInfo}
            score={final_scorePlayer}
            maxScore={max_score}
            multiplicateur={multiplicateur}
            collectedCount={collectedCount}
            removedAllowed={removedAllowed}
            timeLeft={effectiveTimeLeft}
            pollutants={pollutants}
            allowedObjects={allowedObjects}
            onReturnToPoule={() => {
              window.location.href = "/poules";
            }}
            onPlayAgain={() => {
              window.location.reload();
            }}
          />
        </DefaultLayout>
      );
    }

    // Mode normal (pas de poule) - écran de fin classique
    return (
      <DefaultLayout fullScreen>
        <div
          style={{
            width: "100%",
            height: "100vh",
            overflowY: "auto",
            overflowX: "hidden",
            background: "white",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 180,
            paddingBottom: 100,
            paddingLeft: 20,
            paddingRight: 20,
            boxSizing: "border-box"
          }}
        >
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 32,
            maxWidth: 800,
            width: "100%"
          }}>
            <Objectif objective={objective} mode="fin"/>

            {/* Section déchets et autres */}
            <div style={{display: "flex", gap: 80, marginBottom: 20, flexWrap: "wrap", justifyContent: "center"}}>
              <div style={{textAlign: "center" }}>
                <div style={{fontSize: 24, fontWeight: "bold", marginBottom: 10}}>Déchets</div>
                <div style={{display: "flex", gap: 15, fontSize: 40, flexWrap: "wrap", justifyContent: "center" }}>
                  {pollutants.map((obj: defiObject, idx: number) => (
                    <img
                      key={idx}
                      src={`http://localhost:8000/static/depollue/${obj.image}`}
                      alt={obj.name}
                      style={{ width: 40, height: 40 }}
                    />
                  ))}
                </div>
              </div>
              <div style={{textAlign: "center" }}>
                <div style={{fontSize: 24, fontWeight: "bold", marginBottom: 10}}>Eléments du fleuve</div>
                <div style={{display: "flex", gap: 15, fontSize: 40, flexWrap: "wrap", justifyContent: "center"}}>
                  {allowedObjects.map((obj: defiObject, idx: number) => (
                    <img
                      key={idx}
                      src={`http://localhost:8000/static/depollue/${obj.image}`}
                      alt={obj.name}
                      style={{ width: 40, height: 40 }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Fun fact */}
            {funFact && (
              <div
                style={{
                  maxWidth: 600,
                  width: "100%",
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
                💡 Point info : {funFact.text}
              </div>
            )}

            {/* Score */}
            <div style={{fontSize: 48, fontWeight: "bold", color: "#22c55e"}}>
              {isAuthenticated ? (
                <>{final_scorePlayer}/{max_score} points</>
              ) : (
                <>{final_scorePlayer} points (anonyme)</>
              )}
            </div>

            {/* Barre de progression */}
            <div style={{width: "100%", maxWidth: 400, height: "20px", background: "#e5e7eb", borderRadius: 10, overflow: "hidden"}}>
              <div style={{width: `${progressPercent}%`, height: "100%", background: "#22c55e", transition: "width 0.5s ease"}} />
            </div>

            {/* Multiplicateur gris */}
            <div style={{background: "#f3f4f6", padding: "12px 24px", borderRadius: 8, fontSize: 18, textAlign: "center"}}>
              <strong>x{multiplicateur.toFixed(2)}</strong> pour avoir fini avec un timer restant de {formatTime(timeLeft)}
            </div>

            {/* Polluants retirés */}
            <div style={{background: "#dcfce7", padding: "12px 24px", borderRadius: 8, fontSize: 18, color: "#166534", textAlign: "center"}}>
              Vous avez retiré <strong>{collectedCount} polluants</strong> du fleuve
            </div>

            {/* Attention si objets autorisés retirés */}
            {removedAllowed > 0 && (
              <div style={{fontSize: 16, color: "#dc2626", textAlign: "center" }}>
                ⚠️ Attention, vous avez retiré {removedAllowed} objet(s) non polluant(s) du fleuve !
              </div>
            )}

            {/* Boutons */}
            <div style={{display: "flex", gap: 20, marginTop: 20, flexWrap: "wrap", justifyContent: "center"}}>
              <Button size="lg" className="bg-gray-300 text-black font-bold hover:bg-gray-400" onPress={() => { window.location.href = "/"; }}>Retour à l'accueil</Button>
              <Button size="lg" className="bg-purple-600 text-white font-bold hover:bg-purple-700" onPress={() => { window.location.href = "/defis"; }}>Jouer à un autre Jeu</Button>
              <Button size="lg" className="bg-blue-600 text-white font-bold hover:bg-blue-700" onPress={() => { window.location.href = window.location.pathname; }}>Rejouer</Button>
            </div>

            {/* Bouton Plus d'infos */}
          <Button size="md" className="bg-yellow-500 text-white font-bold hover:bg-yellow-600" onPress={() => setMoreInfoVisible(!moreInfoVisible)}>
              {moreInfoVisible ? "Fermer les infos" : "Plus d'infos"}
            </Button>

          {/* Menu infos */}
            {moreInfoVisible && (
              <div
                style={{
                  width: "100%",
                  maxWidth: 700,
                  background: "#f0fdf4",
                  borderRadius: 12,
                  padding: 20,
                  color: "#065f46",
                  fontSize: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  marginTop: 0
                }}
              >
                {recyclageFact && (
                  <div style={{
                    padding: "12px",
                    background: "#dcfce7",
                    borderRadius: 8,
                    marginBottom: 8
                  }}>
                    {recyclageFact.text}
                  </div>
                )}

                <div>
                  <strong style={{display: "block", marginBottom: 12}}>Objets collectés cette partie :</strong>
                  <div style={{
                    display: "flex", 
                    flexDirection: "column", 
                    gap: 12,
                    maxHeight: 400,
                    overflowY: "auto",
                    paddingRight: 8
                  }}>
                    {allSpawnedObjects.map(o => (
                      <div key={o.object.id} style={{
                        display: "flex", 
                        alignItems: "flex-start", 
                        gap: 12,
                        padding: "12px",
                        background: "white",
                        borderRadius: 8,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                      }}>
                        {/* Image */}
                        <img 
                          src={`http://localhost:8000/static/depollue/${o.object.image}`} 
                          alt={o.object.name} 
                          style={{
                            width: 50, 
                            height: 50, 
                            objectFit: "contain",
                            flexShrink: 0
                          }}
                        />
                        
                        {/* Texte */}
                        <div style={{flex: 1}}>
                          <div style={{fontWeight: "bold", marginBottom: 4}}>
                            {o.object.name}
                          </div>
                          <div style={{
                            fontSize: 14, 
                            color: o.type === "pollutant" ? "#dc2626" : "#16a34a",
                            fontWeight: 600,
                            marginBottom: 4
                          }}>
                            {o.type === "pollutant" ? "🔴 Polluant" : "🟢 Non polluant"}
                          </div>
                          {o.object.description && (
                            <div style={{fontSize: 14, opacity: 0.85, lineHeight: 1.4}}>
                              {o.object.description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
            fontSize: 28,
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
            onClick={(info) => console.log("Coords cliquées :", info.coordinate)} // Pour setup les coordonnées en cliquant sur la map, facile pour créer des spawnpoints pour les prochaines cartes
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
