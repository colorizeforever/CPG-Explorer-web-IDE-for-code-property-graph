const Metric = ({ label, value }: { label: string; value: number }) => (
  <div className="bg-surface-700 rounded p-2">
    <p className="text-[10px] text-gray-500 uppercase">{label}</p>
    <p className="text-sm font-semibold text-gray-200">{value.toLocaleString()}</p>
  </div>
);

export default Metric;
