// Interactive family tree canvas — pan/zoom graph of big/little relationships.
// Uses React Flow for rendering; nodes laid out in generational pledge class rows.
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  type Node,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { getMembers } from "@/lib/firestore";
import { buildFamilyTree } from "@/lib/build-family-tree";
import { theme } from "@/lib/theme";
import { MemberNode } from "./MemberNode";
import { GhostNode } from "./GhostNode";
import { MemberDetailPanel } from "./MemberDetailPanel";
import type { Member } from "@/types/member";
import type { MemberNodeData } from "./MemberNode";

const nodeTypes = {
  memberNode: MemberNode,
  ghostNode: GhostNode,
};

export function FamilyTreeGraph() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  useEffect(() => {
    getMembers()
      .then(setMembers)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const { nodes, edges } = useMemo(() => buildFamilyTree(members), [members]);

  const onNodeClick: NodeMouseHandler<Node> = useCallback((_event, node) => {
    if (node.type === "memberNode") {
      setSelectedMember((node.data as unknown as MemberNodeData).member ?? null);
    }
  }, []);

  const onPaneClick = useCallback(() => setSelectedMember(null), []);

  if (loading) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 w-full h-[calc(100vh-63px)]"
        style={{ background: theme.bgPage }}
      >
        <div
          className="h-5 w-5 rounded-full border-2 animate-spin"
          style={{
            borderColor: `${theme.primary}40`,
            borderTopColor: theme.primary,
          }}
        />
        <p className="text-xs tracking-wide" style={{ color: theme.textDim }}>
          Loading family tree…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center w-full h-[calc(100vh-63px)]"
        style={{ background: theme.bgPage }}
      >
        <p className="text-destructive text-sm">Failed to load members: {error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-63px)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Controls showInteractive={false} />
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color={theme.bgDots}
        />
      </ReactFlow>

      {selectedMember && (
        <MemberDetailPanel
          member={selectedMember}
          members={members}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
}
