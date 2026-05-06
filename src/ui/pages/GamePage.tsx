import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { setRunning } from '../../state/slices/gameSlice';
import { startGame, stopGame } from '../../services/GameService';
import GameMap from '../components/Map/GameMap';
import ResourcePanel from '../components/Panels/ResourcePanel';
import AgentPanel from '../components/Panels/AgentPanel';
import JobPanel from '../components/Panels/JobPanel';
import LogPanel from '../components/Panels/LogPanel';
import NewJobModal from '../components/Modals/NewJobModal';

export default function GamePage() {
  const dispatch = useAppDispatch();
  const isRunning = useAppSelector(s => s.game.isRunning);
  const currentTime = useAppSelector(s => s.game.currentTime);
  const modal = useAppSelector(s => s.game.modal);

  const hours = Math.floor(currentTime / 10) % 24;
  const days = Math.floor(currentTime / 240) + 1;

  function handleToggle() {
    if (isRunning) {
      stopGame();
    } else {
      startGame();
    }
  }

  useEffect(() => {
    return () => { stopGame(); };
  }, []);

  return (
    <div className="game-layout">
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div className="header-bar">
          <h1>☣ Ржавый Туман</h1>
          <span className="time-display">День {days}, {String(hours).padStart(2, '0')}:00</span>
          <button
            className={`btn ${isRunning ? 'btn-danger' : 'btn-primary'}`}
            onClick={handleToggle}
          >
            {isRunning ? '⏸ Пауза' : '▶ Запустить'}
          </button>
        </div>
        <div className="map-container">
          <GameMap />
        </div>
      </div>

      <div className="sidebar">
        <ResourcePanel />
        <AgentPanel />
        <JobPanel />
        <LogPanel />
      </div>

      {modal?.type === 'newJob' && <NewJobModal />}
    </div>
  );
}
