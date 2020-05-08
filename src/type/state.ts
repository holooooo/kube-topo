import { TopologyNode } from ".";
import { TopologyLink } from "./topology";
import { GroupConfig } from "../../node_modules/@antv/g6/lib/types";

export interface StatusState {
  isInited: boolean;
  isUploaded: boolean;
}

export interface TopologyState {
  links: TopologyLink[];
  nodes: TopologyNode[];
  groups: GroupConfig[];
  layout: string;
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
