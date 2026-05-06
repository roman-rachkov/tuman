import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { closeModal, addLog, spendResource } from '../../../state/slices/gameSlice';
import { addJob } from '../../../state/slices/jobsSlice';
import { Job, ResourceType } from '../../../core/jobs/types';
import graphData from '../../../assets/maps/snow_valley.json';
import { GraphNode } from '../../../core/graph/types';

const nodes = graphData.nodes as GraphNode[];
const nodesMap: Record<string, GraphNode> = {};
for (const n of nodes) nodesMap[n.id] = n;

const RESOURCE_LABEL: Record<string, string> = {
  food: 'Еда',
  water: 'Вода',
  scrap: 'Металлолом',
};

let jobCounter = 1;

export default function NewJobModal() {
  const dispatch = useAppDispatch();
  const resources = useAppSelector(s => s.game.resources);
  const currentTime = useAppSelector(s => s.game.currentTime);

  const [targetLocation, setTargetLocation] = useState(nodes[2].id);
  const [rewardResource, setRewardResource] = useState<ResourceType>('food');
  const [rewardAmount, setRewardAmount] = useState(10);

  function nodeName(id: string): string {
    return nodesMap[id]?.tags?.name || id;
  }

  function handleCreate() {
    if ((resources[rewardResource] ?? 0) < rewardAmount) {
      alert('Недостаточно ресурсов для оплаты!');
      return;
    }

    const job: Job = {
      id: `job_${jobCounter++}`,
      type: 'delivery',
      status: 'pending',
      reward: { [rewardResource]: rewardAmount } as Record<ResourceType, number>,
      targetLocation,
      createdAt: currentTime,
    };

    dispatch(spendResource({ resource: rewardResource, amount: rewardAmount }));
    dispatch(addJob(job));
    dispatch(addLog(`Создана заявка: доставка в «${nodeName(targetLocation)}».`));
    dispatch(closeModal());
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && dispatch(closeModal())}>
      <div className="modal">
        <h2>Новая заявка: Доставка</h2>

        <div className="form-group">
          <label>Пункт назначения</label>
          <select value={targetLocation} onChange={e => setTargetLocation(e.target.value)}>
            {nodes.map(n => (
              <option key={n.id} value={n.id}>{n.tags?.name || n.id}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Вознаграждение (ресурс)</label>
          <select value={rewardResource} onChange={e => setRewardResource(e.target.value as ResourceType)}>
            {Object.entries(RESOURCE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Количество (доступно: {Math.floor(resources[rewardResource] ?? 0)})</label>
          <input
            type="number"
            min={1}
            max={Math.floor(resources[rewardResource] ?? 0)}
            value={rewardAmount}
            onChange={e => setRewardAmount(Number(e.target.value))}
          />
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={() => dispatch(closeModal())}>Отмена</button>
          <button className="btn btn-primary" onClick={handleCreate}>Создать заявку</button>
        </div>
      </div>
    </div>
  );
}
