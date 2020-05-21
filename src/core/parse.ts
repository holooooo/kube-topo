import YAML from "yaml";
import {
  TopologyNode,
  TopologyNodeTypes,
  TopologyLinkType,
  workloadTypes,
  TopologyNodeType,
  TopologyLink,
} from "../type";
import { GroupConfig } from "@antv/g6/lib/types";
import { intersection } from "../utils";

let cache: {
    [key: string]: { [value: string]: Set<TopologyNode> };
  } = {},
  links: { [source: string]: { [target: string]: string } },
  groups: GroupConfig[] = [{ id: "cluster", title: "Cluster" }];

export const parse = (
  yamlFile: string,
  saveToState: (
    nodes: TopologyNode[],
    links: TopologyLink[],
    groups: GroupConfig[]
  ) => void
) => {
  const yamlList = YAML.parseAllDocuments(yamlFile);
  initCache();
  handle([...yamlList.map((yaml) => yaml.toJSON())]);

  let nodesResult: TopologyNode[] = [] as TopologyNode[];
  Object.values(cache["ObjType"]).forEach(
    (list) => (nodesResult = nodesResult.concat(...list))
  );
  let linksResult: TopologyLink[] = [] as TopologyLink[];
  Object.keys(links).forEach((key) =>
    Object.keys(links[key]).forEach((k) =>
      linksResult.push({
        source: key,
        target: k,
        color: links[key][k],
      })
    )
  );

  saveToState(nodesResult, linksResult, groups);
};

const handle = (yamls: { [key: string]: any }[]) => {
  yamls.forEach((yaml) => {
    if (yaml.kind === "List") {
      return handle(yaml.items);
    }
    parseTopologyNode(yaml);
  });
  findRelation();
};

const initCache = () => {
  if (!cache.ObjType) {
    cache.ObjType = {};
  }
  Object.keys(TopologyNodeTypes).forEach((key) => {
    if (!cache.ObjType[key]) {
      cache.ObjType[key] = new Set();
    }
  });
};

export const cleanCache = () => {
  cache = {};
  links = {};
  groups = [];
};

const parseTopologyNode = (obj: { [key: string]: any }) => {
  // init obj
  let node = getFromCache(
    obj.metadata.name,
    TopologyNodeTypes[obj.kind],
    obj.metadata.namespace || undefined
  )[0];
  const temp = new TopologyNode(obj);
  node = node ? Object.assign(node, temp) : temp;

  // save to cache
  if (node.labels) {
    for (let key of Object.keys(node.labels)) {
      cache[key] = cache[key] || [];
      cache[key][node.labels[key]] = (
        cache[key][node.labels[key]] || new Set()
      ).add(node);
    }
  }
  cache.ObjType[node.nodeType.name].add(node);
};

const findRelation = () => {
  links = {};
  let topoNodeList: TopologyNode[] = [];
  Object.values(cache.ObjType).forEach(
    (v) => (topoNodeList = topoNodeList.concat([...v]))
  );
  topoNodeList.forEach((node) => {
    if (
      node.nodeType === TopologyNodeTypes.Namespace &&
      groups.filter((g) => g.id === node.id).length === 0
    ) {
      groups.push({ id: node.id, title: node.name });
    }

    let linksSet: {
      [key: string]: TopologyNode[];
    } = {
      Reference: [],
      Belong: [],
      Expose: [],
    };
    if (!node.detail || !node.namespace) {
      return;
    }

    // belongList.push(node.namespace);

    if (workloadTypes.has(node.nodeType)) {
      // find cm ,secret and pvc volume
      if (node.detail.spec.template.spec.volumes) {
        const volumes = node.detail.spec.template.spec.volumes;
        for (let volume of volumes) {
          let volumeType = "";
          let volumeName = "";
          if (volume.secret) {
            volumeType = "Secret";
            volumeName = "secretName";
          } else if (volume.configMap) {
            volumeType = "ConfigMap";
            volumeName = "name";
          } else if (volume.persistentVolumeClaim) {
            volumeType = "PersistentVolumeClaim";
            volumeName = "claimName";
          } else {
            continue;
          }
          linksSet.Reference.push(
            ...getFromCache(
              volume[
                volumeType.replace(volumeType[0], volumeType[0].toLowerCase())
              ][volumeName],
              TopologyNodeTypes[volumeType],
              node.namespace?.name
            )
          );
        }

        // ergodic container, find envRef
        const containers = node.detail.spec.template.spec.containers;
        let envFroms: { [key: string]: { [key: string]: string } }[] = [];
        for (let contain of containers) {
          if (contain.envFrom) {
            envFroms.push(...contain.envFrom);
          }
        }
        envFroms.forEach((envFrom) => {
          let envFromType = "";
          if (envFrom.configMapRef) {
            envFromType = "ConfigMap";
          } else if (envFrom.secretRef) {
            envFromType = "Secret";
          }
          linksSet.Reference.push(
            ...getFromCache(
              envFrom[
                envFromType.replace(
                  envFromType[0],
                  envFromType[0].toLowerCase()
                ) + "Ref"
              ].name,
              TopologyNodeTypes[envFromType],
              node.namespace?.name
            )
          );
        });
      }
    } else if (node.nodeType === TopologyNodeTypes.Service) {
      if (node.detail.spec.selector && node.namespace) {
        const label = node.detail.spec.selector;
        const targets = matchLabel(label, node.namespace.name).filter((t) =>
          workloadTypes.has(t.nodeType)
        );
        linksSet.Expose.push(...targets);
      }
    } else if (node.nodeType === TopologyNodeTypes.Ingress) {
      const paths = node.detail.spec.paths;
      for (let path of paths) {
        linksSet.Expose.push(
          getFromCache(
            path.backend.serviceName,
            TopologyNodeTypes.Service,
            node.namespace.name
          )[0]
        );
      }
      // TODO go on
    } else if (node.nodeType === TopologyNodeTypes.PersistentVolume) {
    } else if (node.nodeType === TopologyNodeTypes.PersistentVolumeClaim) {
    } else if (node.nodeType === TopologyNodeTypes.Pod) {
    }

    // find volume template
    if (node.nodeType === TopologyNodeTypes.StatefulSet) {
      if (node.detail && node.detail.spec.volumeClaimTemplates) {
        const vcts = node.detail.spec.volumeClaimTemplates;
        let scSet: Set<TopologyNode> = new Set();
        for (let vct of vcts) {
          if (vct.spec.storageClassName) {
            scSet.add(
              getFromCache(
                vct.spec.storageClassName,
                TopologyNodeTypes.StorageClass
              )[0]
            );
          }
        }
        linksSet.Reference.push(...scSet);
      }
    }

    Object.keys(linksSet).forEach((key) => {
      linksSet[key].forEach((r) => {
        links[node.id] = links[node.id] || {};
        links[node.id][r.id] = TopologyLinkType[key];
      });
    });
  });
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

const matchLabel = (
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
