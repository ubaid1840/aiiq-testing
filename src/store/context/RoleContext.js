'use client'
import { createContext, useReducer } from "react";
import { SET_ROLE} from '../action/RoleAction'
import { myRoleReducer } from '../reducer/RoleReducer'

export const RoleContext = createContext()

const RoleContextProvider = (props) => {

    const [state, dispatch] = useReducer(myRoleReducer, { value: { data: '' }})

    const setRole = (data) => {
        dispatch({ type: SET_ROLE, payload: { data: data } })
    }

    return (
        <RoleContext.Provider
            value={{ state, setRole }}
        >
            {props.children}
        </RoleContext.Provider>
    )
}

export default RoleContextProvider