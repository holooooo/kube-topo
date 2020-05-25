import { TopologyNode } from ".";
import { TopologyLink } from "./topology";
import { ComboConfig } from "@antv/g6/lib/types";

export interface StatusState {
  isInited: boolean;
  isUploaded: boolean;
}

export interface TopologyState {
  links: TopologyLink[];
  nodes: TopologyNode[];
  combos: ComboConfig[];
  layout: string;
  width: number;
  height: number;
}

export interface DraggerState {
  isDragging: boolean;
  isLoading: boolean;
}

export interface StateStore {
  status: StatusState;
  topology: TopologyState;
  dragger: DraggerState;
}
