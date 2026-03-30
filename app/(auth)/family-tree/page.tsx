// Family Tree page — interactive big/little relationship graph across pledge classes.
// Protected by the (auth) layout; only visible to signed-in members.
import { FamilyTreeGraph } from "@/components/family-tree/FamilyTreeGraph";

export default function FamilyTreePage() {
  return <FamilyTreeGraph />;
}
