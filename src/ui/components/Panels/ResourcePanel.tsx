import React from 'react';
import { useAppSelector } from '../../hooks/useAppDispatch';

const RESOURCE_NAMES: Record<string, string> = {
  food: 'Еда',
  water: 'Вода',
  scrap: 'Металлолом',
};

const RESOURCE_ICONS: Record<string, string> = {
  food: '🥫',
  water: '💧',
  scrap: '⚙️',
};

export default function ResourcePanel() {
  const resources = useAppSelector(s => s.game.resources);
  return (
    <div className="panel">
      <div className="panel-header">Ресурсы</div>
      <div className="panel-content">
        {Object.entries(resources).map(([key, val]) => (
          <div key={key} className="resource-row">
            <span className="resource-label">{RESOURCE_ICONS[key]} {RESOURCE_NAMES[key] || key}</span>
            <span className="resource-value">{Math.floor(val)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
