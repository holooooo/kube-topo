import { combineReducers } from "redux";
import state from "./status";
import topology from "./topology";
import dragger from "./dragger";

export default combineReducers({
  dragger,
  state,
  topology,
});
