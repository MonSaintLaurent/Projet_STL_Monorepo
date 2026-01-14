import { Button } from "@heroui/button";
import { useState, useEffect } from "react";

interface Defi {
  id: number;
  title: string;
  description: string;
  image?: string;
  color?: string;
  route?: string;
  objective?: string;
}

export default function DefisSection() {
  const [defis, setDefis] = useState<Defi[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch les défis depuis l'API backend
  useEffect(() => {
    async function fetchDefis() {
      try {
        const res = await fetch("http://localhost:8000/defis/"); // Endpoint backend
        const data = await res.json();
        setDefis(data.defis);
      } catch (err) {
        console.error("Erreur lors du fetch des défis :", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDefis();
  }, []);

  if (loading) {
    return <p>Chargement des défis...</p>;
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
          {defis.map((defi) => {
            const imageUrl = defi.image 
              ? `http://localhost:8000/static/defis/${defi.image}`
              : null;

            return (
              <div key={defi.id} className="defi-card">
                <div className={`defi-image ${defi.color}`}>
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={defi.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div>{defi.image}</div>
                  )}
                </div>
                
                <h2 className="defi-title">{defi.title}</h2>
                
                <p className="defi-description">{defi.description}</p>
                
                <Button 
                  color="secondary" 
                  size="lg"
                  className="font-bold"
                  onPress={() =>{
                    if (defi.route) {
                      window.location.href = defi.route;
                    } else {
                      console.warn(`Aucune route définie pour le jeu "${defi.title}"`);
                    }
                  }}
                >
                  JOUER
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}