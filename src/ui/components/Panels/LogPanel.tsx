import React from 'react';
import { useAppSelector } from '../../hooks/useAppDispatch';

export default function LogPanel() {
  const log = useAppSelector(s => s.game.log);

  return (
    <div className="log-panel">
      <div className="panel-header">Журнал событий</div>
      <div className="log-content">
        {log.map((entry, i) => (
          <div key={i} className="log-entry">{entry}</div>
        ))}
      </div>
    </div>
  );
}
