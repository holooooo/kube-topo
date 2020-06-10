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
  cache,
  links,
  groups,
  getFromCache,
  matchLabel,
  resetLinks,
} from "./cache";
import { nodeSelect } from ".";

export const parse = (
  yamlFile: string,
  save: (
    nodes: TopologyNode[],
    links: TopologyLink[],
    groups: GroupConfig[]
  ) => void
) => {
  const yamlList = YAML.parseAllDocuments(yamlFile);
  handleRawData([...yamlList.map((yaml) => yaml.toJSON())]);
  findRelation();
  nodeSelect();
  saveToState(save);
};

const handleRawData = (yamls: { [key: string]: any }[]) => {
  yamls.forEach((yaml) => {
    if (!yaml) return;
    if (yaml.kind === "List") {
      return handleRawData(yaml.items);
    }
    parseTopologyNode(yaml);
  });
};

const saveToState = (
  save: (
    nodes: TopologyNode[],
    links: TopologyLink[],
    groups: GroupConfig[]
  ) => void
) => {
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

  save(nodesResult, linksResult, groups);
};

/**
 *turn json obj to toponode obj
 *
 * @param {{ [key: string]: any }} obj
 */
const parseTopologyNode = (obj: { [key: string]: any }) => {
  // init node, if node has been create by cache(some globe obj such as ns, sc) then assign it with real node
  let node = getFromCache(
    obj.metadata.name,
    TopologyNodeTypes[obj.kind],
    obj.metadata.namespace || undefined
  )[0];
  const temp = new TopologyNode(obj);
  node = node ? Object.assign(node, temp) : temp;

  // save to cache
  const labels = node.labels;
  if (labels) {
    for (let key of Object.keys(labels)) {
      cache[key] = cache[key] || [];
      cache[key][labels[key]] = (cache[key][labels[key]] || new Set()).add(
        node
      );
    }
  }
  cache.ObjType[node.nodeType.name].add(node);
};

/**
 *find the realtion inside nodes, rule come from ./rule.yaml file
 *
 */
const findRelation = () => {
  resetLinks();
  let topoNodeList: TopologyNode[] = [];
  Object.values(cache.ObjType).forEach(
    (v) => (topoNodeList = topoNodeList.concat([...v]))
  );
  topoNodeList.forEach((node) => {
    // push namespace to g6 groups
    if (
      node.nodeType === TopologyNodeTypes.Namespace &&
      groups.filter((g) => g.id === node.id).length === 0
    ) {
      groups.push({ id: node.id, title: node.name });
    }

    const parsers = parseMap[node.nodeType.name];
    // skip fake or useless node
    if (!node.detail || !node.namespace || !parsers) return;

    for (const parser of parsers) {
      const result = parser(node);
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

// TODO add more information in edges
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
      let parser;
      if ("exist" in filter) {
        parser = existParser(rule.type, filter);
      } else {
        parser = matchParser(rule.type, filter);
      }
      parseMap[nodeType] = (parseMap[nodeType] || []).concat([parser]);
    }
};

const existParser = (type: string, filter: ExistFilter) => {
  const isExist = (obj: any, exist: string): boolean => {
    if (exist) {
      const existSlice = exist.split(".");
      const rest = existSlice.slice(1).join(".");
      obj = obj[existSlice[0]];
      return (obj && isExist(obj, rest)) || false;
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
      const rest = targetSlice.slice(1).join(".");
      if (targetSlice[0] === "$") {
        let result: TopologyNode[] = [];
        for (const o of obj) {
          result = result.concat(getTargets(o, rest, type, namespace) || []);
        }
        return result;
      }

      obj = obj[targetSlice[0]];
      return (obj && getTargets(obj, rest, type, namespace)) || [];
    }
    return getFromCache(obj as string, TopologyNodeTypes[type], namespace);
  };

  return (obj: TopologyNode): Result => {
    if (!isExist(obj.detail!, filter.exist)) return { type: type, nodes: [] };
    return {
      type: type,
      nodes: getTargets(
        obj.detail,
        filter.target,
        filter.nodeType,
        obj.namespace!.name
      ),
    };
  };
};

const matchParser = (type: string, filter: MatchFilter) => {
  const getLabel = (obj: any, match: string): { [keys: string]: string } => {
    if (match) {
      const matchSlice = match.split(".");
      const rest = matchSlice.slice(1).join(".");
      obj = obj[matchSlice[0]];
      return (obj && getLabel(obj, rest)) || false;
    }
    return obj;
  };

  return (obj: TopologyNode): Result => {
    const label = getLabel(obj.detail, filter.match);
    const targets = matchLabel(
      label,
      new Set([obj.namespace!.name])
    ).filter((t) => workloadTypes.has(t.nodeType));
    return { type: type, nodes: targets };
  };
};
