export const cytoscapeStyles = [
  {
    selector: 'node',
    style: {
      'background-color': 'data(color)',
      'border-width': 2,
      'border-color': '#1a1a2e',
      label: 'data(label)',
      color: '#e0e0ff',
      'font-size': '10px',
      'font-family': 'IBM Plex Mono, monospace',
      'text-valign': 'bottom',
      'text-margin-y': 5,
      'text-wrap': 'wrap',
      'text-max-width': '100px',
      'text-background-color': '#0a1220',
      'text-background-opacity': 0.8,
      'text-background-padding': '2px',
      width: 'data(size)',
      height: 'data(size)',
    },
  },
  {
    selector: 'node[domain="meta"]',
    style: {
      'background-color': '#314056',
      shape: 'round-rectangle',
      'font-size': '9px',
      'text-valign': 'center',
      'text-margin-y': 0,
      color: '#d8e1ef',
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
    selector: 'node[domain="infrastructure"]',
    style: { 'background-color': '#c77dff', shape: 'cut-rectangle' },
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
      'font-family': 'IBM Plex Mono, monospace',
      color: '#7a8fa8',
      opacity: 0.85,
      'text-background-color': '#0a1220',
      'text-background-opacity': 0.7,
      'text-background-padding': '2px',
    },
  },
  {
    selector: 'edge[relationship="DRIVES"]',
    style: { 'line-color': '#4db8ff', 'target-arrow-color': '#4db8ff' },
  },
  {
    selector: 'edge[relationship="AMPLIFIES"]',
    style: { 'line-color': '#f4a261', 'target-arrow-color': '#f4a261' },
  },
  {
    selector: 'edge[relationship="TRIGGERS"]',
    style: { 'line-color': '#ef233c', 'target-arrow-color': '#ef233c' },
  },
  {
    selector: 'edge[relationship="STRESSES"]',
    style: { 'line-color': '#c77dff', 'target-arrow-color': '#c77dff' },
  },
  {
    selector: 'edge[relationship="REDUCES"]',
    style: { 'line-color': '#52b788', 'target-arrow-color': '#52b788' },
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
    name: 'breadthfirst',
    directed: true,
    spacingFactor: 1.25,
    animate: true,
  },
  radial: {
    name: 'concentric',
    concentric: (node: { degree: () => number }) => node.degree(),
    levelWidth: () => 2,
    startAngle: (3 / 2) * Math.PI,
    clockwise: true,
    animate: true,
  },
}
