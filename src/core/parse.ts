import YAML from "yaml";
import {
  TopologyNode,
  TopologyNodeTypes,
  TopologyLinkType,
  workloadTypes,
  TopologyNodeType,
  TopologyLink,
} from "../type";
import { v4 as uuidv4 } from "uuid";

export let cache: {
    [key: string]: { [value: string]: Set<TopologyNode> };
  } = {},
  links: { [source: string]: { [target: string]: TopologyLinkType } };

export const parse = (
  yamlFile: string,
  saveToState: (nodes: TopologyNode[], links: TopologyLink[]) => void
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
        type: links[key][k],
      })
    )
  );

  saveToState(nodesResult, linksResult);
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

const parseTopologyNode = (obj: { [key: string]: any }) => {
  // init obj
  let node = getFromCache(
    obj.metadata.name,
    TopologyNodeTypes[obj.kind],
    obj.metadata.namespace || undefined
  )[0] || {
    id: uuidv4(),
  };
  const temp: TopologyNode = {
    name: obj.metadata.name,
    namespace: getFromCache(
      obj.metadata.namespace,
      TopologyNodeTypes.Namespace
    )[0],
    labels: (obj.metadata.labels as { [keys: string]: string }) || [],
    annotations: (obj.metadata.annotations as { [keys: string]: string }) || [],
    type: TopologyNodeTypes[obj.kind],
    detail: obj,
  } as TopologyNode;
  Object.keys(temp).forEach((k) => {
    if (temp[k]) {
      node[k] = temp[k];
    }
  });

  // Special resource handling
  if (workloadTypes.has(node.type)) {
    node.selectors = obj.spec.selector.matchLabels as {
      [keys: string]: string;
    };
  } else if (node.type.name === "service") {
    node.selectors = obj.spec.selector as {
      [keys: string]: string;
    };
  }

  // save to cache
  if (node.labels) {
    for (let key of Object.keys(node.labels)) {
      cache[key] = cache[key] || [];
      cache[key][node.labels[key]] = (
        cache[key][node.labels[key]] || new Set()
      ).add(node);
    }
  }
  cache.ObjType[node.type.name].add(node);
};

const findRelation = () => {
  links = {};
  let topoNodeList: TopologyNode[] = [];
  Object.values(cache.ObjType).forEach(
    (v) => (topoNodeList = topoNodeList.concat([...v]))
  );
  topoNodeList.forEach((node) => {
    let referenceList: TopologyNode[] = [];
    let belongList: TopologyNode[] = [];
    if (node.namespace) {
      belongList.push(node.namespace);
    }
    if (!node.detail || !node.namespace) {
      return;
    }

    if (workloadTypes.has(node.type)) {
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
          referenceList.push(
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
          referenceList.push(
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
    } else if (node.type === TopologyNodeTypes.Service) {
      if (node.detail.spec.selector && node.namespace) {
        const label = node.detail.spec.selector;
        const targets = matchLabel(label, node.namespace.name).filter((t) =>
          workloadTypes.has(t.type)
        );
        referenceList.push(...targets);
      }
    } else if (node.type === TopologyNodeTypes.Ingress) {
      const paths = node.detail.spec.paths;
      for (let path of paths) {
        referenceList.push(
          getFromCache(
            path.backend.serviceName,
            TopologyNodeTypes.Service,
            node.namespace.name
          )[0]
        );
      }
    } else if (node.type === TopologyNodeTypes.PersistentVolume) {
    } else if (node.type === TopologyNodeTypes.PersistentVolumeClaim) {
    } else if (node.type === TopologyNodeTypes.Pod) {
    }

    if (node.type === TopologyNodeTypes.StatefulSet) {
      // find volume template
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
        referenceList.push(...scSet);
      }
    }

    referenceList.forEach((r) => {
      links[node.id] = links[node.id] || {};
      links[node.id][r.id] = TopologyLinkType.Reference;
    });
    belongList.forEach((b) => {
      links[node.id] = links[node.id] || {};
      links[node.id][b.id] = TopologyLinkType.Belong;
    });
  });
};

const getFromCache = (
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
    const node = {
      id: uuidv4(),
      name: name,
      type: type,
      namespace: namespace
        ? getFromCache(namespace, TopologyNodeTypes.Namespace)[0]
        : undefined,
    } as TopologyNode;
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

const intersection = (sets: Set<any>[]): Set<any> => {
  if (sets.length === 2) {
    return new Set([...sets[0]].filter((s) => sets[1].has(s)));
  } else if (sets.length === 1) {
    return sets[0];
  }
  return intersection([intersection([sets[0], sets[1]]), ...sets.slice(2)]);
};
