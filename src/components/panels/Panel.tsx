import React from "react";
import { TopologyNode, StateStore, workloadTypes } from "../../type";
import { Card } from "antd";
import { connect } from "react-redux";
import Workload from "./components/Workload";

export interface Props {
  node?: TopologyNode;
  nodeToolTipX: number;
  nodeToolTipY: number;
  height: number;
  width: number;
}
export class Panel extends React.Component<Props> {
  private cardRef: React.RefObject<HTMLDivElement>;

  constructor(props: Props) {
    super(props);
    this.cardRef = React.createRef();
  }

  get x(): number {
    const { nodeToolTipX, width } = this.props;
    if (nodeToolTipX === -1000) return this.props.nodeToolTipX;
    if (nodeToolTipX < 75) return 0;
    if (nodeToolTipX + 250 > width) return width - 250;
    return nodeToolTipX - 75;
  }

  get y(): number {
    const { nodeToolTipY, height } = this.props;
    if (nodeToolTipY === -1000) return this.props.nodeToolTipY;
    if (this.cardRef.current) {
      const cardHeight = this.cardRef.current.firstElementChild?.clientHeight!;
      const cardButton = nodeToolTipY + 15 + cardHeight;
      if (cardButton > height) return height - cardHeight - 64;
    }

    return nodeToolTipY + 15;
  }

  shouldComponentUpdate(nextProps: Props) {
    const differentHeight = this.props.nodeToolTipY !== nextProps.nodeToolTipY;
    const differentNode = this.props.node !== nextProps.node;
    return differentHeight || differentNode;
  }

  render = () => {
    const { node } = this.props;
    return (
      <div ref={this.cardRef}>
        {node && (
          <Card
            title={node.nodeType.name}
            className="panel"
            style={{ top: `${this.y}px`, left: `${this.x}px` }}
          >
            <p>
              <strong>Name: </strong>
              {node.name}
            </p>
            {node.status && (
              <p>
                <strong>Status: </strong> {node.status}
              </p>
            )}
            {node.namespace && (
              <p>
                <strong>Namespace: </strong> {node.namespace.name}
              </p>
            )}
            {workloadTypes.has(node.nodeType) && (
              <Workload node={node}></Workload>
            )}
          </Card>
        )}
      </div>
    );
  };
}
const mapStateToProps = (state: StateStore) => {
  return {
    node: state.topology.targetNode,
    nodeToolTipX: state.topology.nodeToolTipX,
    nodeToolTipY: state.topology.nodeToolTipY,
    height: state.topology.height,
    width: state.topology.width,
  };
};

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(Panel);
