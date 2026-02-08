
import React, { useRef, useEffect } from 'react';
import { DetectedObject } from '../types';

interface Props {
  imageSrc: string | null;
  detectedObjects: DetectedObject[];
}

const ConveyorVisualizer: React.FC<Props> = ({ imageSrc, detectedObjects }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !imageSrc) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = canvasRef.current!;
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw frame
      ctx.drawImage(img, 0, 0);

      // Draw bounding boxes
      detectedObjects.forEach((obj) => {
        const [ymin, xmin, ymax, xmax] = obj.box2d;
        const left = (xmin / 1000) * canvas.width;
        const top = (ymin / 1000) * canvas.height;
        const width = ((xmax - xmin) / 1000) * canvas.width;
        const height = ((ymax - ymin) / 1000) * canvas.height;

        // Draw Box
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 4;
        ctx.strokeRect(left, top, width, height);

        // Draw Label Background
        ctx.fillStyle = 'rgba(34, 197, 94, 0.9)';
        const labelText = `${obj.name} (${obj.color})`;
        const subLabelText = `${obj.wasteType} → ${obj.targetBin}`;
        
        ctx.font = 'bold 16px Inter';
        const labelWidth = Math.max(ctx.measureText(labelText).width, ctx.measureText(subLabelText).width) + 20;
        
        ctx.fillRect(left, top - 45, labelWidth, 45);

        // Draw Text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, left + 10, top - 28);
        ctx.font = '12px Inter';
        ctx.fillText(subLabelText, left + 10, top - 10);
      });
    };
  }, [imageSrc, detectedObjects]);

  return (
    <div className="relative border-4 border-slate-700 rounded-xl overflow-hidden shadow-2xl bg-slate-900 group">
      <div className="absolute top-0 left-0 w-full h-2 bg-slate-800 conveyor-pattern z-10"></div>
      <div className="absolute bottom-0 left-0 w-full h-2 bg-slate-800 conveyor-pattern z-10"></div>
      
      {imageSrc ? (
        <canvas ref={canvasRef} className="w-full h-auto block" />
      ) : (
        <div className="aspect-video flex items-center justify-center bg-slate-800 text-slate-400">
          <div className="text-center">
            <div className="mb-4 animate-pulse">
               <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
               </svg>
            </div>
            <p>Awaiting Live Camera Feed...</p>
          </div>
        </div>
      )}
      
      {/* Simulation Overlay */}
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-green-400 border border-green-400/30 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
        AI VISION ACTIVE
      </div>
    </div>
  );
};

export default ConveyorVisualizer;
