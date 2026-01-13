import { Button } from "@heroui/button";
import { useState, useEffect } from "react";

interface Game {
  id: number;
  title: string;
  description: string;
  image?: string;
  color?: string;
  route?: string;
  objective?: string;
}

export default function DefisSection() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch les jeux depuis l'API backend
  useEffect(() => {
    async function fetchGames() {
      try {
        const res = await fetch("http://localhost:8000/games/"); // Endpoint backend
        const data = await res.json();
        setGames(data.games);
      } catch (err) {
        console.error("Erreur lors du fetch des jeux :", err);
      } finally {
        setLoading(false);
      }
    }
    fetchGames();
  }, []);

  if (loading) {
    return <p>Chargement des jeux...</p>;
  }
  
  return (
    <div className="defis-section">
      {/* Titre bleu "Défis du jour" collé au container double page défi */}
      <div className="defis-badge-wrapper">
        <h1 className="defis-badge">DÉFIS DU JOUR</h1>
      </div>

      {/* Container des 2 défis du jour */}
      <div className="defis-container">
        <div className="defis-grid">
          {games.map((game) => (
            <div key={game.id} className="game-card">
              <div className={`game-image ${game.color}`}>
                <div>{game.image}</div>
              </div>
              
              <h2 className="game-title">{game.title}</h2>
              
              <p className="game-description">{game.description}</p>
              
              <Button 
                color="secondary" 
                size="lg"
                className="font-bold"
                onPress={() =>{
                  if (game.route) {
                    window.location.href = game.route;
                  } else {
                    console.warn(`Aucune route définie pour le jeu "${game.title}"`);
                  }
                }}
              >
                JOUER
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}