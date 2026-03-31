// Custom React Flow node for a big who is not in the member database.
// Shown as a greyed dashed card above the oldest pledge class row.
import { Handle, Position, type NodeProps } from "@xyflow/react";

export interface GhostNodeData {
  name: string;
  familyColor: string;
}

export function GhostNode({ data }: NodeProps) {
  const { name, familyColor } = data as unknown as GhostNodeData;

  return (
    <>
      <div
        className="rounded-xl border-2 border-dashed px-3 py-2.5 flex items-center gap-2.5 opacity-50 bg-white/60"
        style={{ borderColor: familyColor, width: 168 }}
      >
        <div
          className="h-9 w-9 rounded-full border-2 border-dashed flex items-center justify-center text-xs shrink-0"
          style={{ borderColor: familyColor, color: familyColor }}
        >
          ?
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate leading-tight">{name}</p>
          <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
            Not in directory
          </p>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: familyColor }} />
    </>
  );
}
