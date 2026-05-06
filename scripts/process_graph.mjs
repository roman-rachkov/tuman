/**
 * Processes /tmp/vlad_osm.json (from Overpass) into src/assets/maps/vladivostok.json
 * Builds a road intersection graph with named POIs.
 */
import fs from 'fs';

const SPEED_MAP = {
  motorway: 2.2, trunk: 2.0, primary: 1.8, secondary: 1.6,
  tertiary: 1.4, residential: 1.2, living_street: 1.0, unclassified: 1.2,
};

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const raw = JSON.parse(fs.readFileSync('/tmp/vlad_osm.json', 'utf8'));
console.log(`Total OSM elements: ${raw.elements.length}`);

const osmNodes = {};
for (const el of raw.elements) {
  if (el.type === 'node') osmNodes[el.id] = el;
}

const ways = raw.elements.filter(e => e.type === 'way' && e.nodes?.length >= 2);
console.log(`Ways: ${ways.length}`);

// Count node references across all ways to find intersections
const nodeRefCount = {};
for (const way of ways) {
  for (const nid of way.nodes) {
    nodeRefCount[nid] = (nodeRefCount[nid] || 0) + 1;
  }
}

// Graph vertices: endpoints + intersections (node referenced by >1 way)
const graphNodeIds = new Set();
for (const way of ways) {
  const ns = way.nodes;
  graphNodeIds.add(ns[0]);
  graphNodeIds.add(ns[ns.length - 1]);
  for (const nid of ns) {
    if (nodeRefCount[nid] > 1) graphNodeIds.add(nid);
  }
}
console.log(`Graph vertices: ${graphNodeIds.size}`);

// Build graph nodes
const graphNodes = [];
const nodeIdMap = {};
let nodeCounter = 0;

for (const osmId of graphNodeIds) {
  const n = osmNodes[osmId];
  if (!n || n.lat == null) continue;
  const gid = `n_${nodeCounter++}`;
  nodeIdMap[osmId] = gid;
  const entry = { id: gid, lat: n.lat, lng: n.lon };
  if (n.tags?.name) entry.tags = { name: n.tags.name };
  graphNodes.push(entry);
}

// Build edges between consecutive graph vertices along each way
const graphEdges = [];
const edgeSet = new Set();
let edgeCounter = 0;

for (const way of ways) {
  const highway = way.tags?.highway || 'unclassified';
  const speed = SPEED_MAP[highway] || 1.2;
  const ns = way.nodes;

  let segStart = 0;
  let accDist = 0;

  for (let i = 1; i < ns.length; i++) {
    const prev = osmNodes[ns[i-1]];
    const curr = osmNodes[ns[i]];
    if (!prev || !curr) continue;
    accDist += haversine(prev.lat, prev.lon, curr.lat, curr.lon);

    if (graphNodeIds.has(ns[i]) || i === ns.length - 1) {
      const fromOsm = ns[segStart];
      const toOsm = ns[i];
      const fromId = nodeIdMap[fromOsm];
      const toId = nodeIdMap[toOsm];

      if (fromId && toId && fromId !== toId && accDist > 2) {
        const key = fromId < toId ? `${fromId}-${toId}` : `${toId}-${fromId}`;
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          graphEdges.push({
            id: `e_${edgeCounter++}`,
            from: fromId,
            to: toId,
            length: Math.round(accDist),
            baseSpeed: speed,
            state: 0,
          });
        }
      }
      segStart = i;
      accDist = 0;
    }
  }
}

console.log(`Edges before filtering: ${graphEdges.length}`);

// Remove isolated nodes
const connected = new Set();
for (const e of graphEdges) { connected.add(e.from); connected.add(e.to); }
const filteredNodes = graphNodes.filter(n => connected.has(n.id));
console.log(`Connected nodes: ${filteredNodes.length}`);

// --- Named location extraction ---
// Collect all OSM nodes with names that are also named amenities/shops/etc.
const poiNodes = raw.elements.filter(e =>
  e.type === 'node' && e.tags?.name &&
  (e.tags.amenity || e.tags.shop || e.tags.office || e.tags.tourism ||
   (e.tags.building && e.tags.name))
);
console.log(`POI nodes with names: ${poiNodes.length}`);

// Snap each POI to nearest graph node and annotate it
let annotated = 0;
const usedNames = new Set();
for (const poi of poiNodes) {
  const name = poi.tags.name.trim();
  if (!name || usedNames.has(name)) continue;
  usedNames.add(name);

  let nearest = null, nearestDist = Infinity;
  for (const gn of filteredNodes) {
    const d = haversine(poi.lat, poi.lon, gn.lat, gn.lng);
    if (d < nearestDist) { nearestDist = d; nearest = gn; }
  }
  if (nearest && nearestDist < 300 && !nearest.tags?.name) {
    nearest.tags = { name };
    annotated++;
  }
}
console.log(`Annotated ${annotated} nodes with POI names`);

const namedNodes = filteredNodes.filter(n => n.tags?.name);
console.log(`Total named nodes: ${namedNodes.length}`);
if (namedNodes.length > 0) {
  console.log('Sample names:', namedNodes.slice(0, 15).map(n => n.tags.name));
}

const out = { nodes: filteredNodes, edges: graphEdges };
fs.writeFileSync('src/assets/maps/vladivostok.json', JSON.stringify(out));
console.log(`\nDone! ${filteredNodes.length} nodes, ${graphEdges.length} edges`);
console.log('Written to src/assets/maps/vladivostok.json');
