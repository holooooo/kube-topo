import { AnyAction } from "redux";
import { StatusState } from "../type";

const initStatusState = {
  isInited: false,
  isUploaded: false,
} as StatusState;

const status = (state = initStatusState, action: AnyAction): StatusState => {
  switch (action.type) {
    case "status/hasInited":
      return {
        ...state,
        isInited: true,
      };
    case "status/hasUploaded":
      return {
        ...state,
        isUploaded: true,
      };
    default:
      return state;
  }
};

export default status;
