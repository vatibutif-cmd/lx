import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';

// Reusing the components from original App.jsx
const BatteryOverlay = ({ percent }) => {
  // --- 调节区域 START ---
  // 您可以手动修改以下数值来调整进度条位置
  const batteryStyle = {
    top: '19.3%',    // 垂直位置 (向上调小，向下调大)
    left: '21.8%',   // 水平位置 (向左调小，向右调大)
    width: '56.4%',  // 宽度
    height: '62%',   // 高度
    borderRadius: '4px',
  };
  // --- 调节区域 END ---

  return (
    <div className="absolute z-10 flex flex-col"
      style={{
        ...batteryStyle,
        background: 'rgba(10, 20, 15, 0.6)',
        border: '1px solid rgba(0, 255, 127, 0.3)',
        boxShadow: 'inset 0 0 30px rgba(0, 255, 127, 0.1)',
      }}
    >
      <div className="absolute inset-0 z-20 opacity-30 pointer-events-none" 
           style={{
             backgroundImage: 'linear-gradient(rgba(0, 255, 127, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 127, 0.2) 1px, transparent 1px)', 
             backgroundSize: '20px 20px'
           }} 
      />
      
      <div className="w-full h-full relative overflow-hidden p-1">
          <div className="absolute bottom-1 left-1 right-1 bg-brand-green/10 h-[calc(100%-8px)] rounded-[4px] overflow-hidden flex flex-col justify-end">
              <div 
                className="w-full bg-gradient-to-t from-brand-green via-[#00FF9D] to-brand-green shadow-[0_0_30px_rgba(0,255,127,0.6)] transition-all duration-700 ease-out relative"
                style={{ height: `${percent}%` }}
              >
                <div className="absolute top-0 left-0 w-full h-[2px] bg-white shadow-[0_0_15px_#FFF] z-10" />
                <div className="absolute inset-0 animate-[chargeFlicker_2s_infinite] bg-white/10" />
              </div>
          </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center z-30">
          <div className="bg-black/40 backdrop-blur-sm px-6 py-2 rounded-xl border border-brand-green/20 shadow-2xl">
            <span className="text-6xl font-black tracking-tighter text-brand-green drop-shadow-[0_0_20px_rgba(0,255,127,0.8)] tabular-nums">
                {Math.min(100, Math.round(percent * 100) / 100).toFixed(2)}<span className="text-3xl align-top ml-1">%</span>
            </span>
          </div>
      </div>
    </div>
  );
};

