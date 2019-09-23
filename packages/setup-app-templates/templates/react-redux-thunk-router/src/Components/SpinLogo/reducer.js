import {
  SET_REACT_SPIN,
  SET_REDUX_SPIN
} from './constants';

import initStore from './initStore';

export default function update(state = initStore(), action) {
  switch(action.type) {
    case SET_REACT_SPIN: {
      return {
        ...state,
        React: true,
        Redux: false
      };
    }
    case SET_REDUX_SPIN: {
      return {
        ...state,
        React: false,
        Redux: true
      };
    }
    default: {
      //
    }
  }

  return state;
}
