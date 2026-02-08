
import React from 'react';
import { BinStatus, IoTBin } from '../types';

interface Props {
  binStatuses: Record<IoTBin, BinStatus>;
  systemState: {
    processedCount: number;
    operatingState: 'Normal' | 'Warning' | 'Overload';
  };
}

const IoTDashboard: React.FC<Props> = ({ binStatuses, systemState }) => {
  const getFillColor = (level: string) => {
    switch (level) {
      case 'High': return 'bg-red-500';
      case 'Medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
      {/* System Stats Card */}
      <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl shadow-lg flex flex-col justify-between">
        <div>
          <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">System Throughput</h3>
          <p className="text-4xl font-bold text-white">{systemState.processedCount}</p>
          <p className="text-xs text-slate-500 mt-1">Total items processed today</p>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${systemState.operatingState === 'Normal' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
          <span className="text-sm font-medium uppercase">{systemState.operatingState}</span>
        </div>
      </div>

      {/* IoT Bin Grids */}
      {Object.entries(binStatuses).map(([name, status]) => (
        <div key={name} className={`bg-slate-800 border p-5 rounded-xl shadow-lg transition-all ${status.alertRequired ? 'border-red-500 animate-pulse' : 'border-slate-700'}`}>
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-sm font-bold text-slate-200 leading-tight">{name}</h4>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${status.sensorStatus === 'Active' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-slate-700 text-slate-400'}`}>
              IOT {status.sensorStatus}
            </span>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Fill Level</span>
                <span className="font-semibold text-white">{status.fillLevel}</span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${getFillColor(status.fillLevel)}`}
                  style={{ width: status.fillLevel === 'High' ? '90%' : status.fillLevel === 'Medium' ? '50%' : '15%' }}
                ></div>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Total Weight:</span>
              <span className="text-white font-mono">{status.count * 0.45} kg</span>
            </div>
          </div>
          
          {status.alertRequired && (
            <div className="mt-3 text-[10px] font-bold text-red-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              EMPTYING REQUIRED
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default IoTDashboard;
