import { AnyAction } from "redux";
import { DraggerState } from "../type";

const initDraggerState = {
  isDragging: false,
  isLoading: false,
} as DraggerState;

const path = "dragger/";
const SET_DRAGGING = path + "setDragging";
const SET_LOADING = path + "setLoading";

export const setDragging = (isDragging: boolean) => {
  return { type: SET_DRAGGING, isDragging };
};
export const setLoading = (isLoading: boolean) => {
  return { type: SET_LOADING, isLoading };
};

const dragger = (state = initDraggerState, action: AnyAction): DraggerState => {
  switch (action.type) {
    case SET_DRAGGING:
      return {
        ...state,
        isDragging: action.isDragging,
      };
    case SET_LOADING:
      return {
        ...state,
        isLoading: action.isLoading,
      };
    default:
      return state;
  }
};

export default dragger;
