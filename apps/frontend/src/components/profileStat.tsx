type StatProfileProps = {
  title: string;
  value: string | number;
};

export default function StatProfile({ title, value }: StatProfileProps) {
  return (
    <div className="stat-card">
      <p className="stat-title">{title}</p>
      <p className="stat-value">{value}</p>
    </div>
  );
}