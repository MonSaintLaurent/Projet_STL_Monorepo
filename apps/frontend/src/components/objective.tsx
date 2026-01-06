interface ObjectifProps {
  objective: string;
  mode?: "jeu" | "fin";
  style?: React.CSSProperties;
}

export default function Objectif({objective, mode = "jeu", style}: ObjectifProps) {
  const isGameMode = mode === "jeu";
  
  return (
    <div
      style={{
        position: isGameMode ? "relative" : "absolute",
        top: isGameMode ? 20 : 50,
        left: isGameMode ? 20 : 30,
        transform: "none",
        zIndex: isGameMode ? 1001 : "auto",
        display: "flex",
        gap: 8,
        alignItems: "center",
        pointerEvents: "none",
        marginBottom: isGameMode ? 0 : 40,
        ...style,
      }}
    >
      {/* Bulle gauche : OBJECTIF ou RÉSULTATS */}
      <div
        style={{
          background: "#1e6ba8",
          color: "white",
          padding: isGameMode ? "14px 32px" : "16px 40px",
          borderRadius: "30px",
          fontWeight: "bold",
          fontSize: isGameMode ? 18 : 24,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          whiteSpace: "nowrap",
        }}
      >
        {mode === "jeu" ? "OBJECTIF" : "RÉSULTATS"}
      </div>

      {/* Bulle droite : consigne ou résumé */}
      <div
        style={{
          background: "#1e6ba8",
          color: "white",
          padding: isGameMode ? "14px 36px" : "16px 44px",
          borderRadius: "30px",
          fontWeight: "500",
          fontSize: isGameMode ? 18 : 24,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          maxWidth: isGameMode ? "700px" : "900px",
        }}
      >
        {objective}
      </div>
    </div>
  );
}
