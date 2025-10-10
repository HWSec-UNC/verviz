// Converts your hierarchical tree (with children[]) into nodes/links
export function treeToGraph(root) {
  if (!root) return { nodes: [], links: [] };

  const nodes = [];
  const links = [];
  let seq = 0;

  function visit(node, parentId) {
    const id = String(seq++); // IMPORTANT: string id
    nodes.push({
      id,
      name: node?.name || "Unnamed",
      state: node?.state,
      path_condition: node?.path_condition || []
    });
    if (parentId != null) links.push({ source: parentId, target: id });
    (node?.children || []).forEach((child) => visit(child, id));
  }

  visit(root, null);
 // console.log({nodes,links})
  return { nodes, links };
}
