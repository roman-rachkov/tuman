import { store } from '../state/store';
import { tick, addLog, setRunning } from '../state/slices/gameSlice';
import { updateAgent, setAgentPosition } from '../state/slices/agentsSlice';
import { updateJob as updateJobAction } from '../state/slices/jobsSlice';
import { findPath } from '../core/graph/pathfinder';
import { GraphNode, GraphEdge } from '../core/graph/types';
import graphData from '../assets/maps/snow_valley.json';

const TICK_MS = 200;
const GAME_SPEED = 5;

let intervalId: ReturnType<typeof setInterval> | null = null;
let animFrameId: number | null = null;
let lastFrameTime = 0;

const nodesMap: Record<string, GraphNode> = {};
const edgesArr: GraphEdge[] = graphData.edges as GraphEdge[];

for (const n of graphData.nodes) {
  nodesMap[n.id] = n as GraphNode;
}

function nodeName(id: string): string {
  return (nodesMap[id] as GraphNode)?.tags?.name || id;
}

export function startGame() {
  store.dispatch(setRunning(true));
  store.dispatch(addLog('Игровой цикл запущен.'));
  intervalId = setInterval(gameTick, TICK_MS);
  lastFrameTime = performance.now();
  animFrameId = requestAnimationFrame(animationFrame);
}

export function stopGame() {
  store.dispatch(setRunning(false));
  if (intervalId) { clearInterval(intervalId); intervalId = null; }
  if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
}

function gameTick() {
  store.dispatch(tick());
  assignJobs();
}

function assignJobs() {
  const state = store.getState();
  const agents = Object.values(state.agents.agents);
  const jobs = Object.values(state.jobs.jobs).filter(j => j.status === 'pending');

  for (const agent of agents) {
    if (agent.state !== 'idle') continue;
    if (jobs.length === 0) break;
    const job = jobs.shift();
    if (!job) break;

    const startNode = job.sourceLocation || agent.currentNodeId;
    const path = findPath(nodesMap, edgesArr, agent.currentNodeId, startNode, e => e.state < 2);

    if (path.length === 0 && agent.currentNodeId !== startNode) {
      store.dispatch(addLog(`${agent.name}: нет пути до начала задания.`));
      continue;
    }

    const fullPath = agent.currentNodeId === startNode
      ? findPath(nodesMap, edgesArr, startNode, job.targetLocation, e => e.state < 2)
      : [...path, ...findPath(nodesMap, edgesArr, startNode, job.targetLocation, e => e.state < 2).slice(1)];

    if (fullPath.length === 0) {
      store.dispatch(addLog(`${agent.name}: нет пути до цели задания.`));
      continue;
    }

    store.dispatch(updateAgent({
      id: agent.id,
      state: 'moving_to_start',
      currentJobId: job.id,
      targetNodePath: fullPath,
      pathProgress: 0,
      pathSegment: 0,
    }));
    store.dispatch(updateJobAction({ id: job.id, status: 'assigned', assignedAgentId: agent.id }));
    store.dispatch(addLog(`${agent.name} принял задание: доставка в «${nodeName(job.targetLocation)}».`));
  }
}

function animationFrame(now: number) {
  const dt = (now - lastFrameTime) / 1000;
  lastFrameTime = now;

  const state = store.getState();
  const agents = Object.values(state.agents.agents);

  for (const agent of agents) {
    if ((agent.state !== 'moving_to_start' && agent.state !== 'moving_to_end' && agent.state !== 'executing') || !agent.targetNodePath) continue;

    const path = agent.targetNodePath;
    const seg = agent.pathSegment ?? 0;
    const progress = agent.pathProgress ?? 0;

    if (seg >= path.length - 1) {
      const lastNode = nodesMap[path[path.length - 1]];
      store.dispatch(setAgentPosition({ id: agent.id, lat: lastNode.lat, lng: lastNode.lng, nodeId: lastNode.id }));

      const job = agent.currentJobId ? state.jobs.jobs[agent.currentJobId] : null;
      store.dispatch(updateAgent({
        id: agent.id,
        state: 'idle',
        currentJobId: undefined,
        targetNodePath: undefined,
        pathProgress: 0,
        pathSegment: 0,
        currentNodeId: lastNode.id,
      }));

      if (job) {
        store.dispatch(updateJobAction({ id: job.id, status: 'completed' }));
        store.dispatch(addLog(`${agent.name} доставил груз в «${nodeName(job.targetLocation)}»!`));
        for (const [res, amt] of Object.entries(job.reward)) {
          store.dispatch({ type: 'game/gainResource', payload: { resource: res, amount: amt } });
        }
      }
      continue;
    }

    const fromNode = nodesMap[path[seg]];
    const toNode = nodesMap[path[seg + 1]];
    const edge = edgesArr.find(e =>
      (e.from === path[seg] && e.to === path[seg + 1]) ||
      (e.to === path[seg] && e.from === path[seg + 1])
    );

    const speed = edge ? (edge.state === 1 ? edge.baseSpeed * 0.5 : edge.baseSpeed) : 1.4;
    const length = edge ? edge.length : 300;
    const newProgress = progress + (dt * speed * GAME_SPEED) / length;

    if (newProgress >= 1) {
      store.dispatch(updateAgent({ id: agent.id, pathSegment: seg + 1, pathProgress: 0, currentNodeId: toNode.id }));
      store.dispatch(setAgentPosition({ id: agent.id, lat: toNode.lat, lng: toNode.lng, nodeId: toNode.id }));
    } else {
      const lat = fromNode.lat + (toNode.lat - fromNode.lat) * newProgress;
      const lng = fromNode.lng + (toNode.lng - fromNode.lng) * newProgress;
      store.dispatch(updateAgent({ id: agent.id, pathProgress: newProgress }));
      store.dispatch(setAgentPosition({ id: agent.id, lat, lng }));
    }
  }

  animFrameId = requestAnimationFrame(animationFrame);
}
