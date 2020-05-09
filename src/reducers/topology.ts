import { TopologyState, TopologyLink, TopologyNode } from "../type";
import { AnyAction } from "redux";
import { GroupConfig } from "@antv/g6/lib/types";

const initTopologyNodesState = {
  links: [],
  nodes: [],
  groups: [],
  layout: "Concentric",
} as TopologyState;

const path = "topolopy/";
const SET_LINKS = path + "setLinks";
const SET_NODES = path + "setNodes";
const SET_GROUPS = path + "setGroups";
const SET_TOPODATAS = path + "setTopoDatas";
const SET_LAYOUT = path + "setLayout";

export const setLinks = (links: TopologyLink[]) => {
  return { type: SET_LINKS, links };
};

export const setNodes = (nodes: TopologyNode[]) => {
  return { type: SET_NODES, nodes };
};
export const setGroups = (groups: GroupConfig[]) => {
  return { type: SET_GROUPS, groups };
};
export const setTopoDatas = (data: {
  nodes: TopologyNode[];
  links: TopologyLink[];
  groups: GroupConfig[];
}) => {
  return { type: SET_TOPODATAS, ...data };
};
export const setLayout = (layout: string) => {
  return { type: SET_LAYOUT, layout };
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
    default:
      return state;
  }
};

export default topology;
