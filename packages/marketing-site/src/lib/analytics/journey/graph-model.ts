export interface JourneyNode {
  id: string;
  label: string;
  kind: "page" | "event" | "conversion";
}

export interface JourneyEdge {
  source: string;
  target: string;
  count: number;
}

export interface JourneyGraph {
  nodes: JourneyNode[];
  edges: JourneyEdge[];
}

