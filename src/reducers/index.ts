import { combineReducers } from "redux";
import state from "./status";
import typology from "./topology";
import dragger from "./dragger";

export default combineReducers({
  dragger,
  state,
  typology,
});
