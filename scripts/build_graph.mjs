/**
 * Fetches road network + named POIs from Overpass API for Vladivostok + Russky Island
 * and writes src/assets/maps/vladivostok.json in the game's GraphData format.
 *
 * Road types included: primary, secondary, tertiary, residential, living_street, unclassified
 * Graph is simplified: only intersection nodes + named-POI nodes are kept as vertices;
 * long segments are split into intermediate coords for smooth animation.
 */

import fs from 'fs';
import https from 'https';

const BBOX = '42.96,131.75,43.28,132.12'; // south,west,north,east — Vladivostok + Russky Island

const OVERPASS_QUERY = `
[out:json][timeout:60];
(
  way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|living_street|unclassified)$"](${BBOX});
  node["amenity"~"^(hospital|pharmacy|school|fuel|marketplace|fire_station|police|shelter|restaurant|cafe)$"](${BBOX});
  node["shop"~"^(supermarket|convenience|hardware|bakery)$"](${BBOX});
  node["building"~"^(warehouse|industrial|commercial)$"]["name"](${BBOX});
);
out body;
>;
out skel qt;
`;

function overpassFetch(query) {
  return new Promise((resolve, reject) => {
    const body = 'data=' + encodeURIComponent(query);
    const opts = {
      hostname: 'overpass-api.de',
      path: '/api/interpreter',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse error: ' + data.slice(0, 200))); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Speed by road type (m/s walking/running equivalent for game)
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

async function main() {
  console.log('Fetching Overpass data...');
  const osm = await overpassFetch(OVERPASS_QUERY);
  console.log(`Got ${osm.elements.length} elements`);

  // Index all raw OSM nodes
  const osmNodes = {};
  for (const el of osm.elements) {
    if (el.type === 'node') osmNodes[el.id] = el;
  }

  // Separate ways from POI nodes
  const ways = osm.elements.filter(e => e.type === 'way' && e.nodes?.length >= 2);
  const poiNodes = osm.elements.filter(e =>
    e.type === 'node' && (e.tags?.amenity || e.tags?.shop || (e.tags?.building && e.tags?.name))
    && e.tags?.name
  );

  // Count how many ways reference each node to find intersections
  const nodeRefCount = {};
  for (const way of ways) {
    for (const nid of way.nodes) {
      nodeRefCount[nid] = (nodeRefCount[nid] || 0) + 1;
    }
  }

  // A node is a graph vertex if it's:
  //  - first or last node in a way
  //  - referenced by more than one way (intersection)
  const graphNodeIds = new Set();
  for (const way of ways) {
    const ns = way.nodes;
    graphNodeIds.add(ns[0]);
    graphNodeIds.add(ns[ns.length - 1]);
    for (const nid of ns) {
      if (nodeRefCount[nid] > 1) graphNodeIds.add(nid);
    }
  }

  console.log(`Graph vertices (intersections + endpoints): ${graphNodeIds.size}`);

  // Build graph nodes
  const graphNodes = [];
  const nodeIdMap = {}; // osmId -> game id
  let nodeCounter = 0;

  for (const osmId of graphNodeIds) {
    const n = osmNodes[osmId];
    if (!n) continue;
    const gid = `n_${nodeCounter++}`;
    nodeIdMap[osmId] = gid;
    const tags = {};
    if (n.tags?.name) tags.name = n.tags.name;
    graphNodes.push({ id: gid, lat: n.lat, lng: n.lon, ...(Object.keys(tags).length ? { tags } : {}) });
  }

  // Add named POI nodes (amenities, shops)
  const poiNames = new Set();
  const namedDestinations = [];
  for (const poi of poiNodes) {
    const name = poi.tags?.name;
    if (!name || poiNames.has(name)) continue;
    poiNames.add(name);
    const gid = `poi_${nodeCounter++}`;
    nodeIdMap[poi.id] = gid;

    // Snap POI to the nearest graph node
    let nearest = null, nearestDist = Infinity;
    for (const gn of graphNodes) {
      const d = haversine(poi.lat, poi.lon, gn.lat, gn.lng);
      if (d < nearestDist) { nearestDist = d; nearest = gn; }
    }
    if (nearest && nearestDist < 500) {
      // Tag the nearest node with this POI name instead of adding a separate node
      nearest.tags = nearest.tags || {};
      if (!nearest.tags.name) nearest.tags.name = name;
    }
  }

  // Build edges: traverse each way, creating edges between consecutive graph vertices
  const graphEdges = [];
  const edgeSet = new Set(); // prevent duplicates
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

        if (nodeIdMap[fromOsm] && nodeIdMap[toOsm] && fromOsm !== toOsm) {
          const fromId = nodeIdMap[fromOsm];
          const toId = nodeIdMap[toOsm];
          const key = [fromId, toId].sort().join('-');
          if (!edgeSet.has(key) && accDist > 1) {
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

  console.log(`Edges: ${graphEdges.length}`);

  // Remove isolated nodes (no edges)
  const connectedNodeIds = new Set();
  for (const e of graphEdges) {
    connectedNodeIds.add(e.from);
    connectedNodeIds.add(e.to);
  }
  const filteredNodes = graphNodes.filter(n => connectedNodeIds.has(n.id));
  console.log(`Connected nodes: ${filteredNodes.length}`);

  const graphData = { nodes: filteredNodes, edges: graphEdges };

  const outPath = 'src/assets/maps/vladivostok.json';
  fs.writeFileSync(outPath, JSON.stringify(graphData, null, 2));
  console.log(`Written to ${outPath}`);
  console.log(`Summary: ${filteredNodes.length} nodes, ${graphEdges.length} edges`);

  // Print named nodes sample
  const named = filteredNodes.filter(n => n.tags?.name).slice(0, 20);
  console.log('Sample named nodes:', named.map(n => n.tags.name));
}

main().catch(e => { console.error(e); process.exit(1); });
