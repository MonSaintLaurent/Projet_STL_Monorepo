import { Button } from "@heroui/button";
import Objectif from "@/components/objective";

interface PouleEndScreenProps {
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

export default function PouleEndScreen({
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
}: PouleEndScreenProps) {
  
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
    return "#afb0e4";
  };

  // Si my_rank est 0, le considérer comme 1
  const displayRank = pouleInfo.my_rank === 0 ? 1 : pouleInfo.my_rank;

  const progressPercent = Math.min(100, (score / maxScore) * 100);

  return (
    <div style={{
      width: "100%",
      minHeight: "calc(100vh - 64px)",
      background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #ddd6fe 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 24,
      padding: "40px 20px",
      overflowY: "auto"
    }}>
      
      {/* En-tête Poule */}
      <div style={{
        background: "white",
        borderRadius: "16px",
        padding: "20px 40px",
        textAlign: "center",
        border: "3px solid #afb0e4",
        boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)"
      }}>
        <div style={{ fontSize: "48px", marginBottom: "8px" }}>
          {pouleInfo.emoji}
        </div>
        <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: 0, color: "#6366f1" }}>
          Poule {pouleInfo.name}
        </h2>
      </div>

      {/* Nouveau record ou non */}
      {pouleInfo.is_new_best ? (
        <div style={{
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          padding: "16px 32px",
          borderRadius: "12px",
          fontSize: "24px",
          fontWeight: "bold",
          color: "white",
          boxShadow: "0 8px 20px rgba(16,185,129,0.4)",
          animation: "pulse 2s ease-in-out infinite"
        }}>
          🎉 Nouveau record personnel !
        </div>
      ) : (
        <div style={{
          background: "white",
          border: "2px solid #e5e7eb",
          padding: "12px 24px",
          borderRadius: "12px",
          fontSize: "18px",
          color: "#374151",
          fontWeight: "600"
        }}>
          ✅ Score enregistré
        </div>
      )}

      {/* Classement */}
      <div style={{
        background: "white",
        borderRadius: "16px",
        padding: "24px",
        textAlign: "center",
        border: "3px solid #afb0e4",
        minWidth: "300px",
        boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)"
      }}>
        <div style={{ fontSize: "16px", color: "#6b7280", marginBottom: "8px" }}>
          Ton classement
        </div>
        <div style={{
          fontSize: "72px",
          fontWeight: "bold",
          color: getRankColor(displayRank),
          textShadow: "0 4px 12px rgba(0,0,0,0.1)"
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
        border: "2px solid #dcfce7",
        borderRadius: "16px",
        padding: "24px 40px",
        textAlign: "center",
        boxShadow: "0 4px 12px rgba(34, 197, 94, 0.1)"
      }}>
        <div style={{ fontSize: "48px", fontWeight: "bold", color: "#22c55e" }}>
          {score}/{maxScore}
        </div>
        <div style={{ fontSize: "18px", color: "#6b7280" }}>
          points
        </div>
      </div>

      {/* Tentatives restantes */}
      <div style={{
        background: pouleInfo.attempts_left === 0 
          ? "#fee2e2" 
          : "#dcfce7",
        borderRadius: "12px",
        padding: "16px 32px",
        border: `2px solid ${pouleInfo.attempts_left === 0 ? "#fecaca" : "#bbf7d0"}`,
        boxShadow: pouleInfo.attempts_left === 0 
          ? "0 4px 12px rgba(239, 68, 68, 0.2)"
          : "0 4px 12px rgba(34, 197, 94, 0.2)"
      }}>
        <span style={{ 
          fontSize: "20px", 
          fontWeight: "600",
          color: pouleInfo.attempts_left === 0 ? "#dc2626" : "#166534"
        }}>
          {pouleInfo.attempts_left === 0 ? (
            "❌ Plus de tentatives disponibles"
          ) : pouleInfo.attempts_left === 999999 ? (
            "♾️ Tentatives illimitées"
          ) : (
            // Affichage tentatives restantes
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
          textAlign: "center"
        }}>
          <div style={{ fontSize: "14px", color: "#6b7280" }}>Multiplicateur</div>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#374151" }}>
            ×{multiplicateur.toFixed(2)}
          </div>
        </div>

        <div style={{
          background: "#dcfce7",
          border: "2px solid #bbf7d0",
          borderRadius: "12px",
          padding: "16px",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "14px", color: "#166534" }}>Polluants retirés</div>
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#166534" }}>
            {collectedCount}
          </div>
        </div>

        {removedAllowed > 0 && (
          <div style={{
            background: "#fee2e2",
            border: "2px solid #fecaca",
            borderRadius: "12px",
            padding: "16px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "14px", color: "#dc2626" }}>Erreurs</div>
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
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold hover:from-green-600 hover:to-emerald-700"
            onPress={onPlayAgain}
          >
            🔄 Réessayer ({pouleInfo.attempts_left === 999999 ? "∞" : pouleInfo.attempts_left})
          </Button>
        )}
      </div>
    </div>
  );
}