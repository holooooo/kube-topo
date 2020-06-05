import { unionSet } from "./../utils/parse";
import { cache, matchLabel } from "./cache";
import {
  TopologyNode,
  workloadTypes,
  TopologyNodeTypes,
  Schedule,
  Taint,
  Toleration,
  Affinity,
  SelectorRequirement,
  TopologyNodeType,
  PreferredSchedulingTerm,
  PodAffinityTerm,
  WeightedPodAffinityTerm,
  isSelectorRequirement,
  isPreferredSchedulingTerm,
  isPodAffinityTerm,
  isWeightedPodAffinityTerm,
  ScheduleType,
} from "../type";
import { getFromCache } from ".";
import { differenceSet } from "../utils";

/**
 *if there has k8s node obj,parse workload nodeselector, namespace nodeselector annotation,
  nodeName, nodeAffinity, podAffinity and taint rules
 *
 */
export const nodeSelect = () => {
  const nodes = cache.ObjType["Node"];
  if (!nodes.size) return;
  // find all taint node
  let taintNodes: Set<TopologyNode> = new Set();
  nodes.forEach((node) => node.detail!.spec.taints && taintNodes.add(node));

  let workloads: Set<TopologyNode> = new Set();
  Object.keys(cache.ObjType).forEach((type) => {
    if (workloadTypes.has(TopologyNodeTypes[type]))
      workloads = new Set([...workloads, ...cache.ObjType[type]]);
  });

  workloads.forEach((workload) => {
    let schedule: Schedule = new Schedule();
    const detail = workload.detail!.spec.template || workload.detail!;
    console.log(detail);
    if (detail.spec.nodeName) {
      // TODO alert target node has taint scene
      // nodename ignore taint, but cant real run in taint node.
      schedule.target = new Set([
        getFromCache(detail.spec.nodeName, TopologyNodeTypes.Node)[0],
      ]);
      workload.schedule = schedule;
      console.log(workload.schedule);
      return;
    }

    // check taint
    const tolerations = detail.spec.tolerations;
    if (taintNodes && !tolerations) {
      schedule.never = taintNodes;
    }
    if (taintNodes && tolerations) {
      taintNodes.forEach((taintNode) => {
        const taints = taintNode.detail!.spec.taints;
        const taint = checkTolerations(taints, tolerations);
        if (taint && taint.effect === "PreferNoSchedule") {
          schedule.hate = schedule.hate.add(taintNode);
        } else if (taint) {
          schedule.never = schedule.never.add(taintNode);
        }
      });
    }

    // node selector, check node which select by nodeSelector is not in taint nodes
    const nodeSelector = detail.spec.nodeselector;
    if (nodeSelector) {
      schedule.target = differenceSet([
        new Set(matchLabel(nodeSelector, undefined, TopologyNodeTypes.Node)),
        schedule.never,
      ]);
    }

    // FIXME this is shit
    // nodeAffinity , podAffinity
    const aft: Affinity = detail.spec.affinity;

    if (aft && aft.nodeAffinity) {
      const hit =
        aft.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution
          ?.nodeSelectorTerms || [];
      const hrt =
        aft.nodeAffinity.requiredDuringSchedulingRequiredDuringExecution
          ?.nodeSelectorTerms || [];
      const hardTerms = [...hit, ...hrt];
      let srs: SelectorRequirement[] = [];
      hardTerms.forEach((terms) => {
        srs = srs.concat(terms.matchExpressions || terms.matchFields || []);
      });

      const sit =
        aft.nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution || [];
      schedule = Object.assign(
        schedule,
        selectByTerm(sit, TopologyNodeTypes.Node, true),
        selectByTerm(srs, TopologyNodeTypes.Node, false)
      );
    }
    if (aft && aft.podAffinity) {
      const hit =
        aft.podAffinity.requiredDuringSchedulingIgnoredDuringExecution || [];
      const hrt =
        aft.podAffinity.requiredDuringSchedulingRequiredDuringExecution || [];
      const hardTerms = [...hit, ...hrt];

      const sit =
        aft.podAffinity.preferredDuringSchedulingIgnoredDuringExecution || [];
      schedule = Object.assign(
        schedule,
        selectByTerm(sit, TopologyNodeTypes.Node, true),
        selectByTerm(hardTerms, TopologyNodeTypes.Node, false)
      );
    }
    if (aft && aft.podAntiAffinity) {
      const hit =
        aft.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution ||
        [];
      const hrt =
        aft.podAntiAffinity.requiredDuringSchedulingRequiredDuringExecution ||
        [];
      const hardTerms = [...hit, ...hrt];

      const sit =
        aft.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution ||
        [];
      schedule = Object.assign(
        schedule,
        selectByTerm(sit, TopologyNodeTypes.Node, true, true),
        selectByTerm(hardTerms, TopologyNodeTypes.Node, false, true)
      );
    }

    // TODO cpu and memory filter
    // TODO podNodeSelectorPluginConfig NodeRestriction plugin
    // merge result to instance
    workload.schedule = schedule;
    console.log(workload.schedule);
  });
};

/**
 *check is this workload's tolerations can tolerate this node's taints.
 *and return the worst taint
 *
 * @param {Taint[]} taints
 * @param {Toleration[]} tolerations
 * @returns {(Taint | undefined)}
 */
