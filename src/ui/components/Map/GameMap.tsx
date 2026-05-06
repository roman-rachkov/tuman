import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from 'react-leaflet';
import { useAppSelector, useAppDispatch } from '../../hooks/useAppDispatch';
import { selectAgent } from '../../../state/slices/gameSlice';
import graphData from '../../../assets/maps/snow_valley.json';
import { GraphEdge, GraphNode } from '../../../core/graph/types';

const nodes = graphData.nodes as GraphNode[];
const edges = graphData.edges as GraphEdge[];
const nodesMap: Record<string, GraphNode> = {};
for (const n of nodes) nodesMap[n.id] = n;

const CENTER: [number, number] = [43.2000, 131.9450];

const BOUNDS: [[number, number], [number, number]] = [
  [42.96, 131.72],
  [43.30, 132.12],
];

const EDGE_COLOR: Record<number, string> = {
  0: '#3a4a2a',
  1: '#6a4a10',
  2: '#6a1010',
  3: '#104a6a',
};

export default function GameMap() {
  const dispatch = useAppDispatch();
  const agentsMap = useAppSelector(s => s.agents.agents);
  const agents = Object.values(agentsMap);
  const selectedAgentId = useAppSelector(s => s.game.selectedAgentId);

  return (
    <MapContainer
      center={CENTER}
      zoom={15}
      minZoom={12}
      maxZoom={18}
      maxBounds={BOUNDS}
      maxBoundsViscosity={1.0}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
        opacity={0.3}
      />

      {edges.map(edge => {
        const from = nodesMap[edge.from];
        const to = nodesMap[edge.to];
        if (!from || !to) return null;
        return (
          <Polyline
            key={edge.id}
            positions={[[from.lat, from.lng], [to.lat, to.lng]]}
            color={EDGE_COLOR[edge.state] || '#3a4a2a'}
            weight={edge.state === 0 ? 2 : 3}
            dashArray={edge.state === 1 ? '6 4' : edge.state === 2 ? '2 4' : undefined}
            opacity={0.8}
          />
        );
      })}

      {nodes.map(node => (
        <CircleMarker
          key={node.id}
          center={[node.lat, node.lng]}
          radius={5}
          fillColor="#d4a017"
          color="#8b6914"
          weight={1}
          fillOpacity={0.9}
        >
          <Tooltip direction="top" offset={[0, -6]} opacity={0.9}>
            <span style={{ fontFamily: 'Courier New', fontSize: '0.78rem', color: '#1a1508' }}>
              {node.tags?.name || node.id}
            </span>
          </Tooltip>
        </CircleMarker>
      ))}

      {agents.map(agent => {
        const lat = agent.positionLat ?? nodesMap[agent.currentNodeId]?.lat;
        const lng = agent.positionLng ?? nodesMap[agent.currentNodeId]?.lng;
        if (lat === undefined || lng === undefined) return null;
        const isSelected = agent.id === selectedAgentId;
        return (
          <CircleMarker
            key={agent.id}
            center={[lat, lng]}
            radius={isSelected ? 9 : 7}
            fillColor={isSelected ? '#ff8800' : '#22ccaa'}
            color={isSelected ? '#ff8800' : '#009977'}
            weight={2}
            fillOpacity={1}
            eventHandlers={{ click: () => dispatch(selectAgent(isSelected ? undefined : agent.id)) }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={0.95} permanent={isSelected}>
              <span style={{ fontFamily: 'Courier New', fontSize: '0.78rem', color: '#1a1508' }}>
                {agent.name} [{agent.state}]
              </span>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
