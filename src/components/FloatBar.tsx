import React from "react";
import { Button, Tooltip, Popover, List } from "antd";
import {
  DeleteTwoTone,
  LayoutTwoTone,
  GithubOutlined,
} from "@ant-design/icons";
import { LAYOUTS } from "./Topology";

// tslint:disable-next-line:no-empty-interface
export interface Props {
  handleSwitchLayout: (layout: string) => void;
  handleClean: () => void;
}
export class FloatBar extends React.Component<Props> {
  renderLayouts = () => {
    return (
      <List
        itemLayout="horizontal"
        dataSource={Object.keys(LAYOUTS)}
        size="small"
        renderItem={(item) => (
          <List.Item>
            <Button
              type="link"
              onClick={() => this.props.handleSwitchLayout(item)}
            >
              {item}
            </Button>
          </List.Item>
        )}
      />
    );
  };

  render() {
    return (
      <div className={"floatBar"}>
        <Tooltip title="Clean All Data">
          <Button
            shape="circle"
            icon={<DeleteTwoTone />}
            onClick={this.props.handleClean}
          />
        </Tooltip>
        <Popover content={this.renderLayouts()} title="Change Layout">
          <Button shape="circle" icon={<LayoutTwoTone />} />
        </Popover>
        <Button
          shape="circle"
          icon={<GithubOutlined />}
          href="https://github.com/Okabe-Kurisu/kube-topo"
        />
      </div>
    );
  }
}

export default FloatBar;
