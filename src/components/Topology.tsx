import React from "react";
import {
  TopologyNode,
  TopologyLink,
  StateStore,
  TopologyNodeTypes,
} from "../type";
import { connect } from "react-redux";
import G6 from "@antv/g6";
import { GraphData } from "../../node_modules/@antv/g6/lib/types";
import { Graph } from "../../node_modules/@antv/g6/lib";

// tslint:disable-next-line:no-empty-interface
export interface Props {
  nodes: TopologyNode[];
  links: TopologyLink[];
}

//TODO move this to util
const fittingString = (str: string, maxWidth: number) => {
  const width = str.length;
  const ellipsis = "\n";
  if (width > maxWidth) {
    const result =
      str.substring(0, maxWidth) + ellipsis + str.substring(maxWidth, width);
    return result;
  }
  return str;
};

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

  //TODO move this to parse.ts
  get data(): GraphData {
    let data: GraphData = {
      nodes: [],
      edges: [],
      groups: [{ id: "cluster", title: "Cluster" }],
    };
    for (let node of this.props.nodes) {
      if (node.type !== TopologyNodeTypes.Namespace) {
        data.nodes?.push({
          id: node.id,
          label: fittingString(node.name, 15),
          type: "image",
          img: node.type.icon,
          groupId: node.namespace?.id || "cluster",
          degree: node.type.degree,
          name: node.name,
          nodeType: node.type.name,
          node,
        });
      } else {
        data.groups?.push({
          id: node.id,
          title: node.name,
        });
      }
    }
    for (let link of this.props.links) {
      data.edges?.push({
        target: link.target,
        source: link.source,
        color: link.type,
      });
    }
    return data;
  }

  renderGraph = () => {
    if (!this.graphRef.current) {
      return;
    }
    const config = {
      animate: true,
      container: this.graphRef.current,
      width: 1000,
      height: 600,
      fitView: true,
      layout: {
        type: "force",
        linkDistance: 150,
        nodeStrength: 1.5,
        preventOverlap: true,
        sortBy: "degree",
        nodeSize: 32,
        maxLevelDiff: 5,
      },
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
            fontSize: 14,
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
                model.nodeType;
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
    this.graph.read(this.data);
    this.graph.render();
  };

  render() {
    const { nodes, links } = this.props;
    const style = {
      width: "100%",
      height: "100%",
    };
    this.renderGraph();
    return (
      <div style={style}>
        {!(nodes.length > 0 || links.length > 0) && (
          <p>Drag Some Yaml to Here</p>
        )}
        {(nodes.length > 0 || links.length > 0) && (
          <div ref={this.graphRef}></div>
        )}
      </div>
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
