
import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({ 
  initialColorMode: 'light',
  useSystemColorMode: false,
  components: {
    Button : {
      defaultProps: {
        colorScheme: 'blue',
      },
      Link : {
        defaultProps : {
          colorScheme : 'blue'
        }
      }
    }
  }
 })

export default theme