const LiveLogs = ({ logs }) => {
  return (
    <div className="flex flex-col gap-3 text-brand-text-blue text-[1.5vmin] font-mono overflow-hidden h-full">
        <div className="shrink-0 flex items-center gap-2 border-b border-white/10 pb-2">
            <div className="w-[1vmin] h-[1vmin] rounded-full bg-brand-green animate-pulse" />
            <span className="text-white font-bold tracking-wider text-[1.8vmin]">LIVE ENERGY LOSS</span>
        </div>
        <div className="flex-1 overflow-hidden relative">
            <div className="flex flex-col gap-[1vmin] w-full transition-all duration-300">
                {logs.map((log, index) => (
                    <div key={index} className="flex items-center gap-2 whitespace-nowrap text-brand-text-blue/80 animate-[slideIn_0.5s_ease-out]">
                        <span className="opacity-70">[{log.timestamp}]</span>
                        <span className="text-white font-bold">{log.message.split(' ')[0]}</span>
                        <span className={log.type === 'success' ? "text-brand-gold font-bold" : "text-brand-green"}>
                            {log.message.split(' ').slice(1).join(' ')}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default function BigScreen() {
  const [percent, setPercent] = useState(0);
  const [particles, setParticles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [socket, setSocket] = useState(null);
  const [joinUrl, setJoinUrl] = useState('');

  useEffect(() => {
    // Connect to Socket.io server
    const socketUrl = window.location.port === '5173' 
      ? `http://${window.location.hostname}:3001`
      : '/';
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    // Set Join URL for QR Code (Initial fallback)
    const currentPort = window.location.port || '80';
    setJoinUrl(`http://${window.location.hostname}:${currentPort}/join`);

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('init', (state) => {
      setPercent(state.progress);
      setLogs(state.logs);
      
      // Prefer public URL if available (for WeChat), otherwise fallback to IP
      if (state.publicUrl) {
          setJoinUrl(`${state.publicUrl}/join`);
      } else if (state.serverIp) {
          const port = state.port || 5173;
          setJoinUrl(`http://${state.serverIp}:${port}/join`);
      }
    });

    newSocket.on('progress_update', (p) => {
      setPercent(p);
    });

    newSocket.on('new_log', (log) => {
      setLogs(prev => [log, ...prev].slice(0, 10)); // Keep 10 logs visible
    });

    newSocket.on('spawn_particle', (data) => {
        const particleId = Date.now() + Math.random();
        setParticles(prev => [...prev, { id: particleId, name: data.name }]);
        
        // Remove particle after animation
        setTimeout(() => {
            setParticles(prev => prev.filter(p => p.id !== particleId));
        }, 1500);
    });

    newSocket.on('completion', (data) => {
        // Trigger massive effect
        alert(`ENERGY FULL! Triggered by ${data.name}`);
    });

    return () => newSocket.close();
  }, []);

  return (
    <div className="w-screen h-screen bg-brand-black flex items-center justify-center overflow-hidden relative font-sans">
      {/* Particles */}
      {particles.map(p => (
          <div key={p.id} 
               className="fixed z-50 pointer-events-none flex flex-col items-center animate-[energyFly_1.5s_ease-in-out_forwards]" 
               style={{
                   top: '60%', 
                   left: '70%',
               }}
          >
              <div className="w-4 h-4 rounded-full bg-brand-green shadow-[0_0_20px_#00FF7F,0_0_40px_#00FF7F]" />
              {/* Optional Name Tag on Particle */}
              {/* <span className="text-xs text-white mt-1 opacity-80">{p.name}</span> */}
          </div>
      ))}

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1a1a2e] via-[#050508] to-black" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vw] h-[200vh] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(255,193,7,0.03)_60deg,transparent_120deg)] animate-[spin_20s_linear_infinite]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vh] bg-[conic-gradient(from_180deg_at_50%_50%,transparent_0deg,rgba(255,193,7,0.05)_40deg,transparent_80deg)] animate-[spin_15s_linear_infinite_reverse]" />
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(rgba(255, 193, 7, 0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="w-full h-full max-w-[177.78vh] max-h-[56.25vw] aspect-video relative z-10 grid grid-cols-12 gap-8 p-4 md:p-8 lg:p-12 items-center mx-auto">
         <div className="absolute inset-0 border border-brand-gold/10 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.8)] bg-black/20 backdrop-blur-sm pointer-events-none" />
         
         {/* Left Side (60%) */}
         <div className="col-span-7 h-full relative flex items-center justify-center p-4 lg:p-8">
            <div className="relative h-[95%] w-auto aspect-[450/800] transition-transform duration-500">
                 <img src="/charging-station.png" className="h-full w-full object-contain drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]" alt="Energy Cabinet" />
                 <div className="absolute left-[8%] top-[15%] bottom-[15%] w-[0.5%] min-w-[3px] bg-brand-yellow/80 shadow-[0_0_15px_rgba(255,215,0,0.5)] flex flex-col justify-center items-center py-4 overflow-hidden">
                    <div className="whitespace-nowrap -rotate-90 text-brand-black font-bold tracking-[0.5em] text-[1.2vh] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vh] text-center">
                        ROCHEX ENERGY
                    </div>
                 </div>
                 <div className="absolute top-[12%] left-1/2 -translate-x-1/2 flex gap-[1.5vh] z-20">
                    <div className="w-[1vh] h-[1vh] rounded-full bg-[#00FF00] shadow-[0_0_10px_#00FF00]" />
                    <div className="w-[1vh] h-[1vh] rounded-full bg-[#FF0000] opacity-30" />
                    <div className="w-[1vh] h-[1vh] rounded-full bg-[#00FF00] shadow-[0_0_10px_#00FF00]" />
                 </div>
                 <div className="absolute top-[35%] left-1/2 -translate-x-1/2 z-20">
                     <div className="relative w-[6vh] h-[6vh] flex items-center justify-center">
                        <div
                          className={`absolute inset-0 rounded-full ${particles.length > 0 ? 'animate-[electricPulse_0.18s_ease-in-out_infinite]' : 'animate-[electricPulse_1.6s_ease-in-out_infinite]'}`}
                          style={{
                            background:
                              'radial-gradient(circle at 30% 30%, rgba(0,255,127,0.55) 0%, rgba(0,255,127,0.18) 35%, rgba(0,0,0,0) 70%)',
                            boxShadow:
                              '0 0 18px rgba(0,255,127,0.45), 0 0 40px rgba(0,255,127,0.18), inset 0 0 14px rgba(0,0,0,0.6)',
                          }}
                        />
                        <div
                          className="absolute inset-[-45%] rounded-full opacity-70 blur-[1.5px] animate-[ringRotate_3.8s_linear_infinite]"
                          style={{
                            background:
                              'conic-gradient(from 0deg, rgba(0,255,127,0) 0deg, rgba(0,255,127,0.35) 60deg, rgba(255,193,7,0.18) 105deg, rgba(0,255,127,0.05) 160deg, rgba(0,255,127,0) 240deg, rgba(0,255,127,0.25) 320deg, rgba(0,255,127,0) 360deg)',
                            maskImage: 'radial-gradient(circle, transparent 52%, black 56%)',
                            WebkitMaskImage: 'radial-gradient(circle, transparent 52%, black 56%)',
                          }}
                        />
                        <div
                          className={`absolute inset-[-18%] rounded-full border border-brand-green/30 ${particles.length > 0 ? 'animate-[electricPulse_0.3s_ease-in-out_infinite]' : 'animate-[electricPulse_2.4s_ease-in-out_infinite]'}`}
                          style={{
                            boxShadow: '0 0 16px rgba(0,255,127,0.25), inset 0 0 10px rgba(0,255,127,0.1)',
                          }}
                        />
                        <div
                          className={`absolute inset-[-8%] rounded-full ${particles.length > 0 ? 'animate-[boltFlicker_0.22s_ease-in-out_infinite]' : 'animate-[boltFlicker_1.15s_ease-in-out_infinite]'}`}
                          style={{
                            background:
                              'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 55%, rgba(0,0,0,0.85) 100%)',
                            boxShadow: 'inset 0 0 18px rgba(0,0,0,0.75)',
                          }}
                        />
                        <svg
                          viewBox="0 0 24 24"
                          className={`relative z-10 w-[3.3vh] h-[3.3vh] ${particles.length > 0 ? 'animate-[boltFlicker_0.18s_ease-in-out_infinite]' : 'animate-[boltFlicker_0.85s_ease-in-out_infinite]'}`}
                          style={{
                            filter:
                              'drop-shadow(0 0 10px rgba(0,255,127,0.9)) drop-shadow(0 0 22px rgba(0,255,127,0.35))',
                          }}
                        >
                          <path d="M13 2L3 14h7l-1 8 12-14h-7l-1-6z" fill="rgba(0,255,127,1)" />
                          <path
                            d="M13 2L3 14h7l-1 8 12-14h-7l-1-6z"
                            fill="rgba(255,255,255,0.25)"
                            transform="translate(-0.6,-0.6)"
                          />
                        </svg>
                     </div>
                 </div>
                 <BatteryOverlay percent={percent} />
            </div>
         </div>

         {/* Right Side (40%) */}
         <div className="col-span-5 h-full flex flex-col justify-center pl-4 lg:pl-8">
            <div className="glass-effect rounded-2xl p-6 lg:p-10 border border-brand-gold/10 bg-brand-black/40 backdrop-blur-md shadow-2xl relative overflow-hidden flex flex-col h-[80%] justify-between">
                <div className="absolute inset-0 rounded-2xl border border-brand-gold/5 shadow-[inset_0_0_30px_rgba(255,193,7,0.02)] pointer-events-none" />
                
                {/* QR Code Section */}
                <div className="flex flex-col items-center gap-[4vh] mb-4 flex-1 justify-center">
                    <div className="w-[30vmin] h-[30vmin] bg-white rounded-xl p-3 border border-white/10 relative shrink-0 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
                         <QRCodeSVG value={joinUrl} className="w-full h-full" />
                         <div className="absolute inset-0 border-2 border-brand-green/30 rounded-xl shadow-[0_0_15px_rgba(0,255,127,0.1)] animate-pulse pointer-events-none" />
                    </div>
                    <div className="text-center space-y-[2vh]">
                        <div className="px-6 py-2 bg-brand-green/10 rounded-full inline-block border border-brand-green/20">
                            <h3 className="text-brand-green font-bold text-[2vmin] tracking-widest uppercase">Scan to Charge</h3>
                        </div>
                        <p className="text-brand-white text-[3vmin] font-bold leading-tight">
                            使用微信扫码<br/>
                            <span className="text-brand-text-blue">为年会注入能量</span>
                        </p>
                        <div className="text-white/40 text-[1.2vmin] font-mono mt-2">
                             若无法扫码，请确保手机连接同一 Wi-Fi 并手动访问：<br/>
                             <span className="text-brand-green underline">{joinUrl}</span>
                        </div>
                    </div>
                </div>

                {/* Live Logs */}
                <div className="h-[35%] pt-4 lg:pt-6 border-t border-white/5 overflow-hidden">
                    <LiveLogs logs={logs} />
                </div>
            </div>
         </div>
      </div>
    </div>
  );
}
