import React from "react";
import { TopologyNode, TopologyLink, StateStore } from "../type";
import { connect } from "react-redux";
import G6 from "@antv/g6";
import { Graph } from "@antv/g6/lib";
import FloatBar from "./FloatBar";
import { ComboConfig, LayoutConfig, GraphData } from "@antv/g6/lib/types";
import { setLayout, setTopoDatas, setCanvas } from "../reducers";
import { cleanCache } from "../core";

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
  ComboForce: {
    type: "comboForce",
  },
};

export interface Props {
  nodes: TopologyNode[];
  edges: TopologyLink[];
  combos: ComboConfig[];
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
      groupByTypes: false,
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
        style: {
          lineWidth: 2,
        },
        labelCfg: {
          position: "end",
          refY: -10,
        },
      },
      defaultCombo: {
        type: "circle",
      },
      modes: {
        default: [
          "drag-canvas",
          "zoom-canvas",
          "drag-node",
          "drag-combo",
          "collapse-expand-combo",
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

    console.log(this.graph && this.graph.getCombos());
    console.log(this.graph && JSON.parse(JSON.stringify({ ...this.props })));
    if (this.graph) {
      this.graph
        .changeData({ ...this.props } as GraphData)
        .changeSize(width, height)
        .updateLayout(config);
    } else {
      this.graph = new G6.Graph(config);
      this.graph.data({ ...this.props } as GraphData);
    }

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
    cleanCache();
    this.props.setTopoDatas({ nodes: [], links: [], combos: [] });

    // clead graph view
    this.graph.destroy();
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
    combos: state.topology.combos,
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
