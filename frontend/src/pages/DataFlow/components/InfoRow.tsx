const InfoRow = ({ label, value }: { label: string; value: string }) => {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] text-gray-500 uppercase">{label}</p>
      <p className="text-xs text-gray-300 break-all">{value}</p>
    </div>
  );
};

export default InfoRow;
