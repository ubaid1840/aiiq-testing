'use client'
import { createContext, useReducer } from "react";
import { SET_EMAIL} from '../action/EmailAction'
import { myEmailReducer } from '../reducer/EmailReducer'

export const EmailContext = createContext()

const EmailContextProvider = (props) => {

    const [state, dispatch] = useReducer(myEmailReducer, { value: { data: '' }})

    const setEmail = (data) => {
        dispatch({ type: SET_EMAIL, payload: { data: data } })
    }

    return (
        <EmailContext.Provider
            value={{ state, setEmail }}
        >
            {props.children}
        </EmailContext.Provider>
    )
}

export default EmailContextProvider