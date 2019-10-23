import {
  SET_SERVER_ONLY
} from '../Constants';

import initStore from './initStore';

export default function update(state = initStore(), action) {
  switch(action.type) {
    case SET_SERVER_ONLY: {
      return {
        ...state,
        serverOnly: true
      };
    }
    default: {
      //
    }
  }

  return state;
}
