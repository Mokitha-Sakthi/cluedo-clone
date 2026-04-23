import React, { useState, useEffect } from 'react';
import { createRoom, joinRoom, GameSocket } from './services';
import { SUSPECTS, WEAPONS } from './constants';
import './index.css';

function App() {
  const [user, setUser] = useState(localStorage.getItem('cluedo_user') || '');
  const [room, setRoom] = useState(null);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [gameState, setGameState] = useState(null);
  const [socket, setSocket] = useState(null);
  const [lastDisproof, setLastDisproof] = useState(null);
  const [logs, setLogs] = useState([]);
  const addLog = (text) => setLogs(prev => [text, ...prev].slice(0, 50));
  const [selectedSuspect, setSelectedSuspect] = useState(SUSPECTS[0]);
  const [selectedWeapon, setSelectedWeapon] = useState(WEAPONS[0]);

  useEffect(() => {
    if (user) localStorage.setItem('cluedo_user', user);
  }, [user]);

  const handleCreate = async () => {
    if (!user) return alert("Enter name");
    const data = await createRoom(user);
    setRoom(data);
    connectSocket(data.room_id, user);
  };

  const handleJoin = async () => {
    if (!user || !roomIdInput) return alert("Enter name and room ID");
    const data = await joinRoom(roomIdInput, user);
    setRoom(data);
    connectSocket(data.room_id, user);
  };

  const connectSocket = (rid, uid) => {
    const ws = new GameSocket(rid, uid, (msg) => {
      console.log("WS Msg:", msg);
      if (msg.type === "STATE_UPDATE" || msg.type === "PLAYER_JOINED") {
        setGameState(msg.state);
        if (msg.type === "PLAYER_JOINED") addLog(`${msg.user_id} joined the room`);
      } else if (msg.type === "DISPROOF_CARD") {
        setLastDisproof(msg);
        addLog(`You saw ${msg.card} from ${msg.by}`);
      } else if (msg.type === "DICE_ROLLED") {
        addLog(`${msg.user_id} rolled a ${msg.roll}`);
      } else if (msg.type === "PLAYER_MOVED") {
        addLog(`${msg.user_id} moved to ${msg.room}`);
      } else if (msg.type === "SUGGESTION_MADE") {
        addLog(`${msg.user_id} suggested ${msg.suspect} in the ${msg.room} with the ${msg.weapon}`);
      } else if (msg.type === "SUGGESTION_DISPROVED") {
        addLog(`Suggestion disproved by ${msg.by}`);
      } else if (msg.type === "SUGGESTION_NOT_DISPROVED") {
        addLog(`Suggestion could not be disproved!`);
      } else if (msg.type === "GAME_OVER") {
        addLog(`GAME OVER! ${msg.winner} won!`);
        alert(`Game Over! Winner: ${msg.winner}. Solution: ${msg.solution.suspect} in the ${msg.solution.room} with the ${msg.solution.weapon}`);
      }
    });
    setSocket(ws);
  };

  const setReady = () => socket.send("READY");
  const rollDice = () => socket.send("ROLL_DICE");
  const move = (roomName) => socket.send("MOVE", { room: roomName });
  const suggest = () => {
    const r = gameState.game_data.player_positions[user];
    socket.send("SUGGESTION", { suspect: selectedSuspect, weapon: selectedWeapon, room: r });
  };
  const accuse = () => {
    const r = gameState.game_data.player_positions[user];
    socket.send("ACCUSATION", { suspect: selectedSuspect, weapon: selectedWeapon, room: r });
  };

  if (!room) {
    return (
      <div className="app-container">
        <div className="card fade-in" style={{ maxWidth: '400px', margin: 'auto' }}>
          <h1>🕵️ Cluedo Clone</h1>
          <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem' }}>Master Detective Multiplayer</p>
          <div className="input-group">
            <label>Your Name</label>
            <input value={user} onChange={e => setUser(e.target.value)} placeholder="e.g. Sherlock" />
          </div>
          <button onClick={handleCreate} style={{ width: '100%', marginBottom: '1rem' }}>Create Room</button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input value={roomIdInput} onChange={e => setRoomIdInput(e.target.value)} placeholder="Room Code" />
            <button onClick={handleJoin}>Join</button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState?.status === 'waiting') {
    return (
      <div className="app-container">
        <div className="card fade-in">
          <h2>Room: {room.room_id}</h2>
          <p>Players: {gameState.players.join(', ')}</p>
          <p>Ready: {gameState.ready_players.length} / {gameState.players.length}</p>
          <button onClick={setReady} disabled={gameState.ready_players.includes(user)}>
            {gameState.ready_players.includes(user) ? "Ready!" : "Ready Up"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
        <div className="card fade-in">
          <h2>Detective Board</h2>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Turn:</strong> {gameState.game_data.turn_order[gameState.game_data.current_turn_index]}
          </div>
          
          <div className="board-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {["Kitchen", "Ballroom", "Conservatory", "Dining Room", "Billiard Room", "Library", "Lounge", "Hall", "Study"].map(r => (
              <div key={r} className="card" style={{ 
                textAlign: 'center', 
                border: gameState.game_data.player_positions[user] === r ? '2px solid var(--primary)' : ''
              }}>
                {r}
                <br/>
                <button size="small" onClick={() => move(r)} style={{ padding: '2px 5px', fontSize: '10px' }}>Go</button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <select value={selectedSuspect} onChange={e => setSelectedSuspect(e.target.value)}>
                {SUSPECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={selectedWeapon} onChange={e => setSelectedWeapon(e.target.value)}>
                {WEAPONS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <button onClick={rollDice}>Roll Dice</button>
            <button onClick={suggest} style={{ marginLeft: '10px' }}>Suggest</button>
            <button onClick={accuse} style={{ marginLeft: '10px', background: 'var(--accent)' }}>Accuse</button>
          </div>
        </div>

        <div className="card fade-in">
          <h3>Your Files</h3>
          <div style={{ marginTop: '1rem' }}>
            <strong>Your Cards:</strong>
            <ul>
              {gameState.game_data.player_cards[user]?.map(c => <li key={c}>{c}</li>)}
            </ul>
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <strong>Notebook:</strong>
            <textarea style={{ width: '100%', height: '100px', background: 'var(--bg-dark)', color: 'white', padding: '10px' }} placeholder="Notes..."></textarea>
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <strong>Game Log:</strong>
            <div style={{ 
              height: '150px', 
              overflowY: 'auto', 
              fontSize: '12px', 
              background: 'var(--bg-dark)', 
              padding: '10px',
              marginTop: '5px',
              border: '1px solid var(--border)'
            }}>
              {logs.map((log, i) => <div key={i} style={{ marginBottom: '4px' }}>• {log}</div>)}
            </div>
          </div>
          {lastDisproof && (
            <div style={{ marginTop: '1rem', color: 'var(--primary)' }}>
              Last Disproof: {lastDisproof.card} (by {lastDisproof.by})
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
