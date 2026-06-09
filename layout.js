(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.FlowchartsLayout = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const X_GAP = 250;
  const Y_GAP = 118;
  const PADDING_X = 72;
  const PADDING_Y = 86;

  function graphLevels(nodes, edges) {
    const ids = new Set(nodes.map(node => node.id));
    const incoming = new Map(nodes.map(node => [node.id, 0]));
    const outgoing = new Map(nodes.map(node => [node.id, []]));
    edges.forEach(edge => {
      if (!ids.has(edge.from) || !ids.has(edge.to)) return;
      incoming.set(edge.to, incoming.get(edge.to) + 1);
      outgoing.get(edge.from).push(edge.to);
    });
    const roots = nodes.filter(node => !incoming.get(node.id)).map(node => node.id);
    const queue = (roots.length ? roots : [nodes[0]?.id]).filter(Boolean).map(id => [id, 0]);
    const levels = new Map();
    while (queue.length) {
      const [id, level] = queue.shift();
      if (levels.has(id)) continue;
      levels.set(id, level);
      outgoing.get(id)?.forEach(next => { if (!levels.has(next)) queue.push([next, level + 1]); });
    }
    nodes.forEach(node => { if (!levels.has(node.id)) levels.set(node.id, Math.max(0, ...levels.values()) + 1); });
    return levels;
  }

  function layoutGraph(nodes, edges, originX = 0, originY = 0) {
    if (!nodes.length) return { x: originX, y: originY, w: 0, h: 0, aspect: 1 };
    const levels = graphLevels(nodes, edges);
    const columns = {};
    nodes.forEach(node => (columns[levels.get(node.id)] ||= []).push(node));
    const depth = Math.max(...levels.values()) + 1;
    const maxRows = Math.max(...Object.values(columns).map(column => column.length));
    Object.entries(columns).forEach(([level, column]) => {
      const columnHeight = (column.length - 1) * Y_GAP;
      column.forEach((node, row) => {
        node.x = originX + PADDING_X + Number(level) * X_GAP;
        node.y = originY + PADDING_Y + (maxRows - 1) * Y_GAP / 2 - columnHeight / 2 + row * Y_GAP;
      });
    });
    const w = PADDING_X * 2 + Math.max(180, (depth - 1) * X_GAP + 180);
    const h = PADDING_Y * 2 + Math.max(72, (maxRows - 1) * Y_GAP + 72);
    return { x: originX, y: originY, w, h, aspect: w / h };
  }

  function moveBlock(block, x, y) {
    const dx = x - block.bounds.x, dy = y - block.bounds.y;
    block.nodes.forEach(node => { node.x += dx; node.y += dy; });
    Object.assign(block.bounds, { x, y });
  }

  function layout(nodes, edges, groups = []) {
    const grouped = new Set();
    const blocks = groups.map(group => {
      const members = nodes.filter(node => node.group === group.id);
      members.forEach(node => grouped.add(node.id));
      const ids = new Set(members.map(node => node.id));
      const bounds = layoutGraph(members, edges.filter(edge => ids.has(edge.from) && ids.has(edge.to)));
      return { group, nodes: members, bounds };
    }).filter(block => block.nodes.length);

    // Mermaid-like composition: wide process pipelines first, tall data trees beside them.
    blocks.sort((a, b) => b.bounds.aspect - a.bounds.aspect);
    let x = 180, y = 170, rowHeight = 0;
    blocks.forEach(block => {
      moveBlock(block, x, y);
      block.group.bounds = block.bounds;
      x += block.bounds.w + 150;
      rowHeight = Math.max(rowHeight, block.bounds.h);
    });

    const loose = nodes.filter(node => !grouped.has(node.id));
    if (loose.length) layoutGraph(loose, edges.filter(edge => !grouped.has(edge.from) && !grouped.has(edge.to)), 180, y + rowHeight + 160);
    return { nodes, groups, width: x + 120, height: y + rowHeight + 220 };
  }
  return { layout, layoutGraph, graphLevels };
});
