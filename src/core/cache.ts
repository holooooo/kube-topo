import { intersection } from "../utils";
import { TopologyNode, TopologyNodeTypes, TopologyNodeType } from "../type";
import { GroupConfig } from "@antv/g6/lib/types";

export let cache: {
    [key: string]: { [value: string]: Set<TopologyNode> };
  } = {},
  links: { [source: string]: { [target: string]: string } },
  groups: GroupConfig[] = [{ id: "cluster", title: "Cluster" }];
export const initCache = () => {
  if (!cache.ObjType) {
    cache.ObjType = {};
  }
  Object.keys(TopologyNodeTypes).forEach((key) => {
    if (!cache.ObjType[key]) {
      cache.ObjType[key] = new Set();
    }
  });
};

export const resetLinks = () => {
  links = {};
};

export const cleanCache = () => {
  cache = {};
  links = {};
  groups = [];
};

export const getFromCache = (
  name: string,
  type: TopologyNodeType,
  namespace?: string
): TopologyNode[] => {
  let result: TopologyNode[] = [];
  if (!name) {
    return result;
  }
  cache.ObjType[type.name].forEach((node) => {
    if (node.name === name) {
      if (namespace && node.namespace?.name !== namespace) {
        return;
      }
      result.push(node);
    }
  });
  if (
    result.length === 0 &&
    (type === TopologyNodeTypes.Namespace ||
      type === TopologyNodeTypes.PersistentVolumeClaim ||
      type === TopologyNodeTypes.StorageClass)
  ) {
    const node = new TopologyNode(undefined, name, namespace, type);
    cache.ObjType[type.name].add(node);
    result.push(node);
  }
  return result;
};

export const matchLabel = (
  labels: { [keys: string]: string },
  namespace: string
): TopologyNode[] => {
  let setList: Set<TopologyNode>[] = [];
  for (let key of Object.keys(labels)) {
    if (!cache[key]) {
      return [];
    }
    let tempSet: Set<TopologyNode> = cache[key][labels[key]];
    if (!tempSet) {
      return [];
    }
    setList.push(tempSet);
  }
  return Array.from(intersection(setList)).filter(
    (n) => n.namespace.name === namespace
  );
};
