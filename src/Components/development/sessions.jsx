"use client";
import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Select,
  Skeleton,
  Spinner,
  Text,
  useBreakpointValue,
  VStack,
} from "@chakra-ui/react";
import { Nav, Col, Row, Tab, Form } from "react-bootstrap";
import RetrievalHistory from "@/Components/development/RetrievalHistory";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaFilter } from "react-icons/fa";
import { CustomToast } from "@/Components/myToast";
import ReactMarkdown from "react-markdown";
import getResult from "../loadMore";
import moment from "moment";
import getResultDev from "./loadMoreDev";

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

export default function Page({ backendUrl, routes }) {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState();
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setendDate] = useState("");
  const [filterPress, setFilterPress] = useState(false);
  const { addToast } = CustomToast();

  const [loadMore, setLoadMore] = useState(10);
  const [selectedFilterUser, setSelectedFilterUser] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [thumbsDownFilter, setThumbsDownFilter] = useState(false);
  const [excludeThumbsDown, setExcludeThumbsDown] = useState(false);
  const [counter, setCounter] = useState(2);
  const [lastDate, setLastDate] = useState()
  const [loadmoreLoading, setLoadmoreLoading] = useState(false);

  useEffect(() => {
    if (backendUrl) {
      fetchData(lastDate);
    }
  }, [backendUrl]);

  useEffect(()=>{
    if(sessions.length > 0){
      let emails = sessions.map((item) => {
        return item.username;
      });
      const uniqueEmails = [...new Set(emails)];
      setAllUsers(uniqueEmails);
    }
        
  },[sessions])

  async function fetchData(last) {
    try {
      const response = await getResultDev(backendUrl, last);
      setLastDate(response.lastDate);
      if (response.data.length > 0) {
        response.data.forEach((obj) => {
          if (obj.hasOwnProperty("session_id")) {
            obj.id = obj.session_id;
            delete obj.session_id;
          }
        });
        const temp = [...response.data];
        temp.reverse();
        const filteredTemp = [...temp.filter((item) => item.headline)];
        setSessions((prevState) => {
          if (prevState.length === 0) {
            return [...filteredTemp];
          }
          if (filteredTemp.length === 0) {
            return [...prevState];
          }
          if (
            prevState[0]?.timestamp !== filteredTemp[0]?.timestamp &&
            prevState[prevState.length - 1]?.timestamp !==
              filteredTemp[filteredTemp.length - 1]?.timestamp
          ) {
            return [...prevState, ...filteredTemp];
          }
          return prevState;
        });
      }
    } catch (e) {
      addToast({ message: `/sessions: ${e.message}`, type: "error" });
    } finally {
      setLoading(false);
      setLoadmoreLoading(false);
    }

    // try {
    //   const response = await axios.get(`${backendUrl}/sessions`, {
    //     headers: {
    //       "Access-Control-Allow-Origin": "*",
    //       "Cache-Control": "no-cache, no-store, must-revalidate",
    //       Pragma: "no-cache",
    //       Expires: "0",
    //     },
    //   });
    //   if (Array.isArray(response.data)) {
    //     if (response.data.length > 0) {
    //       let temp = [...response.data];
    //       temp.forEach((obj) => {
    //         if (obj.hasOwnProperty("userName") && obj.userName) {
    //           obj.username = obj.userName;
    //           delete obj.userName;
    //         }
    //       });
    //       for (let j = 0; j < temp.length; j++) {
    //         let firstQueryTimestamp = null;
    //         for (let i = 0; i < temp[j].data.length; i++) {
    //           if (temp[j].data[i].role === "query") {
    //             firstQueryTimestamp = temp[j].data[i].timestamp;
    //             break;
    //           }
    //         }
    //         if (firstQueryTimestamp) {
    //           temp[j].timestamp = firstQueryTimestamp;
    //         }
    //       }
    //       let emails = temp.map((item) => {
    //         return item.username;
    //       });
    //       const uniqueEmails = [...new Set(emails)];
    //       setAllUsers(uniqueEmails);

    //       temp.reverse();
    //       const filteredTemp = [...temp.filter((item) => item.headline)];
    //       setSessions([...filteredTemp]);
    //     }
    //   } else {
    //     addToast({ message: `/sessions: Gateway error`, type: "error" });
    //   }
    // } catch (e) {
    //   addToast({ message: `/sessions: ${e.message}`, type: "error" });
    // } finally {
    //   setLoading(false);
    // }
  }

  function handleFilter() {
    fetchFilterData();
  }

  async function fetchFilterData() {
    const data = {
      start_date: startDate + "T00:00:00",
      end_date: endDate + "T23:59:59",
    };
    try {
      const response = await axios.post(`${backendUrl}/sessions/filter`, data, {withCredentials : true, headers : {
        "Content-Type": "application/json",
      }});
      setFilterPress(true);
      if (response.data.length > 0) {
        response.data.forEach((obj) => {
          if (obj.hasOwnProperty("session_id")) {
            obj.id = obj.session_id;
            delete obj.session_id;
          }
        });
        const temp = [...response.data];
        temp.reverse();
        const filteredTemp = [...temp.filter((item) => item.headline)];
        setSessions([...filteredTemp]);
      }
    } catch (e) {
      addToast({ message: `/sessions/filter: ${e.message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  }
  const RenderChat = useCallback(
    ({ session_id }) => {
      return (
        <RetrievalHistory
          session_id={session_id}
          url={`${backendUrl}`}
          thumbsFilter={thumbsDownFilter}
          exclude={excludeThumbsDown}
        />
      );
    },
    [selectedSession, thumbsDownFilter, excludeThumbsDown]
  );

  function handleLoadMore() {
    // if (loadMore < sessions.length) {
    //   setLoadMore(loadMore + 10);
    // }
    fetchData(lastDate);
  }
  return (
    <Box display="flex" flexDirection="column" width="100%">
      <Flex
        w="fit-content"
        ml={4}
        flexWrap="wrap"
        bg={"blue.600"}
        borderRadius="5px"
        boxShadow="lg"
        p={4}
        mb={"-30px"}
        fontSize={"20px"}
        fontWeight={"600"}
        color={"white"}
        zIndex={2}
        mt={4}
      >
        <Text fontSize={"16px"} fontWeight={"400"} mb={"0px"}>
          Sessions
        </Text>
      </Flex>

      <Flex
        w="100%"
        alignSelf="center"
        flexWrap="wrap"
        bg="white"
        borderRadius="5px"
        boxShadow="lg"
        p={6}
        pt={"20px"}
        flexDirection={{ base: "column", md: "row" }}
      >
        <Flex
          width={{ base: "100%", md: "auto" }}
          flexDirection={{ base: "column", md: "row" }}
          mt={{ base: "20px", md: "40px" }}
          mb="20px"
          // justifyContent="space-between"
        >
          <Row className="w-200 mt-3" style={{ alignItems: "end" }}>
            <Col xs={12} md="auto" className="mb-3 mb-md-0">
              <div>Start date</div>
              <Form.Control
                disabled={sessions.length === 0}
                style={{ width: "100%" }}
                type="date"
                value={startDate}
                placeholder="Start Date"
                onChange={(e) => {
                  // console.log(e.target.value);
                  setStartDate(e.target.value);
                }}
              />
            </Col>
            <Col xs={12} md="auto" className="mb-3 mb-md-0">
              <div>End date</div>
              <Form.Control
                disabled={sessions.length === 0}
                style={{ width: "100%" }}
                type="date"
                value={endDate}
                placeholder="End Date"
                onChange={(e) => setendDate(e.target.value)}
              />
            </Col>
            <Col xs={12} md="auto" className="mb-3 mb-md-0">
              <div>Username</div>
              <Select
                isDisabled={sessions.length == 0}
                style={{ borderColor: "#cccccc", width: "280px" }}
                value={selectedUser}
                onChange={(e) => {
                  setSelectedUser(e.target.value);
                }}
              >
                <option style={{ display: "none" }} value="none">
                  None
                </option>
                <option value={""}>All</option>
                {allUsers.map(
                  (item, index) =>
                    item && (
                      <option key={index} value={item}>
                        {item}
                      </option>
                    )
                )}
              </Select>
            </Col>

            <Col xs={12} md="auto" className="mb-3 mb-md-0">
              <VStack align={"flex-start"} gap={0}>
                <Checkbox
                  onChange={(e) => setThumbsDownFilter(e.target.checked)}
                >
                  Thumbs down
                </Checkbox>
                <Checkbox
                  isDisabled={!thumbsDownFilter}
                  onChange={(e) => setExcludeThumbsDown(e.target.checked)}
                >
                  Exclude resolved
                </Checkbox>
              </VStack>
            </Col>

            <Col xs={12} md="auto" className="mb-3 mb-md-0">
              <Button
                isDisabled={sessions.length === 0 || !startDate || !endDate}
                style={{ width: "100%" }}
                rounded={"md"}
                className="ml-md-2"
                leftIcon={<FaFilter />}
                onClick={() => {
                  setSelectedSession();
                  setSessions([]);
                  setLoading(true);
                  handleFilter();
                }}
              >
                <Text fontSize={"14px"} fontWeight="400" mb={"0px"}>
                  Filter
                </Text>
              </Button>
            </Col>

            {filterPress && (
              <Col xs={12} md="auto">
                <Button
                  style={{ width: "100%" }}
                  bg={"red"}
                  className="ml-md-2"
                  _hover={{
                    bg: "red.600",
                  }}
                  onClick={() => {
                    setStartDate("");
                    setendDate("");
                    setSelectedSession();
                    setSessions([]);
                    setLoading(true);
                    fetchData(moment(new Date()).format("YYYY-MM-DD"));
                    setFilterPress(false);
                    setSelectedUser("");
                  }}
                >
                  <Text fontSize={"14px"} fontWeight="400" mb={"0px"}>
                    Clear
                  </Text>
                </Button>
              </Col>
            )}
          </Row>
        </Flex>
      </Flex>

      <Flex
        w="100%"
        alignSelf="center"
        justifyContent="space-between"
        pt={6}
        pb={4}
        flexDirection={{ base: "column", md: "row" }}
        maxH={"580px"}
      >
        <Box
          width={{ base: "100%", md: "300px" }}
          bg={"white"}
          p={6}
          rounded={"md"}
          flexWrap="wrap"
          borderRadius="5px"
          boxShadow="lg"
          overflowY={"auto"}
          mb={{ base: 4, md: 0 }}
        >
          {sessions && sessions.length !== 0
            ? sessions
                .filter((item) => item?.username?.includes(selectedUser))
                .map((session_id, index) => (
                  <Box
                    key={index}
                    width="100%"
                    wordBreak="break-word"
                    marginBottom="5px"
                    border="1px solid"
                    borderRadius="5px"
                    borderColor="#cccccc"
                    backgroundColor={
                      selectedSession === session_id.id
                        ? "blue.600"
                        : "gray.100"
                    }
                    color={
                      selectedSession === session_id.id ? "white" : "black"
                    }
                    _hover={{
                      bg: "blue.400",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    <Box
                      padding={2}
                      onClick={() => {
                        setSelectedSession(session_id.id);
                      }}
                      style={{ fontSize: "13px", fontWeight: "500" }}
                    >
                      <div className="markdown">
                        <ReactMarkdown>{session_id.headline}</ReactMarkdown>
                      </div>
                      <Flex
                        justifyContent="space-between"
                        fontSize="10px"
                        mt={2}
                      >
                        <Box width="48%">{session_id.username}</Box>
                        <Box width="48%" textAlign="end">
                          {formatTimestamp(session_id.timestamp)}
                        </Box>
                      </Flex>
                    </Box>
                  </Box>
                ))
            : null}
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "10px",
            }}
          >
            {loading ? (
              <VStack mt={"20px"} width={"100%"} align={"flex-start"} gap={1}>
                {Array(4)
                  .fill()
                  .map((_, index) => (
                    <Skeleton
                      key={index}
                      height="100px"
                      width="100%"
                      borderRadius={"10px"}
                    />
                  ))}
              </VStack>
            ) : (
              !filterPress &&
              <Button
                isLoading={loadmoreLoading}
                onClick={() => {
                  setLoadmoreLoading(true);
                  handleLoadMore();
                }}
              >
                Load more
              </Button>
            )}
          </div>
        </Box>

        {selectedSession && (
          <Box
            width={{ base: "100%", md: "78%" }}
            bg={"white"}
            rounded={"md"}
            flexWrap="wrap"
            borderRadius="5px"
            boxShadow="lg"
            overflow={"hidden"}
            overflowY={"auto"}
          >
            <RenderChat
              session_id={selectedSession}
              thumbsFilter={thumbsDownFilter}
              exclude={excludeThumbsDown}
            />
          </Box>
        )}
      </Flex>
    </Box>
  );
}
