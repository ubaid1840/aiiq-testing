"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  query,
  where,
} from "firebase/firestore";
import { app, auth, provider } from "@/config/firebase";
import {
  Box,
  Button,
  Input,
  FormControl,
  FormLabel,
  Text,
  VStack,
  HStack,
  Image,
  useToast,
  useTheme,
  Heading,
  Flex,
  Stack,
  Checkbox,
  useColorModeValue,
  Divider,
  InputGroup,
  InputRightElement,
  Select,
  Center,
  AbsoluteCenter,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  useDisclosure,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import Cookies from "js-cookie";
import { FaGoogle } from "react-icons/fa";
import { RoleContext } from "@/store/context/RoleContext";
import { EmailContext } from "@/store/context/EmailContext";
import { DecryptCookie, EncryptCookie } from "@/function/cookiesFunctions";
import axios from "axios";
import { Link } from "@chakra-ui/next-js";
import Loader from "../../../loading";

export default function Page() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setemail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/");
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setIsEmailValid(email.includes("@") && email.includes("."));
    setIsPasswordValid(password.length > 5);
  }, [email, password]);

  async function handleUserLogin() {
    try {
      await signInWithEmailAndPassword(auth, email, password).then(() => {
        router.push("/");
      });
    } catch (error) {
      toast({
        title: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setLoading(false);
    }
  }

  const handleLogin = async () => {
    setLoading(true);
    const db = getFirestore(app, 'aiiq-engine');
    let list = [];

    try {
      const snapshot = await getDocs(
        query(collection(db, "users"), where("email", "==", email))
      );
      snapshot.forEach((docs) => {
        list.push(docs.data());
      });

      if (list.length > 0) {
        if (list[0].approved) {
          handleUserLogin();
        } else {
          toast({
            title: "User is not approved",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          setLoading(false);
        }
      } else {
        toast({
          title: "User not registered",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        setLoading(false);
      }
    } catch (error) {
      toast({
        title: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setLoading(false);
    }
  };

  async function handleGoogleLogin() {
    setLoading(true);
    try {
      const data = await signInWithPopup(auth, provider);
      let list = [];
      const db = getFirestore(app, 'aiiq-engine');
      const snapshot = await getDocs(
        query(collection(db, "users"), where("email", "==", data.user.email))
      );

      snapshot.forEach((docs) => {
        list.push(docs.data());
      });

      if (list.length > 0) {
        if (list[0].approved) {
          router.push("/");
        } else {
          toast({
            title: "User is not approved",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          await signOut(auth);
          setLoading(false);
        }
      } else {
        await addDoc(collection(db, "users"), {
          email: data.user.email,
          approved: false,
        });
        toast({
          title: "User is not approved",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        await signOut(auth);
      }
    } catch (error) {
      toast({
        title: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setLoading(false);
    }
  }

  return (
    <div>
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
          <Stack spacing={3}>
            <Box
              onClick={() => {
                setLoading(true);
                handleGoogleLogin();
              }}
              bgColor={"red.500"}
              _hover={{ bgColor: "red.700" }}
              color={"white"}
              display={"flex"}
              textAlign={"center"}
              borderRadius={"2px"}
              alignItems={"center"}
              cursor={"pointer"}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  position: "absolute",
                }}
              >
                <FaGoogle
                  style={{ marginLeft: "20px", marginRight: "20px" }}
                  size={15}
                  color="white"
                />

                <Center height="30px" opacity={0.7}>
                  <Divider orientation="vertical" />
                </Center>
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  marginTop: "10px",
                  marginBottom: "10px",
                }}
              >
                <Text width={"100%"} fontSize={"15px"} fontWeight={"600"} mb={0}>
                  Sign in with Google
                </Text>
              </div>
            </Box>
            <Box position="relative" padding="5">
              <Divider opacity={0.7} color={"gray"} />
              <AbsoluteCenter
                bg="gray.800"
                px="2"
                color={"white"}
                fontSize={"14px"}
                textColor={"rgb(155 169 180)"}
              >
                Or, sign in with your email
              </AbsoluteCenter>
            </Box>

            <FormControl id="email" isRequired>
              <FormLabel fontSize={"15px"} color={"gray.400"}>
                Email
              </FormLabel>
              <Input
                color="gray.400"
                placeholder="youremail@example.com"
                borderRadius={"2px"}
                border={"1px solid"}
                borderColor={"#484848"}
                value={email}
                onChange={(e) => setemail(e.target.value)}
                type="email"
                bg={"gray.800"}
                _placeholder={{ color: "gray.400" }}
                _focus={{ borderColor: "purple.400" }}
              />
            </FormControl>
            <FormControl id="password" isRequired>
              <FormLabel fontSize={"15px"} color={"gray.400"}>
                Password
              </FormLabel>
              <InputGroup>
                <Input
                  color="gray.400"
                  placeholder="Please enter at least 7 characters"
                  borderRadius={"2px"}
                  border={"1px solid"}
                  borderColor={"#484848"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  bg={"gray.800"}
                  _placeholder={{ color: "gray.400" }}
                  _focus={{ borderColor: "purple.400" }}
                />
                <InputRightElement h={"full"}>
                  <Button
                    variant={"ghost"}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <ViewIcon /> : <ViewOffIcon />}
                  </Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>
            <Link
              fontSize={"14px"}
              href="/forgetpassword"
              textAlign={"right"}
              color={"purple.400"}
              _hover={{ color: "purple.600" }}
            >
              Forgot Password?
            </Link>
            <Stack spacing={6}>
              <Button
                isLoading={loading}
                borderRadius={"2px"}
                colorScheme={"purple"}
                isDisabled={!isEmailValid || !isPasswordValid}
                onClick={() => {
                  setLoading(true);
                  handleLogin();
                }}
                size="lg"
                w="full"
              >
                Sign in
              </Button>
            </Stack>
          </Stack>
          <Stack align={"center"} mt={6}>
            <Text color={"gray.300"}>
              Need an account?{" "}
              <Link
                href="/signup"
                color={"purple.400"}
                _hover={{ color: "purple.600" }}
              >
                Sign Up
              </Link>
            </Text>
          </Stack>
        </Box>
      </Flex>
      {loading ? <Loader /> : null}
    
    </div>
  );
}
