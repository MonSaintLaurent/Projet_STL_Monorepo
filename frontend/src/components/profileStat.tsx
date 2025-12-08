import React from "react";

interface StatCardProps {
  icon: string;
  value: string;
  unit: string;
  label: string;
  visible: boolean;
}

export default function StatProfile({ icon, value, unit, label, visible }: StatCardProps) {
  if (!visible) return null;

  return (
    <div className="stat-card">
      {icon && <div className="stat-icon">{icon}</div>}
      <div>
        <p className="stat-value">{value}</p>
        <p className="stat-unit">{unit}</p>
      </div>
      <p className="stat-label">{label}</p>
    </div>
  );
}