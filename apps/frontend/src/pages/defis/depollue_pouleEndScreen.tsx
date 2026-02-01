import { Button } from "@heroui/button";
import Objectif from "@/components/objective";

interface DepolluePouleEndScreenProps {
  objective: string;
  pouleInfo: {
    name: string;
    emoji: string;
    attempts_left: number;
    my_rank: number;
    is_new_best: boolean;
  };
  score: number;
  maxScore: number;
  multiplicateur: number;
  collectedCount: number;
  removedAllowed: number;
  timeLeft: number;
  pollutants: any[];
  allowedObjects: any[];
  onReturnToPoule: () => void;
  onPlayAgain: () => void;
}

export default function DepolluePouleEndScreen({
  objective,
  pouleInfo,
  score,
  maxScore,
  multiplicateur,
  collectedCount,
  removedAllowed,
  timeLeft,
  pollutants,
  allowedObjects,
  onReturnToPoule,
  onPlayAgain
}: DepolluePouleEndScreenProps) {
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "#fbbf24";
    if (rank === 2) return "#9ca3af";
    if (rank === 3) return "#cd7f32";
    return "#6b7280";
  };

  // Si my_rank est 0, le considérer comme 1
  const displayRank = pouleInfo.my_rank === 0 ? 1 : pouleInfo.my_rank;

  const progressPercent = Math.min(100, (score / maxScore) * 100);

  return (
    <div style={{
      width: "100%",
      minHeight: "calc(100vh - 64px)",
      background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 50%, #e0f2fe 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      paddingTop: "40px",
      paddingBottom: "40px",
      paddingLeft: "20px",
      paddingRight: "20px",
      overflowY: "auto",
      gap: 24
    }}>
      
      {/* En-tête Poule */}
      <div style={{
        width: "100%",
        textAlign: "center",
        paddingBottom: "20px",
        borderBottom: "2px solid #e5e7eb"
      }}>
        <div style={{ fontSize: "56px", marginBottom: "8px" }}>
          {pouleInfo.emoji}
        </div>
        <h1 style={{ 
          fontSize: "36px", 
          fontWeight: "bold", 
          margin: 0, 
          color: "#374151",
          letterSpacing: "-0.5px"
        }}>
          Poule {pouleInfo.name}
        </h1>
      </div>

      {/* Classement */}
      <div style={{
        background: "white",
        borderRadius: "16px",
        padding: "24px",
        textAlign: "center",
        border: "3px solid #646464",
        minWidth: "300px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
      }}>
        <div style={{ fontSize: "16px", color: "#9ca3af", marginBottom: "8px" }}>
          Ton classement
        </div>
        <div style={{
          fontSize: "72px",
          fontWeight: "bold",
          color: getRankColor(displayRank),
          textShadow: "0 2px 6px rgba(0,0,0,0.08)"
        }}>
          {getRankEmoji(displayRank)}
        </div>
        <div style={{ fontSize: "32px", fontWeight: "bold", marginTop: "8px", color: "#374151" }}>
          {displayRank}{displayRank === 1 ? "er" : "ème"}
        </div>
      </div>

      {/* Score */}
      <div style={{
        background: "white",
        border: "3px solid #22c55e",
        borderRadius: "16px",
        padding: "24px 40px",
        textAlign: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        position: "relative"
      }}>
        {pouleInfo.is_new_best && (
          <div style={{
            background: "#22c55e",
            color: "white",
            padding: "6px 16px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "bold",
            marginBottom: "12px",
            display: "inline-block"
          }}>
            🎉 Nouveau record !
          </div>
        )}
        
        <div style={{ fontSize: "48px", fontWeight: "bold", color: "#22c55e" }}>
          {score}/{maxScore}
        </div>
        <div style={{ fontSize: "18px", color: "#9ca3af" }}>
          points
        </div>
      </div>

      {/* Tentatives restantes */}
      <div style={{
        background: pouleInfo.attempts_left === 0 
          ? "#f9fafb" 
          : "white",
        borderRadius: "12px",
        padding: "16px 32px",
        border: `2px solid ${pouleInfo.attempts_left === 0 ? "#e5e7eb" : "#22c55e"}`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
      }}>
        <span style={{ 
          fontSize: "18px", 
          fontWeight: "600",
          color: pouleInfo.attempts_left === 0 ? "#6b7280" : "#22c55e"
        }}>
          {pouleInfo.attempts_left === 0 ? (
            "❌ Plus de tentatives disponibles"
          ) : pouleInfo.attempts_left >= 998 ? (
            "♾️ Tentatives illimitées"
          ) : (
            `🎯 ${pouleInfo.attempts_left} tentative${pouleInfo.attempts_left > 1 ? "s" : ""} restante${pouleInfo.attempts_left > 1 ? "s" : ""}`
          )}
        </span>
      </div>

      {/* Stats détaillées */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        width: "100%",
        maxWidth: "800px"
      }}>
        <div style={{
          background: "white",
          border: "2px solid #e5e7eb",
          borderRadius: "12px",
          padding: "16px",
          textAlign: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
        }}>
          <div style={{ fontSize: "14px", color: "#9ca3af", marginBottom: "8px" }}>Multiplicateur</div>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#374151" }}>
            ×{multiplicateur.toFixed(2)}
          </div>
        </div>

        <div style={{
          background: "white",
          border: "2px solid #e5e7eb",
          borderRadius: "12px",
          padding: "16px",
          textAlign: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
        }}>
          <div style={{ fontSize: "14px", color: "#9ca3af", marginBottom: "8px" }}>Polluants retirés</div>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#22c55e" }}>
            {collectedCount}
          </div>
        </div>

        {removedAllowed > 0 && (
          <div style={{
            background: "white",
            border: "2px solid #fca5a5",
            borderRadius: "12px",
            padding: "16px",
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
          }}>
            <div style={{ fontSize: "14px", color: "#9ca3af", marginBottom: "8px" }}>Erreurs</div>
            <div style={{ fontSize: "32px", fontWeight: "bold", color: "#dc2626" }}>
              {removedAllowed}
            </div>
          </div>
        )}
      </div>

      {/* Boutons d'action */}
      <div style={{
        display: "flex",
        gap: "16px",
        marginTop: "24px",
        flexWrap: "wrap",
        justifyContent: "center"
      }}>
        <Button 
          size="lg"
          className="bg-gray-600 text-white font-bold hover:bg-gray-700"
          onPress={onReturnToPoule}
        >
          🏆 Retour à la poule
        </Button>

        {/* Désactiver le bouton si attempts_left = 0 (sauf si illimité) */}
        {(pouleInfo.attempts_left > 0 || pouleInfo.attempts_left === 999999) && (
          <Button 
            size="lg"
            className="bg-green-600 text-white font-bold hover:bg-green-700"
            onPress={onPlayAgain}
          >
            🔄 Réessayer ({pouleInfo.attempts_left >= 998 ? "∞" : pouleInfo.attempts_left})
          </Button>
        )}
      </div>
    </div>
  );
}