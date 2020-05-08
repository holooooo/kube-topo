import { NodeConfig, EdgeConfig } from "../../node_modules/@antv/g6/lib/types";

export interface TopologyNodeType {
  name: string;
  icon: string;
  degree: number;
}
export const TopologyNodeTypes: { [key: string]: TopologyNodeType } = {
  Pod: { name: "Pod", icon: "img/kubernetes/pod.svg", degree: 20 },
  Namespace: { name: "Namespace", icon: "img/kubernetes/ns.svg", degree: 50 },
  Service: { name: "Service", icon: "img/kubernetes/svc.svg", degree: 10 },
  Ingress: { name: "Ingress", icon: "img/kubernetes/ing.svg", degree: 0 },
  PersistentVolume: {
    name: "PersistentVolume",
    icon: "img/kubernetes/pv.svg",
    degree: 45,
  },
  PersistentVolumeClaim: {
    name: "PersistentVolumeClaim",
    icon: "img/kubernetes/pvc.svg",
    degree: 40,
  },
  Volume: { name: "Volume", icon: "img/kubernetes/vol.svg", degree: 25 },
  StorageClass: {
    name: "StorageClass",
    icon: "img/kubernetes/sc.svg",
    degree: 45,
  },
  Secret: { name: "Secret", icon: "img/kubernetes/secret.svg", degree: 25 },
  Endpoints: { name: "Endpoints", icon: "img/kubernetes/ep.svg", degree: 5 },
  ConfigMap: { name: "ConfigMap", icon: "img/kubernetes/cm.svg", degree: 25 },
  ReplicaSet: { name: "ReplicaSet", icon: "img/kubernetes/rs.svg", degree: 30 },
  ReplicationController: {
    name: "ReplicationController",
    icon: "img/kubernetes/rs.svg",
    degree: 30,
  },
  Deployment: {
    name: "Deployment",
    icon: "img/kubernetes/deploy.svg",
    degree: 30,
  },
  StatefulSet: {
    name: "StatefulSet",
    icon: "img/kubernetes/sts.svg",
    degree: 30,
  },
  DaemonSet: { name: "DaemonSet", icon: "img/kubernetes/ds.svg", degree: 30 },
  Job: { name: "Job", icon: "img/kubernetes/job.svg", degree: 30 },
  CronJob: { name: "CronJob", icon: "img/kubernetes/cronjob.svg", degree: 30 },
  HorizontalPodAutoscaling: {
    name: "HorizontalPodAutoscaling",
    icon: "img/kubernetes/hpa.svg",
    degree: 30,
  },
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

export interface TopologyNode extends NodeConfig {
  id: string;
  name: string;
  namespace?: TopologyNode;
  labels?: { [keys: string]: string };
  annotations?: { [keys: string]: string };
  resources?: Resources;
  selectors?: { [keys: string]: string };
  nodeType: TopologyNodeType;
  degree: number;
  detail?: { [key: string]: any };
  [key: string]: any;
}

export enum TopologyLinkType {
  Reference = "#3498db",
  Belong = "#000",
}

export interface TopologyLink extends EdgeConfig {
  source: string;
  target: string;
  color: TopologyLinkType;
}
export interface Resources {
  limit: { cpu: string; memory: string };
  request: { cpu: string; memory: string };
}
