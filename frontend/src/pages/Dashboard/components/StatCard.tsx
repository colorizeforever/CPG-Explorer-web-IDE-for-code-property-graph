const COLORS: Record<string, string> = {
  blue: "text-accent-blue",
  green: "text-accent-green",
  purple: "text-accent-purple",
  orange: "text-accent-orange",
  red: "text-accent-red",
};

const StatCard = ({
  label,
  value,
  color = "blue",
}: {
  label: string;
  value: string;
  color?: string;
}) => (
  <div className="bg-surface-800 rounded-lg border border-surface-600 p-4">
    <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
    <p className={`text-xl font-bold mt-1 ${COLORS[color] || COLORS.blue}`}>
      {value ?? "-"}
    </p>
  </div>
);

export default StatCard;
