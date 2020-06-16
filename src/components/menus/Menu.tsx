import React from "react";
import { TopologyNode, StateStore } from "../../type";
import { Card, Button, Modal, message } from "antd";
import { connect } from "react-redux";
import YAML from "yaml";
import Prism from "prismjs";
import "./styles/menu.css";

export interface Props {
  node?: TopologyNode;
  menuX: number;
  menuY: number;
  height: number;
  width: number;
}

export interface States {
  YamlModelVisble: boolean;
}
export class Menu extends React.Component<Props, States> {
  private cardRef: React.RefObject<HTMLDivElement>;
  private codeRef: React.RefObject<HTMLPreElement>;
  private yaml: string = "";
  private isYamlViewerIniting: boolean = false;
  private isYamlViewerInited: boolean = false;
  state = {
    YamlModelVisble: false,
  };

  constructor(props: Props) {
    super(props);
    this.cardRef = React.createRef();
    this.codeRef = React.createRef();
  }

  componentDidMount() {
    this.highlight();
    // because prism render need a exist code dom. but antd modal cannot pre renden the dom in child, so ...
    this.isYamlViewerIniting = true;
    this.setState({ YamlModelVisble: true });
  }

  componentDidUpdate() {
    this.highlight();

    if (
      this.state.YamlModelVisble &&
      this.isYamlViewerIniting &&
      !this.isYamlViewerInited
    ) {
      setTimeout(() => {
        this.setState({ YamlModelVisble: false });
        this.isYamlViewerInited = true;
      }, 0);
    }
  }

  highlight = () => {
    if (this.codeRef.current) {
      Prism.highlightElement(this.codeRef.current);
    }
  };

  get x(): number {
    const { menuX, width } = this.props;
    if (menuX === -1000) return this.props.menuX;
    if (menuX < 75) return 0;
    if (menuX + 250 > width) return width - 250;
    return menuX;
  }

  get y(): number {
    const { menuY, height } = this.props;
    if (menuY === -1000) return this.props.menuY;
    if (this.cardRef.current) {
      const cardHeight = this.cardRef.current.firstElementChild?.clientHeight!;
      const cardButton = menuY + 15 + cardHeight;
      if (cardButton > height) return height - cardHeight - 64;
    }

    return menuY + 15;
  }

  handleViewYaml = () => {
    if (!this.props.node?.detail) {
      message.warning("This Resource has no Yaml");
      return;
    }

    this.yaml = YAML.stringify(this.props.node?.detail) || "";
    this.setState({
      YamlModelVisble: true,
    });
  };
  handleCloseViewYaml = () => {
    this.setState({ YamlModelVisble: false });
  };

  render = () => {
    const { node } = this.props;
    const { YamlModelVisble } = this.state;
    const { handleCloseViewYaml, handleViewYaml, yaml, x, y } = this;
    return (
      <div ref={this.cardRef}>
        {node && (
          <Card className="menu" style={{ top: `${y}px`, left: `${x}px` }}>
            <Button block onClick={handleViewYaml}>
              View Yaml
            </Button>
          </Card>
        )}

        <Modal
          className="yaml-viewer"
          title={node?.name}
          visible={YamlModelVisble}
          okButtonProps={{ style: { display: "none" } }}
          cancelText="Close"
          onCancel={handleCloseViewYaml}
          mask={this.isYamlViewerInited}
          style={{
            visibility: this.isYamlViewerInited ? "visible" : "hidden",
          }}
        >
          <pre lang="yaml" className="line-number">
            <code ref={this.codeRef} className="language-yaml">
              {yaml}
            </code>
          </pre>
        </Modal>
      </div>
    );
  };
}
const mapStateToProps = (state: StateStore) => {
  return {
    node: state.topology.targetNode,
    menuX: state.topology.menuX,
    menuY: state.topology.menuY,
    height: state.topology.height,
    width: state.topology.width,
  };
};

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(Menu);
