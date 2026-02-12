
import { GoogleGenAI, Type } from "@google/genai";
import { DiagramState } from "../types";

const schema = {
  type: Type.OBJECT,
  properties: {
    nodes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: { type: Type.STRING, description: "Must be one of: userNode, gatewayNode, brokerNode, resourceNode, groupNode, hubNode" },
          position: {
            type: Type.OBJECT,
            properties: {
              x: { type: Type.NUMBER },
              y: { type: Type.NUMBER }
            },
            required: ["x", "y"]
          },
          data: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              type: { type: Type.STRING, description: "ComponentType string: userGroup, gateway, broker, server, workstation, cloudZone, vmware, datacenter" },
              subType: { type: Type.STRING, description: "Detailed subtype e.g. 'Windows', 'Android', 'PWA', 'DMZ'" },
              protocol: { type: Type.STRING, description: "Protocol for nodes that represent flows" }
            },
            required: ["label", "type"]
          },
          parentId: { type: Type.STRING, description: "ID of parent groupNode. If present, position MUST be relative to the parent's top-left corner." },
          style: {
            type: Type.OBJECT,
            properties: {
              width: { type: Type.NUMBER },
              height: { type: Type.NUMBER }
            }
          }
        },
        required: ["id", "type", "position", "data"]
      }
    },
    edges: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          source: { type: Type.STRING },
          target: { type: Type.STRING },
          sourceHandle: { type: Type.STRING },
          targetHandle: { type: Type.STRING },
          data: {
            type: Type.OBJECT,
            properties: {
              protocol: { type: Type.STRING },
              direction: { type: Type.STRING },
              showLabel: { type: Type.BOOLEAN, description: "True only for main segments" }
            }
          },
          animated: { type: Type.BOOLEAN }
        },
        required: ["id", "source", "target"]
      }
    }
  },
  required: ["nodes", "edges"]
};

export async function generateArchitecture(prompt: string, currentState?: DiagramState): Promise<DiagramState | null> {
  const isOptimization = !!currentState;
  
  const context = isOptimization 
    ? `REFACTOR this architecture into a clean BACKBONE/BUS layout using Virtual Connectors:
       1. MERGE: Multiple similar components connect to shared 'hubNode' (Virtual Connector).
       2. VIRTUAL CONNECTOR RULES: 
          - All INCOMING connections to a connector MUST use 'targetHandle: r-target' (Right side).
          - All OUTGOING connections from a connector MUST use 'sourceHandle: l-source' (Left side).
       3. CONSOLIDATE: Use horizontal backbone logic.
       4. REDUCE CLUTTER: Set 'data.showLabel: false' for branching lines. 
       5. PERSISTENCE: Include ALL input nodes. Do not drop parents.
       6. VISUAL CONTINUITY: NO ARROWHEADS at connector (hubNode) points.
       
       Current Diagram: ${JSON.stringify(currentState)}` 
    : `Generate a structured Thinfinity backbone architecture using Virtual Connectors: "${prompt}".`;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: context,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: `You are an expert IT Infrastructure Architect. 
        Your signature style is "Bus Architecture". 
        Use 'hubNode' (Visualized as a Virtual Connector) for all intermediate routing.
        CRITICAL VIRTUAL CONNECTOR ROUTING RULES:
        - All flows ENTERING a Virtual Connector must attach to the RIGHT side ('targetHandle': 'r-target').
        - All flows LEAVING a Virtual Connector must attach to the LEFT side ('sourceHandle': 'l-source').
        - The connector itself visually reads like a bus: Right=In, Left=Out.
        - NO ARROWHEADS appear at Virtual Connector connection points. 
        - Arrowheads ONLY appear on terminal target components (Gateway, Broker, Server, etc.).
        - Set 'data.showLabel: false' on branching segments.`
      },
    });

    let jsonStr = response.text.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonStr);
    
    if (parsed.nodes) {
      const parentNodes = parsed.nodes.filter((n: any) => n.type === 'groupNode');
      const otherNodes = parsed.nodes.filter((n: any) => n.type !== 'groupNode');
      parsed.nodes = [...parentNodes, ...otherNodes];
    }

    return parsed as DiagramState;
  } catch (error) {
    console.error("Gemini Optimization/Generation Failed:", error);
    return null;
  }
}

export async function optimizeArchitecture(currentState: DiagramState): Promise<DiagramState | null> {
  return generateArchitecture("Optimize layout for logical backbone readability with Virtual Connectors", currentState);
}
