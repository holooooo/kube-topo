import { TopologyNodesState } from "../type";
import { AnyAction } from "redux";

const initTopologyNodesState = {
  links: [],
  nodes: [],
} as TopologyNodesState;

const path = "topolopy/";
const SET_LINKS = path + "setLinks";
const SET_NODES = path + "setNodes";

export const setLinks = (links: boolean) => {
  return { type: SET_LINKS, links };
};

export const setNodes = (nodes: boolean) => {
  return { type: SET_NODES, nodes };
};

const topology = (
  state = initTopologyNodesState,
  action: AnyAction
): TopologyNodesState => {
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
