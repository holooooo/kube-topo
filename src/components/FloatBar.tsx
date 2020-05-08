import React from "react";
import { Button, Tooltip, Popover, List } from "antd";
import { DeleteTwoTone, LayoutTwoTone } from "@ant-design/icons";
import { setTopoDatas } from "../reducers/topology";
import { connect } from "react-redux";
import { StateStore } from "../type";
import { LAYOUTS } from "./Topology";

// tslint:disable-next-line:no-empty-interface
export interface Props {
  handleSwichLayout: (layout: string) => void;
  setTopoDatas: typeof setTopoDatas;
}
export class FloatBar extends React.Component<Props> {
  handleDelete = () => {
    this.props.setTopoDatas({ links: [], nodes: [], groups: [] });
  };

  renderLayouts = () => {
    return (
      <List
        itemLayout="horizontal"
        dataSource={Object.keys(LAYOUTS)}
        size="small"
        renderItem={(item) => (
          <List.Item>
            <Button onClick={() => this.props.handleSwichLayout(item)}>
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
            onClick={this.handleDelete}
          />
        </Tooltip>
        <Popover content={this.renderLayouts()} title="Change Layout">
          <Button shape="circle" icon={<LayoutTwoTone />} />
        </Popover>
      </div>
    );
  }
}
const mapStateToProps = (state: StateStore) => {
  return {};
};

const mapDispatchToProps = {
  setTopoDatas,
};

export default connect(mapStateToProps, mapDispatchToProps)(FloatBar);
