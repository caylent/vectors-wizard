import { formatBytes } from "@/lib/providers/s3-vectors/pricing";

export function VectorSizeVisualization({
  dimensions,
  avgKeyLengthBytes,
  filterableMetadataBytes,
  nonFilterableMetadataBytes,
}: {
  dimensions: number;
  avgKeyLengthBytes: number;
  filterableMetadataBytes: number;
  nonFilterableMetadataBytes: number;
}) {
  const vectorDataBytes = 4 * dimensions;
  const total =
    vectorDataBytes +
    avgKeyLengthBytes +
    filterableMetadataBytes +
    nonFilterableMetadataBytes;
  if (total === 0) return null;

  const segments = [
    {
      label: "Vector data",
      bytes: vectorDataBytes,
      color: "bg-accent",
    },
    {
      label: "Key",
      bytes: avgKeyLengthBytes,
      color: "bg-info",
    },
    {
      label: "Filterable meta",
      bytes: filterableMetadataBytes,
      color: "bg-success",
    },
    {
      label: "Non-filterable meta",
      bytes: nonFilterableMetadataBytes,
      color: "bg-warning",
    },
  ].filter((s) => s.bytes > 0);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-text-secondary">
          Per-vector storage breakdown
        </span>
        <span className="font-mono text-xs text-muted">
          {formatBytes(total)}/vector
        </span>
      </div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className={`${seg.color} transition-all duration-500`}
            style={{ width: `${(seg.bytes / total) * 100}%` }}
            title={`${seg.label}: ${formatBytes(seg.bytes)}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((seg) => (
          <span key={seg.label} className="flex items-center gap-1.5 text-xs">
            <span
              className={`inline-block h-2 w-2 rounded-full ${seg.color}`}
            />
            <span className="text-text-secondary">{seg.label}</span>
            <span className="font-mono text-muted">{formatBytes(seg.bytes)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
