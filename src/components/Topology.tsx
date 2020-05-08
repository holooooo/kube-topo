import React from "react";
import { TopologyNode, TopologyLink, StateStore } from "../type";
import { connect } from "react-redux";
import G6 from "@antv/g6";
import { Graph } from "../../node_modules/@antv/g6/lib";
import FloatBar from "./FloatBar";
import { GroupConfig } from "../../node_modules/@antv/g6/lib/types";
import { ILayoutOptions } from "@antv/g6/lib/interface/graph";
import { setLayout } from "../reducers/topology";

export const LAYOUTS: { [key: string]: ILayoutOptions } = {
  Force: {
    type: "force",
    linkDistance: 64,
    nodeStrength: -50,
    preventOverlap: true,
    sortBy: "degree",
    maxLevelDiff: 5,
  },
  Random: {
    type: "random",
    preventOverlap: true,
  },
  Fruchterman: {
    type: "fruchterman",
    preventOverlap: true,
    gravity: 10,
  },
  Circular: {
    type: "circular",
    preventOverlap: true,
    ordering: "degree",
  },
  Radial: {
    type: "radial",
    preventOverlap: true,
    sortBy: "degree",
  },
  Concentric: {
    type: "concentric",
    preventOverlap: true,
    maxLevelDiff: 5,
    sortBy: "degree",
    equidistant: true,
  },
  Grid: {
    type: "grid",
    preventOverlap: true,
    sortBy: "degree",
  },
};

export interface Props {
  nodes: TopologyNode[];
  edges: TopologyLink[];
  groups: GroupConfig[];
  layout: string;
  setLayout: typeof setLayout;
}
export class Topology extends React.Component<Props> {
  private graphRef: React.RefObject<HTMLDivElement>;
  private graph!: Graph;
  private minimap = new G6.Minimap({
    size: [100, 100],
    className: "minimap",
    type: "delegate",
  });
  private grid = new G6.Grid();

  constructor(props: Props) {
    super(props);
    this.graphRef = React.createRef();
  }

  renderGraph = () => {
    if (!this.graphRef.current) {
      return;
    }

    const config = {
      animate: true,
      container: this.graphRef.current,
      width: document.body.clientWidth - 25,
      height: document.body.clientHeight - 7,
      fitView: true,
      layout: LAYOUTS[this.props.layout],
      defaultNode: {
        size: 32,
        style: {
          fill: "#f0f5ff",
          stroke: "#adc6ff",
          lineWidth: 2,
        },
        labelCfg: {
          style: {
            fill: "#1890ff",
            fontSize: 12,
            background: {
              fill: "#ffffff",
              stroke: "#9EC9FF",
              padding: [2, 2, 2, 2],
              radius: 2,
            },
          },
        },
      },
      modes: {
        default: [
          "drag-canvas",
          "zoom-canvas",
          "drag-node",
          "drag-group",
          "collapse-expand-group",
          "activate-relations",
          {
            type: "tooltip",
            formatText(model: any) {
              const text =
                "<strong>Name</strong>: " +
                model.name +
                "<br/> <strong>Type</strong>: " +
                model.nodeType.name;
              return text;
            },
          },
        ],
      },
      plugins: [this.minimap, this.grid],
      nodeStateStyles: {
        active: {
          opacity: 1,
        },
        inactive: {
          opacity: 0.2,
        },
      },
      edgeStateStyles: {
        active: {
          stroke: "#999",
        },
      },
    };

    this.graph
      ? this.graph.updateLayout(config)
      : (this.graph = new G6.Graph(config));
    this.graph.read({ ...this.props });

    this.graph.render();
  };

  handleSwitchLayout = (layout: string) => {
    this.props.setLayout(layout);
    this.graph.updateLayout(LAYOUTS[layout]);
  };

  render() {
    this.renderGraph();
    return (
      <>
        <div className="topology" ref={this.graphRef}></div>
        {this.props.nodes.length > 0 && (
          <FloatBar handleSwichLayout={this.handleSwitchLayout} />
        )}
      </>
    );
  }
}

const mapStateToProps = (state: StateStore) => {
  return {
    nodes: state.topology.nodes,
    edges: state.topology.links,
    groups: state.topology.groups,
    layout: state.topology.layout,
  };
};

const mapDispatchToProps = {
  setLayout,
};

export default connect(mapStateToProps, mapDispatchToProps)(Topology);
