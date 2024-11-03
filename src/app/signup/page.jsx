"use client";

import {
  Flex,
  Box,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Stack,
  Button,
  Text,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { app, auth } from "@/config/firebase";
import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  query,
  where,
} from "firebase/firestore";
import Loader from "../../../loading";
import { Link } from "@chakra-ui/next-js";

export default function Page() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
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

  const handleSignup = async () => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const db = getFirestore(app, 'aiiq-engine');
      const querySnapshot = await getDocs(
        query(collection(db, "users"), where("email", "==", email))
      );
      if (querySnapshot.empty) {
        await addDoc(collection(db, "users"), {
          email: email,
          approved: false,
          role: "user",
        });
      }
      toast({
        title: "User signup successful",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setEmail("");
      setPassword("");
      setLoading(false);
    }
  };

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
          {/* <Stack align={"center"} mb={6}>
          <Heading fontSize={"xl"} color={"white"}>
            AIIQ Admin panel sign Up
          </Heading>
        </Stack> */}
          <Stack spacing={3}>
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
                onChange={(e) => setEmail(e.target.value.toLocaleLowerCase())}
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
            <Stack mt={5}>
              <Button
                borderRadius={"2px"}
                colorScheme={"purple"}
                isDisabled={!isEmailValid || !isPasswordValid}
                onClick={() => {
                  setLoading(true);
                  handleSignup();
                }}
                size="lg"
                w="full"
              >
                Sign Up
              </Button>
            </Stack>
          </Stack>
          <Stack align={"center"} mt={6}>
            <Text color={"gray.300"}>
              Already a user?{" "}
              <Link
                href="/login"
                color={"purple.400"}
                _hover={{ color: "purple.600" }}
              >
                Login
              </Link>
            </Text>
          </Stack>
        </Box>
      </Flex>
      {loading ? <Loader /> : null}
    </div>
  );
}
