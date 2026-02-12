
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState,
  Connection,
  Panel,
  ReactFlowProvider,
  MarkerType,
  useReactFlow,
  Position,
  Node,
} from 'reactflow';
import { 
  Monitor, 
  ShieldCheck, 
  Server, 
  Cpu, 
  Layers, 
  Send, 
  Loader2, 
  Trash2, 
  Terminal, 
  X,
  Globe,
  Cloud,
  ChevronRight,
  ChevronLeft,
  Settings,
  HardDrive,
  SmartphoneNfc,
  Box,
  Link2,
  ArrowRight,
  ArrowLeftRight,
  RefreshCw,
  Activity,
  Edit3,
  Microchip,
  MemoryStick,
  Disc,
  Info,
  Zap,
  GitBranch,
  SquareDashedBottomCode,
  Tags,
  Eye,
  EyeOff,
  Waypoints
} from 'lucide-react';
import { generateArchitecture, optimizeArchitecture } from './services/geminiService';
import { ComponentType, ConnectionDirection, ResourceType, ExecutionType, ResourceSpecs, OSType } from './types';
import { UserNode, GatewayNode, BrokerNode, ResourceNode, GroupNode, HubNode } from './components/NodeTypes';
import { PipeEdge } from './components/PipeEdge';

const nodeTypes = {
  userNode: UserNode,
  gatewayNode: GatewayNode,
  brokerNode: BrokerNode,
  resourceNode: ResourceNode,
  groupNode: GroupNode,
  hubNode: HubNode,
};

const edgeTypes = {
  pipe: PipeEdge,
};

const PROTOCOLS = ['HTTPS', 'HTTP', 'RDP', 'VNC'];
const DIRECTIONS: { id: ConnectionDirection, label: string, icon: any }[] = [
  { id: 'outbound', label: 'Outbound', icon: <ArrowRight size={14} /> },
  { id: 'inbound', label: 'Inbound', icon: <ArrowRight className="rotate-180" size={14} /> },
  { id: 'bidirectional', label: 'Bidirectional', icon: <ArrowLeftRight size={14} /> },
  { id: 'sync', label: 'Sync', icon: <RefreshCw size={14} /> },
];

const RESOURCE_TYPES: ResourceType[] = ['VDI 1:1', 'Session-Based VDI', 'Virtual Application Server'];
const EXECUTION_TYPES: ExecutionType[] = ['VM', 'Container'];
const OS_TYPES: OSType[] = ['Windows Server', 'Windows 10', 'Windows 11', 'Linux'];

const isHub = (nodes: any[], nodeId: string) => {
  const node = nodes.find(n => n.id === nodeId);
  return node?.type === 'hubNode';
};

const calculateBestHandles = (sourceNode: Node, targetNode: Node) => {
  const isSourceHub = sourceNode.type === 'hubNode';
  const isTargetHub = targetNode.type === 'hubNode';

  const sourceX = sourceNode.position.x + (sourceNode.width || 0) / 2;
  const sourceY = sourceNode.position.y + (sourceNode.height || 0) / 2;
  const targetX = targetNode.position.x + (targetNode.width || 0) / 2;
  const targetY = targetNode.position.y + (targetNode.height || 0) / 2;

  const dx = targetX - sourceX;
  const dy = targetY - sourceY;

  let sourceH: string;
  let targetH: string;

  if (isSourceHub) {
    sourceH = 'l-source';
  } else {
    if (Math.abs(dx) > Math.abs(dy)) {
      sourceH = dx > 0 ? 'r-source' : 'l-source';
    } else {
      sourceH = dy > 0 ? 'b-source' : 't-source';
    }
  }

  if (isTargetHub) {
    targetH = 'r-target';
  } else {
    if (Math.abs(dx) > Math.abs(dy)) {
      targetH = dx > 0 ? 'l-target' : 'r-target';
    } else {
      targetH = dy > 0 ? 't-target' : 'b-target';
    }
  }

  return { sourceHandle: sourceH, targetHandle: targetH };
};

const validateNodes = (newNodes: any[]): any[] => {
  const nodeIds = new Set(newNodes.map(n => n.id));
  return newNodes.map(node => {
    if (node.parentId && !nodeIds.has(node.parentId)) {
      const { parentId, extent, ...rest } = node;
      return rest;
    }
    return node;
  });
};

