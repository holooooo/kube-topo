import React from "react";
import { TopologyNode, TopologyNodeTypes } from "../../../type";
import { List, Collapse } from "antd";

const { Panel } = Collapse;
// tslint:disable-next-line:no-empty-interface
export interface Props {
  node: TopologyNode;
}
export default class Workload extends React.Component<Props> {
  renderImages = () => {
    const images = this.props.node.images!;
    return (
      <span>
        <strong>Images: </strong>
        {images.length === 1 && <span>{images[0]}</span>}
        {images.length > 1 && (
          <List
            itemLayout="horizontal"
            dataSource={images}
            renderItem={(item) => <List.Item>{item}</List.Item>}
          />
        )}
      </span>
    );
  };

  // TODO
  renderResources = () => {
    return <div></div>;
  };

  renderSchedule = () => {
    const schedule = this.props.node.schedule!;
    const isHomeless: boolean =
      schedule.hasHardRule && schedule.target.size === 0;
    const hasContent: boolean =
      !isHomeless &&
      (schedule.target.size !== 0 ||
        schedule.never.size !== 0 ||
        schedule.prefer.size !== 0 ||
        schedule.hate.size !== 0);
    const panelCount = { count: 1 };
    return (
      <div>
        {isHomeless && <p>This Workload cannot be schedule to any node</p>}
        {hasContent && (
          <>
            <strong>Schedule: </strong>
            {this.renderScheduleContent("only", schedule.target, panelCount)}
            {this.renderScheduleContent("never", schedule.never, panelCount)}
            {this.renderScheduleContent("prefer", schedule.prefer, panelCount)}
            {this.renderScheduleContent("hate", schedule.hate, panelCount)}
          </>
        )}
      </div>
    );
  };

  renderScheduleContent = (
    status: string,
    content: Set<TopologyNode>,
    panelCount: { count: number }
  ) => {
    const nodeTips: string = `It will ${status} be scheduled to the following nodes.`;
    const podTips: string = `It will ${status} be scheduled to the nodes which has following pods.`;

    const nodes: TopologyNode[] = Array.from(content).filter(
      (node) => node.nodeType === TopologyNodeTypes.Node
    );
    const pods: TopologyNode[] = Array.from(content).filter(
      (node) => node.nodeType === TopologyNodeTypes.Pod
    );

    return (
      <Collapse defaultActiveKey={["1"]}>
        {nodes.length && (
          <Panel header={nodeTips} key={panelCount.count++}>
            <List
              itemLayout="horizontal"
              dataSource={nodes}
              renderItem={(item) => <List.Item>{item.name}</List.Item>}
            />
          </Panel>
        )}
        {pods.length && (
          <Panel header={podTips} key={panelCount.count++}>
            <List
              itemLayout="horizontal"
              dataSource={pods}
              renderItem={(item) => <List.Item>{item.name}</List.Item>}
            />{" "}
          </Panel>
        )}
      </Collapse>
    );
  };

  render = () => {
    const { node } = this.props;
    return (
      <div>
        {node.images && this.renderImages()}
        {node.resources && this.renderResources()}
        {node.schedule && this.renderSchedule()}
      </div>
    );
  };
}
