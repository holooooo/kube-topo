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
    return (
      <div>
        {isHomeless && <p>This Workload cannot be schedule to any node</p>}
        {hasContent && (
          <>
            <strong>Schedule: </strong>
            <Collapse>
              {hasContent &&
                schedule.target.size &&
                this.renderScheduleContent("only", schedule.target)}
              {hasContent &&
                schedule.never.size &&
                this.renderScheduleContent("never", schedule.never)}
              {hasContent &&
                schedule.prefer.size &&
                this.renderScheduleContent("prefer", schedule.prefer)}
              {hasContent &&
                schedule.hate.size &&
                this.renderScheduleContent("hate", schedule.hate)}
            </Collapse>
          </>
        )}
      </div>
    );
  };

  renderScheduleContent = (status: string, content: Set<TopologyNode>) => {
    const nodeTips: string = `It will ${status} be schedule to those nodes.`;
    const podTips: string = `It will ${status} be schedule to the nodes which has this pods.`;

    const nodes: TopologyNode[] = Array.from(content).filter(
      (node) => node.nodeType === TopologyNodeTypes.Node
    );
    const pods: TopologyNode[] = Array.from(content).filter(
      (node) => node.nodeType === TopologyNodeTypes.Pod
    );

    return (
      <>
        {nodes.length && (
          <Panel header={nodeTips} key="1">
            <List
              itemLayout="horizontal"
              dataSource={nodes}
              renderItem={(item) => <List.Item>{item.name}</List.Item>}
            />
          </Panel>
        )}
        {pods.length && (
          <Panel header={podTips} key="1">
            <List
              itemLayout="horizontal"
              dataSource={pods}
              renderItem={(item) => <List.Item>{item.name}</List.Item>}
            />
          </Panel>
        )}
      </>
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
