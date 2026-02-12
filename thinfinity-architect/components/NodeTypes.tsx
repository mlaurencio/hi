
import React from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';
import { Monitor, ShieldCheck, Server, Cpu, Globe, Cloud, Box, Microchip, MemoryStick, Terminal, Activity, SmartphoneNfc } from 'lucide-react';
import { ComponentType } from '../types';

const handleBaseStyle: React.CSSProperties = {
  width: '10px',
  height: '10px',
  background: '#ffffff',
  border: '2px solid #3b82f6',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  transition: 'opacity 0.2s, transform 0.2s',
  zIndex: 10,
  position: 'absolute',
};

const Handles = ({ selected }: { selected?: boolean }) => {
  const opacity = selected ? '1' : '0';
  const scale = selected ? 'scale(1)' : 'scale(0.5)';
  
  const sides = [
    { pos: Position.Left, id: 'l' },
    { pos: Position.Right, id: 'r' },
    { pos: Position.Top, id: 't' },
    { pos: Position.Bottom, id: 'b' },
  ];

  return (
    <>
      {sides.map((s) => (
        <React.Fragment key={s.id}>
          <Handle 
            type="target" 
            position={s.pos} 
            id={`${s.id}-target`}
            className="group-hover:opacity-100"
            style={{ 
              ...handleBaseStyle, 
              opacity,
              transform: scale,
              ...(s.pos === Position.Left || s.pos === Position.Right ? { top: '45%' } : { left: '45%' })
            }} 
          />
          <Handle 
            type="source" 
            position={s.pos} 
            id={`${s.id}-source`}
            className="group-hover:opacity-100"
            style={{ 
              ...handleBaseStyle, 
              opacity,
              transform: scale,
              ...(s.pos === Position.Left || s.pos === Position.Right ? { top: '55%' } : { left: '55%' })
            }} 
          />
        </React.Fragment>
      ))}
    </>
  );
};

