

export enum ComponentType {
  USER_GROUP = 'userGroup',
  GATEWAY = 'gateway',
  BROKER = 'broker',
  SERVER = 'server',
  WORKSTATION = 'workstation',
  CLOUD_ZONE = 'cloudZone',
  VMWARE = 'vmware',
  DATACENTER = 'datacenter',
  VDI_POOL = 'vdiPool'
}

export type ConnectionDirection = 'inbound' | 'outbound' | 'bidirectional' | 'sync';

export type ResourceType = 'VDI 1:1' | 'Session-Based VDI' | 'Virtual Application Server';
export type ExecutionType = 'VM' | 'Container';
export type OSType = 'Windows Server' | 'Windows 10' | 'Windows 11' | 'Linux';

export interface ResourceSpecs {
  cpu: number;
  ram: number;
  diskC: number;
  diskD: number;
}

export interface NodeData {
  label: string;
  type: ComponentType;
  description?: string;
  subType?: 'Windows' | 'Android' | 'PWA' | 'Browser' | 'Native' | 'Oracle' | 'AWS' | 'Azure' | string;
  metadata?: string;
  status?: string;
  iconType?: 'monitor' | 'laptop' | 'server' | 'shield' | 'cloud' | 'database';
  
  // Resource specific fields
  resourceType?: ResourceType;
  executionType?: ExecutionType;
  osType?: OSType;
  specs?: ResourceSpecs;
}

export interface DiagramNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: NodeData;
  style?: any;
  parentId?: string;
  extent?: 'parent';
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  // Added sourceHandle and targetHandle to support ReactFlow handle mapping and prevent TS errors in App.tsx
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  protocol?: string;
  direction?: ConnectionDirection;
  port?: string;
  animated?: boolean;
  style?: any;
  // Fix: Added the data property to store connection metadata as used in the UI and received from the Gemini API
  data?: {
    protocol?: string;
    direction?: ConnectionDirection;
    showLabel?: boolean;
  };
}

export interface DiagramState {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}