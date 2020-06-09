import { TopologyNode } from ".";

export class Schedule {
  // all the nodes that pod can be schedule to
  target: Set<TopologyNode>;
  // all the nodes that pod never be schedule to
  never: Set<TopologyNode>;
  // all the nodes that pod prefer to be schedule
  prefer: Set<TopologyNode>;
  // all the nodes that pod dont want to be schedule
  hate: Set<TopologyNode>;
  hasHardRule: boolean;

  constructor() {
    this.hasHardRule = false;
    this.hate = new Set();
    this.never = new Set();
    this.target = new Set();
    this.prefer = new Set();
  }
}

export type ScheduleType = "target" | "never" | "prefer" | "hate";

export type TaintEffect = "PreferNoSchedule" | "NoExecute" | "NoSchedule";
export type TolerationOperator = "exist" | "equal";
export interface Taint {
  key: string;
  value: string;
  effect: TaintEffect;
}
export interface Toleration {
  key: string;
  operator: TolerationOperator;
  value?: string;
  effect: TaintEffect;
}

export interface Affinity {
  nodeAffinity?: NodeAffinity;
  podAffinity?: PodAffinity;
  podAntiAffinity?: PodAntiAffinity;
}

export interface NodeAffinity {
  requiredDuringSchedulingRequiredDuringExecution?: NodeSelector;
  requiredDuringSchedulingIgnoredDuringExecution?: NodeSelector;
  preferredDuringSchedulingIgnoredDuringExecution?: PreferredSchedulingTerm[];
}

export interface NodeSelector {
  nodeSelectorTerms: NodeSelectorTerms[];
}

export interface NodeSelectorTerms {
  matchExpressions?: SelectorRequirement[];
  matchFields?: SelectorRequirement[];
}

export interface PodAffinity {
  requiredDuringSchedulingRequiredDuringExecution?: PodAffinityTerm[];
  requiredDuringSchedulingIgnoredDuringExecution?: PodAffinityTerm[];
  preferredDuringSchedulingIgnoredDuringExecution?: WeightedPodAffinityTerm[];
}

export interface PodAntiAffinity {
  requiredDuringSchedulingRequiredDuringExecution?: PodAffinityTerm[];
  requiredDuringSchedulingIgnoredDuringExecution?: PodAffinityTerm[];
  preferredDuringSchedulingIgnoredDuringExecution?: WeightedPodAffinityTerm[];
}

export type SelectorOperator =
  | "In"
  | "NotIn"
  | "Exists"
  | "DoesNotExist"
  | "Gt"
  | "Lt";
export interface SelectorRequirement {
  key: string;
  operator: SelectorOperator;
  values: string[] | string;
}
export interface PreferredSchedulingTerm {
  weight: Number;
  matchExpressions: SelectorRequirement[];
}

export interface WeightedPodAffinityTerm {
  weight: Number;
  podAffinityTerm: PodAffinityTerm;
}

export interface PodAffinityTerm {
  labelSelector: LabelSelector;
  namespaces?: string[];
  topologyKey: string;
}

export interface LabelSelector {
  matchLabels?: { [key: string]: string };
  matchExpressions?: SelectorRequirement[];
}

export const isSelectorRequirement = (
  selector: any
): selector is SelectorRequirement[] => {
  return (selector[0] as SelectorRequirement).operator !== undefined;
};
export const isPreferredSchedulingTerm = (
  selector: any
): selector is PreferredSchedulingTerm[] => {
  return (
    (selector[0] as PreferredSchedulingTerm).matchExpressions !== undefined &&
    (selector[0] as PreferredSchedulingTerm).weight !== undefined
  );
};

export const isPodAffinityTerm = (
  selector: any
): selector is PodAffinityTerm[] => {
  return (selector[0] as PodAffinityTerm).labelSelector !== undefined;
};

export const isWeightedPodAffinityTerm = (
  selector: any
): selector is WeightedPodAffinityTerm[] => {
  return (selector[0] as WeightedPodAffinityTerm).podAffinityTerm !== undefined;
};
