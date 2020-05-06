import { TopologyState, TopologyLink, TopologyNode } from "../type";
import { AnyAction } from "redux";

const initTopologyNodesState = {
  links: [],
  nodes: [],
} as TopologyState;

const path = "topolopy/";
const SET_LINKS = path + "setLinks";
const SET_NODES = path + "setNodes";

export const setLinks = (links: TopologyLink[]) => {
  return { type: SET_LINKS, links };
};

export const setNodes = (nodes: TopologyNode[]) => {
  return { type: SET_NODES, nodes };
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
    default:
      return state;
  }
};

export default topology;
