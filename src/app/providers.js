'use client'
import { ChakraProvider } from '@chakra-ui/react'
import './globals.css'
import theme from './theme'
import { GoogleOAuthProvider } from '@react-oauth/google'


export function Providers(props) {

  const { children, ...rest } = props

  return (
    <ChakraProvider theme={theme}>
       <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_CLIENT_ID}>
        {children}
        </GoogleOAuthProvider>
    </ChakraProvider>
  )

}