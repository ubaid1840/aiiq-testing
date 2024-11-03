import { Box, Input, Spinner, Text, VStack } from "@chakra-ui/react";
import axios from "axios";
import { useContext, useState } from "react";
import { GoSearch } from "react-icons/go";
import { CustomToast } from "@/Components/myToast";
import { RxCross2 } from "react-icons/rx";

export default function SearchQueryDev({ closeSearch, url }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState([]);
  const { addToast } = CustomToast();
  const [loading, setLoading] = useState(false);

  async function handleSearchQuery() {
    try {
      await axios
        .post(
          `${url}/search`,
          {
            query: query,
          },
          {
            withCredentials: true,
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          }
        )
        .then((response) => {
          setLoading(false)
          setResult(response.data);
        });
    } catch (e) {
      setLoading(false)
      addToast({ message: `/search: ${e.message}`, type: "error" });
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && query) {
      setLoading(true);
      e.preventDefault();
      handleSearchQuery();
    }
  };

  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  return (
    <Box width={"100%"} height={"100%"} padding={5}>
      <VStack width={"100%"} height={"100%"}>
        <Box
        p={1}
          _hover={{ cursor: "pointer", backgroundColor:'#EEEEEE', borderRadius:5 }}
          display={"flex"}
          alignSelf={"flex-start"}
          onClick={closeSearch}
        >
          <RxCross2 size={20} color="black"  />
        </Box>
        <Box display={"flex"} alignItems={"center"}>
          <Input
          borderColor={'gray'}
            placeholder="Enter query"
            size="md"
            mr={2}
            _placeholder={{ color: "gray", fontsize:'12px' }}
            onChange={(e) => setQuery(e.target.value)}
            value={query}
            onKeyDown={handleKeyDown}
            fontSize={'14px'}
          />
          <Box
           p={'10px'}
           _hover={{ cursor: "pointer", backgroundColor:'#EEEEEE', borderRadius:5 }}
            onClick={() => {
              if (query) {
                setLoading(true);
                handleSearchQuery();
              }
            }}
          >
            <GoSearch size={20} />
          </Box>
        </Box>
        <Box width={"100%"} height={"100%"}>
          {result.length > 0 ? (
            result.map((item, index) => (
              <Box key={index} pb={5}>
                {Object.entries(item.meta).map(([key, value]) => (
                  <Text
                    fontSize={"16px"}
                    fontWeight={"700"}
                    wordBreak={"break-all"}
                    key={key}
                  >
                    {capitalizeFirstLetter(key)}: {value}
                  </Text>
                ))}
                <Text pt={2} fontSize={"14px"} wordBreak={"break-all"}>
                  {item?.content}
                </Text>
              </Box>
            ))
          ) : loading ? (
            <Box
              width={"100%"}
              height={"100%"}
              display={"flex"}
              alignItems={"center"}
              justifyContent={"center"}
            >
              <Spinner />
            </Box>
          ) : (
            <Box
              width={"100%"}
              height={"100%"}
              display={"flex"}
              alignItems={"center"}
              justifyContent={"center"}
            >
              <Text fontSize={"14px"} color={"#cccccc"}>
                Enter query to search content
              </Text>
            </Box>
          )}
        </Box>
      </VStack>
    </Box>
  );
}
