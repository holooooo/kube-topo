import React from "react";
import Topology from "./Topology";
import { StateStore, TopologyNode, TopologyLink } from "../type";
import { connect } from "react-redux";
import { parse } from "../core/parse";
import { setDragging, setLoading } from "../reducers/dragger";
import { setTopoData } from "../reducers/topology";
import { Layout, Spin, Card, Row, Col, message } from "antd";
import { GroupConfig } from "@antv/g6/lib/types";

const { Content } = Layout;

// tslint:disable-next-line:no-empty-interface
interface Props {
  isDragging: boolean;
  nodes: TopologyNode[];
  isLoading: boolean;
  setDragging: typeof setDragging;
  setLoading: typeof setLoading;
  setTopoData: typeof setTopoData;
}
class Dragger extends React.Component<Props> {
  drop: React.RefObject<any>;
  drag: React.RefObject<any>;
  constructor(props: Props) {
    super(props);
    this.drop = React.createRef();
    this.drag = React.createRef();
  }

  componentDidMount = () => {
    // useRef 的 drop.current 取代了 ref 的 this.drop
    this.drop.current.addEventListener("dragover", this.handleDragOver);
    this.drop.current.addEventListener("drop", this.handleDrop);
    this.drop.current.addEventListener("dragenter", this.handleDragEnter);
    this.drop.current.addEventListener("dragleave", this.handleDragLeave);
    return () => {
      this.drop.current.removeEventListener("dragover", this.handleDragOver);
      this.drop.current.removeEventListener("drop", this.handleDrop);
      this.drop.current.removeEventListener("dragenter", this.handleDragEnter);
      this.drop.current.removeEventListener("dragleave", this.handleDragLeave);
    };
  };

  handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    this.props.setDragging(false);
    if (!e.dataTransfer) {
      return;
    }
    const files = [...e.dataTransfer.files];
    const formats = ["yaml", "yml"];

    if (
      formats &&
      files.some(
        (file) =>
          !formats.some((format) =>
            file.name.toLowerCase().endsWith(format.toLowerCase())
          )
      )
    ) {
      message.error("This is only support *.yml or *.yaml");
      return;
    }

    if (files && files.length) {
      this.onUpload(files);
    }
  };

  handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.target !== this.drag.current && this.props.setDragging(true);
  };

  handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.target === this.drag.current && this.props.setDragging(false);
  };

  saveToState = (
    nodes: TopologyNode[],
    links: TopologyLink[],
    groups: GroupConfig[]
  ) => {
    this.props.setLoading(false);
    this.props.setTopoData({ nodes, links, groups });
  };

  onUpload = (files: File[]) => {
    for (let file of files) {
      this.props.setLoading(true);
      let fr = new FileReader();
      fr.readAsText(file);
      fr.onload = () => {
        parse(fr.result as string, this.saveToState);
      };
    }
  };

  render() {
    return (
      <Layout>
        <div ref={this.drop} className="FilesDragAndDrop">
          <Content className={"container"}>
            <Spin spinning={this.props.isLoading}>
              {this.props.nodes.length === 0 && (
                <Row>
                  <Col span={12} offset={6}>
                    <Card style={{ textAlign: "center" }}>
                      <h2>Drop Your Yamls to Here</h2>
                    </Card>
                  </Col>
                </Row>
              )}
              <Topology />
              {this.props.isDragging && (
                <div
                  ref={this.drag}
                  className={"FilesDragAndDrop__placeholder"}
                >
                  Drop it please
                  <span role="img" aria-label="emoji">
                    &#128541;
                  </span>
                </div>
              )}
            </Spin>
          </Content>
        </div>
      </Layout>
    );
  }
}

const mapStateToProps = (state: StateStore) => {
  return {
    nodes: state.topology.nodes,
    isLoading: state.dragger.isLoading,
    isDragging: state.dragger.isDragging,
  };
};

const mapDispatchToProps = {
  setDragging,
  setLoading,
  setTopoData,
};

export default connect(mapStateToProps, mapDispatchToProps)(Dragger);
