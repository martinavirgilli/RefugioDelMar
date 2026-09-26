const variants = {
  default:      "bg-sun text-deep",
  planificada:  "bg-sun text-deep",
  realizada:    "bg-green-100 text-green-800",
  cancelada:    "bg-snowmelt text-glacial",
  adoptado:     "bg-green-100 text-green-800",
  disponible:   "bg-sun text-deep",
};

export default function Badge({ text, variant = "default" }) {
  const key = variant !== "default" ? variant : (text?.toLowerCase() ?? "default");
  const cls = variants[key] ?? variants.default;

  return (
    <span className={`inline-block ${cls} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
      {text}
    </span>
  );
}
