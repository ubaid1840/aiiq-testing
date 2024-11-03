"use client";
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Button,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Icon,
  Spinner,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Input,
  InputGroup,
  InputLeftElement,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  Textarea,
  AlertDialogFooter,
  Image,
} from "@chakra-ui/react";
import {
  HamburgerIcon,
  EditIcon,
  ChevronDownIcon,
  CheckCircleIcon,
} from "@chakra-ui/icons";
import { usePathname, useRouter } from "next/navigation";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import "./chatbot.css";
import Lottie from "react-lottie-player";
import axios from "axios";
import { app, auth, storage } from "@/config/firebase";
import Data from "@/Components/production/chatbot/Animation.json";
import { RiLogoutBoxLine } from "react-icons/ri";
import { signOut } from "firebase/auth";
import Cookies from "js-cookie";
import Link from "next/link";
import Loader from "../../../../loading";
import { DecryptCookie, EncryptCookie } from "@/function/cookiesFunctions";
import { IoArrowUpCircle } from "react-icons/io5";
import handleTokenSave from "@/function/tokenFunction";
import { CustomToast } from "@/Components/myToast";
import { BsLayoutSidebarInset } from "react-icons/bs";
import { motion } from "framer-motion";
import { UserContext } from "@/store/context/UserContext";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FaRegThumbsDown, FaRegThumbsUp } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import { GoSearch } from "react-icons/go";
import { getDownloadURL, ref } from "firebase/storage";
import useCheckSession from "@/function/checkSessionDev";

