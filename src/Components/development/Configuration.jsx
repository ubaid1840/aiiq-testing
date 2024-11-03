"use client";
import {
  Box,
  Button,
  FormLabel,
  Input,
  Radio,
  RadioGroup,
  Select,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Switch,
  Textarea,
  VStack,
  HStack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Text,
  Flex,
  Grid,
  GridItem,
  Spinner,
  Stack,
  Skeleton,
} from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect, useState, useCallback, useContext } from "react";
import { FaSave, FaPlus, FaTrashAlt } from "react-icons/fa";
import { CustomToast } from "@/Components/myToast";
import handleTokenSave from "@/function/tokenFunction";
import Cookies from "js-cookie";
import { usePathname } from "next/navigation";
import { DecryptCookie } from "@/function/cookiesFunctions";

export default function Configuration({ backendUrl, routes }) {
  const [temperature, settemperature] = useState(0);
  const [k, setk] = useState(0);
  const [llm_service, setllm_service] = useState("");
  const [system_message, setsystem_message] = useState("");
  const [prompt_with_rag, setPrompt_with_rag] = useState("");
  const [services, setServices] = useState([]);
  const [llms, setllms] = useState();
  const [in_use, setIn_use] = useState({});
  const [loading, setLoading] = useState(true);
  const [testingMode, setTestingMode] = useState(false);
  const [testingUsers, setTestingUsers] = useState([]);
  const [greeting, setGreeting] = useState("");
  const { addToast } = CustomToast();
  const [chunk_size, setchunk_size] = useState(0);
  const [chunk_overlap, setchunk_overlap] = useState(0);
  const [valid, setValid] = useState(false);
  const [value, setValue] = useState("");
  const [chunking_in_use, setChunking_in_use] = useState({});
  const [chunking_services, setChunking_Services] = useState([]);
  const [chunking_llms, setChunking_llms] = useState();
  const [chunking_llm_service, setChunking_llm_service] = useState("");
  const [chunking_prompt, setChunking_prompt] = useState("");
  const [valid_chunking, setValid_chunking] = useState(false);
  const [chunking_temparature, setChunking_temperature] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    if (backendUrl) {
      fetchData();
    }
  }, [backendUrl]);

  useEffect(() => {
    if (
      prompt_with_rag.includes("$(context)") &&
      prompt_with_rag.includes("$(query)")
    ) {
      setValid(true);
    } else {
      setValid(false);
    }
  }, [prompt_with_rag]);

  useEffect(() => {
    if (
      chunking_prompt.includes("$(context)") &&
      chunking_prompt.includes("$(query)")
    ) {
      setValid_chunking(true);
    } else {
      setValid_chunking(false);
    }
  }, [chunking_prompt]);

  async function fetchData(retry = false) {
    try {
      await axios
        .get(`${backendUrl}/get_llm_params/`, {
          withCredentials:true,
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })
        .then((response) => {
          setchunk_size(Number(response.data.chunk_size));
          setchunk_overlap(Number(response.data.chunk_overlap));
          setIn_use(response.data.in_use);
          settemperature(Number(response.data.temperature));
          setGreeting(response.data.greeting);
          setk(Number(response.data.k));
          setllm_service(response.data.llm_service);
          setsystem_message(response.data.system_message);
          setValue(response.data["auto-chunking"] ? "1" : "2");
          setPrompt_with_rag(response.data.prompt_with_rag);
          setServices(response.data.services);
          setllms(response.data.llms);

          setChunking_in_use(
            response.data.chunking_in_use ? response.data.chunking_in_use : {}
          );
          setChunking_Services(
            response.data.chunking_services
              ? response.data.chunking_services
              : []
          );
          setChunking_llms(
            response.data.chunking_llms ? response.data.chunking_llms : {}
          );
          setChunking_llm_service(
            response.data.chunking_llm_service
              ? response.data.chunking_llm_service
              : ""
          );

          // setChunking_llm_service(response.data.chunking_services[0]);

          setChunking_prompt(
            response.data.chunking_system_message
              ? response.data.chunking_system_message
              : ""
          );
          setChunking_temperature(Number(response.data.chunking_temperature));
        });
    } catch (e) {
      if (!retry) {
        try {
          const session = Cookies.get("aiiq_admin_panel_session");
          const key = DecryptCookie(session);
          const parse = JSON.parse(key);

          const filteredArray = routes.filter((item) =>
            pathname.toLowerCase().includes(item?.name.toLowerCase())
          );

          await handleTokenSave(
            parse.token,
            parse.email,
            filteredArray[0].value,
            filteredArray[0].name
          );

          await fetchData(true);
        } catch (retryError) {}
      } else {
        addToast({ message: `/get_llm_params: ${e.message}`, type: "error" });
      }
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    if (name == "system_message") {
      setsystem_message(value);
    }
    if (name == "greeting_message") {
      setGreeting(value);
    }
    if (name == "prompt_with_rag") {
      setPrompt_with_rag(value);
    }
    if (name == "chunking_prompt") {
      setChunking_prompt(value);
    }
  };

  const handleSubmit = async (event) => {
    const params = {
      chunking_in_use: chunking_in_use,
      chunking_system_message: chunking_prompt,
      chunking_llm_service: chunking_llm_service,
      chunking_temperature: chunking_temparature,
      in_use: in_use,
      system_message: system_message,
      llm_service: llm_service,
      prompt_with_rag: prompt_with_rag,
      temperature: temperature,
      "auto-chunking": value == "1" ? true : false,
      k: k,
      chunk_size: chunk_size,
      chunk_overlap: chunk_overlap,
      greeting: greeting,
    };
    const testingData = {
      mode: testingMode,
      list: testingUsers,
    };
    event.preventDefault();
    try {
      await axios
        .post(`${backendUrl}/testing-users`, testingData, {
          withCredentials : true,
          headers: {
            "Content-Type": "application/json",
          },
        })
        .then((res) => {});
    } catch (e) {
      addToast({ message: `/testing-users: ${e.message}`, type: "error" });
    }

    try {
      await axios
        .post(`${backendUrl}/set_llm_params/`, params, {
          withCredentials : true,
          headers: {
            "Content-Type": "application/json",
          },
        })
        .then((res) => {
          // console.log(res.data)
        });
    } catch (e) {
      setLoading(false);
      addToast({ message: `/set_llm_params/: ${e.message}`, type: "error" });
    } finally {
      fetchData();
    }
  };

  const handlellmsChange = (e, key) => {
    setIn_use((prevInUse) => ({
      ...prevInUse,
      [key]: e.target.value,
    }));
  };

  const handleChunkingllmsChange = (e, key) => {
    setChunking_in_use((prevInUse) => ({
      ...prevInUse,
      [key]: e.target.value,
    }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
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
          LLM Parameters
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
        pt={"50px"}
        justifyContent="center"
      >
        <Box w="100%" maxW="1200px">
          {loading ? (
            <VStack mt={"20px"} width={"100%"} align={"flex-start"} gap={5}>
              {Array(15)
                .fill()
                .map((_, index) => (
                  <HStack key={index} width="100%" gap={10}>
                    <Skeleton height="20px" width="400px" />
                    <Skeleton height="20px" width="100%" />
                  </HStack>
                ))}
            </VStack>
          ) : (
            <form
              style={{ width: "100%" }}
              onSubmit={(e) => {
                setLoading(true);
                handleSubmit(e);
              }}
            >
              <VStack spacing={6} alignItems="start" w="100%">
                <Grid
                  templateColumns={{ base: "1fr", md: "1fr 3fr" }}
                  gap={6}
                  w="100%"
                >
                  {llms &&
                    Object.keys(llms).map((key) => (
                      <React.Fragment key={key}>
                        <GridItem>
                          <FormLabel className="label-style">
                            {`${key.toUpperCase()} LLM Name:`}
                          </FormLabel>
                        </GridItem>
                        <GridItem>
                          <Select
                            borderColor={"#cccccc"}
                            value={in_use[key]}
                            onChange={(e) => handlellmsChange(e, key)}
                          >
                            {llms[key].map((item, index) => (
                              <option key={index} value={item}>
                                {item}
                              </option>
                            ))}
                          </Select>
                        </GridItem>
                      </React.Fragment>
                    ))}

                  <GridItem>
                    <FormLabel className="label-style">
                      LLM Service To Use:
                    </FormLabel>
                  </GridItem>
                  <GridItem>
                    <RadioGroup
                      onChange={(e) => setllm_service(e)}
                      value={llm_service}
                      name="llm_service"
                    >
                      <HStack spacing={5} wrap="wrap">
                        {services.map((item, index) => (
                          <Radio key={index} value={item}>
                            <Text fontSize={"14px"} fontWeight={"500"}>
                              {item.toUpperCase()}
                            </Text>
                          </Radio>
                        ))}
                      </HStack>
                    </RadioGroup>
                  </GridItem>

                  <GridItem>
                    <FormLabel className="label-style">
                      Prompt Template:
                    </FormLabel>
                  </GridItem>
                  <GridItem>
                    <Textarea
                      borderColor={"#cccccc"}
                      name="prompt_with_rag"
                      value={prompt_with_rag}
                      onChange={handleInputChange}
                    />
                    <Text fontSize="sm" color={valid ? "green.500" : "red.500"}>
                      {prompt_with_rag}
                    </Text>
                  </GridItem>

                  <GridItem>
                    <FormLabel className="label-style">
                      Temperature: {temperature}
                    </FormLabel>
                  </GridItem>
                  <GridItem>
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      value={temperature}
                      onChange={(val) => settemperature(val)}
                    >
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                  </GridItem>

                  <GridItem>
                    <FormLabel className="label-style">
                      Number of Documents (K): {k}
                    </FormLabel>
                  </GridItem>
                  <GridItem>
                    <Slider
                      min={0}
                      max={20}
                      step={1}
                      value={k}
                      onChange={(val) => setk(val)}
                    >
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                  </GridItem>

                  <GridItem>
                    <FormLabel className="label-style">
                      System Message:
                    </FormLabel>
                  </GridItem>
                  <GridItem>
                    <Textarea
                      borderColor={"#cccccc"}
                      name="system_message"
                      value={system_message}
                      onChange={handleInputChange}
                    />
                  </GridItem>

                  <GridItem>
                    <FormLabel className="label-style">
                      Greeting Message:
                    </FormLabel>
                  </GridItem>
                  <GridItem>
                    <Textarea
                      borderColor={"#cccccc"}
                      resize="none"
                      minH={0}
                      name="greeting_message"
                      value={greeting}
                      onChange={handleInputChange}
                    />
                  </GridItem>

                  {chunking_llms &&
                    Object.keys(chunking_llms).map((key) => (
                      <React.Fragment key={key}>
                        <GridItem>
                          <FormLabel className="label-style">
                            {`${key.toUpperCase()} Chunking LLM Name:`}
                          </FormLabel>
                        </GridItem>
                        <GridItem>
                          <Select
                            borderColor={"#cccccc"}
                            value={chunking_in_use[key]}
                            onChange={(e) => handleChunkingllmsChange(e, key)}
                          >
                            {chunking_llms[key].map((item, index) => (
                              <option key={index} value={item}>
                                {item}
                              </option>
                            ))}
                          </Select>
                        </GridItem>
                      </React.Fragment>
                    ))}

                  <GridItem>
                    <FormLabel className="label-style">
                      Chunking LLM Service To Use:
                    </FormLabel>
                  </GridItem>
                  <GridItem>
                    <RadioGroup
                      onChange={(e) => setChunking_llm_service(e)}
                      value={chunking_llm_service}
                      name="chunking_llm_service"
                    >
                      <HStack spacing={5} wrap="wrap">
                        {chunking_services.map((item, index) => (
                          <Radio key={index} value={item}>
                            <Text fontSize={"14px"} fontWeight={"500"}>
                              {item.toUpperCase()}
                            </Text>
                          </Radio>
                        ))}
                      </HStack>
                    </RadioGroup>
                  </GridItem>

                  <GridItem>
                    <FormLabel className="label-style">
                      Chunking System Message:
                    </FormLabel>
                  </GridItem>
                  <GridItem>
                    <Textarea
                      borderColor={"#cccccc"}
                      name="chunking_prompt"
                      value={chunking_prompt}
                      onChange={handleInputChange}
                    />
                    <Text
                      fontSize="sm"
                      color={valid_chunking ? "green.500" : "red.500"}
                    ></Text>
                  </GridItem>

                  <GridItem>
                    <FormLabel className="label-style">
                      Temperature: {chunking_temparature}
                    </FormLabel>
                  </GridItem>
                  <GridItem>
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      value={chunking_temparature}
                      onChange={(val) => setChunking_temperature(val)}
                    >
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                  </GridItem>

                  <GridItem>
                    <FormLabel className="label-style">
                      Chunking Strategy:
                    </FormLabel>
                  </GridItem>
                  <GridItem>
                    <RadioGroup onChange={setValue} value={value}>
                      <Stack direction="row">
                        <Radio value={"1"}>
                          <Text>Auto chunking</Text>
                        </Radio>
                        <Radio value={"2"}>
                          <Text>Manual</Text>
                        </Radio>
                      </Stack>
                    </RadioGroup>
                  </GridItem>
                  {value == "2" ? (
                    <>
                      <GridItem>
                        <FormLabel className="label-style">
                          Chunk Size:
                        </FormLabel>
                      </GridItem>
                      <GridItem>
                        <Input
                          min={0}
                          step={1}
                          type="number"
                          value={chunk_size}
                          onChange={(e) =>
                            setchunk_size(Number(e.target.value))
                          }
                        />
                      </GridItem>

                      <GridItem>
                        <FormLabel className="label-style">
                          Chunk Overlap:
                        </FormLabel>
                      </GridItem>
                      <GridItem>
                        <Input
                          min={0}
                          step={1}
                          type="number"
                          value={chunk_overlap}
                          onChange={(e) =>
                            setchunk_overlap(Number(e.target.value))
                          }
                        />
                      </GridItem>
                    </>
                  ) : null}
                </Grid>

                <Button
                  isDisabled={!valid}
                  type="submit"
                  leftIcon={<FaSave />}
                  colorScheme="blue"
                  className="save-btn"
                  w="200px"
                  alignSelf={"center"}
                >
                  Save Parameters
                </Button>
              </VStack>
            </form>
          )}
        </Box>
      </Flex>
    </div>
  );
}
