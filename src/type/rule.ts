import { TopologyNode } from "./topology";

export interface ExistFilter {
  exist: string;
  // can use $ to loop through list
  target: string;
  type: string;
}

export interface MatchFilter {
  match: string;
  nodeTypes: string[];
}
export type Filter = ExistFilter[] | MatchFilter[];
export interface Rule {
  type: string;
  nodeTypes: string[];
  filters: Filter;
}

export interface Rules {
  rules: Rule[];
}

export interface Result {
  type: string;
  nodes: TopologyNode[];
}
