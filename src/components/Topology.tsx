import React from "react";
import { TopologyNode, TopologyLink, StateStore } from "../type";
import { connect } from "react-redux";
import G6 from "@antv/g6";
import { Graph } from "@antv/g6/lib";
import FloatBar from "./FloatBar";
import { GroupConfig } from "@antv/g6/lib/types";
import { ILayoutOptions } from "@antv/g6/lib/interface/graph";
import { setLayout, setTopoDatas, setCanvas } from "../reducers/topology";
import { initCache } from "../core";

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
  height: number;
  width: number;
  layout: string;
  setLayout: typeof setLayout;
  setTopoDatas: typeof setTopoDatas;
  setCanvas: typeof setCanvas;
}
export class Topology extends React.Component<Props> {
  private graphRef: React.RefObject<HTMLDivElement>;
  private graph!: Graph;

  constructor(props: Props) {
    super(props);
    this.graphRef = React.createRef();
  }
  componentDidMount = () => {
    window.onresize = this.handleResize;
    this.handleResize();
  };

  renderGraph = () => {
    if (!this.graphRef.current || !this.props.nodes.length) {
      return;
    }

    const minimap = new G6.Minimap({
      size: [100, 100],
      className: "minimap",
      type: "delegate",
    });
    const grid = new G6.Grid();
    const { width, height } = this.props;

    const config = {
      animate: true,
      container: this.graphRef.current,
      width,
      height,
      fitView: true,
      layout: LAYOUTS[this.props.layout],
      defaultNode: {
        size: 64,
        style: {
          fill: "#f0f5ff",
          stroke: "#adc6ff",
          lineWidth: 2,
        },
        labelCfg: {
          style: {
            fill: "#1890ff",
            fontSize: 24,
            background: {
              fill: "#ffffff",
              stroke: "#9EC9FF",
              padding: [2, 2, 2, 2],
              radius: 2,
            },
          },
        },
      },
      defaultEdge: {
        // type: 'line',  // 在数据中已经指定 type，这里无需再次指定
        style: {
          lineWidth: 2,
        },
        labelCfg: {
          position: "end",
          refY: -10,
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
      plugins: [minimap, grid],
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
          lineWidth: 2,
        },
      },
    };

    this.graph
      ? this.graph.changeSize(width, height).updateLayout(config)
      : (this.graph = new G6.Graph(config));
    this.graph.read({ ...this.props });

    this.graph.render();
  };

  handleResize = () => {
    this.props.setCanvas(
      document.body.clientWidth,
      document.body.clientHeight - 7
    );
  };

  handleSwitchLayout = (layout: string) => {
    this.props.setLayout(layout);
    this.graph.updateLayout(LAYOUTS[layout]);
  };

  handleClean = () => {
    // clean data
    initCache();
    this.props.setTopoDatas({ nodes: [], links: [], groups: [] });

    // clead graph view
    this.graph.clear();
    const plugs: any[] = this.graph.get("plugins");
    plugs.forEach((plug) => plug.destroy());

    this.graph.get("modeController").destroy();
    this.graph.get("customGroupControll").destroy();
    this.graph.get("canvas").destroy();
    this.graph = null!;
  };

  get show() {
    if (this.props.nodes.length) return true;
    return false;
  }

  render() {
    this.renderGraph();
    return (
      <>
        <div className="topology" ref={this.graphRef}></div>
        {this.show && (
          <>
            <FloatBar
              handleSwichLayout={this.handleSwitchLayout}
              handleClean={this.handleClean}
            />
          </>
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
    height: state.topology.height,
    width: state.topology.width,
  };
};

const mapDispatchToProps = {
  setLayout,
  setTopoDatas,
  setCanvas,
};

export default connect(mapStateToProps, mapDispatchToProps)(Topology);