const checkTolerations = (
  taints: Taint[],
  tolerations: Toleration[]
): Taint | undefined => {
  let worst: Taint | undefined = taints[0];
  for (const taint of taints) {
    for (const toleration of tolerations) {
      if (
        toleration.key === taint.key &&
        (toleration.operator === "exist" || toleration.value! === taint.value)
      ) {
        worst = worst || taint;
        if (worst.effect !== "PreferNoSchedule") {
          return taint;
        }
        break;
      }
    }
  }
  return worst;
};

/**
 * select node or pod by term
 *
 * @param {(SelectorRequirement[]
 *     | PreferredSchedulingTerm[]
 *     | PodAffinityTerm[]
 *     | WeightedPodAffinityTerm[])} selectors
 * @param {TopologyNodeType} type
 * @param {boolean} isHard
 * @param {boolean} [isAnti=false]
 * @returns {Schedule}
 */
const selectByTerm = (
  selectors:
    | SelectorRequirement[]
    | PreferredSchedulingTerm[]
    | PodAffinityTerm[]
    | WeightedPodAffinityTerm[],
  type: TopologyNodeType,
  isHard: boolean,
  isAnti: boolean = false
): Schedule => {
  let result: Schedule = new Schedule();
  if (!selectors.length) return result;

  if (isSelectorRequirement(selectors)) {
    selectBySelector(selectors, type, result, isHard);
    return result;
  }
  if (isPreferredSchedulingTerm(selectors)) {
    selectors.forEach((selector) => {
      selectBySelector(selector.matchExpressions, type, result, isHard);
    });

    return result;
  }
  if (isPodAffinityTerm(selectors)) {
    selectors.forEach((s) => selectByPodTerm(s, type, result, isHard, isAnti));
    return result;
  }
  if (isWeightedPodAffinityTerm(selectors)) {
    selectors.forEach((s) =>
      selectByPodTerm(s.podAffinityTerm, type, result, isHard, isAnti)
    );
    return result;
  }
  return result;
};

const selectBySelector = (
  selectors: SelectorRequirement[],
  type: TopologyNodeType,
  result: Schedule,
  isHard: boolean,
  isAnti?: boolean,
  namespace?: Set<string>
) => {
  selectors.forEach((s) => {
    const nodes = cache[s.key],
      value = s.values;
    if (!nodes) {
      const target: ScheduleType = isHard
        ? isAnti
          ? "target"
          : "never"
        : isAnti
        ? "prefer"
        : "hate";
      result[target] = cache.ObjType[type.name];
      return result;
    }

    let resultTarget: ScheduleType = isHard ? "target" : "prefer",
      resultNever: ScheduleType = isHard ? "never" : "hate";
    if (isAnti) {
      const temp = resultTarget;
      resultTarget = resultNever;
      resultNever = temp;
    }

    console.log(nodes);

    Object.keys(nodes).forEach((key) => {
      const rightTypeNodes = new Set(
        Array.from(nodes[key]).filter(
          (node) =>
            node.nodeType === type &&
            (namespace ? namespace.has(node.namespace!.name) : true)
        )
      );

      switch (s.operator) {
        case "Exists":
          if (key === value) {
            result[resultTarget] = unionSet([
              result[resultTarget],
              rightTypeNodes,
            ]);
          }
          break;
        case "DoesNotExist":
          if (key === value) {
            result[resultNever] = unionSet([
              result[resultNever],
              rightTypeNodes,
            ]);
          }
          break;
        case "In":
          if (new Set(value).has(key)) {
            result[resultTarget] = unionSet([
              result[resultTarget],
              rightTypeNodes,
            ]);
          }
          break;
        case "NotIn":
          if (new Set(value).has(key)) {
            result[resultNever] = unionSet([
              result[resultNever],
              rightTypeNodes,
            ]);
          }
          break;
        case "Gt":
          if (Number(value) > Number(key)) {
            result[resultTarget] = unionSet([
              result[resultTarget]!,
              rightTypeNodes,
            ]);
          } else {
            result[resultNever] = unionSet([
              result[resultNever],
              rightTypeNodes,
            ]);
          }
          break;
        case "Lt":
          if (Number(value) < Number(key)) {
            result[resultTarget] = unionSet([
              result[resultTarget],
              rightTypeNodes,
            ]);
          } else {
            result[resultNever] = unionSet([
              result[resultNever],
              rightTypeNodes,
            ]);
          }
          break;
      }
    });
  });
};

const selectByPodTerm = (
  selector: PodAffinityTerm,
  type: TopologyNodeType,
  result: Schedule,
  isHard: boolean,
  isAnti?: boolean
) => {
  if (selector.labelSelector.matchExpressions) {
    const srs = selector.labelSelector.matchExpressions;
    const namespace = new Set(selector.namespaces);
    selectBySelector(srs, type, result, isHard, isAnti, namespace);
  } else if (selector.labelSelector.matchLabels) {
    const labels = selector.labelSelector.matchLabels;
    const target: ScheduleType = isAnti ? "hate" : "prefer";
    result[target] = unionSet([
      result[target],
      new Set(matchLabel(labels, new Set(selector.namespaces), type)),
    ]);
  }
};