const INITIAL_NODES: any[] = [
  { id: 'g-user1', type: 'groupNode', data: { label: 'User Group 1', type: ComponentType.USER_GROUP }, position: { x: 50, y: 150 }, style: { width: 180, height: 400 } },
  { id: 'g-oracle', type: 'groupNode', data: { label: 'Oracle Cloud Datacenter', type: ComponentType.DATACENTER }, position: { x: 1050, y: 100 }, style: { width: 550, height: 600 } },
  { id: 'hub-in', type: 'hubNode', data: { label: 'Inbound Virtual Connector' }, position: { x: 300, y: 350 } },
  { id: 'gw-dmz', type: 'gatewayNode', data: { label: 'Thinfinity Gateway', osType: 'Windows Server', executionType: 'VM', specs: { cpu: 2, ram: 8, diskC: 40, diskD: 20 } }, position: { x: 450, y: 280 } },
  { id: 'hub-mid', type: 'hubNode', data: { label: 'Mid-Tier Connector' }, position: { x: 700, y: 350 } },
  { id: 'brk-main', type: 'brokerNode', data: { label: 'Primary Broker', osType: 'Windows Server', executionType: 'VM', specs: { cpu: 4, ram: 16, diskC: 60, diskD: 20 } }, position: { x: 800, y: 280 } },
  { id: 'u1-win', parentId: 'g-user1', type: 'userNode', data: { label: 'Windows', subType: 'Windows' }, position: { x: 20, y: 60 }, extent: 'parent' },
  { id: 'u1-and', parentId: 'g-user1', type: 'userNode', data: { label: 'Android', subType: 'Android' }, position: { x: 20, y: 180 }, extent: 'parent' },
  { id: 'u1-pwa', parentId: 'g-user1', type: 'userNode', data: { label: 'PWA', subType: 'PWA' }, position: { x: 20, y: 300 }, extent: 'parent' },
  { id: 'srv-vdi', parentId: 'g-oracle', type: 'resourceNode', data: { label: 'VDI Cluster', subType: 'VDI CLUSTER', resourceType: 'Session-Based VDI', executionType: 'VM', osType: 'Windows 10', specs: { cpu: 8, ram: 32, diskC: 100, diskD: 500 } }, position: { x: 60, y: 80 }, extent: 'parent' },
  { id: 'srv-vm', parentId: 'g-oracle', type: 'resourceNode', data: { label: 'App Server', subType: 'SERVER', resourceType: 'Virtual Application Server', executionType: 'Container', osType: 'Linux', specs: { cpu: 4, ram: 16, diskC: 60, diskD: 20 } }, position: { x: 60, y: 380 }, extent: 'parent' },
];

