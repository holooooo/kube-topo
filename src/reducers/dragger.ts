import { AnyAction } from "redux";
import { DraggerState } from "../type";

const initDraggerState = {
  isDragging: false,
} as DraggerState;

const path = "dragger/";
const SET_DRAGGING = path + "setDragging";

export const setDragging = (isDragging: boolean) => {
  return { type: SET_DRAGGING, isDragging };
};

const dragger = (state = initDraggerState, action: AnyAction): DraggerState => {
  switch (action.type) {
    case SET_DRAGGING:
      return {
        ...state,
        isDragging: action.isDragging,
      };
    default:
      return state;
  }
};

export default dragger;