export default function MainPage({ backendUrl, allRoutes }) {
  const {
    isOpen: isOpenDrawer,
    onOpen: onOpenDrawer,
    onClose: onCloseDrawer,
  } = useDisclosure();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();
  const [additionalIcons, setAdditionalIcons] = useState([]);

  const [betterAnswer, setBetterAnswer] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatContainerRef = useRef(null);
  const [historySessions, setHistorySessions] = useState();
  const [viewChat, setViewChat] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [currentChat, setCurrentChat] = useState(false);
  const { state: UserState, setUser } = useContext(UserContext);
  const pathname = usePathname();
  const [chatbotReloading, setChatbotReloading] = useState(false);
  const { addToast } = CustomToast();
  const [sidebarHide, setSidebarHide] = useState(false);
  const textareaRef = useRef(null);
  const [currentRoute, setCurrentRoute] = useState("");
  const [search, setSearch] = useState("");
  const [iconsUrl, setIconsUrl] = useState({ data: [] });
  const [imageUrl, setImageUrl] = useState();
  const [wordcloudLoading, setWordCloudLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState("");
  const [myQuery, setMyQuery] = useState("");
  const [currentID, setCurrentID] = useState("");
  const [routes, setRoutes] = useState([]);

  const checkSession = useCheckSession();

  useEffect(() => {
    checkSession(allRoutes).then((item) => {
      if (item) {
        const key = EncryptCookie(
          JSON.stringify({
            token: item.token,
            email: item.email,
          })
        );
        Cookies.set("aiiq_admin_panel_session", key, {
          expires: 365,
        });
        handleTokenSave(item.token, item.email, backendUrl);
        setRoutes(item.allRoutes);
      }
    });
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [messages]);

  useEffect(() => {
    if (backendUrl && routes.length > 0) {
      handleEndSession();
      fetchData();
      handleHistory();
    }
  }, [backendUrl, routes]);

  useEffect(() => {
    if (routes && routes.length > 0) {
      const temp = routes.filter((item) =>
        pathname.toLowerCase().includes(item?.name.toLowerCase())
      );
      fetchIcons(temp[0]?.name);
      fetchWordCloud(temp[0]?.name);
      fetchLogo(temp[0]?.name);
      setCurrentRoute(temp[0]?.name);
    }
  }, [routes]);

  const fetchData = async (retry = false) => {
    try {
      const requestOptions = {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      };

      const response = await fetch(
        `${backendUrl}/get_llm_params/`,
        requestOptions
      );

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const data = await response.json();

      setCurrentChat(true);
      setMessages([
        {
          by: "ai",
          msg: data.greeting,
        },
      ]);
    } catch (e) {
      if (!retry) {
        try {
          const session = Cookies.get("aiiq_admin_panel_session");
          const key = DecryptCookie(session);
          const parse = JSON.parse(key);

          const filteredArray = allRoutes.filter((item) =>
            pathname.toLowerCase().includes(item.name.toLowerCase())
          );
          await handleTokenSave(
            parse.token,
            parse.email,
            filteredArray[0]?.value
          );

          await fetchData(true);
        } catch (retryError) {
          setMessages([
            {
              by: "ai",
              msg: "Failed to load data. Refresh the page.",
            },
          ]);
        }
      } else {
        setMessages([
          {
            by: "ai",
            msg: "Error loading data. Please try again later.",
          },
        ]);
        addToast({
          message: `/get_llm_params/: ${e.message}`,
          type: "error",
        });
      }
    } finally {
      setChatbotReloading(false);
    }
  };

  async function fetchLogo(route) {
    const logoRef = ref(storage, `${route}/images/logo.png`);

    await getDownloadURL(logoRef)
      .then((url) => {
        if (url) {
          setLogoUrl(url);
        }
      })
      .catch((e) => {
        console.log("not found", e.code);
      });
  }

  function fetchWordCloud(route) {
    const db = getFirestore(app, "aiiq-engine");
    getDoc(doc(db, "settings", `${route}-wordcloud`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          if (snapshot.data()?.allowed) {
            downloadUploadedWordCloud(route);
          } else {
            downloadDocumentPicture();
          }
        } else {
          downloadDocumentPicture();
        }
      })
      .catch(() => {
        downloadDocumentPicture();
      });
  }

  function downloadUploadedWordCloud(route) {
    const imageRef = ref(storage, `${route}/images/wordcloud.png`);
    getDownloadURL(imageRef)
      .then((url) => {
        if (url) {
          setImageUrl(url);
          setWordCloudLoading(false);
        } else {
          setImageUrl("/noImage.png");
        }
      })
      .catch((error) => {
        setImageUrl("/noImage.png");
        setWordCloudLoading(false);
      });
  }

  const downloadDocumentPicture = async () => {
    try {
      const response = await fetch(`${backendUrl}/wordcloud`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
    } catch (error) {
      setImageUrl("/noImage.png");
    } finally {
      setWordCloudLoading(false);
    }
  };

  async function fetchIcons(route) {
    const db = getFirestore(app, "aiiq-engine");
    try {
      getDoc(doc(db, "appearance", `${route}-icons`)).then((snapshot) => {
        if (snapshot.exists()) {
          setIconsUrl(snapshot.data());
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  async function handleEndSession(retry = false) {
    setViewChat(false);
    setHistorySessions();
    try {
      axios.post(`${backendUrl}/end-session`).then(async (response) => {
        setCurrentID(response.data?.id);
        setChatbotReloading(false);
        handleHistory();
      });
    } catch (error) {
      if (!retry) {
        try {
          const session = Cookies.get("aiiq_admin_panel_session");
          const key = DecryptCookie(session);
          const parse = JSON.parse(key);

          const filteredArray = allRoutes.filter((item) =>
            pathname.toLowerCase().includes(item.name.toLowerCase())
          );

          await handleTokenSave(
            parse.token,
            parse.email,
            filteredArray[0]?.value
          );

          await handleEndSession(true);
        } catch (retryError) {
          console.log("Error during token refresh:");
        }
      } else {
        console.log("Error at backend");
      }
      setChatbotReloading(false);
      addToast({ message: `/end-session: ${error.message}`, type: "error" });
    }
  }
  async function sendQueryAgain(text, email) {
    if (email) {
      let userInput = text;
      let userName = email;

      const requestOptions = {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          userInput: userInput,
          userName: userName,
          session_id: currentID,
        }),
      };

      try {
        const response = await fetch(`${backendUrl}/query`, requestOptions);

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();

        setMessages((prevMessages) => {
          const newState = [...prevMessages];
          newState.pop();
          newState.push({
            by: "ai",
            msg: data.response,
          });
          return newState;
        });
      } catch (error) {
        setMessages((prevMessages) => {
          const newState = [...prevMessages];
          newState.pop();
          newState.push({
            by: "ai",
            msg: error.message,
          });
          return newState;
        });
      }
    }
  }

  const handleSend = async (text) => {
    if (UserState.value.data.email) {
      let userInput = text;
      let userName = UserState.value.data?.email;
      let list = [];
      const filter = messages.filter((item) => item.by === "user");
      if (filter.length > 2) {
        list.push(filter[filter.length - 1].msg);
        list.push(filter[filter.length - 2].msg);
      } else {
        filter.map((item) => {
          list.push(item.msg);
        });
      }

      list.push(text);
      list.reverse();

      const requestOptions = {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          userInput: userInput,
          userName: userName,
          session_id: currentID,
          list: list,
        }),
      };

      try {
        const response = await fetch(`${backendUrl}/query`, requestOptions);

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();

        setMessages((prevMessages) => {
          const newState = [...prevMessages];
          newState.pop();
          newState.push({
            by: "ai",
            msg: data.response,
          });
          return newState;
        });
      } catch (error) {
        try {
          console.log("not authenticated");
          const session = Cookies.get("aiiq_admin_panel_session");
          const key = DecryptCookie(session);
          const parse = JSON.parse(key);

          const filteredArray = allRoutes.filter((item) =>
            pathname.toLowerCase().includes(item.name.toLowerCase())
          );

          await handleTokenSave(
            parse.token,
            parse.email,
            filteredArray[0]?.value
          );

          sendQueryAgain(text, UserState.value.data?.email);
        } catch (retryError) {
          console.error("Error in retry logic:", retryError);
        }
      } finally {
        // Clean-up tasks if needed, e.g., stopping a loading spinner
        // setLoading(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        const text = input;
        setInput("");
        setMessages((prevMessages) => {
          const newState = [...prevMessages];
          newState.push({
            by: "user",
            msg: text,
          });
          newState.push({
            by: "ai",
            msg: "loading",
          });
          return newState;
        });

        handleSend(text);
      }
    }
  };

  async function handleHistory(retry = false) {
    const userEmail = auth?.currentUser?.email;
    if (userEmail) {
      try {
        const requestOptions = {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({
            userName: userEmail,
          }),
        };

        const response = await fetch(
          `${backendUrl}/get-user-sessions`,
          requestOptions
        );

        if (!response.ok) {
          console.log("no sessions found");
        }

        const data = await response.json();

        if (data.sessions) {
          const temp = data.sessions;
          temp.reverse();
          setSessions(temp);
        }
      } catch (error) {
        if (!retry) {
          try {
            const session = Cookies.get("aiiq_admin_panel_session");
            const key = DecryptCookie(session);
            const parse = JSON.parse(key);

            const filteredArray = allRoutes.filter((item) =>
              pathname.toLowerCase().includes(item.name.toLowerCase())
            );

            await handleTokenSave(
              parse.token,
              parse.email,
              filteredArray[0].value
            );

            await handleHistory(true);
          } catch (retryError) {}
        } else {
          addToast({
            message: `/get-user-sessions: ${error.message}`,
            type: "error",
          });
        }
      } finally {
        setLoading(false);
        setHistoryLoading(false);
      }
    }
  }

  async function handleSelectedSession(data) {
    setViewChat(true);
    setCurrentChat(false);
    const temp = [...data.data];
    temp.reverse();

    setHistorySessions({ ...data, data: temp });
  }

  async function handleLogout() {
    try {
      // document.cookie =
      //   "backend_auth=; expires=2023-01-01; path=/; secure; SameSite=None;";
      await signOut(auth).then(() => {
        Cookies.remove("aiiq_admin_panel_session");
        setUser({});
      });
    } catch (error) {
      setLoading(false);
    }
  }

  async function handleMarkResolved(ind) {
    const realIndex = (ind + 1) / 4;
    try {
      const requestOptions = {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          index: realIndex,
          session_id: historySessions.id,
        }),
      };

      await fetch(`${backendUrl}/mark_resolved`, requestOptions)
        .then((response) => response.json())
        .then((data) => {
          if (!data.error) {
            const temp = [...historySessions.data];
            temp[ind] = {
              ...historySessions.data[ind],
              resolved: true,
            };

            setHistorySessions({
              headline: historySessions.headline,
              timestamp: historySessions.timestamp,
              userName: historySessions.userName,
              data: [...temp],
            });
          }
        });
    } catch (error) {
      console.log(error);
    } finally {
      // setLoading(false)
    }
  }

  const SessionsHistory = () => {
    return (
      <Box
        width={"100%"}
        height={"100%"}
        overflowY={"auto"}
        display={"flex"}
        justifyContent={"center"}
      >
        <div className="chatbot-body">
          {historySessions?.data.map((message, index) =>
            message.role == "query" ? (
              <div key={index} style={{ width: "100%" }}>
                <div key={index} className={`message-container-user`}>
                  <div className="message-user">{message.content}</div>
                  <div className="user-div-container">
                    <Image className="user-img" src={"/chatbot/user.svg"} alt="user-avatar"/>
                  </div>
                </div>
                <div className={`message-container-ai`}>
                  <div className="ai-div-container">
                    <Image className="ai-img" src={"/aiiq_icon.png"} alt="ai-avatar" />
                  </div>
                  <VStack align={"flex-start"} gap={0}>
                    <div className="message-ai" style={{ marginBottom: "0px" }}>
                      <div className="markdown">
                        <ReactMarkdown>
                          {historySessions?.data[index - 3]?.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                    {UserState.value.data?.role == "superadmin" ||
                    `${UserState.value.data[currentRoute]}-role` == "admin" ? (
                      <HStack
                        gap={2}
                        align={"flex-start"}
                        marginBottom={"10px"}
                        mt={2}
                      >
                        {message?.label === "down" && (
                          <Icon
                            as={FaRegThumbsDown}
                            boxSize={4}
                            color={"red"}
                          />
                        )}
                        {message?.label === "up" && (
                          <Icon
                            as={FaRegThumbsUp}
                            boxSize={4}
                            color={"green"}
                          />
                        )}
                        {message?.label === "down" && message.resolved ? (
                          <Button
                            isDisabled={true}
                            colorScheme={"gray"}
                            size={"sm"}
                          >
                            <Text fontSize={"14px"} fontWeight="400" mb={"0px"}>
                              Resolved
                            </Text>
                          </Button>
                        ) : message?.label === "down" && !message.resolved ? (
                          <Button onClick={() => handleMarkResolved(index)}>
                            <Text fontSize={"14px"} fontWeight="400" mb={"0px"}>
                              Mark Resolved
                            </Text>
                          </Button>
                        ) : null}
                        {message?.label === "down" && !message?.resolved && (
                          <Button
                            onClick={() => {
                              setBetterAnswer("");
                              setMyQuery(message?.content);
                              onOpen();
                            }}
                          >
                            <Text fontSize={"14px"} fontWeight="400" mb={"0px"}>
                              Submit Better answer
                            </Text>
                          </Button>
                        )}
                      </HStack>
                    ) : null}
                  </VStack>
                </div>
              </div>
            ) : null
          )}
        </div>
      </Box>
    );
  };

  function getValidLink(link) {
    if (!link.startsWith("http://") && !link.startsWith("https://")) {
      return `https://${link}`;
    }
    return link;
  }

  const TopBar = () => {
    return (
      <Box
        display={"flex"}
        justifyContent={"space-between"}
        w={"100%"}
        p={2}
        alignItems={"center"}
        borderTopRadius={10}
      >
        <HStack alignItems={"center"} gap={3}>
          {!sidebarHide && (
            <HStack gap={5}>
              {logoUrl && <Image src={logoUrl} height={"50px"} ml={3} alt="logo"/>}
              <Icon
                ml={3}
                _hover={{ cursor: "pointer" }}
                as={BsLayoutSidebarInset}
                onClick={() => setSidebarHide(!sidebarHide)}
                boxSize={7}
                color={"#7C7C7C"}
                display={{ base: "none", md: "unset" }}
              />
              <Box
                bg={"#50AAA5"}
                _hover={{ cursor: "pointer", opacity: 0.7 }}
                borderRadius={5}
                height={"32px"}
                width={"32px"}
                display={"flex"}
                justifyContent={"center"}
                alignItems={"center"}
              >
                <EditIcon
                  onClick={() => {
                    setChatbotReloading(true);
                    setHistoryLoading(true);
                    setMessages([]);
                    handleEndSession();
                  }}
                  style={{ color: "white" }}
                  boxSize={5}
                />
              </Box>
            </HStack>
          )}
          <HamburgerIcon
            onClick={onOpenDrawer}
            boxSize={7}
            color={"blue.500"}
            display={{ md: "none" }}
            m={2}
          />

          <Menu>
            <MenuButton
              ml={5}
              px={4}
              py={2}
              bg={"white"}
              transition="all 0.2s"
              borderRadius="md"
              borderWidth="1px"
              _hover={{ bg: "blue.500", color: "white" }}
              _expanded={{ bg: "blue.500", color: "white" }}
            >
              {routes &&
                routes.length > 0 &&
                routes?.map((item, index) => {
                  if (
                    pathname.toLowerCase().includes(item.name.toLowerCase())
                  ) {
                    return (
                      item.name.charAt(0).toUpperCase() + item.name.slice(1)
                    );
                  }
                })}

              <ChevronDownIcon display={{ base: "none", md: "unset" }} />
            </MenuButton>
            <MenuList padding={2} borderRadius={20} fontSize={"16px"}>
              {routes &&
                routes.length > 0 &&
                routes?.map((item, index) => (
                  <Link
                    href={`/${item.name}`}
                    key={index}
                    onClick={() => setLoading(true)}
                  >
                    <MenuItem>
                      <div
                        style={{
                          width: "100%",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        {item.name}
                        {pathname.includes(item.name) && <CheckCircleIcon />}
                      </div>
                    </MenuItem>
                  </Link>
                ))}
            </MenuList>
          </Menu>
        </HStack>
        <HStack alignItems={"center"} gap={3} mr={2}>
          <Link
            href={
              pathname[pathname.length - 1] === "/"
                ? `${pathname}admin/?page=files`
                : `${pathname}/admin?page=files`
            }
            target="_blank"
          >
            <Button
              ml={2}
              fontSize={"13px"}
              bg={"#50AAA5"}
              _hover={{ opacity: 0.7 }}
            >
              Admin Panel
            </Button>
          </Link>
          {iconsUrl.data.length != 0 &&
            iconsUrl.data.map((eachIcon, index) => (
              <Link
                key={index}
                href={getValidLink(eachIcon.link)}
                target="_blank"
              >
                <Box
                  alignItems={"center"}
                  display={"flex"}
                  justifyContent={"center"}
                  _hover={{
                    cursor: "pointer",
                    backgroundColor: "blue.600",
                  }}
                  style={{
                    padding: "4px",
                    borderRadius: "50px",
                  }}
                  bg={"gray.600"}
                >
                  <Image src={eachIcon.url} width={"28px"} alt={`icon-${index}`}/>
                </Box>
              </Link>
            ))}
          <Box
            alignItems={"center"}
            display={"flex"}
            justifyContent={"center"}
            _hover={{
              cursor: "pointer",
              backgroundColor: "blue.600",
            }}
            style={{
              padding: "8px",
              borderRadius: "50px",
            }}
            bg={"gray.600"}
            color={"white"}
          >
            <Icon
              onClick={() => {
                setLoading(true);
                handleLogout();
              }}
              as={RiLogoutBoxLine}
              boxSize={5}
            />
          </Box>
        </HStack>
      </Box>
    );
  };

  async function handleSendLabel(val, ind) {
    const msgLength = messages.length / 2;
    const realIndex = msgLength - (ind + 1) / 2 + 1;
    try {
      const requestOptions = {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          index: realIndex,
          label: val,
          session_id: currentID,
        }),
      };

      await fetch(`${backendUrl}/update_label`, requestOptions)
        .then((response) => response.json())
        .then((data) => {
          if (!data.error) {
            const temp = [...messages];
            temp[ind] = { ...messages[ind], label: val };
            setMessages([...temp]);
          }
        });
    } catch (error) {
      console.log(error);
    } finally {
      // setLoading(false)
    }
  }

  const PromptResults = () => {
    return (
      <Box
        width={"100%"}
        height={"100%"}
        overflowY={"auto"}
        display={"flex"}
        justifyContent={"center"}
        ref={chatContainerRef}
      >
        <div className="chatbot-body">
          {messages.map((message, index) =>
            message.by == "ai" ? (
              message.msg == "loading" ? (
                <Lottie
                  key={index}
                  loop
                  animationData={Data}
                  play
                  style={{ width: "100px" }}
                />
              ) : (
                <div key={index}>
                  <div
                    key={index}
                    className={`message-container-${message.by}`}
                  >
                    <div className="ai-div-container">
                      <Image className="ai-img" src={"/aiiq_icon.png"} alt="ai-avatar"/>
                    </div>
                    <VStack width={"100%"} align={"flex-start"} gap={0}>
                      <div className="message-ai">
                        <div className="markdown">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.msg}
                          </ReactMarkdown>
                        </div>
                      </div>
                      {index != 0 && message.label === "down" ? (
                        <Icon as={FaRegThumbsDown} boxSize={4} color={"red"} />
                      ) : message.label === "up" ? (
                        <Icon as={FaRegThumbsUp} boxSize={4} color={"green"} />
                      ) : null}
                      {index != 0 && !message.label && (
                        <HStack
                          justify={"flex-start"}
                          gap={5}
                          width={"80%"}
                          ml={2}
                        >
                          <Icon
                            onClick={() => {
                              handleSendLabel("down", index);
                            }}
                            as={FaRegThumbsDown}
                            boxSize={5}
                            color={"red"}
                            _hover={{ cursor: "pointer", opacity: 0.7 }}
                          />
                          <Icon
                            onClick={() => {
                              handleSendLabel("up", index);
                            }}
                            as={FaRegThumbsUp}
                            boxSize={5}
                            color={"green"}
                            _hover={{ cursor: "pointer", opacity: 0.7 }}
                          />
                        </HStack>
                      )}
                    </VStack>
                  </div>
                </div>
              )
            ) : (
              <div key={index} className={`message-container-${message.by}`}>
                <div className="message-user">{message.msg}</div>
                <div className="user-div-container">
                  <Image className="user-img" src={"/chatbot/user.svg"} alt={"user-avatar"}/>
                </div>
              </div>
            )
          )}
        </div>
      </Box>
    );
  };

  async function handleSaveBetterAnswer(query) {
    try {
      const requestOptions = {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          query: query,
          response: betterAnswer,
        }),
      };

      await fetch(`${backendUrl}/better_answer`, requestOptions)
        .then((response) => response.json())
        .then((data) => {
          addToast({ message: `Context added`, type: "success" });
        });
    } catch (error) {
      console.log(error);
      addToast({
        message: `/better_answer: Failed to add context`,
        type: "error",
      });
    } finally {
      // setLoading(false)
    }
    onClose();
  }

  const WelcomeScreen = () => {
    return (
      <Flex flex={1} align={"center"} justify={"center"}>
        <VStack gap={4}>
          <Box
            display={"flex"}
            flexDir={{ base: "column", md: "row" }}
            alignItems={"center"}
            gap={{ base: 1, md: 5 }}
          >
            <Text fontSize={"32px"} fontWeight={"600"}>
              Welcome to
            </Text>
            <Image src="/aiiq-logo.png" width={"80px"} alt="aiiq-logo"/>
            <Text fontSize={"32px"} fontWeight={"600"}>
              Engine
            </Text>
          </Box>
          <Text fontSize={"16px"} fontWeight={"500"} px={5}>
            {messages.length > 0 && messages[0].msg}
          </Text>
          {chatbotReloading || wordcloudLoading ? (
            <Spinner />
          ) : (
            <Image
            alt="wordcloud"
              src={imageUrl}
              width={{
                base: imageUrl === "/noImage.png" ? "20%" : "90%",
                md: imageUrl === "/noImage.png" ? "20%" : "50%",
              }}
            />
          )}
        </VStack>
      </Flex>
    );
  };

  const RenderSessions = useCallback(() => {
    return sessions.map((session_ID, index) => (
      <Box
        _hover={{
          backgroundColor: "#E2E2E2",
          cursor: "pointer",
          color: "black",
        }}
        bg={session_ID?.id == historySessions?.id ? "gray.700" : "inherit"}
        key={index}
        p={2}
        borderRadius="md"
        onClick={() => {
          onCloseDrawer();
          setHistorySessions([]);
          handleSelectedSession(session_ID);
        }}
      >
        <div className="markdown">
          <ReactMarkdown>{session_ID.headline}</ReactMarkdown>
        </div>
      </Box>
    ));
  }, [sessions]);

  return loading ? (
    <Loader />
  ) : (
    <Flex height="100vh" color={"black"}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: sidebarHide ? 260 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{ overflow: "hidden" }}
      >
        <Flex
          flexDir={"column"}
          justifyContent={"space-between"}
          bg="#FFFFFF"
          pt={4}
        >
          <Box
            display={{ base: "none", md: "block" }}
            w="260px"
            overflowY="auto"
            height="100vh"
            px={4}
          >
            <HStack justifyContent="space-between" mb={4} mt={2}>
              <Icon
                _hover={{ cursor: "pointer" }}
                as={BsLayoutSidebarInset}
                onClick={() => setSidebarHide(!sidebarHide)}
                boxSize={6}
                color={"#7C7C7C"}
                display={{ base: "none", md: "unset" }}
              />
            </HStack>
            <Button
              width={"100%"}
              onClick={() => {
                setChatbotReloading(true);
                setHistoryLoading(true);
                setMessages([]);
                handleEndSession();
              }}
              leftIcon={<EditIcon mb={"2px"} boxSize={5} />}
              fontSize={"13px"}
              bg={"#50AAA5"}
              _hover={{ opacity: 0.7 }}
            >
              Start new chat
            </Button>
            <VStack spacing={2} align="stretch" my={10}>
              <InputGroup mb={2}>
                <InputLeftElement pointerEvents="none">
                  <GoSearch size={20} />
                </InputLeftElement>
                <Input
                  borderColor={"gray"}
                  placeholder="Search"
                  size="md"
                  _placeholder={{ color: "gray", fontsize: "12px" }}
                  onChange={(e) => setSearch(e.target.value)}
                  value={search}
                  // onKeyDown={handleKeyDown}
                  fontSize={"14px"}
                />
              </InputGroup>

              <Box
                _hover={{
                  backgroundColor: "#E2E2E2",
                  cursor: "pointer",
                  color: "black",
                }}
                bg={currentChat ? "#E2E2E2" : "inherit"}
                color={"#7C7C7C"}
                p={2}
                borderRadius="md"
                onClick={() => {
                  setCurrentChat(true);
                  setViewChat(false);
                  setHistorySessions();
                }}
              >
                <Text fontSize={"14px"} fontWeight={400}>
                  Current chat
                </Text>
              </Box>
              {historyLoading ? (
                <Flex
                  width={"100%"}
                  alignItems={"center"}
                  justifyContent={"center"}
                >
                  <Spinner />
                </Flex>
              ) : (
                sessions.length > 0 && (
                  <VStack gap={2}>
                    {sessions
                      .filter((eachSession) =>
                        eachSession?.headline
                          .toLowerCase()
                          ?.includes(search.toLowerCase())
                      )
                      .map(
                        (session_ID, index) =>
                          session_ID.headline && (
                            <Box
                              _hover={{
                                backgroundColor: "#E2E2E2",
                                cursor: "pointer",
                                color: "black",
                              }}
                              bg={
                                session_ID?.id == historySessions?.id
                                  ? "#E2E2E2"
                                  : "inherit"
                              }
                              color={"#7C7C7C"}
                              key={index}
                              p={2}
                              borderRadius="md"
                              onClick={() => {
                                setHistorySessions();
                                handleSelectedSession(session_ID);
                              }}
                            >
                              <div className="markdown">
                                <ReactMarkdown>
                                  {session_ID.headline}
                                </ReactMarkdown>
                              </div>
                            </Box>
                          )
                      )}
                  </VStack>
                )
              )}
            </VStack>
          </Box>
        </Flex>
      </motion.div>

      <Box flex="1" color="white" height="100vh" overflowY={"auto"}>
        <Box
          width={"100%"}
          height={"100%"}
          bg={"#FFFFFF"}
          color={"black"}
          justifyContent={"space-between"}
          alignItems={"center"}
          display={"flex"}
          flexDir={"column"}
          pt={2}
        >
          <TopBar />
          <Box
            overflowY={"auto"}
            width={"100%"}
            height={"100%"}
            bgGradient="linear(to-b, #FFFFFF, #50AAA67D)"
            color={"black"}
            display={"flex"}
            flexDir={"column"}
          >
            {viewChat ? (
              historySessions?.data.length > 0 ? (
                <SessionsHistory />
              ) : null
            ) : messages.length <= 1 ? (
              <WelcomeScreen />
            ) : (
              <PromptResults />
            )}
            {viewChat
              ? null
              : currentID && (
                  <Box
                    width={"100%"}
                    alignItems={"center"}
                    display={"flex"}
                    flexDir={"column"}
                    justifyContent={"center"}
                    paddingBottom={"5px"}
                    paddingTop={"15px"}
                  >
                    <Box
                      height={"70px"}
                      borderRadius={5}
                      overflow={"hidden"}
                      width={{
                        base: "100%",
                        sm: "calc(100% - 260px)",
                        md: "calc(80% - 130px)",
                        lg: "calc(70% - 130px)",
                        xl: "calc(70% - 130px)",
                      }}
                      bg="#f4f4f4"
                      py={2}
                      px={4}
                      boxShadow="md"
                      border={"1px solid #9D9D9D"}
                      alignItems={"center"}
                      display={"flex"}
                    >
                      <textarea
                        ref={textareaRef}
                        disabled={
                          messages[messages.length - 1]?.msg === "loading"
                        }
                        className="textStyle"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask your Query here"
                        onKeyDown={handleKeyDown}
                      />
                      <Icon
                        as={IoArrowUpCircle}
                        boxSize={12}
                        color={input.trim() === "" ? "#00000051" : "#000000"}
                        onClick={() => {
                          if (input.trim()) {
                            const text = input;
                            setInput("");
                            setMessages((prevMessages) => {
                              const newState = [...prevMessages];
                              newState.push({
                                by: "user",
                                msg: text,
                              });
                              newState.push({
                                by: "ai",
                                msg: "loading",
                              });
                              return newState;
                            });
                            handleSend(text);
                          }
                        }}
                        _hover={{ cursor: "pointer", opacity: 0.7 }}
                      />
                    </Box>
                    <Box
                      display={"flex"}
                      gap={2}
                      justifyContent={"flex-end"}
                      alignItems={"center"}
                      width={{
                        base: "100%",
                        sm: "calc(100% - 260px)",
                        md: "calc(80% - 130px)",
                        lg: "calc(70% - 130px)",
                        xl: "calc(70% - 130px)",
                      }}
                    >
                      <Text color={"gray"} fontSize={"14px"}>
                        Powered by
                      </Text>
                      <Text fontWeight={500} color={"#717171"}>
                        AIIQ
                      </Text>
                    </Box>
                  </Box>
                )}
          </Box>
        </Box>
      </Box>

      <Drawer placement="left" onClose={onCloseDrawer} isOpen={isOpenDrawer}>
        <DrawerOverlay />
        <DrawerContent bg={"gray.900"} color={"gray.300"}>
          <DrawerCloseButton mr={2} />
          <DrawerBody>
            <HStack justifyContent="space-between" mb={4}>
              <EditIcon
                onClick={() => {
                  setChatbotReloading(true);
                  setHistoryLoading(true);
                  setMessages([]);
                  handleEndSession();
                }}
                _hover={{ cursor: "pointer" }}
                style={{ color: "#7C7C7C" }}
                boxSize={6}
                mt={3}
              />
            </HStack>
            <VStack justifyContent={"space-between"}>
              <VStack spacing={0} align="stretch">
                <Box
                  _hover={{
                    backgroundColor: "#E2E2E2",
                    cursor: "pointer",
                    color: "black",
                  }}
                  bg={currentChat ? "gray.700" : "inherit"}
                  p={2}
                  borderRadius="md"
                  onClick={() => {
                    onCloseDrawer();
                    setCurrentChat(true);
                    setViewChat(false);
                    setHistorySessions();
                  }}
                >
                  <Text fontSize={"14px"} fontWeight={400}>
                    Current chat
                  </Text>
                </Box>

                <RenderSessions />
              </VStack>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Submit answer
            </AlertDialogHeader>

            <AlertDialogBody>
              <Text>Query: {myQuery}</Text>
              <Textarea
                value={betterAnswer}
                onChange={(e) => setBetterAnswer(e.target.value)}
                resize={"none"}
                height={"140px"}
              />
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} colorScheme={"gray"}>
                Cancel
              </Button>
              <Button
                onClick={() => handleSaveBetterAnswer(myQuery)}
                ml={3}
                bg={"#50AAA5"}
                _hover={{ opacity: 0.7 }}
              >
                Save
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Flex>
  );
}
