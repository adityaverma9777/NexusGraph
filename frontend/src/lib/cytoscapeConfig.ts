export const cytoscapeStyles = [
  {
    selector: 'node',
    style: {
      'background-color': 'data(color)',
      'border-width': 2,
      'border-color': '#1a1a2e',
      label: 'data(label)',
      color: '#e0e0ff',
      'font-size': '11px',
      'font-family': 'IBM Plex Mono, monospace',
      'text-valign': 'bottom',
      'text-margin-y': 5,
      width: 'data(size)',
      height: 'data(size)',
    },
  },
  {
    selector: 'node[domain="climate"]',
    style: { 'background-color': '#00b4d8', shape: 'hexagon' },
  },
  {
    selector: 'node[domain="disease"]',
    style: { 'background-color': '#ef233c', shape: 'diamond' },
  },
  {
    selector: 'node[domain="economy"]',
    style: { 'background-color': '#f4a261', shape: 'rectangle' },
  },
  {
    selector: 'node[domain="ecology"]',
    style: { 'background-color': '#52b788', shape: 'pentagon' },
  },
  {
    selector: 'node[domain="population"]',
    style: { 'background-color': '#a8dadc', shape: 'ellipse' },
  },
  {
    selector: 'edge',
    style: {
      width: 'data(weight)',
      'line-color': 'data(edgeColor)',
      'target-arrow-color': 'data(edgeColor)',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      label: 'data(relationship)',
      'font-size': '9px',
      color: '#888',
      opacity: 0.8,
    },
  },
  {
    selector: 'edge[confidence < 0.5]',
    style: { 'line-style': 'dashed', opacity: 0.4 },
  },
  {
    selector: ':selected',
    style: {
      'border-width': 4,
      'border-color': '#f0f0ff',
      'background-color': '#ffffff',
    },
  },
]

export const cytoscapeLayouts = {
  default: {
    name: 'cose-bilkent',
    animate: true,
    animationDuration: 600,
    nodeRepulsion: 8000,
    idealEdgeLength: 180,
    gravity: 0.25,
    numIter: 2500,
  },
  hierarchical: {
    name: 'dagre',
    rankDir: 'TB',
    nodeSep: 80,
    rankSep: 120,
    animate: true,
  },
  radial: {
    name: 'concentric',
    concentric: (node: { degree: () => number }) => node.degree(),
    levelWidth: () => 2,
    animate: true,
  },
}
