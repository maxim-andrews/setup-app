import {
  SET_OS_TIME_FETCHING,
  SET_OS_TIME,
  SET_ERROR
} from './constants';

// kra-mod-start
if (KRA.REDUX) {
  import initStore from './initStore';

  export default function update(state = initStore(), action) {
    switch(action.type) {
      case SET_OS_TIME_FETCHING: {
        return {
          ...state,
          fetching: true,
          error: false
        };
      }
      case SET_OS_TIME: {
        return {
          ...state,
          hostOS: action.payload.hostOS,
          hostTime: action.payload.hostTime,
          fetching: false
        };
      }
      case SET_ERROR: {
        return {
          ...state,
          error: action.payload,
          fetching: false
        };
      }
      default: {
        //
      }
    }

    return state;
  }
} else {
  export default function update(state, action) {
    switch(action.type) {
      case SET_OS_TIME_FETCHING: {
        return {
          ...state,
          fetching: true,
          error: false
        };
      }
      case SET_OS_TIME: {
        return {
          ...state,
          hostOS: action.payload.hostOS,
          hostTime: action.payload.hostTime,
          fetching: false
        };
      }
      case SET_ERROR: {
        return {
          ...state,
          error: action.payload,
          fetching: false
        };
      }
      default: {
        //
      }
    }

    return state;
  }
}
// kra-mod-end
