import YAML from "yaml";
import {
  TopologyNode,
  TopologyNodeTypes,
  TopologyLinkType,
  workloadTypes,
  TopologyLink,
  Rules,
  ExistFilter,
  MatchFilter,
  Rule,
  Result,
} from "../type";
import { GroupConfig } from "@antv/g6/lib/types";
import {
  initCache,
  cache,
  links,
  groups,
  getFromCache,
  matchLabel,
  resetLinks,
} from "./cache";

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
  resetLinks();
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

    let results: Result[] = [];
    if (!node.detail || !node.namespace) {
      return;
    }

    const parsers = parseMap[node.nodeType.name];
    if (!parsers) {
      return;
    }
    for (const parser of parsers) {
      results = results.concat(parser(node));
    }

    for (const result of results) {
      for (const r of result.nodes) {
        links[node.id] = links[node.id] || {};
        links[node.id][r.id] = TopologyLinkType[result.type];
      }
    }
  });
};

const parseMap: {
  [key: string]: ((obj: TopologyNode) => Result)[];
} = {};

// parse ./rule.yaml and generate the corresponding parser
export const initRelationParser = () => {
  const rules: Rules = (process.env.RULES as unknown) as Rules;
  for (const rule of rules.rules) {
    handleParser(rule);
  }
};

const handleParser = (rule: Rule) => {
  for (const nodeType of rule.nodeTypes)
    for (const filter of rule.filters) {
      if ("exist" in filter) {
        parseMap[nodeType] = (parseMap[nodeType] || []).concat([
          existParser(rule.type, filter),
        ]);
      } else {
        parseMap[nodeType] = (parseMap[nodeType] || []).concat([
          matchParser(rule.type, filter),
        ]);
      }
    }
};

const existParser = (type: string, filter: ExistFilter) => {
  const isExist = (obj: any, exist: string): boolean => {
    if (exist) {
      const existSlice = exist.split(".");
      obj = obj[existSlice[0]];
      const [, ...tail] = existSlice;
      return (obj && isExist(obj, tail.join("."))) || false;
    }
    return true;
  };

  const getTargets = (
    obj: any,
    target: string,
    type: string,
    namespace: string
  ): TopologyNode[] => {
    if (target) {
      const targetSlice = target.split(".");
      const [, ...tail] = targetSlice;
      if (targetSlice[0] === "$") {
        obj = [...obj];
        let result: TopologyNode[] = [];
        for (const o of obj) {
          result = result.concat(
            getTargets(o, tail.join("."), type, namespace) || []
          );
        }
        return result;
      }
      obj = obj[targetSlice[0]];
      return (obj && getTargets(obj, tail.join("."), type, namespace)) || [];
    }
    return getFromCache(obj as string, TopologyNodeTypes[type], namespace);
  };

  return (obj: TopologyNode): Result => {
    if (!isExist(obj.detail!, filter.exist)) return { type: type, nodes: [] };
    return {
      type: type,
      nodes: getTargets(obj, filter.target, filter.type, obj.namespace!.name),
    };
  };
};

const matchParser = (type: string, filter: MatchFilter) => {
  const getLabel = (obj: any, match: string): { [keys: string]: string } => {
    if (match) {
      const matchSlice = match.split(".");
      obj = obj[matchSlice[0]];
      const [, ...tail] = matchSlice;
      return (obj && getLabel(obj, tail.join("."))) || false;
    }
    return obj;
  };

  return (obj: TopologyNode): Result => {
    const label = getLabel(obj.detail, filter.match);
    const targets = matchLabel(label, obj.namespace!.name).filter((t) =>
      workloadTypes.has(t.nodeType)
    );
    return { type: type, nodes: targets };
  };
};
