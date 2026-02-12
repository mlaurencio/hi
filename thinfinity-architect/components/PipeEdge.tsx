
import React from 'react';
import { getSmoothStepPath, EdgeProps } from 'reactflow';

export const PipeEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  data,
  style = {},
  markerEnd,
  markerStart,
  selected,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 24,
  });

  const protocol = data?.protocol || label || 'TCP';
  const direction = data?.direction || 'outbound';
  const showLabel = data?.showLabel !== false;

  const strokeColor = selected ? '#3b82f6' : '#94a3b8';
  const strokeWidth = selected ? 5 : 3;

  return (
    <>
      <path
        id={id}
        style={{ ...style, strokeWidth, stroke: strokeColor, fill: 'none', transition: 'stroke 0.2s, stroke-width 0.2s' }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        markerStart={markerStart}
      />
      
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={15}
        className="react-flow__edge-interaction cursor-pointer"
      />

      {showLabel && (
        <foreignObject
          width={120}
          height={30}
          x={labelX - 60}
          y={labelY - 15}
          className="overflow-visible pointer-events-none"
        >
          <div className="flex flex-col items-center justify-center h-full">
            <div className={`px-3 py-1 rounded-lg shadow-lg border flex items-center gap-2 transition-all ${
              selected ? 'bg-blue-600 border-blue-400 text-white' : 'bg-[#1e293b] border-slate-700 text-white'
            }`}>
              <div className={`text-[6px] font-black uppercase tracking-widest ${selected ? 'text-blue-100' : 'text-slate-400'}`}>
                {protocol}
              </div>
              <div className="w-[1px] h-3 bg-white/20" />
              <div className="text-[7px] font-black leading-none opacity-80 uppercase">{direction}</div>
            </div>
          </div>
        </foreignObject>
      )}
    </>
  );
};
