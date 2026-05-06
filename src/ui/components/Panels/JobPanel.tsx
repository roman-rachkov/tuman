import React from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks/useAppDispatch';
import { openModal } from '../../../state/slices/gameSlice';
import graphData from '../../../assets/maps/snow_valley.json';
import { GraphNode } from '../../../core/graph/types';

const nodesMap: Record<string, GraphNode> = {};
for (const n of graphData.nodes as GraphNode[]) nodesMap[n.id] = n;

function nodeName(id: string): string {
  return nodesMap[id]?.tags?.name || id;
}

const STATUS_CLASS: Record<string, string> = {
  pending: 'status-pending',
  assigned: 'status-assigned',
  completed: 'status-completed',
  failed: 'status-failed',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Ожидает',
  assigned: 'Выполняется',
  completed: 'Готово',
  failed: 'Провалено',
};

const RESOURCE_LABEL: Record<string, string> = {
  food: 'еда',
  water: 'вода',
  scrap: 'металлолом',
};

export default function JobPanel() {
  const dispatch = useAppDispatch();
  const jobsMap = useAppSelector(s => s.jobs.jobs);
  const jobs = Object.values(jobsMap);
  const activeJobs = jobs.filter(j => j.status !== 'completed' && j.status !== 'failed');
  const isRunning = useAppSelector(s => s.game.isRunning);

  return (
    <div className="panel">
      <div className="panel-header">
        <span>Заявки ({activeJobs.length})</span>
        <button
          className="btn btn-primary"
          onClick={() => dispatch(openModal({ type: 'newJob', data: null }))}
          disabled={!isRunning}
          style={{ fontSize: '0.72rem', padding: '2px 8px' }}
        >
          + Новая
        </button>
      </div>
      <div className="panel-content" style={{ maxHeight: '150px', overflowY: 'auto' }}>
        {activeJobs.length === 0 && (
          <div style={{ color: '#444', fontSize: '0.78rem', textAlign: 'center', padding: '8px' }}>
            Нет активных заявок
          </div>
        )}
        {activeJobs.map(job => (
          <div key={job.id} className="job-row">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{job.type === 'delivery' ? '📦 Доставка' : job.type}</span>
              <span className={`job-status ${STATUS_CLASS[job.status]}`}>
                {STATUS_LABEL[job.status]}
              </span>
            </div>
            <div style={{ color: '#6a6050', fontSize: '0.7rem', marginTop: '2px' }}>
              → {nodeName(job.targetLocation)}
            </div>
            <div style={{ color: '#5a7050', fontSize: '0.7rem' }}>
              Награда: {Object.entries(job.reward).map(([k, v]) => `${v} ${RESOURCE_LABEL[k] || k}`).join(', ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
