import React, { useState, useEffect } from 'react';
import { createRoom, joinRoom, GameSocket } from './services';
import { SUSPECTS, WEAPONS, ROOM_BOUNDARIES } from './constants';
import './index.css';

const SUSPECT_DATA = {
  "Miss Scarlett": { color: "#E53935", icon: "💃" },
  "Colonel Mustard": { color: "#FDD835", icon: "🎖️" },
  "Mrs. White": { color: "#FAFAFA", icon: "🧹" },
  "Mr. Green": { color: "#43A047", icon: "💵" },
  "Mrs. Peacock": { color: "#1E88E5", icon: "🦚" },
  "Professor Plum": { color: "#8E24AA", icon: "🎓" }
};

function App() {
  const [user, setUser] = useState(localStorage.getItem('cluedo_user') || '');
  const [room, setRoom] = useState(null);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [gameState, setGameState] = useState(null);
  const [socket, setSocket] = useState(null);
  const [lastDisproof, setLastDisproof] = useState(null);
  const [logs, setLogs] = useState([]);
  const addLog = (text) => setLogs(prev => [text, ...prev].slice(0, 50));
  const [gameOver, setGameOver] = useState(null);
  const [selectedSuspect, setSelectedSuspect] = useState(SUSPECTS[0]);
  const [selectedWeapon, setSelectedWeapon] = useState(WEAPONS[0]);
  const [characterPickerOpen, setCharacterPickerOpen] = useState(true);
  const [showEnvelope, setShowEnvelope] = useState(false);

  useEffect(() => {
    if (gameState?.status === 'ongoing') {
      setShowEnvelope(true);
      const timer = setTimeout(() => setShowEnvelope(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [gameState?.status]);

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
        setGameOver({ winner: msg.winner, solution: msg.solution });
      }
    });
    setSocket(ws);
  };

  const setReady = () => socket.send("READY");
  const startGame = () => {
    console.log("START GAME button clicked");
    socket.send("START_GAME");
  };
  const selectChar = (char) => socket.send("SELECT_CHARACTER", { character: char });
  const rollDice = () => socket.send("ROLL_DICE");
  const move = (pos) => socket.send("MOVE", { position: pos });
  const endTurn = () => socket.send("END_TURN");
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

  if (gameOver) {
    return (
      <div className="app-container">
        <div className="card fade-in" style={{ textAlign: 'center', maxWidth: '500px', margin: 'auto' }}>
          <h1 style={{ color: 'var(--primary)' }}>🏆 Game Over!</h1>
          <h2 style={{ marginBottom: '2rem' }}>{gameOver.winner === user ? "You Won!" : `${gameOver.winner} Won!`}</h2>
          
          <div className="card" style={{ background: 'var(--bg-dark)', marginBottom: '2rem' }}>
            <h3>The Solution Was:</h3>
            <p style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>
              <strong>{gameOver.solution.suspect}</strong> in the <strong>{gameOver.solution.room}</strong> with the <strong>{gameOver.solution.weapon}</strong>
            </p>
          </div>

          <button onClick={() => window.location.reload()} style={{ width: '100%' }}>Play Again</button>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="app-container">
        <div className="card fade-in" style={{ textAlign: 'center', maxWidth: '400px', margin: 'auto' }}>
          <h2>Joining Room...</h2>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }


  if (gameState?.status === 'waiting') {
    const players = gameState.players || [];
    const readyPlayers = gameState.ready_players || [];
    const selections = gameState.selected_characters || {};
    const mySelection = selections[user];

    return (
      <div className="app-container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
          <div className="card fade-in">
            <h2 style={{ marginBottom: '1.5rem' }}>Choose Your Character</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
              {Object.entries(SUSPECT_DATA).map(([name, data]) => {
                const isTaken = Object.values(selections).includes(name);
                const isMine = mySelection === name;
                const takenBy = Object.entries(selections).find(([uid, char]) => char === name)?.[0];

                return (
                  <div 
                    key={name}
                    className={`char-card ${isMine ? 'selected' : ''} ${isTaken && !isMine ? 'taken' : ''}`}
                    style={{ '--char-color': data.color }}
                    onClick={() => !isTaken && selectChar(name)}
                  >
                    <div className="char-icon">{data.icon}</div>
                    <div className="char-name">{name}</div>
                    {isTaken && <div className="taken-tag">{isMine ? 'YOU' : takenBy}</div>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card fade-in">
            <h3>Lobby: {room.room_id}</h3>
            <div style={{ margin: '1rem 0' }}>
              <button 
                className="btn-secondary"
                style={{ width: '100%', fontSize: '12px' }}
                onClick={() => {
                  navigator.clipboard.writeText(room.room_id);
                  alert("Room ID copied!");
                }}
              >
                📋 Copy Room ID
              </button>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ marginBottom: '1rem', color: 'var(--text-dim)' }}>Players ({players.length}/6)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {players.map(p => (
                  <div key={p} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: 'var(--bg-dark)',
                    borderRadius: '0.5rem',
                    border: p === user ? '1px solid var(--primary)' : 'none'
                  }}>
                    <span>{p === user ? `✨ ${p}` : p}</span>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {selections[p] && <span style={{ fontSize: '12px', color: SUSPECT_DATA[selections[p]].color }}>{selections[p]}</span>}
                      {readyPlayers.includes(p) ? 
                        <span style={{ color: '#4ade80' }}>✓</span> : 
                        <span style={{ color: 'var(--text-dim)' }}>...</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              {!readyPlayers.includes(user) ? (
                <button 
                  onClick={setReady} 
                  disabled={!mySelection} 
                  style={{ width: '100%', height: '60px', fontSize: '1.2rem' }}
                >
                  {mySelection ? "I'M READY" : "SELECT CHARACTER"}
                </button>
              ) : gameState.creator_id === user ? (
                <button 
                  onClick={startGame} 
                  disabled={readyPlayers.length < players.length || players.length < 2} 
                  style={{ width: '100%', height: '60px', fontSize: '1.2rem', background: 'var(--accent)' }}
                >
                  {readyPlayers.length < players.length ? "WAITING FOR OTHERS..." : players.length < 2 ? "NEED MORE PLAYERS" : "START GAME 🎬"}
                </button>
              ) : (
                <button 
                  disabled 
                  style={{ width: '100%', height: '60px', fontSize: '1.2rem', background: 'var(--bg-dark)', color: 'var(--text-dim)' }}
                >
                  READY! (Wait for host)
                </button>
              )}
              <p style={{ fontSize: '12px', color: 'var(--text-dim)', textAlign: 'center', marginTop: '0.5rem' }}>
                {gameState.creator_id === user ? "You are the host" : `Host: ${gameState.creator_id}`}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const myCharacter = gameState.game_data?.player_characters?.[user];
  const characterInfo = SUSPECT_DATA[myCharacter] || { color: 'var(--primary)', icon: '🕵️' };

  return (
    <div className="app-container">
      {showEnvelope && (
        <div className="envelope-overlay">
          <div className="envelope">
            <div className="card-back person">👤</div>
            <div className="card-back weapon">🔪</div>
            <div className="card-back room">🏠</div>
            <div className="envelope-front">SECRET</div>
          </div>
          <h2 className="envelope-text">Confidential Solution Hidden...</h2>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
        <div className="card fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Detective Board</h2>
            <div className="badge" style={{ background: characterInfo.color, color: myCharacter === 'Mrs. White' ? 'black' : 'white' }}>
              {characterInfo.icon} {myCharacter}
            </div>
          </div>
          
          <div className="current-turn-banner" style={{ background: gameState.game_data.turn_order[gameState.game_data.current_turn_index] === user ? 'var(--primary)' : 'var(--bg-dark)' }}>
            <span style={{ color: gameState.game_data.turn_order[gameState.game_data.current_turn_index] === user ? 'black' : 'white' }}>
              {gameState.game_data.turn_order[gameState.game_data.current_turn_index] === user ? "⭐ YOUR TURN" : `Waiting for ${gameState.game_data.turn_order[gameState.game_data.current_turn_index]}...`}
            </span>
          </div>

          <div className="board-container" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="tile-grid">
              {Array.from({ length: 25 * 25 }).map((_, i) => {
                const r = Math.floor(i / 25);
                const c = i % 25;
                
                const isRoom = Object.entries(ROOM_BOUNDARIES).find(([name, b]) => 
                  r >= b.top && r <= b.bottom && c >= b.left && c <= b.right
                );
                
                // Check if any player is at this position
                const playersHere = Object.entries(gameState.game_data.player_positions).filter(([uid, pos]) => 
                  Array.isArray(pos) && pos[0] === r && pos[1] === c
                );
                
                const isCurrentTurn = gameState.game_data.turn_order[gameState.game_data.current_turn_index] === user;
                const canMove = isCurrentTurn && gameState.game_data.last_roll && !gameState.game_data.moved_this_turn;
                
                let isReachable = false;
                if (canMove) {
                  const myPos = gameState.game_data.player_positions[user];
                  if (Array.isArray(myPos)) {
                    const dist = Math.abs(myPos[0] - r) + Math.abs(myPos[1] - c);
                    isReachable = dist > 0 && dist <= gameState.game_data.last_roll;
                  }
                }

                return (
                  <div 
                    key={i} 
                    className={`tile ${isRoom ? 'room-tile' : ''} ${isReachable ? 'reachable' : ''}`}
                    style={{ 
                      backgroundColor: isRoom ? `${isRoom[1].color}44` : 'transparent',
                    }}
                    onClick={() => isReachable && move([r, c])}
                  >
                    {playersHere.map(([uid, _]) => {
                      const charName = gameState.game_data.player_characters[uid];
                      const info = SUSPECT_DATA[charName] || { icon: '🕵️', color: 'white' };
                      return (
                        <div key={uid} className="token" style={{ background: info.color }} title={uid}>
                          {info.icon}
                        </div>
                      );
                    })}
                    {isRoom && (r === isRoom[1].top && c === isRoom[1].left) && (
                      <span className="room-label">{isRoom[0]}</span>
                    )}
                  </div>
                );
              })}
              <div className="center-logo">CLUE</div>
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select value={selectedSuspect} onChange={e => setSelectedSuspect(e.target.value)}>
                {SUSPECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={selectedWeapon} onChange={e => setSelectedWeapon(e.target.value)}>
                {WEAPONS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            
            {!gameState.game_data.last_roll && (
              <button onClick={rollDice} disabled={gameState.game_data.turn_order[gameState.game_data.current_turn_index] !== user}>
                🎲 Roll Dice
              </button>
            )}
            
            {gameState.game_data.last_roll && !gameState.game_data.moved_this_turn && (
              <div className="dice-badge">Rolled: {gameState.game_data.last_roll}</div>
            )}

            {gameState.game_data.moved_this_turn && (
              <>
                <button onClick={suggest} style={{ background: 'var(--primary)', color: 'black' }}>Suggest</button>
                <button onClick={accuse} style={{ background: 'var(--accent)' }}>Accuse</button>
                <button onClick={endTurn} className="btn-secondary">End Turn</button>
              </>
            )}
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
