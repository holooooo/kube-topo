import React from "react";
import { TopologyNode, TopologyLink, StateStore } from "../type";
import { connect } from "react-redux";
import G6 from "@antv/g6";
import { Graph } from "@antv/g6/lib";
import FloatBar from "./FloatBar";
import { GroupConfig, LayoutConfig } from "@antv/g6/lib/types";
import { setLayout, setTopoData, setCanvas } from "../reducers/topology";
import { initCache } from "../core";
import MiniMap from "@antv/g6/lib/plugins/minimap";
import Grid from "@antv/g6/lib/plugins/grid";

export const LAYOUTS: { [key: string]: LayoutConfig } = {
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

const DEFAULT_CONFIG = {
  animate: true,
  fitView: true,
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
    ],
  },

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

export interface Props {
  nodes: TopologyNode[];
  edges: TopologyLink[];
  groups: GroupConfig[];
  height: number;
  width: number;
  layout: string;
  setLayout: typeof setLayout;
  setTopoData: typeof setTopoData;
  setCanvas: typeof setCanvas;
}
export class Topology extends React.Component<Props> {
  private graphRef: React.RefObject<HTMLDivElement>;
  private graph?: Graph;
  private minimap?: MiniMap;
  private grid?: Grid;

  constructor(props: Props) {
    super(props);
    this.graphRef = React.createRef();
    this.graphUpdate();
  }
  componentDidMount = () => {
    window.onresize = this.handleResize;
    this.handleResize();
  };

  graphUpdate = () => {
    if (!this.graphRef.current || !this.hasData) {
      return;
    }

    this.minimap =
      this.minimap ||
      new G6.Minimap({
        size: [100, 100],
        className: "minimap",
        type: "delegate",
      });
    this.grid = this.grid || new G6.Grid();

    const { width, height, layout } = this.props;
    const config = Object.assign({}, DEFAULT_CONFIG, {
      width,
      height,
      layout: LAYOUTS[layout],
      container: this.graphRef.current,
      plugins: [this.minimap, this.grid],
    });
    this.graph
      ? this.graph.changeSize(width, height).updateLayout(config)
      : (this.graph = new G6.Graph(config));
  };

  renderGraph = () => {
    this.graphUpdate();
    if (this.graph) {
      this.graph.read({ ...this.props });
      this.graph.render();
    }
  };

  handleResize = () => {
    this.props.setCanvas(
      document.body.clientWidth,
      document.body.clientHeight - 7
    );
  };

  handleSwitchLayout = (layout: string) => {
    if (!this.graph) return;

    this.props.setLayout(layout);
    this.graph.updateLayout(LAYOUTS[layout]);
  };

  handleClean = () => {
    // clean data
    initCache();
    this.props.setTopoData({ nodes: [], links: [], groups: [] });

    // clean graph view
    if (!this.graph) return;
    this.graph.clear();
    const plugs: any[] = this.graph.get("plugins");
    plugs.forEach((plug) => plug.destroy());

    this.graph.get("modeController").destroy();
    this.graph.get("customGroupControll").destroy();
    this.graph.get("canvas").destroy();
    this.minimap = null!;
    this.grid = null!;
    this.graph = null!;
  };

  get hasData() {
    if (this.props.nodes.length) return true;
    return false;
  }

  render() {
    this.renderGraph();
    return (
      <>
        <div className="topology" ref={this.graphRef}></div>
        {this.hasData && (
          <FloatBar
            handleSwitchLayout={this.handleSwitchLayout}
            handleClean={this.handleClean}
          />
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
  setTopoData,
  setCanvas,
};

export default connect(mapStateToProps, mapDispatchToProps)(Topology);
