import React from "react";
import { TopologyNode, TopologyLink, StateStore } from "../type";
import { connect } from "react-redux";

// tslint:disable-next-line:no-empty-interface
export interface Props {
  height: number;
  width: number;
  nodes: TopologyNode[];
  links: TopologyLink[];
}
export class Topology extends React.Component<Props> {
  render() {
    const { nodes, links } = this.props;
    return (
      <>
        {!(nodes.length > 0 || links.length > 0) && (
          <p>Drag Some Yaml to Here</p>
        )}
        {(nodes.length > 0 || links.length > 0) && (
          <div>
            <p>{nodes.toString()}</p>
            <p>{links.toString()}</p>
          </div>
        )}
      </>
    );
  }
}

const mapStateToProps = (state: StateStore) => {
  return {
    nodes: state.topology.nodes,
    links: state.topology.links,
  };
};

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(Topology);
