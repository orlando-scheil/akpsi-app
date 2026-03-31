// Converts a flat member list into positioned React Flow nodes and edges for the family tree.
// Handles ghost nodes for bigs not in the database and lays out trees in generational rows.
import type { Node, Edge } from "@xyflow/react";
import type { Member } from "@/types/member";

// ─── Layout constants ─────────────────────────────────────────────────────────
const ROW_HEIGHT = 110;
const NODE_WIDTH = 168;
const NODE_GAP = 48;   // horizontal gap between siblings
const TREE_GAP = 80;   // horizontal gap between separate family trees

// ─── Family colors (cycled across root trees) ─────────────────────────────────
const FAMILY_COLORS = [
  "#3b82f6", // blue   – fam-1
  "#10b981", // emerald – fam-2
  "#8b5cf6", // violet – fam-3
  "#f59e0b", // amber
  "#ef4444", // red
  "#06b6d4", // cyan
];

// ─── Internal tree representation ─────────────────────────────────────────────
interface InternalNode {
  id: string;
  type: "member" | "ghost";
  member?: Member;
  ghostName?: string;
  pledgeOrder: number; // determines y-position
  children: InternalNode[];
  subtreeWidth: number;
  x: number;
  y: number;
}

// Pledge class → comparable integer (Fall year*2, Spring year*2-1)
function pledgeOrder(m: Member): number {
  return m.pledgeClassQuarter === "Fall"
    ? m.pledgeClassYear * 2
    : m.pledgeClassYear * 2 - 1;
}

// Bottom-up pass: compute subtree widths
function computeWidths(node: InternalNode): void {
  for (const child of node.children) computeWidths(child);

  if (node.children.length === 0) {
    node.subtreeWidth = NODE_WIDTH;
  } else {
    const total = node.children.reduce(
      (sum, c, i) => sum + c.subtreeWidth + (i > 0 ? NODE_GAP : 0),
      0
    );
    node.subtreeWidth = Math.max(NODE_WIDTH, total);
  }
}

// Top-down pass: assign x coordinates
function assignX(node: InternalNode, startX: number): void {
  node.x = startX + node.subtreeWidth / 2 - NODE_WIDTH / 2;
  let cx = startX;
  for (const child of node.children) {
    assignX(child, cx);
    cx += child.subtreeWidth + NODE_GAP;
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function buildFamilyTree(members: Member[]): {
  nodes: Node[];
  edges: Edge[];
} {
  if (members.length === 0) return { nodes: [], edges: [] };

  const memberMap = new Map<string, Member>(members.map((m) => [m.uid, m]));

  // ── Build parent→children map ──────────────────────────────────────────────
  // Also collect ghost nodes (bigs not in the member list)
  const childrenOf = new Map<string, string[]>();
  const ghostMap = new Map<string, string>(); // ghostId → display name
  const hasParent = new Set<string>();

  const addChild = (parentId: string, childUid: string) => {
    if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
    childrenOf.get(parentId)!.push(childUid);
    hasParent.add(childUid);
  };

  for (const m of members) {
    if (m.bigUid) {
      if (memberMap.has(m.bigUid)) {
        addChild(m.bigUid, m.uid);
      } else {
        // Stale uid reference — treat as ghost; only set name if not already known
        const gid = `ghost-uid-${m.bigUid}`;
        if (!ghostMap.has(gid)) ghostMap.set(gid, m.bigName ?? "Unknown");
        addChild(gid, m.uid);
      }
    } else if (m.bigName) {
      // Known name, no uid — create/reuse ghost by name
      const gid = `ghost-name-${m.bigName.replace(/\s+/g, "-").toLowerCase()}`;
      ghostMap.set(gid, m.bigName);
      addChild(gid, m.uid);
    }
  }

  // ── Determine pledge class row y-positions ─────────────────────────────────
  const orders = new Set<number>(members.map(pledgeOrder));
  const minOrder = Math.min(...orders);
  const ghostOrder = minOrder - 1; // ghost nodes sit one row above the oldest class

  const allOrders = [ghostOrder, ...Array.from(orders).sort((a, b) => a - b)];
  const orderToY = new Map<number, number>(
    allOrders.map((o, i) => [o, i * ROW_HEIGHT])
  );

  // ── Recursively build internal tree (with cycle guard) ─────────────────────
  function buildNode(
    id: string,
    isGhost: boolean,
    ghostName: string | undefined,
    visited: Set<string>
  ): InternalNode {
    if (visited.has(id)) {
      // Cycle — return as leaf
      const m = memberMap.get(id);
      return {
        id, type: "member", member: m,
        pledgeOrder: m ? pledgeOrder(m) : ghostOrder,
        children: [], subtreeWidth: NODE_WIDTH, x: 0, y: 0,
      };
    }
    visited.add(id);

    const m = memberMap.get(id);
    const po = isGhost ? ghostOrder : (m ? pledgeOrder(m) : ghostOrder);
    const childIds = childrenOf.get(id) ?? [];
    const children = childIds.map((cid) => buildNode(cid, false, undefined, new Set(visited)));

    return {
      id,
      type: isGhost ? "ghost" : "member",
      member: isGhost ? undefined : m,
      ghostName,
      pledgeOrder: po,
      children,
      subtreeWidth: NODE_WIDTH,
      x: 0,
      y: orderToY.get(po) ?? 0,
    };
  }

  // ── Collect roots ──────────────────────────────────────────────────────────
  const roots: InternalNode[] = [];

  // Ghost roots first
  for (const [gid, name] of ghostMap) {
    roots.push(buildNode(gid, true, name, new Set()));
  }

  // Member roots (no parent at all)
  for (const m of members) {
    if (!hasParent.has(m.uid)) {
      roots.push(buildNode(m.uid, false, undefined, new Set()));
    }
  }

  // ── Lay out each tree side by side ────────────────────────────────────────
  let cursorX = 0;
  let colorIdx = 0;

  const rfNodes: Node[] = [];
  const rfEdges: Edge[] = [];

  for (const root of roots) {
    computeWidths(root);
    assignX(root, cursorX);

    // Assign y after positions computed
    function setY(node: InternalNode) {
      node.y = orderToY.get(node.pledgeOrder) ?? 0;
      for (const c of node.children) setY(c);
    }
    setY(root);

    const color = FAMILY_COLORS[colorIdx % FAMILY_COLORS.length];
    colorIdx++;

    // Flatten to React Flow nodes + edges
    function flatten(node: InternalNode) {
      if (node.type === "ghost") {
        rfNodes.push({
          id: node.id,
          type: "ghostNode",
          position: { x: node.x, y: node.y },
          data: { name: node.ghostName, familyColor: color },
          draggable: false,
          selectable: false,
        });
      } else {
        rfNodes.push({
          id: node.id,
          type: "memberNode",
          position: { x: node.x, y: node.y },
          data: { member: node.member, familyColor: color },
          draggable: false,
        });
      }

      for (const child of node.children) {
        rfEdges.push({
          id: `e-${node.id}-${child.id}`,
          source: node.id,
          target: child.id,
          type: "smoothstep",
          style: { stroke: color, strokeWidth: 2.5, opacity: 0.7 },
        });
        flatten(child);
      }
    }

    flatten(root);
    cursorX += root.subtreeWidth + TREE_GAP;
  }

  return { nodes: rfNodes, edges: rfEdges };
}
