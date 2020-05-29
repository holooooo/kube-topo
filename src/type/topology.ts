import { NodeConfig, EdgeConfig } from "@antv/g6/lib/types";
import { v4 as uuidv4 } from "uuid";
import { fittingString } from "../utils";
import { getFromCache } from "../core";
import { Schedule } from ".";

export interface TopologyNodeType {
  name: string;
  icon: string;
  degree: number;
}
export const TopologyNodeTypes: { [key: string]: TopologyNodeType } = {
  ConfigMap: { name: "ConfigMap", icon: "img/kubernetes/cm.svg", degree: 25 },
  CronJob: { name: "CronJob", icon: "img/kubernetes/cronjob.svg", degree: 30 },
  DaemonSet: { name: "DaemonSet", icon: "img/kubernetes/ds.svg", degree: 30 },
  Deployment: {
    name: "Deployment",
    icon: "img/kubernetes/deploy.svg",
    degree: 30,
  },
  Endpoints: { name: "Endpoints", icon: "img/kubernetes/ep.svg", degree: 5 },
  HorizontalPodAutoscaling: {
    name: "HorizontalPodAutoscaling",
    icon: "img/kubernetes/hpa.svg",
    degree: 30,
  },
  Ingress: { name: "Ingress", icon: "img/kubernetes/ing.svg", degree: 0 },
  Job: { name: "Job", icon: "img/kubernetes/job.svg", degree: 30 },
  Namespace: { name: "Namespace", icon: "img/kubernetes/ns.svg", degree: 50 },
  Node: { name: "Node", icon: "img/kubernetes/Node.svg", degree: 0 },
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
  Pod: { name: "Pod", icon: "img/kubernetes/pod.svg", degree: 20 },
  ReplicaSet: { name: "ReplicaSet", icon: "img/kubernetes/rs.svg", degree: 30 },
  ReplicationController: {
    name: "ReplicationController",
    icon: "img/kubernetes/rs.svg",
    degree: 30,
  },
  Secret: { name: "Secret", icon: "img/kubernetes/secret.svg", degree: 25 },
  Service: { name: "Service", icon: "img/kubernetes/svc.svg", degree: 10 },
  StatefulSet: {
    name: "StatefulSet",
    icon: "img/kubernetes/sts.svg",
    degree: 30,
  },
  StorageClass: {
    name: "StorageClass",
    icon: "img/kubernetes/sc.svg",
    degree: 45,
  },
  Volume: { name: "Volume", icon: "img/kubernetes/vol.svg", degree: 25 },
};

export const workloadTypes: Set<TopologyNodeType> = new Set([
  TopologyNodeTypes.CronJob,
  TopologyNodeTypes.DaemonSet,
  TopologyNodeTypes.Deployment,
  TopologyNodeTypes.Job,
  TopologyNodeTypes.ReplicaSet,
  TopologyNodeTypes.ReplicationController,
  TopologyNodeTypes.StatefulSet,
]);

export class TopologyNode implements NodeConfig {
  id: string;
  annotations?: { [keys: string]: string };
  degree: number;
  detail?: { [key: string]: any };
  images?: string[];
  labels?: { [keys: string]: string };
  name: string;
  namespace?: TopologyNode;
  nodeType: TopologyNodeType;
  resources?: Resources;
  schedule?: Schedule;
  selectors?: { [keys: string]: string };
  [key: string]: any;

  public constructor(
    obj?: any,
    name?: string,
    namespace?: string,
    nodeType?: TopologyNodeType
  ) {
    this.id = uuidv4();
    this.name = name || obj.metadata.name;
    this.label = fittingString(this.name, 15);
    this.type = "image";

    const namespaceTemp =
      namespace || (obj && obj.metadata.namespace) || undefined;
    this.namespace = getFromCache(
      namespaceTemp,
      TopologyNodeTypes.Namespace
    )[0];

    this.nodeType = nodeType || TopologyNodeTypes[obj.kind];
    this.labels =
      (obj && (obj.metadata.labels as { [keys: string]: string })) || [];
    this.img = this.nodeType.icon;
    this.detail = obj;

    this.groupId = (this.namespace && this.namespace.id) || "cluster";
    this.degree = this.nodeType.degree;
    this.annotations =
      (obj && (obj.metadata.annotations as { [keys: string]: string })) || [];

    if (!obj) {
      return;
    }

    //TODO ugly
    // Special resource handling
    if (workloadTypes.has(this.nodeType)) {
      this.selectors = obj.spec.selector.matchLabels as {
        [keys: string]: string;
      };
      this.images = [];
      (obj.spec.template.spec.containers as any[]).forEach((container) =>
        this.images?.push(container.image)
      );
    } else if (this.nodeType === TopologyNodeTypes.Service) {
      this.selectors = obj.spec.selector;
    } else if (
      this.nodeType === TopologyNodeTypes.PersistentVolume ||
      this.nodeType === TopologyNodeTypes.PersistentVolumeClaim
    ) {
      if (obj.status && obj.status.phase) {
        this.status = obj.status.phase;
      }
    }
    if (obj.status && obj.status.conditions) {
      this.status =
        obj.status.conditions[obj.status.conditions.length - 1].type;
    }
  }
}

export const TopologyLinkType: { [key: string]: string } = {
  Reference: "#3498db",
  Expose: "#2ecc71",
  Belong: "#000",
};

export interface TopologyLink extends EdgeConfig {
  source: string;
  target: string;
  color: string;
}
export interface Resources {
  limit: { cpu: string; memory: string };
  request: { cpu: string; memory: string };
}