const INITIAL_EDGES: any[] = [
  { id: 'e-u1', source: 'u1-win', sourceHandle: 'r-source', target: 'hub-in', targetHandle: 'r-target', data: { protocol: 'HTTPS', direction: 'outbound', showLabel: false }, type: 'pipe' },
  { id: 'e-u2', source: 'u1-and', sourceHandle: 'r-source', target: 'hub-in', targetHandle: 'r-target', data: { protocol: 'HTTPS', direction: 'outbound', showLabel: false }, type: 'pipe' },
  { id: 'e-u3', source: 'u1-pwa', sourceHandle: 'r-source', target: 'hub-in', targetHandle: 'r-target', data: { protocol: 'HTTPS', direction: 'outbound', showLabel: false }, type: 'pipe' },
  { id: 'e-back1', source: 'hub-in', sourceHandle: 'l-source', target: 'gw-dmz', targetHandle: 'l-target', data: { protocol: 'HTTPS', direction: 'outbound', showLabel: true }, type: 'pipe', markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' } },
  { id: 'e-back2', source: 'gw-dmz', sourceHandle: 'r-source', target: 'hub-mid', targetHandle: 'r-target', data: { protocol: 'HTTPS', direction: 'bidirectional', showLabel: true }, type: 'pipe' },
  { id: 'e-back3', source: 'hub-mid', sourceHandle: 'l-source', target: 'brk-main', targetHandle: 'l-target', data: { protocol: 'HTTPS', direction: 'bidirectional', showLabel: false }, type: 'pipe', markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' } },
  { id: 'e-back4', source: 'brk-main', sourceHandle: 'r-source', target: 'srv-vdi', targetHandle: 'l-target', data: { protocol: 'RDP', direction: 'sync', showLabel: true }, type: 'pipe', markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' } },
];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [pendingConn, setPendingConn] = useState<Connection | null>(null);
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const [connModalConfig, setConnModalConfig] = useState<{ 
    protocol: string, 
    direction: ConnectionDirection,
    logicalSourceId: string | null,
    showLabel: boolean
  }>({
    protocol: 'HTTPS',
    direction: 'outbound',
    logicalSourceId: null,
    showLabel: true
  });

  const [pendingComponent, setPendingComponent] = useState<{ type: string, subType?: string } | null>(null);
  const [editingComponentId, setEditingComponentId] = useState<string | null>(null);
  const [componentForm, setComponentForm] = useState<{
    label: string,
    resourceType?: ResourceType,
    executionType: ExecutionType,
    osType: OSType,
    specs: ResourceSpecs
  }>({
    label: '',
    resourceType: 'VDI 1:1',
    executionType: 'VM',
    osType: 'Windows Server',
    specs: { cpu: 2, ram: 8, diskC: 40, diskD: 0 }
  });

  const { fitView } = useReactFlow();

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedId), [nodes, selectedId]);
  const selectedEdge = useMemo(() => edges.find(e => e.id === selectedId), [edges, selectedId]);

  const connectionNodes = useMemo(() => {
    let sourceId: string | null = null;
    let targetId: string | null = null;
    
    if (pendingConn) {
      sourceId = pendingConn.source;
      targetId = pendingConn.target;
    } else if (editingEdgeId) {
      const edge = edges.find(e => e.id === editingEdgeId);
      if (edge) {
        sourceId = edge.source;
        targetId = edge.target;
      }
    }

    if (!sourceId || !targetId) return [];
    
    const sNode = nodes.find(n => n.id === sourceId);
    const tNode = nodes.find(n => n.id === targetId);
    return [sNode, tNode].filter(Boolean);
  }, [pendingConn, editingEdgeId, edges, nodes]);

  const onConnect = useCallback((params: Connection) => {
    setPendingConn(params);
    setConnModalConfig({ 
      protocol: 'HTTPS', 
      direction: 'outbound', 
      logicalSourceId: params.source,
      showLabel: true
    });
  }, []);

  useEffect(() => {
    if (editingEdgeId) {
      const edge = edges.find(e => e.id === editingEdgeId);
      if (edge) {
        setConnModalConfig({
          protocol: edge.data?.protocol || 'HTTPS',
          direction: edge.data?.direction || 'outbound',
          logicalSourceId: edge.source,
          showLabel: edge.data?.showLabel !== false
        });
      }
    }
  }, [editingEdgeId, edges]);

  useEffect(() => {
    if (editingComponentId) {
      const node = nodes.find(n => n.id === editingComponentId);
      if (node && node.data) {
        setComponentForm({
          label: node.data.label,
          resourceType: node.data.resourceType,
          executionType: node.data.executionType || 'VM',
          osType: node.data.osType || 'Windows Server',
          specs: node.data.specs || { cpu: 2, ram: 8, diskC: 40, diskD: 0 }
        });
      }
    }
  }, [editingComponentId, nodes]);

  const finalizeConnection = useCallback(() => {
    const { protocol, direction, logicalSourceId, showLabel } = connModalConfig;
    const markerColor = '#94a3b8';

    const buildEdge = (sourceId: string, targetId: string, sHandle?: string, tHandle?: string, id?: string) => {
      const sourceIsHub = isHub(nodes, sourceId);
      const targetIsHub = isHub(nodes, targetId);
      
      const config: any = { markerEnd: undefined, markerStart: undefined };

      if (!targetIsHub && (direction === 'outbound' || direction === 'bidirectional' || direction === 'sync')) {
        config.markerEnd = { type: MarkerType.ArrowClosed, color: markerColor };
      }
      if (!sourceIsHub && (direction === 'inbound' || direction === 'bidirectional' || direction === 'sync')) {
        config.markerStart = { type: MarkerType.ArrowClosed, color: markerColor };
      }

      let finalSHandle = sHandle;
      let finalTHandle = tHandle;
      if (sourceIsHub) finalSHandle = 'l-source';
      if (targetIsHub) finalTHandle = 'r-target';

      return {
        id: id || `e-${Date.now()}`,
        source: sourceId,
        target: targetId,
        sourceHandle: finalSHandle,
        targetHandle: finalTHandle,
        type: 'pipe',
        data: { protocol, direction, showLabel },
        animated: direction === 'sync',
        ...config,
      };
    };

    if (pendingConn && pendingConn.source && pendingConn.target) {
      const isSwapped = logicalSourceId !== pendingConn.source;
      const finalSourceId = isSwapped ? pendingConn.target : pendingConn.source;
      const finalTargetId = isSwapped ? pendingConn.source : pendingConn.target;
      
      const sNode = nodes.find(n => n.id === finalSourceId);
      const tNode = nodes.find(n => n.id === finalTargetId);
      let handles = { sourceHandle: pendingConn.sourceHandle, targetHandle: pendingConn.targetHandle };
      if (sNode && tNode) {
        handles = calculateBestHandles(sNode as Node, tNode as Node);
      }

      const newEdge = buildEdge(finalSourceId!, finalTargetId!, handles.sourceHandle || undefined, handles.targetHandle || undefined);
      setEdges((eds) => addEdge(newEdge, eds));
      setPendingConn(null);
    } else if (editingEdgeId) {
      setEdges(eds => eds.map(e => {
        if (e.id === editingEdgeId) {
          const isSwapped = logicalSourceId !== e.source;
          const finalSourceId = isSwapped ? e.target : e.source;
          const finalTargetId = isSwapped ? e.source : e.target;
          
          const sNode = nodes.find(n => n.id === finalSourceId);
          const tNode = nodes.find(n => n.id === finalTargetId);
          let handles = { sourceHandle: e.sourceHandle, targetHandle: e.targetHandle };
          if (sNode && tNode) {
            handles = calculateBestHandles(sNode as Node, tNode as Node);
          }

          return buildEdge(finalSourceId, finalTargetId, handles.sourceHandle || undefined, handles.targetHandle || undefined, e.id);
        }
        return e;
      }));
      setEditingEdgeId(null);
    }
  }, [pendingConn, editingEdgeId, connModalConfig, setEdges, nodes]);

  const finalizeComponent = useCallback(() => {
    if (!componentForm.label.trim()) return;

    if (pendingComponent) {
      const id = `${pendingComponent.type}-${Date.now()}`;
      const newNode = {
        id,
        type: `${pendingComponent.type}Node`,
        position: { x: 450, y: 300 },
        data: { subType: pendingComponent.subType, ...componentForm }
      };
      setNodes(nds => validateNodes([...nds, newNode]));
      setPendingComponent(null);
    } else if (editingComponentId) {
      setNodes(nds => validateNodes(nds.map(n => {
        if (n.id === editingComponentId) {
          return { ...n, data: { ...n.data, ...componentForm } };
        }
        return n;
      })));
      setEditingComponentId(null);
    }
  }, [pendingComponent, editingComponentId, componentForm, setNodes]);

  const deleteMetadataTag = (tagKey: string) => {
    if (!selectedId || !selectedNode) return;
    setNodes(nds => validateNodes(nds.map(n => {
      if (n.id === selectedId) {
        const newData = { ...n.data };
        if (tagKey === 'osType') delete newData.osType;
        if (tagKey === 'executionType') delete newData.executionType;
        if (tagKey === 'cpu' && newData.specs) newData.specs.cpu = 0;
        if (tagKey === 'ram' && newData.specs) newData.specs.ram = 0;
        if (tagKey === 'subType') delete newData.subType;
        return { ...n, data: newData };
      }
      return n;
    })));
  };

  const handleAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setIsLoading(true);
    const result = await generateArchitecture(prompt);
    if (result && result.nodes) {
      const validatedNodes = validateNodes(result.nodes.map(n => ({ 
        ...n, 
        position: n.position || { x: Math.random() * 500, y: Math.random() * 500 } 
      })));
      setNodes(validatedNodes as any[]);
      
      const cleanedEdges = result.edges.map(e => {
        const sourceNode = validatedNodes.find(n => n.id === e.source);
        const targetNode = validatedNodes.find(n => n.id === e.target);
        const direction = e.data?.direction || 'outbound';
        let handles = calculateBestHandles(sourceNode as Node, targetNode as Node);
        const sourceIsHub = isHub(validatedNodes, e.source);
        const targetIsHub = isHub(validatedNodes, e.target);
        const config: any = { ...e, ...handles, type: 'pipe', markerEnd: undefined, markerStart: undefined };
        if (!targetIsHub && (direction === 'outbound' || direction === 'bidirectional' || direction === 'sync')) config.markerEnd = { type: MarkerType.ArrowClosed, color: '#94a3b8' };
        if (!sourceIsHub && (direction === 'inbound' || direction === 'bidirectional' || direction === 'sync')) config.markerStart = { type: MarkerType.ArrowClosed, color: '#94a3b8' };
        return config;
      });
      setEdges(cleanedEdges as any[]);
      setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 300);
    }
    setIsLoading(false);
  };

  const handleAutoAlign = async () => {
    setIsOptimizing(true);
    const currentState = { nodes, edges };
    try {
      const optimized = await optimizeArchitecture(currentState);
      if (optimized && optimized.nodes) {
        const validatedNodes = validateNodes(optimized.nodes.map(n => ({ ...n, position: n.position || { x: 0, y: 0 } })));
        setNodes(validatedNodes as any[]);
        const cleanedEdges = optimized.edges.map(e => {
          const sourceNode = validatedNodes.find(n => n.id === e.source);
          const targetNode = validatedNodes.find(n => n.id === e.target);
          const direction = e.data?.direction || 'outbound';
          let handles = calculateBestHandles(sourceNode as Node, targetNode as Node);
          const sourceIsHub = isHub(validatedNodes, e.source);
          const targetIsHub = isHub(validatedNodes, e.target);
          const config: any = { ...e, ...handles, type: 'pipe', markerEnd: undefined, markerStart: undefined };
          if (!targetIsHub && (direction === 'outbound' || direction === 'bidirectional' || direction === 'sync')) config.markerEnd = { type: MarkerType.ArrowClosed, color: '#94a3b8' };
          if (!sourceIsHub && (direction === 'inbound' || direction === 'bidirectional' || direction === 'sync')) config.markerStart = { type: MarkerType.ArrowClosed, color: '#94a3b8' };
          return config;
        });
        setEdges(cleanedEdges as any[]);
        setTimeout(() => fitView({ padding: 0.2, duration: 1000 }), 400);
      } else {
        fitView({ padding: 0.2, duration: 800 });
      }
    } catch (err) {
      console.error("Auto Align execution error:", err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const addNode = (type: string, data: any = {}) => {
    if (type === 'resource' || type === 'gateway' || type === 'broker') {
      setPendingComponent({ type, subType: data.subType });
      setComponentForm({
        label: `${data.subType || type.toUpperCase()} - New Instance`,
        resourceType: type === 'resource' ? (data.subType === 'SERVER' ? 'Virtual Application Server' : 'VDI 1:1') : undefined,
        executionType: 'VM',
        osType: 'Windows Server',
        specs: { cpu: 2, ram: 8, diskC: 40, diskD: 20 }
      });
      return;
    }
    const id = `${type}-${Date.now()}`;
    const newNode = {
      id,
      type: `${type}Node`,
      position: { x: 400, y: 300 },
      data: { label: type === 'hub' ? 'Virtual Connector' : `New ${type}`, ...data },
      ...(type === 'group' ? { type: 'groupNode', style: { width: 300, height: 400 } } : {})
    };
    setNodes(nds => validateNodes([...nds, newNode]));
  };

  const isConnModalOpen = !!pendingConn || !!editingEdgeId;
  const isComponentModalOpen = !!pendingComponent || !!editingComponentId;

  const updateSpec = (key: keyof ResourceSpecs, val: string) => {
    const num = Math.max(0, parseInt(val) || 0);
    setComponentForm(prev => ({ ...prev, specs: { ...prev.specs, [key]: num } }));
  };

  const getActiveComponentTypeDisplay = () => {
    if (editingComponentId) {
      const node = nodes.find(n => n.id === editingComponentId);
      return node?.type?.replace('Node', '').toUpperCase() || 'COMPONENT';
    }
    return pendingComponent?.type?.toUpperCase() || 'COMPONENT';
  };

  const showResourceFields = (pendingComponent?.type === 'resource') || 
    (editingComponentId && nodes.find(n => n.id === editingComponentId)?.type === 'resourceNode');

  const metadataTags = useMemo(() => {
    if (!selectedNode || !selectedNode.data) return [];
    const tags: { key: string, label: string, value: string }[] = [];
    const d = selectedNode.data;
    if (d.subType) tags.push({ key: 'subType', label: 'SubType', value: d.subType });
    if (d.osType) tags.push({ key: 'osType', label: 'OS', value: d.osType });
    if (d.executionType) tags.push({ key: 'executionType', label: 'Mode', value: d.executionType });
    if (d.specs?.cpu > 0) tags.push({ key: 'cpu', label: 'CPU', value: `${d.specs.cpu} Cores` });
    if (d.specs?.ram > 0) tags.push({ key: 'ram', label: 'RAM', value: `${d.specs.ram} GB` });
    return tags;
  }, [selectedNode]);

  return (
    <div className="flex flex-col w-full h-full bg-[#f1f5f9] font-sans">
      {isOptimizing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white/90 p-12 rounded-[3rem] shadow-2xl flex flex-col items-center gap-6 border border-white">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                <Loader2 size={64} className="text-blue-600 animate-spin relative" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">Architecting Backbone Flow</h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Applying Virtual Connector logic & grouping...</p>
              </div>
           </div>
        </div>
      )}

      <header className="flex items-center justify-between bg-white px-10 py-5 border-b border-slate-200 h-24 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="bg-slate-900 p-3 rounded-2xl shadow-lg"><Layers className="text-white w-7 h-7" /></div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">Thinfinity <span className="text-blue-600">Architect</span></h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 leading-none">Enterprise Visualization Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white transition-colors">
              {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
           </button>
           <button onClick={handleAutoAlign} className="flex items-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-100 group">
              <Zap size={16} className="group-hover:fill-current" /> Auto Align
           </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className={`${sidebarOpen ? 'w-80' : 'w-0'} bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto z-10 transition-all duration-300`}>
          <div className="p-8 space-y-10 min-w-[320px]">
            {selectedId ? (
              <section className="animate-in slide-in-from-left-4">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <Settings size={14} className="text-blue-500" /> {selectedNode ? 'Component' : 'Link'}
                   </h3>
                   <button onClick={() => setSelectedId(null)}><X size={18} className="text-slate-300" /></button>
                </div>
                
                <div className="space-y-6">
                   {selectedNode && (
                     <div className="space-y-8">
                       <div>
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1">Display Label</label>
                         <input 
                            type="text" 
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                            value={selectedNode.data.label}
                            onChange={(e) => setNodes(nds => validateNodes(nds.map(n => n.id === selectedId ? {...n, data: {...n.data, label: e.target.value}} : n)))}
                         />
                       </div>

                       {metadataTags.length > 0 && (
                         <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block px-1 flex items-center gap-2">
                               <Tags size={12} className="text-blue-500"/> Metadata Tags
                            </label>
                            <div className="space-y-2">
                               {metadataTags.map(tag => (
                                 <div key={tag.key} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl group transition-all hover:border-blue-200 hover:bg-blue-50/30">
                                    <div className="flex flex-col">
                                       <span className="text-[8px] font-bold text-slate-400 uppercase leading-none mb-1">{tag.label}</span>
                                       <span className="text-[10px] font-black text-slate-700 leading-none">{tag.value}</span>
                                    </div>
                                    <button 
                                       onClick={() => deleteMetadataTag(tag.key)}
                                       className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                       title={`Remove ${tag.label}`}
                                    >
                                       <Trash2 size={12} />
                                    </button>
                                 </div>
                               ))}
                            </div>
                         </div>
                       )}

                       {(selectedNode.type === 'resourceNode' || selectedNode.type === 'gatewayNode' || selectedNode.type === 'brokerNode') && (
                         <button 
                           onClick={() => setEditingComponentId(selectedNode.id)}
                           className="w-full flex items-center justify-center gap-3 py-4 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-blue-100 hover:bg-blue-100 transition-colors"
                         >
                           <Edit3 size={14} /> Edit Specifications
                         </button>
                       )}
                     </div>
                   )}

                   {selectedEdge && (
                     <div className="space-y-4">
                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Link Identity</p>
                           <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold text-slate-600">Protocol</span>
                              <span className="text-[10px] font-black text-blue-600">{selectedEdge.data?.protocol || 'None'}</span>
                           </div>
                           <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold text-slate-600">Direction</span>
                              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">{selectedEdge.data?.direction}</span>
                           </div>
                           <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-600">Visible</span>
                              <span className="text-[10px] font-black text-emerald-600 uppercase">{selectedEdge.data?.showLabel !== false ? 'Yes' : 'No'}</span>
                           </div>
                        </div>
                        <button onClick={() => setEditingEdgeId(selectedEdge.id)} className="w-full flex items-center justify-center gap-3 py-4 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-blue-100 hover:bg-blue-100 transition-colors">
                           <Edit3 size={14} /> Reconfigure Link
                        </button>
                     </div>
                   )}

                   <button 
                      onClick={() => {
                        if(selectedNode) {
                          setNodes(nds => {
                            const filtered = nds.filter(n => n.id !== selectedId);
                            return validateNodes(filtered);
                          });
                          setEdges(eds => eds.filter(e => e.source !== selectedId && e.target !== selectedId));
                        } else {
                          setEdges(eds => eds.filter(e => e.id !== selectedId));
                        }
                        setSelectedId(null);
                      }}
                      className="w-full py-4 bg-rose-50 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
                   >
                     <Trash2 size={14} /> Delete Selected
                   </button>
                </div>
              </section>
            ) : (
              <>
                <section>
                  <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-6 px-1">Infrastructure Components</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <SidebarTool icon={<Monitor />} label="Windows" onClick={() => addNode('user', { subType: 'Windows' })} />
                    <SidebarTool icon={<SmartphoneNfc />} label="Android" onClick={() => addNode('user', { subType: 'Android' })} />
                    <SidebarTool icon={<ShieldCheck className="text-indigo-500" />} label="Gateway" onClick={() => addNode('gateway')} />
                    <SidebarTool icon={<Cpu className="text-blue-500" />} label="Broker" onClick={() => addNode('broker')} />
                    <SidebarTool icon={<HardDrive />} label="Server" onClick={() => addNode('resource', { subType: 'SERVER' })} />
                    <SidebarTool icon={<Box />} label="VDI Cluster" onClick={() => addNode('resource', { subType: 'VDI CLUSTER' })} />
                  </div>
                </section>
                <section>
                  <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-6 px-1 flex items-center gap-2 text-blue-600">
                    <Waypoints size={14}/> Logic & Routing
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    <SidebarTool icon={<GitBranch className="text-blue-500 rotate-90" />} label="Virtual Connector" onClick={() => addNode('hub')} fullWidth />
                  </div>
                </section>
                <section>
                  <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-6 px-1">Zone Boundaries</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <button onClick={() => addNode('group', { label: 'Oracle Cloud DC', type: ComponentType.DATACENTER })} className="flex items-center gap-4 p-4 rounded-2xl border-2 border-[#9b1c1c] bg-rose-50/50 hover:bg-rose-50 transition-all group w-full text-left">
                       <Cloud className="text-[#9b1c1c]" />
                       <span className="text-[10px] font-black text-[#9b1c1c] uppercase tracking-widest">Enterprise DC</span>
                    </button>
                  </div>
                </section>
              </>
            )}
          </div>
        </aside>

        <main className="flex-1 relative bg-white">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onSelectionChange={(p) => setSelectedId(p.nodes[0]?.id || p.edges[0]?.id || null)}
            fitView
            minZoom={0.05}
            snapToGrid
          >
            <Background color="#cbd5e1" gap={40} size={1} />
            <Controls />
            <Panel position="bottom-center" className="w-full max-w-4xl px-8 pb-12">
              <form onSubmit={handleAI} className="relative group">
                <div className="absolute -inset-3 bg-blue-600 rounded-[3rem] blur-2xl opacity-5 group-hover:opacity-15 transition duration-1000"></div>
                <div className="relative flex items-center bg-white rounded-[2.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 p-3 pl-10">
                  <Terminal size={24} className="text-slate-400 mr-5" />
                  <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe your architecture to Gemini..." className="flex-1 py-5 text-sm font-bold text-slate-700 focus:outline-none bg-transparent placeholder:text-slate-300" disabled={isLoading} />
                  <button type="submit" disabled={isLoading} className="px-12 py-5 bg-slate-900 hover:bg-blue-600 text-white rounded-[1.8rem] flex items-center gap-4 transition-all font-black text-xs uppercase tracking-[0.2em] shadow-xl">
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    {isLoading ? 'Thinking' : 'Architect'}
                  </button>
                </div>
              </form>
            </Panel>
          </ReactFlow>

          {isConnModalOpen && (
            <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
               <div className="bg-white rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] w-full max-w-lg overflow-hidden border border-white">
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-10 py-10 text-white relative">
                     <div className="flex items-center gap-4 mb-2">
                        <Link2 size={28} />
                        <h2 className="text-2xl font-black tracking-tight">{pendingConn ? 'Define Connection' : 'Edit Link'}</h2>
                     </div>
                     <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Configuring protocol and flow</p>
                     <button onClick={() => { setPendingConn(null); setEditingEdgeId(null); }} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"><X size={24} /></button>
                  </div>
                  <div className="p-10 space-y-8 max-h-[80vh] overflow-y-auto">
                     <div className="grid grid-cols-2 gap-4 items-center p-6 bg-slate-50 rounded-3xl border border-slate-100 relative">
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Source Component</label>
                           <div className={`w-full px-4 py-5 rounded-2xl text-[10px] font-black transition-all border-2 flex items-center justify-center text-center ${connModalConfig.logicalSourceId === connectionNodes[0]?.id ? 'bg-white text-blue-600 border-blue-500 shadow-md' : 'bg-transparent text-slate-400 border-transparent cursor-default'}`}>
                              {connectionNodes[0]?.data?.label || 'Unknown'}
                           </div>
                        </div>
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                           <button onClick={() => setConnModalConfig(prev => { const otherNode = connectionNodes.find(n => n.id !== prev.logicalSourceId); return { ...prev, logicalSourceId: otherNode?.id || prev.logicalSourceId }; })} className="p-3 bg-white border border-slate-200 rounded-full text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-lg active:scale-95"><ArrowLeftRight size={18} /></button>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 text-right">Target Component</label>
                           <div className={`w-full px-4 py-5 rounded-2xl text-[10px] font-black transition-all border-2 flex items-center justify-center text-center ${connModalConfig.logicalSourceId === connectionNodes[1]?.id ? 'bg-white text-blue-600 border-blue-500 shadow-md' : 'bg-transparent text-slate-400 border-transparent cursor-default'}`}>
                              {connectionNodes[1]?.data?.label || 'Unknown'}
                           </div>
                        </div>
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Select Protocol</label>
                        <div className="grid grid-cols-2 gap-3">
                           {PROTOCOLS.map(p => (<button key={p} onClick={() => setConnModalConfig(prev => ({ ...prev, protocol: p }))} className={`px-4 py-4 rounded-2xl text-xs font-black transition-all border-2 ${connModalConfig.protocol === p ? 'bg-blue-600 text-white border-blue-600 shadow-xl' : 'bg-white text-slate-500 border-slate-100 hover:border-blue-200'}`}>{p}</button>))}
                        </div>
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Flow Direction</label>
                        <div className="grid grid-cols-1 gap-3">
                           {DIRECTIONS.map(d => (<button key={d.id} onClick={() => setConnModalConfig(prev => ({ ...prev, direction: d.id }))} className={`flex items-center justify-between px-6 py-5 rounded-2xl text-xs font-black transition-all border-2 ${connModalConfig.direction === d.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl' : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-100'}`}><span className="flex items-center gap-3"><div className={`p-2 rounded-lg ${connModalConfig.direction === d.id ? 'bg-white/20' : 'bg-slate-50 text-slate-400'}`}>{d.icon}</div>{d.label}</span></button>))}
                        </div>
                     </div>
                     <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex-1">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Display Metadata Tag</label>
                           <p className="text-[9px] text-slate-400 font-bold">Toggle visibility of protocol/direction labels on the connection.</p>
                        </div>
                        <button 
                          onClick={() => setConnModalConfig(prev => ({ ...prev, showLabel: !prev.showLabel }))}
                          className={`p-4 rounded-xl transition-all border-2 flex items-center gap-3 ${connModalConfig.showLabel ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400'}`}
                        >
                           {connModalConfig.showLabel ? <Eye size={18} /> : <EyeOff size={18} />}
                           <span className="text-[10px] font-black uppercase tracking-widest">{connModalConfig.showLabel ? 'Visible' : 'Hidden'}</span>
                        </button>
                     </div>
                     <div className="flex gap-4 pt-6"><button onClick={finalizeConnection} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3"><Activity size={18} /> {pendingConn ? 'Establish Link' : 'Update Link'}</button></div>
                  </div>
               </div>
            </div>
          )}

          {isComponentModalOpen && (
            <div className="absolute inset-0 z-[110] flex items-center justify-center bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
               <div className="bg-white rounded-[2.5rem] shadow-[0_60px_120px_-20px_rgba(0,0,0,0.4)] w-full max-w-4xl overflow-hidden border border-white">
                  <div className="bg-gradient-to-br from-slate-800 to-slate-950 px-12 py-10 text-white relative">
                     <div className="flex items-center gap-5 mb-3"><SquareDashedBottomCode size={32} className="text-blue-400" /><h2 className="text-3xl font-black tracking-tighter leading-none">{pendingComponent ? 'Deploy Infrastructure' : 'Edit Configuration'}</h2></div>
                     <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Enterprise Management Console</p>
                     <button onClick={() => { setPendingComponent(null); setEditingComponentId(null); }} className="absolute top-10 right-10 text-slate-500 hover:text-white transition-colors"><X size={28} /></button>
                  </div>
                  <div className="p-12 space-y-10 max-h-[75vh] overflow-y-auto custom-scrollbar">
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-10">
                           <section>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Identity & Environment</label>
                              <div className="space-y-4">
                                 <div className="relative">
                                    <input type="text" placeholder="Component Friendly Name" className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" value={componentForm.label} onChange={(e) => setComponentForm(prev => ({ ...prev, label: e.target.value }))} />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-200 text-[9px] font-black text-slate-500 rounded-full uppercase tracking-widest">{getActiveComponentTypeDisplay()}</span>
                                 </div>
                                 {showResourceFields && (
                                    <div className="space-y-2">
                                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Resource Type</label>
                                       <div className="flex flex-col gap-2">
                                          {RESOURCE_TYPES.map(type => (<button key={type} onClick={() => setComponentForm(prev => ({ ...prev, resourceType: type }))} className={`w-full text-left px-5 py-4 rounded-xl text-[10px] font-black transition-all border-2 ${componentForm.resourceType === type ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-slate-500 border-slate-100 hover:border-blue-100'}`}>{type}</button>))}
                                       </div>
                                    </div>
                                 )}
                              </div>
                           </section>
                           <section>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Platform Specifications</label>
                              <div className="space-y-4">
                                 <div className="grid grid-cols-2 gap-2">
                                    {OS_TYPES.map(os => (<button key={os} onClick={() => setComponentForm(prev => ({ ...prev, osType: os }))} className={`px-4 py-3 rounded-xl text-[10px] font-black transition-all border-2 ${componentForm.osType === os ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-900'}`}>{os}</button>))}
                                 </div>
                                 <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                                    {EXECUTION_TYPES.map(type => (<button key={type} onClick={() => setComponentForm(prev => ({ ...prev, executionType: type }))} className={`px-5 py-4 rounded-xl text-[10px] font-black transition-all ${componentForm.executionType === type ? 'bg-white text-indigo-600 shadow-md border border-indigo-100' : 'bg-transparent text-slate-400'}`}>{type}</button>))}
                                 </div>
                              </div>
                           </section>
                        </div>
                        <div className="space-y-10">
                           <section>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Hardware Allocation</label>
                              <div className="grid grid-cols-2 gap-4">
                                 <SpecInput icon={<Microchip size={14}/>} label="vCPU" value={componentForm.specs.cpu} onChange={(v: string) => updateSpec('cpu', v)} unit="Cores" />
                                 <SpecInput icon={<MemoryStick size={14}/>} label="RAM" value={componentForm.specs.ram} onChange={(v: string) => updateSpec('ram', v)} unit="GB" />
                                 <SpecInput icon={<Disc size={14}/>} label="Disk C" value={componentForm.specs.diskC} onChange={(v: string) => updateSpec('diskC', v)} unit="GB" />
                                 <SpecInput icon={<Disc size={14}/>} label="Disk D" value={componentForm.specs.diskD} onChange={(v: string) => updateSpec('diskD', v)} unit="GB" />
                              </div>
                           </section>
                           <section className="p-8 bg-blue-50/50 rounded-[2rem] border border-blue-100">
                              <div className="flex items-center gap-3 mb-6"><Info size={20} className="text-blue-600" /><h4 className="text-[11px] font-black uppercase tracking-widest text-blue-900">Summary</h4></div>
                              <div className="space-y-3"><BlueprintRow label="Mode" value={componentForm.executionType} /><BlueprintRow label="OS" value={componentForm.osType} /><BlueprintRow label="Storage" value={`${componentForm.specs.diskC + componentForm.specs.diskD} GB`} /></div>
                           </section>
                        </div>
                     </div>
                     <div className="flex gap-4 pt-10 border-t border-slate-100"><button onClick={() => { setPendingComponent(null); setEditingComponentId(null); }} className="flex-1 py-6 bg-slate-50 text-slate-500 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-colors">Discard</button><button onClick={finalizeComponent} disabled={!componentForm.label.trim()} className="flex-[2] py-6 bg-slate-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50">{pendingComponent ? 'Commit Changes' : 'Update Component'}</button></div>
                  </div>
               </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const BlueprintRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between items-center text-[10px] border-b border-blue-100/50 pb-2">
     <span className="font-bold text-slate-500">{label}:</span>
     <span className="font-black text-blue-800 uppercase tracking-tighter">{value}</span>
  </div>
);

const SpecInput = ({ icon, label, value, onChange, unit }: any) => (
  <div className="space-y-2">
     <div className="flex items-center gap-2 px-1"><span className="text-slate-400">{icon}</span><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</label></div>
     <div className="relative"><input type="number" min="0" className="w-full pl-6 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" value={value} onChange={(e) => onChange(e.target.value)} /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">{unit}</span></div>
  </div>
);

const SidebarTool = ({ icon, label, onClick, fullWidth }: any) => (
  <button onClick={onClick} className={`flex ${fullWidth ? 'flex-row items-center px-6 gap-6 py-5' : 'flex-col items-center justify-center p-5 gap-3'} rounded-2xl border border-slate-100 bg-white shadow-sm hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 transition-all group text-center`}>
    <div className="text-slate-300 group-hover:text-blue-500 transition-colors transform group-hover:scale-110 duration-200">{icon}</div>
    <span className="text-[9px] font-black text-slate-400 group-hover:text-slate-900 uppercase tracking-widest leading-none">{label}</span>
  </button>
);

const AppWithProvider = () => (
  <ReactFlowProvider>
    <App />
  </ReactFlowProvider>
);

export default AppWithProvider;
