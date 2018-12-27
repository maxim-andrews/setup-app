import {
  SET_REACT_SPIN,
  SET_REDUX_SPIN
} from './constants';

const initialState = {
  React: true,
  Redux: false
};

export default function update(state = initialState, action) {
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
