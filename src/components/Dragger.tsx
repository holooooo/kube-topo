import React from "react";
import Topology from "./Topology";
import { StateStore } from "../type";
import { connect } from "react-redux";
import { parse } from "../core/parse";
import { setDragging } from "../reducers/dragger";

// tslint:disable-next-line:no-empty-interface
interface Props {
  isDragging: boolean;
  setDragging: typeof setDragging;
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

  onUpload = (files: File[]) => {
    for (let file of files) {
      let fr = new FileReader();
      fr.readAsText(file);
      fr.onload = () => {
        parse(fr.result as string);
      };
    }
  };

  render() {
    return (
      <div ref={this.drop}>
        <Topology />
        {this.props.isDragging && (
          <div ref={this.drag}>
            请放手
            <span role="img" aria-label="emoji">
              &#128541;
            </span>
          </div>
        )}
        {this.props.children}
      </div>
    );
  }
}

const mapStateToProps = (state: StateStore) => {
  return {
    isDragging: state.dragger.isDragging,
  };
};

const mapDispatchToProps = {
  setDragging: setDragging,
};

export default connect(mapStateToProps, mapDispatchToProps)(Dragger);
