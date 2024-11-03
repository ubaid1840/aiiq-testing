import { SET_EMAIL } from '../action/EmailAction'

export const myEmailReducer = (state, action) => {
  switch (action.type) {
    case SET_EMAIL:
      let newEmailState = { ...state }
      newEmailState.value.data = action.payload.data       
      return newEmailState
      break
    default:
      return state
  }
}

