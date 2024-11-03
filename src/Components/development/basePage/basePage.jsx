'use client'
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { app, auth } from "@/config/firebase";
import { collection, getDocs, getFirestore, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Flex,
  useColorModeValue,
  Select,

} from "@chakra-ui/react";
import { RiLogoutBoxLine } from "react-icons/ri";
import Cookies from 'js-cookie'

export default function BasePage() {
  const [allRoutes, setAllRoutes] = useState([])
  const router = useRouter()
  const [myPath, setMyPath] = useState('Select one')
  const [proceedLoading, setProceedLoading] = useState(true);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (user) {
        const db = getFirestore(app, 'aiiq-engine');
        await getDocs(query(collection(db, 'users'), where('email', '==', user.email)))
          .then(async (snapshot) => {
            let list = []
            snapshot.forEach((docs) => {
              list.push(docs.data())
            })
            await getDocs(collection(db, 'routes'))
              .then((allRoutes) => {
                let list1 = []
                allRoutes.forEach((docs) => {
                  list1.push(docs.data())
                })
                if (list[0].role == 'superadmin') {
                  setAllRoutes([...list1])
                } else {
                  const newList = list1.filter(platform => {
                    const approvedKey = `${platform.name}-approved`;
                    return list[0][approvedKey];
                  });
                  setAllRoutes([...newList])
                }
                setProceedLoading(false)
              })
          })
      } else {
        router.push('/login')
      }
    })
    return () => {
      unsubscribe()
    }
  }, []);

  async function handleLogout() {
    try {
      await signOut(auth).then(() => {
        Cookies.remove("aiiq_admin_panel_session");
      });
    } catch (error) {
      setLoading(false);
    }
  }

  return (
    <Flex
      minH={"100vh"}
      align={"center"}
      justify={"center"}
      bg={useColorModeValue("gray.900", "gray.800")}
      px={4}
    >
      <Box
        maxW={"lg"}
        w={"full"}
        bg={useColorModeValue("gray.800", "gray.700")}
        boxShadow={"2xl"}
        rounded={"lg"}
        p={8}
      >
        <FormControl>
          <FormLabel color={"gray.400"}>Select and proceed</FormLabel>
          <Select
            isDisabled={proceedLoading}
            value={myPath}
            color={"gray.400"}
            borderRadius={"2px"}
            border={"1px solid"}
            borderColor={"#484848"}
            onChange={(e) => setMyPath(e.target.value)}
            bg={"gray.800"}
            _placeholder={{ color: "gray.400" }}
            _focus={{ borderColor: "purple.400" }}
          >
            <option
              style={{ display: 'none', color: "black", }}
              value={`Select one`}
            >
              Select one
            </option>
            {allRoutes.map((item, index) => (
              <option
                key={index}
                style={{ color: "black", padding: '10px' }}
                value={`/${item.name}`}
              >
                {item.name}
              </option>
            ))}
          </Select>
        </FormControl>
        <Button
          isDisabled={myPath === 'Select one'}
          isLoading={proceedLoading}
          mt={5}
          borderRadius={"2px"}
          colorScheme={"purple"}
          onClick={() => {
            setProceedLoading(true);
            router.push(myPath)
          }}
          size="md"
          w="full"
        >
          Proceed
        </Button>
      </Box>
      <Button
        pos={'absolute'}
        top={5}
        right={5}
        variant={"ghost"}
        color={"white"}
        _hover={{ bg: "transparent", color: "blue.400" }}
        onClick={() => {
          setProceedLoading(true);
          handleLogout();
        }}
      >
        <RiLogoutBoxLine size={30} />
      </Button>
    </Flex>
  )

}
