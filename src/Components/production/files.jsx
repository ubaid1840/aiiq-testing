"use client";
import { useRef, useState, useEffect, useCallback, useContext } from "react";
import { IoMdCloudUpload, IoMdDownload } from "react-icons/io";
import {
  Box,
  Flex,
  Button,
  Spinner,
  Skeleton,
  Stack,
  Img,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  useDisclosure,
  ModalCloseButton,
  Text,
  Progress,
  ModalHeader,
  Link,
  LinkBox,
  SimpleGrid,
} from "@chakra-ui/react";
import { MdDeleteForever } from "react-icons/md";
import axios from "axios";
import { FaEye, FaFile } from "react-icons/fa";
import { CustomToast } from "@/Components/myToast";
import PdfViewer from "@/Components/pdfViewer";
import {
  BsFileEarmarkPdf,
  BsFiletypeDocx,
  BsFiletypeTxt,
} from "react-icons/bs";
import TxtViewer from "@/Components/txtViewer";
import DocxViewer from "@/Components/docxViewer";
import Image from "next/image";
import Cookies from "js-cookie";
import { DecryptCookie } from "@/function/cookiesFunctions";
import { usePathname } from "next/navigation";
import handleTokenSave from "@/function/tokenFunction";

export default function Page({ backendUrl, routes }) {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fileUrl, setFileUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState();
  const [fileType, setFileType] = useState();
  const [uploadingLoading, setUploadingLoading] = useState(false);

  const { addToast } = CustomToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [imageUrl, setImageUrl] = useState();

  const [status, setStatus] = useState(true);
  const [intervalId, setIntervalId] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    if (backendUrl) {
      downloadDocumentPicture();
      fetchUploadedFiles();
    }
  }, [backendUrl]);

  useEffect(() => {
    const initialStatusCheck = async () => {
      try {
        const response = await axios.get(`${backendUrl}/status/`);
        const isProcessed = response.data.status;
        setStatus(isProcessed);

        if (isProcessed == false) {
          checkStatus();
        }
      } catch (error) {
        console.error("Error fetching initial status:", error);
      }
    };
    if (backendUrl) {
      initialStatusCheck();
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [backendUrl]);

  const fetchUploadedFiles = async (retry = false) => {
    axios
      .get(`${backendUrl}/documents/`, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })
      .then((response) => {
        setLoading(false);
        if (Array.isArray(response.data)) {
          setUploadedFiles(response.data);
        }
      })
      .catch(async (e) => {
        if (!retry) {
          try {
            const session = Cookies.get("aiiq_admin_panel_session");
            const key = DecryptCookie(session);
            const parse = JSON.parse(key);

            const filteredArray = routes.filter((item) =>
              pathname.toLowerCase().includes(item.name.toLowerCase())
            );

            await handleTokenSave(
              parse.token,
              parse.email,
              filteredArray[0].value
            );

            await fetchUploadedFiles(true);
          } catch (retryError) {}
        } else {
          setLoading(false);
          addToast({ message: `/documents: ${e.message}`, type: "error" });
        }
      });
  };

  const handleFileChange = (event) => {
    const fileList = Array.from(event.target.files);
    fileList.map((item) => {});
    setFiles(fileList);
  };

  const removeFile = (index) => {
    const updatedFiles = [...files.filter((item, i) => i != index)];
    setFiles(updatedFiles);
  };

  async function uploadFiles() {
    const filteredFiles = files.filter(
      (file) => !uploadedFiles.includes(file.name)
    );

    if (filteredFiles.length > 0) {
      const formData = new FormData();
      for (let i = 0; i < filteredFiles.length; i++) {
        formData.append("file", filteredFiles[i]);
      }

      axios
        .post(`${backendUrl}/upload/`, formData)
        .then(() => {
          setUploadingLoading(false);
          setFiles([]);
          checkStatus();
          fetchUploadedFiles();
        })
        .catch((error) => {
          setUploadingLoading(false);
          addToast({
            message: `Error uploading files : ${error.message}`,
            type: "error",
          });
        });
    }
  }

  const checkStatus = () => {
    const fetchStatus = async () => {
      try {
        const response = await axios.get(`${backendUrl}/status/`);
        const isProcessed = response.data.status;
        setStatus(isProcessed);

        if (isProcessed == true) {
          clearInterval(id);
        }
      } catch (error) {
        console.error("Error fetching status:", error);
      }
    };

    const id = setInterval(fetchStatus, 60000);
    setIntervalId(id);
    fetchStatus();
  };

  const downloadFile = async (documentId) => {
    try {
      const response = await fetch(`${backendUrl}/documents/${documentId}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
      const blob = await response.blob();
      const fileName = documentId;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName || "downloadedFile");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      addToast({
        message: `/documents/${documentId}: ${error.message}`,
        type: "error",
      });
    } finally {
      // setRowLoading(false);
    }
  };

  const ViewFiles = async (documentId) => {
    try {
      const response = await fetch(`${backendUrl}/documents/${documentId}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
      const blob = await response.blob();
      const fileExtension = documentId.split(".").pop();
      let fileBlob;
      if (fileExtension === "pdf") {
        fileBlob = new Blob([blob], { type: "application/pdf" });
      } else if (fileExtension === "txt") {
        fileBlob = new Blob([blob], { type: "text/plain" });
      } else if (fileExtension === "docx") {
        fileBlob = new Blob([blob], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
      }
      const fileUrl = window.URL.createObjectURL(fileBlob);
      setFileUrl(fileUrl);
      setFileType(fileExtension);
    } catch (error) {
      console.error("Error fetching PDF:", error);
    }
  };

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
      console.error("Error fetching PDF:", error);
      setImageUrl("/noImage.png");
    }
  };

  const RenderSelectedFiles = () => {
    return (
      files.length > 0 && (
        <Box overflow="hidden" marginBottom="15px" mt={6}>
          {files.map((file, index) => (
            <RenderSelectedFilesRows key={index} file={file} index={index} />
          ))}
        </Box>
      )
    );
  };

  const RenderSelectedFilesRows = ({ file, index }) => {
    return (
      <div>
        <Box key={index} display={"flex"} justifyContent={"space-between"}>
          <Text fontSize={"12px"}>{file.name}</Text>
          <Button size="sm" variant={"ghost"}>
            <MdDeleteForever
              size={20}
              color="red"
              onClick={() => removeFile(index)}
            />
          </Button>
        </Box>
      </div>
    );
  };

  const RenderUploadedRow = ({ documentId, index }) => {
    const [rowLoading, setRowLoading] = useState(false);

    const deleteFile = async (documentId) => {
      try {
        await axios
          .delete(`${backendUrl}/documents/${documentId}`)
          .then((res) => {
            addToast({
              message: `File deleted successfully`,
              type: "success",
            });
            const temp = [
              ...uploadedFiles.filter((item) => item != documentId),
            ];
            setUploadedFiles(temp);
          });
      } catch (e) {
        addToast({
          message: `/documents/${documentId}: ${e.message}`,
          type: "error",
        });
      } finally {
        setRowLoading(false);
      }
    };

    const extension = documentId?.split(".").pop();
    return (
      <LinkBox
        display={"flex"}
        alignItems={"center"}
        mb={2}
        maxW={"50vw"}
        justifyContent={"space-between"}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          {extension == "pdf" ? (
            <BsFileEarmarkPdf />
          ) : extension == "docx" ? (
            <BsFiletypeDocx />
          ) : extension == "txt" ? (
            <BsFiletypeTxt />
          ) : null}
          <Box
            _hover={{ cursor: "pointer", textDecorationLine: "underline" }}
            onClick={() => {
              onOpen();
              setSelectedFile(documentId);
              ViewFiles(documentId);
            }}
            ml={2}
          >
            {documentId}
          </Box>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexDirection: "row",
          }}
        >
          {rowLoading ? (
            <div style={{ marginLeft: "5px" }}>
              <Spinner size={"sm"} />
            </div>
          ) : (
            <Box
              onClick={() => {
                setRowLoading(true);
                deleteFile(documentId);
              }}
              _hover={{ cursor: "pointer" }}
            >
              <MdDeleteForever size={20} color="red" />
            </Box>
          )}
        </div>
      </LinkBox>
    );
  };

  const RenderUploadedFiles = () => {
    return (
      uploadedFiles.length > 0 && (
        <Box overflow="hidden" marginBottom="15px" mt={4} overflowX={"auto"}>
          <Box
            color="white"
            padding="10px"
            display={"flex"}
            flexDir={"column"}
          ></Box>
          {uploadedFiles.map(
            (file, index) =>
              file !== "better_answers.txt" && (
                <RenderUploadedRow
                  key={index}
                  documentId={file}
                  index={index}
                />
              )
          )}
        </Box>
      )
    );
  };

  const RenderButton = useCallback(() => {
    return (
      <Button
        rounded={"md"}
        onClick={() => {
          if (inputRef.current) inputRef.current.click();
        }}
        leftIcon={<FaFile />}
      >
        <Text fontSize={"14px"} fontWeight="400" mb={0}>
          Browse
        </Text>
        <input
          style={{ display: "none" }}
          ref={inputRef}
          multiple
          type="file"
          onChange={(e) => handleFileChange(e)}
        ></input>
      </Button>
    );
  }, [files]);

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
        <SimpleGrid
          columns={{ base: 1, md: 2 }}
          spacing={4}
          p={0}
          mb={{ base: 20, md: "50px" }}
        >
          <Box position="relative" width="100%" height="100%">
            <Flex
              w="fit-content"
              ml={4}
              flexWrap="wrap"
              bg={"blue.600"}
              borderRadius="5px"
              boxShadow="lg"
              p={4}
              position="absolute"
              top={0}
              left={0}
              zIndex={2}
              fontSize={"20px"}
              fontWeight={"600"}
              color={"white"}
            >
              <Text fontSize={"16px"} fontWeight={"400"} mb={"0px"}>
                Upload Document
              </Text>
            </Flex>
            <Flex
              w="100%"
              alignSelf="center"
              flexWrap="wrap"
              bg="white"
              borderRadius="5px"
              boxShadow="lg"
              mt={"25px"}
              justifyContent="center"
              height={"100%"}
            >
              <Box
                p="6"
                alignSelf={"center"}
                width={"80%"}
                display={"flex"}
                flexDirection={"column"}
              >
                <Box
                  boxShadow="base"
                  p="6"
                  rounded="md"
                  alignSelf={"center"}
                  width="fit-content"
                  justifyContent={"center"}
                  alignItems={"center"}
                  display={"flex"}
                  flexDirection={"column"}
                >
                  <Image
                    src="/upload.jpg"
                    width={300}
                    height={300}
                    alt="browse image"
                  />
                  {loading ? null : <RenderButton />}
                </Box>
                <Text alignSelf={"center"} fontSize={"10px"} mt={"10px"}>
                  Supported formats: TXT, DOCS, PDF
                </Text>
                <RenderSelectedFiles />
                {!status && (
                  <Text alignSelf={"center"} fontSize={"18px"} mt={"10px"}>
                    Processing files...
                  </Text>
                )}

                {files.length > 0 && (
                  <Button
                    isLoading={uploadingLoading}
                    rounded={"md"}
                    onClick={() => {
                      setUploadingLoading(true);
                      uploadFiles();
                    }}
                    leftIcon={<IoMdCloudUpload />}
                  >
                    Upload
                  </Button>
                )}
              </Box>
            </Flex>
          </Box>

          <Box
            position="relative"
            width="100%"
            height="100%"
            mt={{ base: 7, md: 0 }}
          >
            <Flex
              w="fit-content"
              ml={4}
              flexWrap="wrap"
              bg={"blue.600"}
              borderRadius="5px"
              boxShadow="lg"
              p={4}
              position="absolute"
              top={0}
              left={0}
              zIndex={2}
              fontSize={"20px"}
              fontWeight={"600"}
              color={"white"}
            >
              <Text fontSize={"16px"} fontWeight={"400"} mb={"0px"}>
                Word Cloud
              </Text>
            </Flex>
            <Flex
              w="100%"
              alignSelf="center"
              flexWrap="wrap"
              bg="white"
              borderRadius="5px"
              boxShadow="lg"
              mt={"25px"}
              justifyContent="center"
              height={"100%"}
            >
              <Box
                p="6"
                alignItems={"center"}
                width={"100%"}
                justifyContent={"center"}
                display={"flex"}
              >
                <Img
                  src={imageUrl}
                  width={{
                    base: imageUrl === "/noImage.png" ? "20%" : "90%",
                    md: imageUrl === "/noImage.png" ? "20%" : "90%",
                  }}
                />
              </Box>
            </Flex>
          </Box>
        </SimpleGrid>

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
        >
          <Text fontSize={"16px"} fontWeight={"400"} mb={"0px"}>
            Uploaded files
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
          justifyContent="center"
        >
          <Box width="100%" marginTop="20px">
            {loading ? (
              <Stack mt={"20px"}>
                <Skeleton height="20px" />
                <Skeleton height="20px" />
                <Skeleton height="20px" />
              </Stack>
            ) : uploadedFiles.length == 0 ? (
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "10px",
                  color: "#3A3A3A8C",
                  fontSize: "14px",
                }}
              >
                No documents uploaded
              </div>
            ) : (
              <RenderUploadedFiles />
            )}
          </Box>
        </Flex>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setFileType();
          setSelectedFile();
          onClose();
        }}
        size={{ base: "full", md: "6xl" }}
        isCentered
      >
        <ModalOverlay />
        <ModalContent
          maxH={{ base: "80vh", md: "80vh" }}
          width={{ base: "100vw", md: "90vw" }}
        >
          <ModalHeader borderBottom="1px" borderBottomColor="#cccccc" mb="5px">
            Preview
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody
            p={0}
            display="flex"
            flexDirection={{ base: "column", md: "row" }}
          >
            {fileType === "pdf" ? (
              <Box flex={1} minH="50vh">
                <PdfViewer url={fileUrl} />
              </Box>
            ) : fileType === "txt" ? (
              <Box
                minH="50vh"
                alignItems="center"
                justifyContent="center"
                width="100%"
                display="flex"
              >
                <TxtViewer url={fileUrl} />
              </Box>
            ) : fileType === "docx" ? (
              <Box
                minH="50vh"
                alignItems="center"
                justifyContent="center"
                width="100%"
                display="flex"
              >
                <DocxViewer url={fileUrl} />
              </Box>
            ) : (
              <Box
                minH="50vh"
                alignItems="center"
                justifyContent="center"
                width="100%"
                display="flex"
              >
                <Text>Loading preview...</Text>
              </Box>
            )}
          </ModalBody>
          <ModalFooter display="flex" justifyContent="space-between">
            <Button onClick={() => downloadFile(selectedFile)} size="sm">
              <Text fontSize="14px" fontWeight="400" mb={0}>
                Download
              </Text>
            </Button>
            <Button
              colorScheme="red"
              onClick={() => {
                setFileType();
                setSelectedFile();
                onClose();
              }}
              size="sm"
            >
              <Text fontSize="14px" fontWeight="400" mb={0}>
                Close
              </Text>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
