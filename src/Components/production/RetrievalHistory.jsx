import { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  HStack,
  Icon,
  Img,
  Spinner,
  Text,
  Textarea,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import {
  AccordionContext,
  Card,
  Accordion,
  useAccordionButton,
} from "react-bootstrap";
import ReactMarkdown from "react-markdown";
import { CheckCircleIcon } from "@chakra-ui/icons";
import { FaRegThumbsDown, FaRegThumbsUp } from "react-icons/fa";
import { CustomToast } from "../myToast";

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
  const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return `${formattedHours}:${formattedMinutes} ${ampm} ${day}/${month}/${year}`;
}

function RetrievalHistory({ session_id, url, thumbsFilter, exclude }) {
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();
  const [betterAnswer, setBetterAnswer] = useState("");
  const [myQuery, setMyQuery] = useState("");
  const { addToast } = CustomToast();

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const res = await axios.get(`${url}/sessions/${session_id}`);

        let arr = [];
        let messages = [...res.data];
        for (let i = 0; i < messages.length; i++) {
          if (messages[i].role != "query") {
            arr.push(messages[i]);
          } else {
            if (messages[i].label) {
              arr.push({
                ...messages[i],
                resolved: messages[i].resolved ? messages[i].resolved : false,
              });
              arr.push({
                ...messages[i + 1],
                label: messages[i].label,
                resolved: messages[i].resolved ? messages[i].resolved : false,
              });
              arr.push({
                ...messages[i + 2],
                label: messages[i].label,
                resolved: messages[i].resolved ? messages[i].resolved : false,
              });
              arr.push({
                ...messages[i + 3],
                label: messages[i].label,
                resolved: messages[i].resolved ? messages[i].resolved : false,
              });
              i = i + 3;
            } else {
              arr.push(messages[i]);
              arr.push(messages[i + 1]);
              arr.push(messages[i + 2]);
              arr.push(messages[i + 3]);
              i = i + 3;
            }
          }
        }
        setChatHistory([...arr]);
      } catch (e) {
        addToast({
          message: `/sessions/${session_id}: ${e.message}`,
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchChatHistory();
  }, [session_id, url]);

  function ContextAwareToggle({ children, eventKey, callback }) {
    const { activeEventKey } = useContext(AccordionContext);

    const decoratedOnClick = useAccordionButton(
      eventKey,
      () => callback && callback(eventKey)
    );

    const isCurrentEventKey = activeEventKey === eventKey;

    return (
      <button
        className="btn btn-outline-link"
        style={{ border: "0px" }}
        onClick={decoratedOnClick}
      >
        {!isCurrentEventKey ? (
          <Img
            style={{ height: "20px", width: "20px", resize: "block" }}
            src="/down_arrow_icon.png"
          />
        ) : (
          <Img
            style={{ height: "20px", width: "20px", resize: "block" }}
            src="/up_arrow_icon.png"
          />
        )}
      </button>
    );
  }

  const RenderChat = ({ role, msg, timestamp, username, message, index }) => {
    const [showMore, setShowMore] = useState(false);

    if (role == "query")
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            paddingLeft: "16vw",
            marginBottom: "10px",
          }}
        >
          <Box
            bg={"blue.600"}
            px={"10px"}
            py={"5px"}
            color="white"
            style={{
              fontSize: "14px",
              borderRadius: "5px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              fontWeight: "400",
            }}
          >
            {showMore ? msg : msg.substring(0, 400)}
            {msg.length > 399 ? (
              <button
                className="btn btn-light"
                style={{ margin: "10px" }}
                onClick={() => setShowMore(!showMore)}
              >
                {showMore ? "Show less" : "Show more"}
              </button>
            ) : null}
            <div
              style={{
                fontSize: "10px",
                marginTop: "5px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              {formatTimestamp(timestamp)}
            </div>
          </Box>
          <div
            style={{
              display: "flex",
              marginLeft: "10px",
              flexDirection: "column",
              maxWidth: "100px",
            }}
          >
            <Img style={{ maxWidth: "25px" }} src="/user_icon.png" />
          </div>
        </div>
      );

    if (role == "ai")
      return (
        <div
          style={{
            paddingRight: "16vw",
            display: "flex",
            flexDirection: "row",
            marginBottom: "10px",
          }}
        >
          <Img
            style={{ height: "25px", maxWidth: "25px", marginRight: "10px" }}
            src="/aiiq_icon.png"
          />
          <VStack align={"flex-start"} gap={0}>
            <div
              style={{
                padding: "10px",
                backgroundColor: "#EAEAEA",
                color: "black",
                fontSize: "14px",
                borderRadius: "5px",
              }}
            >
              {showMore ? (
                <div className="markdown">
                  <ReactMarkdown>{msg}</ReactMarkdown>
                </div>
              ) : (
                <div className="markdown">
                  <ReactMarkdown>{msg.substring(0, 400)}</ReactMarkdown>
                </div>
              )}
              {msg.length > 399 ? (
                <button
                  className="btn btn-primary"
                  style={{ margin: "10px" }}
                  onClick={() => setShowMore(!showMore)}
                >
                  {showMore ? "Show less" : "Show more"}
                </button>
              ) : null}
              <div
                style={{
                  fontSize: "10px",
                  marginTop: "5px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                {formatTimestamp(timestamp)}
                {chatHistory[index - 3].resolved && (
                  <div
                    style={{
                      display: "flex",
                      gap: "5px",
                      alignItems: "center",
                    }}
                  >
                    <CheckCircleIcon boxSize={4} color={"green"} />
                    <div style={{ fontSize: "10px" }}>Resolved</div>
                  </div>
                )}
              </div>
            </div>
            <HStack gap={5} align={"flex-start"} marginBottom={"10px"} mt={2}>
              {chatHistory[index - 3]?.label === "down" && (
                <Icon as={FaRegThumbsDown} boxSize={4} color={"red"} />
              )}
              {chatHistory[index - 3]?.label === "up" && (
                <Icon as={FaRegThumbsUp} boxSize={4} color={"green"} />
              )}
              {chatHistory[index - 3]?.label === "down" &&
                !chatHistory[index - 3].resolved && (
                  <Button onClick={() => handleMarkResolved(index)}>
                    <Text fontSize={"14px"} fontWeight="400" mb={"0px"}>
                      Mark Resolved
                    </Text>
                  </Button>
                )}
              {chatHistory[index - 3]?.label === "down" &&
                !chatHistory[index - 3].resolved && (
                  <Button
                    onClick={() => {
                      setBetterAnswer("");
                      setMyQuery(chatHistory[index - 3]?.content);
                      onOpen();
                    }}
                  >
                    <Text fontSize={"14px"} fontWeight="400" mb={"0px"}>
                      Submit Better answer
                    </Text>
                  </Button>
                )}
            </HStack>
          </VStack>
        </div>
      );
  };

  async function handleMarkResolved(ind) {
    const msgLength = chatHistory.length - 1;
    const realIndex = msgLength / 4 - ind / 4 + 1;
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
          session_id: session_id,
        }),
      };

      await fetch(`${url}/mark_resolved`, requestOptions)
        .then((response) => response.json())
        .then((data) => {
          if (!data.error) {
            let temp = [...chatHistory];
            temp[ind - 3] = {
              ...chatHistory[ind - 3],
              resolved: true,
            };
            setChatHistory([...temp]);
          }
        });
    } catch (error) {
      console.log(error);
    } finally {
      // setLoading(false)
    }
  }

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

      await fetch(`${url}/better_answer`, requestOptions)
        .then((response) => response.json())
        .then((data) => {
          addToast({
            message: `Context Added`,
            type: "success",
          });
          // console.log(data);
        });
    } catch (error) {
      console.log(error);
      addToast({
        message: `Failed to add context`,
        type: "success",
      });
    } finally {
      // setLoading(false)
    }
    onClose();
  }

  return loading ? (
    <Box
      w="100%"
      maxW="1200px"
      justifyContent={"center"}
      display={"flex"}
      mt={4}
    >
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color="blue.500"
        size="xl"
      />
    </Box>
  ) : (
    <Box>
      <div>
        <Box
          paddingX={"20px"}
          bg={"blue.700"}
          color={"white"}
          paddingY={"15px"}
        >
          <Text fontSize={"18px"} fontWeight={"600"} mb={"0px"}>
            Chat History
          </Text>
        </Box>
        <div className="chat-history-container">
          <ul className="list-group chat-history">
            {chatHistory.map((message, index) => {
              if (message.role === "query") {
                return !thumbsFilter ? (
                  <RenderChat
                    message={message}
                    key={index}
                    index={index}
                    role={"query"}
                    msg={message.content}
                    timestamp={message.timestamp}
                    username={
                      message.username ? message.username : "No Username"
                    }
                  />
                ) : message.label === "down" ? (
                  !exclude ? (
                    <RenderChat
                      message={message}
                      key={index}
                      index={index}
                      role={"query"}
                      msg={message.content}
                      timestamp={message.timestamp}
                      username={
                        message.username ? message.username : "No Username"
                      }
                    />
                  ) : message.resolved === true ? null : (
                    <RenderChat
                      message={message}
                      key={index}
                      index={index}
                      role={"query"}
                      msg={message.content}
                      timestamp={message.timestamp}
                      username={
                        message.username ? message.username : "No Username"
                      }
                    />
                  )
                ) : null;
              } else if (message.role === "ai") {
                return !thumbsFilter ? (
                  <RenderChat
                    index={index}
                    key={index}
                    role={"ai"}
                    msg={message.content}
                    timestamp={message.timestamp}
                  />
                ) : message.label === "down" ? (
                  !exclude ? (
                    <RenderChat
                      index={index}
                      key={index}
                      role={"ai"}
                      msg={message.content}
                      timestamp={message.timestamp}
                    />
                  ) : message.resolved === true ? null : (
                    <RenderChat
                      index={index}
                      key={index}
                      role={"ai"}
                      msg={message.content}
                      timestamp={message.timestamp}
                    />
                  )
                ) : null;
              } else if (message.role == "data_used") {
                return !thumbsFilter ? (
                  <Accordion key={index} style={{ marginBottom: "10px" }}>
                    <Card
                      style={{
                        padding: "0px",
                        margin: "0px",
                        maxWidth: "100%",
                        marginBottom: "5px",
                      }}
                    >
                      <Box
                        color={"white"}
                        bg={"teal.400"}
                        paddingY={2}
                        paddingX={4}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>See details</div>
                          <ContextAwareToggle eventKey="-1"></ContextAwareToggle>
                        </div>
                      </Box>

                      <Accordion.Collapse eventKey="-1">
                        <Card.Body>
                          <div>{chatHistory[index - 1].content}</div>
                          <Accordion style={{ marginBottom: "10px" }}>
                            {message?.content?.map((item, index1) => (
                              <Card
                                key={index1}
                                style={{
                                  padding: "0px",
                                  margin: "0px",
                                  maxWidth: "100%",
                                  marginBottom: "5px",
                                }}
                              >
                                <Card.Header
                                  className="bg-primary"
                                  style={{ color: "white" }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                    }}
                                  >
                                    <div>
                                      {item.Source
                                        ? item.Source
                                        : item.source.split("/")[1]}
                                    </div>
                                    <ContextAwareToggle
                                      eventKey={index1}
                                    ></ContextAwareToggle>
                                  </div>
                                </Card.Header>
                                <Accordion.Collapse eventKey={index1}>
                                  <Card.Body>
                                    <div style={{ textAlign: "justify" }}>
                                      <div>{`Page: ${item.page_content}`}</div>
                                    </div>
                                  </Card.Body>
                                </Accordion.Collapse>
                              </Card>
                            ))}
                          </Accordion>
                        </Card.Body>
                      </Accordion.Collapse>
                    </Card>
                  </Accordion>
                ) : message.label === "down" ? (
                  !exclude ? (
                    <Accordion key={index} style={{ marginBottom: "10px" }}>
                      <Card
                        style={{
                          padding: "0px",
                          margin: "0px",
                          maxWidth: "100%",
                          marginBottom: "5px",
                        }}
                      >
                        <Box
                          color={"white"}
                          bg={"teal.400"}
                          paddingY={2}
                          paddingX={4}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div>See details</div>
                            <ContextAwareToggle eventKey="-1"></ContextAwareToggle>
                          </div>
                        </Box>

                        <Accordion.Collapse eventKey="-1">
                          <Card.Body>
                            <div>{chatHistory[index - 1].content}</div>
                            <Accordion style={{ marginBottom: "10px" }}>
                              {message?.content?.map((item, index1) => (
                                <Card
                                  key={index1}
                                  style={{
                                    padding: "0px",
                                    margin: "0px",
                                    maxWidth: "100%",
                                    marginBottom: "5px",
                                  }}
                                >
                                  <Card.Header
                                    className="bg-primary"
                                    style={{ color: "white" }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                      }}
                                    >
                                      <div>
                                        {item.Source
                                          ? item.Source
                                          : item.source.split("/")[1]}
                                      </div>
                                      <ContextAwareToggle
                                        eventKey={index1}
                                      ></ContextAwareToggle>
                                    </div>
                                  </Card.Header>
                                  <Accordion.Collapse eventKey={index1}>
                                    <Card.Body>
                                      <div style={{ textAlign: "justify" }}>
                                        <div>{`Page: ${item.page_content}`}</div>
                                      </div>
                                    </Card.Body>
                                  </Accordion.Collapse>
                                </Card>
                              ))}
                            </Accordion>
                          </Card.Body>
                        </Accordion.Collapse>
                      </Card>
                    </Accordion>
                  ) : message.resolved === true ? null : (
                    <Accordion key={index} style={{ marginBottom: "10px" }}>
                      <Card
                        style={{
                          padding: "0px",
                          margin: "0px",
                          maxWidth: "100%",
                          marginBottom: "5px",
                        }}
                      >
                        <Box
                          color={"white"}
                          bg={"teal.400"}
                          paddingY={2}
                          paddingX={4}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div>See details</div>
                            <ContextAwareToggle eventKey="-1"></ContextAwareToggle>
                          </div>
                        </Box>

                        <Accordion.Collapse eventKey="-1">
                          <Card.Body>
                            <div>{chatHistory[index - 1].content}</div>
                            <Accordion style={{ marginBottom: "10px" }}>
                              {message?.content?.map((item, index1) => (
                                <Card
                                  key={index1}
                                  style={{
                                    padding: "0px",
                                    margin: "0px",
                                    maxWidth: "100%",
                                    marginBottom: "5px",
                                  }}
                                >
                                  <Card.Header
                                    className="bg-primary"
                                    style={{ color: "white" }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                      }}
                                    >
                                      <div>
                                        {item.Source
                                          ? item.Source
                                          : item.source.split("/")[1]}
                                      </div>
                                      <ContextAwareToggle
                                        eventKey={index1}
                                      ></ContextAwareToggle>
                                    </div>
                                  </Card.Header>
                                  <Accordion.Collapse eventKey={index1}>
                                    <Card.Body>
                                      <div style={{ textAlign: "justify" }}>
                                        <div>{`Page: ${item.page_content}`}</div>
                                      </div>
                                    </Card.Body>
                                  </Accordion.Collapse>
                                </Card>
                              ))}
                            </Accordion>
                          </Card.Body>
                        </Accordion.Collapse>
                      </Card>
                    </Accordion>
                  )
                ) : null;
              }
            })}
          </ul>
        </div>
      </div>

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
    </Box>
  );
}

export default RetrievalHistory;
