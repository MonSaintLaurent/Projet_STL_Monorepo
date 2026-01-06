import "./legend.css"

interface LegendProps{
    quantiles: number[];
    colorScale: number[][]; // each color is an array [r, g, b]
}

export default function Legend({ quantiles, colorScale }: LegendProps) {

    if (!Array.isArray(quantiles) || quantiles.length === 0 || !Array.isArray(colorScale) || colorScale.length === 0) {
        return (
            <div className="legend">
                <span className="legend-title">Légende (Vitesse)</span>
                <span className="legend-label">Aucune donnée disponible</span>
            </div>
        );
    }

    // Créer le gradient continu
    const maxValue = Math.max(...quantiles) * 1.5;
    const gradientStops = [
        { pos: 0, color: "rgb(0, 0, 255)" },      // bleu
        { pos: 25, color: "rgb(0, 255, 255)" },   // cyan
        { pos: 50, color: "rgb(0, 255, 0)" },     // vert
        { pos: 75, color: "rgb(255, 255, 0)" },   // jaune
        { pos: 100, color: "rgb(255, 0, 0)" }     // rouge
    ];
    
    const gradientString = gradientStops
        .map(stop => `${stop.color} ${stop.pos}%`)
        .join(", ");

    return (
        <div className="legend">
            <span className="legend-title">Légende (Vitesse)</span>
            <div className="legend-gradient-container">
                <div 
                    className="legend-gradient"
                    style={{ 
                        background: `linear-gradient(to top, ${gradientString})`
                    }}
                />
                <div className="legend-labels">
                    <span className="legend-label">{maxValue.toFixed(0)}</span>
                    <span className="legend-label">{(maxValue * 0.5).toFixed(0)}</span>
                    <span className="legend-label">0</span>
                </div>
            </div>
            <span className="legend-unit">mètres/secondes</span>
        </div>
    );
}