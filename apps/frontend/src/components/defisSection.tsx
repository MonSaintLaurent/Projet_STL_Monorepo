import { Button } from "@heroui/button";
import gamesData from "@/data/games.json";

export default function DefisSection() {
  return (
    <div className="defis-section">
      {/* Titre bleu "Défis du jour" collé au container double page défi */}
      <div className="defis-badge-wrapper">
        <h1 className="defis-badge">DÉFIS DU JOUR</h1>
      </div>

      {/* Container des 2 défis du jour */}
      <div className="defis-container">
        <div className="defis-grid">
          {gamesData.map((game) => (
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