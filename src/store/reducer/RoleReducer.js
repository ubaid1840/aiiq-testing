import { SET_ROLE } from '../action/RoleAction'

export const myRoleReducer = (state, action) => {
  switch (action.type) {
    case SET_ROLE:
      let newRoleState = { ...state }
      newRoleState.value.data = action.payload.data       
      return newRoleState
      break
    default:
      return state
  }
}

