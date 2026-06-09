(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.FlowchartsParser = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const arrows = ['<-.->', '<-.-', '-.->', '<-->', '<--', '-->'];
  const arrowPattern = arrows.map(value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

  function cleanLabel(value = '') {
    return value.trim().replace(/^['"]|['"]$/g, '').replace(/<br\s*\/?\s*>/gi, ' · ').replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  }

  function parseDefinition(fragment) {
    const match = fragment.match(/^\s*([\w-]+)\s*(\[|\{|\()\s*([\s\S]*?)\s*(\]|\}|\))\s*$/);
    if (!match) return null;
    return { id: match[1], label: cleanLabel(match[3]), type: match[2] === '{' ? 'decision' : match[2] === '(' ? 'rounded' : 'node' };
  }

  function parse(source) {
    source = String(source || '').replace(/\\n/g, '\n').replace(/\r/g, '');
    const nodes = new Map(), edges = [], groups = [], groupStack = [], styles = new Map(), metadata = [];
    const ensureNode = (id, label = id, type = 'node') => {
      const current = nodes.get(id) || { id, label: cleanLabel(label) || id, type, color: null, fontSize: 13, align: 'center' };
      if (label !== id) current.label = cleanLabel(label) || id;
      if (type !== 'node' || !current.type) current.type = type;
      if (groupStack.length) current.group = groupStack[groupStack.length - 1];
      nodes.set(id, current);
      return current;
    };
    const parseEndpoint = fragment => {
      const definition = parseDefinition(fragment.trim());
      if (definition) { ensureNode(definition.id, definition.label, definition.type); return definition.id; }
      const id = fragment.trim().match(/^[\w-]+/)?.[0];
      if (id) ensureNode(id);
      return id;
    };

    source.split('\n').forEach(raw => {
      const line = raw.trim();
      if (!line || line.startsWith('%%') || /^(flowchart|graph)\s+/i.test(line)) {
        const meta = line.match(/^%%\s*flowcharts?-edge:(\d+)\s+shape=(\w+)(?:\s+dashed=(true|false))?\s+fromSide=(\w+)\s+toSide=(\w+)(?:\s+labelPos=(\d+))?/);
        if (meta) metadata[+meta[1]] = { shape: meta[2], dashed: meta[3] === 'true', fromSide: meta[4], toSide: meta[5], labelPos: Number(meta[6] || 50) };
        return;
      }
      const subgroup = line.match(/^subgraph\s+([\w-]+)(?:\s+\[\s*["']?([\s\S]*?)["']?\s*\])?$/i);
      if (subgroup) { groups.push({ id: subgroup[1], label: cleanLabel(subgroup[2] || subgroup[1]) }); groupStack.push(subgroup[1]); return; }
      if (/^end$/i.test(line)) { groupStack.pop(); return; }
      const style = line.match(/^style\s+([\w-]+)\s+fill:(#[0-9a-fA-F]{3,8})/i);
      if (style) { styles.set(style[1], style[2]); return; }

      let edge = line.match(new RegExp(`^([\\w-]+(?:\\s*[\\[\\{\\(].*?[\\]\\}\\)] )?)\\s*--\\s*["']([^"']+)["']\\s*-->\\s*([\\w-]+(?:\\s*[\\[\\{\\(].*?[\\]\\}\\)])?)$`.replace('] )', '])')));
      if (!edge) edge = line.match(/^([\w-]+)\s*--\s*["']([^"']+)["']\s*-->\s*([\w-]+)$/);
      if (edge) { const from = parseEndpoint(edge[1]), to = parseEndpoint(edge[3]); if (from && to) edges.push({ from, to, label: cleanLabel(edge[2]), shape: 'curve', dashed: false, direction: 'forward' }); return; }

      edge = line.match(new RegExp(`^(.+?)\\s*(${arrowPattern})\\s*(?:\\|([^|]+)\\|\\s*)?(.+?)$`));
      if (edge) {
        const from = parseEndpoint(edge[1]), to = parseEndpoint(edge[4]);
        if (from && to) edges.push({ from, to, label: cleanLabel(edge[3] || ''), shape: 'curve', dashed: edge[2].includes('.'), direction: edge[2].startsWith('<') && edge[2].endsWith('>') ? 'both' : edge[2].startsWith('<') ? 'back' : 'forward' });
        return;
      }
      const definition = parseDefinition(line); if (definition) ensureNode(definition.id, definition.label, definition.type);
    });
    const nodeList = [...nodes.values()];
    nodeList.forEach(node => { if (styles.has(node.id)) node.color = styles.get(node.id); });
    edges.forEach((edge, index) => Object.assign(edge, { fromSide: 'right', toSide: 'left', labelPos: 50 }, metadata[index] || {}));
    return { nodes: nodeList, edges, groups };
  }
  return { parse, cleanLabel };
});
