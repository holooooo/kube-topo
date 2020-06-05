import { intersectionSet } from "../utils";
import { TopologyNode, TopologyNodeTypes, TopologyNodeType } from "../type";
import { GroupConfig } from "@antv/g6/lib/types";

export let cache: { [key: string]: { [value: string]: Set<TopologyNode> } },
  links: { [source: string]: { [target: string]: string } },
  groups: GroupConfig[];

/**
 *clean all data in cache and init cache
 *
 */
export const initCache = () => {
  cache = { ObjType: {} };
  Object.keys(TopologyNodeTypes).forEach((key) => {
    if (!cache.ObjType[key]) {
      cache.ObjType[key] = new Set();
    }
  });
  links = {};
  groups = [{ id: "cluster", title: "Cluster" }];
};

export const resetLinks = () => {
  links = {};
};

/**
 *get toponodes from cache
 *
 * @param {string} name
 * @param {TopologyNodeType} type
 * @param {string} [namespace]
 * @returns {TopologyNode[]}
 */
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

/**
 *search all node by labels
 *
 * @param {{ [keys: string]: string }} labels
 * @param {string} namespace
 * @returns {TopologyNode[]}
 */
export const matchLabel = (
  labels: { [keys: string]: string },
  namespace?: Set<string>,
  type?: TopologyNodeType
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

  return Array.from(intersectionSet(setList))
    .filter((n) => !namespace || namespace.has(n.namespace!.name))
    .filter((n) => !type || n.nodeType === type);
};
