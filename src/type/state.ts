import { TopologyNode } from ".";
import { TopologyLink } from "./topology";

export interface StatusState {
  isInited: boolean;
  isUploaded: boolean;
}

export interface TopologyState {
  links: TopologyLink[];
  nodes: TopologyNode[];
}

export interface DraggerState {
  isDragging: boolean;
}

export interface StateStore {
  status: StatusState;
  topology: TopologyState;
  dragger: DraggerState;
}
