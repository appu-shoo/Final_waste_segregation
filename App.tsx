
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ConveyorVisualizer from './components/ConveyorVisualizer';
import IoTDashboard from './components/IoTDashboard';
import { analyzeWasteFrame } from './services/geminiService';
import { AnalysisResponse, BinStatus, IoTBin, SystemState } from './types';

const INITIAL_BINS: Record<IoTBin, BinStatus> = {
  'Plastic Bin': { fillLevel: 'Low', sensorStatus: 'Active', alertRequired: false, count: 0 },
  'Organic Bin': { fillLevel: 'Low', sensorStatus: 'Active', alertRequired: false, count: 0 },
  'Cloth/Textile Bin': { fillLevel: 'Low', sensorStatus: 'Active', alertRequired: false, count: 0 },
  'Metal Bin': { fillLevel: 'Low', sensorStatus: 'Active', alertRequired: false, count: 0 },
  'Paper Bin': { fillLevel: 'Low', sensorStatus: 'Active', alertRequired: false, count: 0 },
  'Glass Bin': { fillLevel: 'Low', sensorStatus: 'Active', alertRequired: false, count: 0 },
  'General Waste Bin': { fillLevel: 'Low', sensorStatus: 'Active', alertRequired: false, count: 0 },
};

const App: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResponse | null>(null);
  const [binStatuses, setBinStatuses] = useState(INITIAL_BINS);
  const [systemState, setSystemState] = useState<SystemState>({ processedCount: 0, operatingState: 'Normal' });
  const [error, setError] = useState<string | null>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStreamActive(true);
        }
      } catch (err) {
        console.error("Camera access denied:", err);
        setError("Please allow camera access to use the waste sorting simulation.");
      }
    };
    initCamera();
    
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      // Ensure video is ready
      if (video.videoWidth === 0) {
        setIsProcessing(false);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");

      ctx.drawImage(video, 0, 0);
      const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      setCapturedImage(canvas.toDataURL('image/jpeg', 0.8));

      const analysis = await analyzeWasteFrame(base64Image);
      
      setLastAnalysis(analysis);
      
      // Update Bin Statuses
      setBinStatuses(prev => {
        const updated = { ...prev };
        analysis.detectedObjects.forEach(obj => {
          if (updated[obj.targetBin]) {
            updated[obj.targetBin].count += 1;
            const newCount = updated[obj.targetBin].count;
            if (newCount > 10) {
              updated[obj.targetBin].fillLevel = 'High';
              updated[obj.targetBin].alertRequired = true;
            } else if (newCount > 5) {
              updated[obj.targetBin].fillLevel = 'Medium';
            }
          }
        });
        return updated;
      });

      // Update System State
      setSystemState(prev => ({
        processedCount: prev.processedCount + analysis.detectedObjects.length,
        operatingState: analysis.systemStatus.operatingState as any
      }));

    } catch (err) {
      console.error("Processing failed:", err);
      // We don't set a persistent error here to avoid blocking the auto-loop
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  // Automated Analysis Loop
  useEffect(() => {
    if (!streamActive) return;

    const intervalId = setInterval(() => {
      if (!isProcessing) {
        captureAndAnalyze();
      }
    }, 4000); // Analyze every 4 seconds

    return () => clearInterval(intervalId);
  }, [streamActive, isProcessing, captureAndAnalyze]);

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            ECOSORT AI
          </h1>
          <p className="text-slate-400 font-medium">IoT-Enabled Automated Waste Segregation System</p>
        </div>
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 px-4 py-2 rounded-full shadow-inner">
              <span className={`w-2.5 h-2.5 rounded-full ${isProcessing ? 'bg-yellow-400' : 'bg-green-500'} animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]`}></span>
              <span className="text-xs font-bold text-slate-300 tracking-widest uppercase">
                {isProcessing ? 'Analyzing Frame...' : 'Auto-Monitoring Active'}
              </span>
           </div>
           
           <button 
             onClick={() => {
                setBinStatuses(INITIAL_BINS);
                setSystemState({ processedCount: 0, operatingState: 'Normal' });
                setLastAnalysis(null);
                setCapturedImage(null);
             }}
             className="px-6 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-all font-bold text-sm shadow-sm active:scale-95"
           >
             RESET SYSTEM
           </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-6">
        {/* Error Notification */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-sm flex items-center gap-3">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
             {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Visualizer Area */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
              <ConveyorVisualizer 
                imageSrc={capturedImage} 
                detectedObjects={lastAnalysis?.detectedObjects || []} 
              />
            </div>
            
            {/* Real-time sorting log */}
            {lastAnalysis && (
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-inner">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                   Sorting System Activity
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed mono italic">
                   &gt; {lastAnalysis.sortingAction}
                </p>
              </div>
            )}
          </div>

          {/* Side Info Panel */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
               <div className="bg-slate-800/50 p-4 border-b border-slate-700">
                  <h3 className="font-bold text-slate-200">Live Camera Stream</h3>
               </div>
               <div className="aspect-video bg-black relative">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover grayscale opacity-50"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 border-2 border-white/20 rounded-full flex items-center justify-center">
                       <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 text-[10px] text-white/40 font-mono pointer-events-none">
                    ENV_CAM_01 // 1280x720 // 30FPS
                  </div>
               </div>
            </div>

            {/* Analysis Output Text Format */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl h-full max-h-[400px] overflow-y-auto">
              <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">AI Inspection Log</h3>
              {lastAnalysis ? (
                <div className="space-y-6 mono text-xs">
                  <div>
                    <p className="text-green-400 mb-2 font-bold">Detected Objects:</p>
                    {lastAnalysis.detectedObjects.map((obj, i) => (
                      <div key={i} className="mb-4 pl-4 border-l-2 border-slate-800">
                        <p><span className="text-slate-500">{i+1}. Object Name:</span> {obj.name}</p>
                        <p><span className="text-slate-500">   Color:</span> {obj.color}</p>
                        <p><span className="text-slate-500">   Waste Type:</span> {obj.wasteType}</p>
                        <p><span className="text-slate-500">   Target IoT Bin:</span> {obj.targetBin}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="text-blue-400 mb-1 font-bold">Sorting Action:</p>
                    <p className="text-slate-300 pl-4">{lastAnalysis.sortingAction}</p>
                  </div>

                  <div>
                    <p className="text-purple-400 mb-1 font-bold">System Status:</p>
                    <p className="text-slate-300 pl-4">- Objects processed: {lastAnalysis.systemStatus.processedCount}</p>
                    <p className="text-slate-300 pl-4">- State: {lastAnalysis.systemStatus.operatingState}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-10 opacity-30">
                  <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm">Awaiting first detection...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard Components */}
        <IoTDashboard 
          binStatuses={binStatuses} 
          systemState={systemState} 
        />
        
        {/* Hidden processing canvas */}
        <canvas ref={canvasRef} className="hidden" />
      </main>

      <footer className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
        <p>&copy; 2024 EcoSort AI Simulation. Built for Computer Vision & Smart IoT Waste Management Research.</p>
        <div className="mt-2 flex justify-center gap-4 text-[10px] uppercase font-bold tracking-widest">
           <span className="text-green-500">Gemini 3 Flash</span>
           <span>React 18</span>
           <span>Tailwind CSS</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
