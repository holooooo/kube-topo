import { TopologyState, TopologyLink, TopologyNode } from "../type";
import { AnyAction } from "redux";
import { GroupConfig } from "@antv/g6/lib/types";

const initTopologyNodesState = {
  links: [],
  nodes: [],
  groups: [],
  layout: "Concentric",
  height: 0,
  width: 0,
} as TopologyState;

const path = "topolopy/";
const SET_LINKS = path + "setLinks";
const SET_NODES = path + "setNodes";
const SET_GROUPS = path + "setGroups";
const SET_TOPODATAS = path + "setTopoData";
const SET_LAYOUT = path + "setLayout";
const SET_CANVAS = path + "setCanvas";

export const setLinks = (links: TopologyLink[]) => {
  return { type: SET_LINKS, links };
};

export const setNodes = (nodes: TopologyNode[]) => {
  return { type: SET_NODES, nodes };
};
export const setGroups = (groups: GroupConfig[]) => {
  return { type: SET_GROUPS, groups };
};
export const setTopoData = (data: {
  nodes: TopologyNode[];
  links: TopologyLink[];
  groups: GroupConfig[];
}) => {
  return { type: SET_TOPODATAS, ...data };
};
export const setLayout = (layout: string) => {
  return { type: SET_LAYOUT, layout };
};
export const setCanvas = (width: number, height: number) => {
  return { type: SET_CANVAS, width, height };
};

const topology = (
  state = initTopologyNodesState,
  action: AnyAction
): TopologyState => {
  switch (action.type) {
    case SET_LINKS:
      return {
        ...state,
        links: action.links,
      };
    case SET_NODES:
      return {
        ...state,
        nodes: action.nodes,
      };
    case SET_GROUPS:
      return {
        ...state,
        groups: action.groups,
      };
    case SET_TOPODATAS:
      return {
        ...state,
        links: action.links,
        nodes: action.nodes,
        groups: action.groups,
      };
    case SET_LAYOUT:
      return {
        ...state,
        layout: action.layout,
      };
    case SET_CANVAS:
      return {
        ...state,
        width: action.width,
        height: action.height,
      };
    default:
      return state;
  }
};

export default topology;