const NodeShell = ({ children, title, sub, icon, selected }: any) => {
  return (
    <div className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 bg-white transition-all hover:shadow-xl cursor-pointer min-w-[200px] ${
      selected ? 'border-blue-500 shadow-xl ring-4 ring-blue-500/10' : 'border-slate-200 shadow-sm'
    }`}>
      <div className={`p-2.5 rounded-lg bg-slate-50 border border-slate-100 group-hover:bg-white transition-colors`}>
        {icon}
      </div>
      <div className="flex flex-col">
        {sub && <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">{sub}</span>}
        <span className="text-sm font-black text-slate-800 leading-none">{title}</span>
      </div>
      <Handles selected={selected} />
    </div>
  );
};

export const UserNode = ({ data, selected }: any) => {
  const getIcon = () => {
    switch (data.subType?.toLowerCase()) {
      case 'windows': return <Monitor className="text-blue-500" />;
      case 'android': return <SmartphoneNfc className="text-emerald-500" />;
      case 'pwa': return <Globe className="text-indigo-500" />;
      default: return <Monitor className="text-slate-400" />;
    }
  };
  return <NodeShell title={data.label} sub={data.subType || "Endpoint"} icon={getIcon()} selected={selected} />;
};

const HardwareBrief = ({ specs }: any) => {
  if (!specs) return null;
  const hasCpu = specs.cpu > 0;
  const hasRam = specs.ram > 0;
  if (!hasCpu && !hasRam) return null;

  return (
    <div className="flex gap-2 mt-3">
       {hasCpu && (
         <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded-lg border border-slate-100 flex-1 justify-center">
            <Microchip size={10} className="text-slate-400" />
            <span className="text-[9px] font-black text-slate-600">{specs.cpu}c</span>
         </div>
       )}
       {hasRam && (
         <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded-lg border border-slate-100 flex-1 justify-center">
            <MemoryStick size={10} className="text-slate-400" />
            <span className="text-[9px] font-black text-slate-600">{specs.ram}G</span>
         </div>
       )}
    </div>
  );
};

export const GatewayNode = ({ data, selected }: any) => {
  const isLinux = data.osType === 'Linux';
  return (
    <div className={`relative group p-6 rounded-2xl bg-white border-2 shadow-lg min-w-[220px] transition-all ${
      selected ? 'border-indigo-600 ring-4 ring-indigo-500/10' : 'border-indigo-100'
    }`}>
      <div className="flex items-center gap-4 mb-2">
         <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg">
            <ShieldCheck size={28} />
         </div>
         <div className="flex-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">GATEWAY</p>
            <p className="text-sm font-black text-indigo-900 leading-none">{data.label}</p>
         </div>
         {data.osType && (
            <div className={`p-1.5 rounded-lg border ${isLinux ? 'bg-orange-50 border-orange-100 text-orange-500' : 'bg-blue-50 border-blue-100 text-blue-500'}`}>
               {isLinux ? <Terminal size={14} /> : <Monitor size={14} />}
            </div>
         )}
      </div>
      <HardwareBrief specs={data.specs} />
      <div className="mt-3 flex items-center justify-between">
         <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1">
            <Activity size={10} /> Online
         </span>
         {data.executionType && <span className="text-[8px] font-black text-indigo-400 uppercase">{data.executionType}</span>}
      </div>
      <Handles selected={selected} />
    </div>
  );
};

export const BrokerNode = ({ data, selected }: any) => {
  const isLinux = data.osType === 'Linux';
  return (
    <div className={`relative group p-6 bg-white border-2 rounded-2xl shadow-xl min-w-[220px] transition-all ${
      selected ? 'border-blue-600 ring-4 ring-blue-500/10' : 'border-slate-200'
    }`}>
      <div className="flex items-center gap-4">
         <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg">
            <Cpu size={28} />
         </div>
         <div className="flex-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">BROKER</p>
            <p className="text-sm font-black text-slate-900 leading-none">{data.label}</p>
         </div>
         {data.osType && (
            <div className={`p-1.5 rounded-lg border ${isLinux ? 'bg-orange-50 border-orange-100 text-orange-500' : 'bg-blue-50 border-blue-100 text-blue-500'}`}>
               {isLinux ? <Terminal size={14} /> : <Monitor size={14} />}
            </div>
         )}
      </div>
      <HardwareBrief specs={data.specs} />
      <div className="mt-4 flex items-center justify-between px-1">
         <span className="text-[8px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">PRIMARY</span>
         {data.osType && <span className="text-[8px] font-black text-slate-400 uppercase">{data.osType}</span>}
      </div>
      <Handles selected={selected} />
    </div>
  );
};

export const ResourceNode = ({ data, selected }: any) => {
  const isLinux = data.osType === 'Linux';
  const isContainer = data.executionType === 'Container';
  const specs = data.specs;

  return (
    <div className={`group relative bg-white border-2 p-5 rounded-2xl shadow-md min-w-[280px] transition-all ${
      selected ? 'border-blue-600 ring-4 ring-blue-500/10 shadow-2xl scale-[1.02]' : 'border-slate-200'
    }`}>
      <div className="flex items-center gap-4 mb-4 pb-3 border-b border-slate-100">
         <div className="flex -space-x-4">
            <div className={`p-3 rounded-xl border-2 border-white shadow-sm ${isContainer ? 'bg-indigo-600 text-white' : 'bg-blue-600 text-white'}`}>
               {isContainer ? <Box size={22} /> : <Server size={22} />}
            </div>
            {data.osType && (
               <div className={`p-3 rounded-xl border-2 border-white shadow-sm ${isLinux ? 'bg-orange-500 text-white' : 'bg-slate-100 text-blue-500'}`}>
                  {isLinux ? <Terminal size={22} /> : <Monitor size={22} />}
               </div>
            )}
         </div>
         <div className="flex-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{data.resourceType || "RESOURCE"}</p>
            <p className="text-sm font-black text-slate-900 leading-none">{data.label}</p>
         </div>
      </div>
      
      {specs && (specs.cpu > 0 || specs.ram > 0) ? (
         <div className="grid grid-cols-2 gap-2 mb-3">
            {specs.cpu > 0 && (
               <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <Microchip size={12} className="text-slate-400" />
                  <span className="text-[10px] font-black text-slate-700">{specs.cpu} <span className="text-[8px] text-slate-400 font-bold uppercase">vCPU</span></span>
               </div>
            )}
            {specs.ram > 0 && (
               <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <MemoryStick size={12} className="text-slate-400" />
                  <span className="text-[10px] font-black text-slate-700">{specs.ram} <span className="text-[8px] text-slate-400 font-bold uppercase">GB</span></span>
               </div>
            )}
         </div>
      ) : null}

      <div className="flex items-center justify-between px-1">
         <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${selected ? 'bg-blue-500' : 'bg-emerald-500'} animate-pulse`} />
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{data.osType || 'System Ready'}</span>
         </div>
         {data.executionType && (
            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-tighter ${
               isContainer ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-blue-50 border-blue-100 text-blue-600'
            }`}>
               {data.executionType}
            </span>
         )}
      </div>

      <Handles selected={selected} />
    </div>
  );
};

export const HubNode = ({ selected }: any) => (
  <div className={`w-6 h-6 rounded-full border-[3px] shadow-sm transition-all flex items-center justify-center ${
    selected 
      ? 'bg-blue-600 border-blue-400 scale-110 shadow-blue-200 shadow-lg' 
      : 'bg-[#94a3b8] border-white hover:border-blue-300'
  }`}>
    <Handles selected={selected} />
  </div>
);

export const GroupNode = ({ data, selected }: any) => {
  const isDatacenter = data.type === ComponentType.DATACENTER;
  
  return (
    <div 
      className={`relative h-full w-full rounded-[2.5rem] transition-all duration-300 ${
        isDatacenter 
          ? 'border-[6px] border-[#9b1c1c] bg-slate-50/20 shadow-inner' 
          : 'border-2 border-dashed border-blue-200 bg-blue-50/5'
      } ${selected ? 'ring-4 ring-blue-500/20' : ''}`}
    >
      <NodeResizer minWidth={200} minHeight={200} isVisible={selected} lineClassName="border-blue-400" />
      
      {isDatacenter && (
        <>
          <div className="absolute -top-3 -left-3 w-8 h-8 bg-[#9b1c1c] rotate-45" />
          <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#9b1c1c] rotate-45" />
          <div className="absolute -bottom-3 -left-3 w-8 h-8 bg-[#9b1c1c] rotate-45" />
          <div className="absolute -bottom-3 -right-3 w-8 h-8 bg-[#9b1c1c] rotate-45" />
        </>
      )}

      <div className={`absolute -top-4 left-10 px-6 py-2 rounded-full border shadow-xl flex items-center gap-2 z-10 bg-white ${isDatacenter ? 'border-[#9b1c1c]' : 'border-blue-200'}`}>
        <span className={`text-[10px] font-black uppercase tracking-widest ${isDatacenter ? 'text-[#9b1c1c]' : 'text-blue-600'}`}>
          {data.label}
        </span>
      </div>
    </div>
  );
};
