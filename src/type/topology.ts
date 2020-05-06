export interface TopologyNodeType {
  name: string;
  icon: string;
}
export const TopologyNodeTypes: { [key: string]: TopologyNodeType } = {
  Pod: { name: "Pod", icon: "" },
  Namespace: { name: "Namespace", icon: "" },
  Service: { name: "Service", icon: "" },
  Ingress: { name: "Ingress", icon: "" },
  PersistentVolume: { name: "PersistentVolume", icon: "" },
  PersistentVolumeClaim: { name: "PersistentVolumeClaim", icon: "" },
  Volume: { name: "Volume", icon: "" },
  StorageClass: { name: "StorageClass", icon: "" },
  Secret: { name: "Secret", icon: "" },
  Endpoints: { name: "Endpoints", icon: "" },
  ConfigMap: { name: "ConfigMap", icon: "" },
  ReplicaSet: { name: "ReplicaSet", icon: "" },
  ReplicationController: { name: "ReplicationController", icon: "" },
  Deployment: { name: "Deployment", icon: "" },
  StatefulSet: { name: "StatefulSet", icon: "" },
  DaemonSet: { name: "DaemonSet", icon: "" },
  Job: { name: "Job", icon: "" },
  CronJob: { name: "CronJob", icon: "" },
  HorizontalPodAutoscaling: { name: "HorizontalPodAutoscaling", icon: "" },
};

export const workloadTypes: Set<TopologyNodeType> = new Set([
  TopologyNodeTypes.ReplicaSet,
  TopologyNodeTypes.ReplicationController,
  TopologyNodeTypes.Deployment,
  TopologyNodeTypes.StatefulSet,
  TopologyNodeTypes.DaemonSet,
  TopologyNodeTypes.Job,
  TopologyNodeTypes.CronJob,
]);

export interface TopologyNode {
  [key: string]: any;
  id: string;
  name: string;
  type: TopologyNodeType;
  namespace?: TopologyNode;
  labels?: { [keys: string]: string };
  annotations?: { [keys: string]: string };
  resources?: Resources;
  selectors?: { [keys: string]: string };
  detail?: { [key: string]: any };
}

export enum TopologyLinkType {
  Reference = "Reference",
  Belong = "Belong",
}

export interface TopologyLink {
  source: string;
  target: string;
  type: TopologyLinkType;
}
export interface Resources {
  limit: { cpu: string; memory: string };
  request: { cpu: string; memory: string };
}
