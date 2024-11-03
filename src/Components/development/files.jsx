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
  TableContainer,
  Table,
  Thead,
  Tr,
  Th,
  Td,
  Tbody,
  Select,
  VStack,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogCloseButton,
  HStack,
  Switch,
  Wrap,
  WrapItem,
  Textarea,
  Checkbox,
  Center,
  Image,
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
import Cookies from "js-cookie";
import { DecryptCookie } from "@/function/cookiesFunctions";
import { usePathname } from "next/navigation";
import handleTokenSave from "@/function/tokenFunction";
import {
  doc,
  getDoc,
  getFirestore,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { app } from "@/config/firebase";

export default function Page({ backendUrl, routes }) {
  const inputRef = useRef(null);
  const cancelRef = useRef();
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
  const [intervalIdImageProcessing, setIntervalIdImageProcessing] =
    useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [imagePrompt, setImagePrompt] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState(0);
  const [processView, setProcessView] = useState(false);
  const [selectedModel, setSelectedModel] = useState("opanai");
  const [selectionOption, setSelectionOption] = useState("");
  const [localDescription, setLocalDescription] = useState([]);
  const [getImagesLoading, setGetImagesLoading] = useState(false);
  const [imagePromptLoading, setImagePromptLoading] = useState(false);
  const [oldImagePrompt, setOldImagePrompt] = useState("");
  const [filesUnderProcess, setFilesunderProcess] = useState([]);
  const [imagesUnderProcess, setImagesUnderProcess] = useState([]);
  const [imageProcessingGetLoading, setImageProcessingGetLoading] =
    useState(false);
  const [imageProcessingUpdateLoading, setImageProcessingUpdateLoading] =
    useState(false);
  const [imageProcessingAllLoading, setImageProcessingAllLoading] =
    useState(false);
  const [extractedImages, setExtractedImages] = useState({
    filename: "",
    images: [],
    descriptions: [],
  });
  const [oldExtractedImages, setOldExtractedImages] = useState({
    filename: "",
    images: [],
    descriptions: [],
  });
  const {
    isOpen: isOpenImageProcessing,
    onOpen: onOpenImageProcessing,
    onClose: onCloseImageProcessing,
  } = useDisclosure();
  const [existingImages, setExistingImages] = useState([])

  const pathname = usePathname();

  useEffect(() => {
    if (backendUrl) {
      downloadDocumentPicture();
      fetchUploadedFiles();
    }
  }, [backendUrl]);

  useEffect(() => {
    fetchImagePropmpt();
  }, [routes]);

  useEffect(() => {
    const initialStatusCheck = async () => {
      try {
        axios
          .get(`${backendUrl}/status/`, { withCredentials: true })
          .then((response) => {
            if (response.data?.files?.length > 0) {
              setFilesunderProcess(response.data?.files);
            }
            if (response.data?.images?.length > 0) {
              setImagesUnderProcess(response.data?.images);
            }
            const isProcessed = response.data.status;
            setStatus(isProcessed);

            if (isProcessed == false) {
              checkStatus();
            }
          });
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
        withCredentials: true,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })
      .then((response) => {
        if (response.data?.filenames) {
          setLoading(false);
          if (Array.isArray(response.data?.filenames)) {
            setUploadedFiles(response.data?.filenames);
            setExistingImages(response.data?.processed_image)
          }
        }
      })
      .catch(async (e) => {
        if (!retry) {
          try {
            const session = Cookies.get("aiiq_admin_panel_session");
            const key = DecryptCookie(session);
            const parse = JSON.parse(key);

            const filteredArray = routes.filter((item) =>
              pathname.toLowerCase().includes(item?.name?.toLowerCase())
            );

            await handleTokenSave(
              parse.token,
              parse.email,
              filteredArray[0]?.value,
              filteredArray[0].name
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

  function handleUploadedGetImages(filteredFiles) {
    for (let i = 0; i < filteredFiles.length; i++) {
      const formData = new FormData();
      formData.append("filename", filteredFiles[i].name);
      axios.post(`${backendUrl}/get-images`, formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    }
  }
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
        .post(`${backendUrl}/upload/`, formData, { withCredentials: true })
        .then(() => {
          handleUploadedGetImages(filteredFiles);
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

  function checkStatus() {
    const fetchStatus = async () => {
      try {
        axios
          .get(`${backendUrl}/status/`, { withCredentials: true })
          .then((response) => {
            if (response.data?.files?.length > 0) {
              setFilesunderProcess(response.data?.files);
            }
            if (response.data?.images?.length > 0) {
              setImagesUnderProcess(response.data?.images);
            }
            const isProcessed = response.data.status;
            setStatus(isProcessed);

            if (isProcessed == true) {
              clearInterval(id);
            }
          });
      } catch (error) {
        console.error("Error fetching status:", error);
      }
    };

    const id = setInterval(fetchStatus, 15000);
    setIntervalId(id);
    fetchStatus();
  }

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
      } else {
        downloadFile(documentId);
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
          "Content-Type": "application/json",
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

  async function handleImageprocessing(documentId, option) {
    const formData = new FormData();
    formData.append("filename", documentId);
    axios
      .post(`${backendUrl}/get-images`, formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        if (response.data?.prompt) {
          setImagePrompt(response.data?.prompt);
          setOldImagePrompt(response.data?.prompt);
        }
        setGetImagesLoading(false);
        setExtractedImages({
          filename: response.data.filename,
          images: [...response.data.images],
          descriptions: [...response.data.descriptions],
        });
        setOldExtractedImages({
          filename: response.data.filename,
          images: [...response.data.images],
          descriptions: [...response.data.descriptions],
        });
        if (option === "all") {
          if (response?.data?.images.length > 0) {
            let temp = [];
            let temp1 = [];
            response.data.images.map((item, index) => {
              temp.push({
                index: index,
                image: item,
                description: response.data.descriptions[index],
              });
              temp1.push({
                index: index,
                description: response.data.descriptions[index],
              });
            });
            setLocalDescription([...temp1]);
            setSelectedImages([...temp]);
          }
        }
      })
      .catch((e) => {
        setGetImagesLoading(false);
        console.log("Error extracting images :", e?.response?.data);
      });
  }

  const RenderEachTableRow = ({ documentId, index }) => {
    const [rowLoading, setRowLoading] = useState(false);
    const [option, setOption] = useState("");
    const extension = documentId?.split(".").pop();

    const deleteFile = async (documentId) => {
      try {
        await axios
          .delete(`${backendUrl}/documents/${documentId}`, {
            withCredentials: true,
          })
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

    return (
      <Tr key={index} bg={existingImages.filter((item)=> item === documentId).length > 0 ? 'lightgreen' : index % 2 === 0 ? "gray.50" : "white"}>
        <Td>
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
              {`${documentId} ${
                filesUnderProcess.filter((item) => item === documentId).length >
                0
                  ? "(File Processing)"
                  : ""
              }`}
            </Box>
          </div>
        </Td>
        <Td>
          {imagesUnderProcess.filter((item) => item === documentId).length ==
          0 ? (
            <HStack align={"flex-start"}>
              <Select
                isDisabled={
                  filesUnderProcess.filter((item) => item === documentId)
                    .length > 0
                    ? true
                    : false
                }
                size={"sm"}
                value={option}
                onChange={(e) => {
                  setOption(e.target.value);
                }}
              >
                <option value={""}>None</option>
                <option value={"some"}>Some</option>
                <option value={"all"}>All</option>
              </Select>
              {option && option !== "none" && (
                <Button
                  fontSize={"12px"}
                  fontWeight={"400"}
                  size={"sm"}
                  onClick={() => {
                    setGetImagesLoading(true);
                    setLocalDescription([]);
                    setProcessView(false);
                    setCurrentProcessingIndex(0);
                    setSelectedImages([]);
                    setSelectedDocument(documentId);
                    onOpenImageProcessing();
                    setSelectionOption("");
                    handleImageprocessing(documentId, option);
                  }}
                >
                  Process
                </Button>
              )}
            </HStack>
          ) : (
            <div
              style={{ height: "30px", display: "flex", alignItems: "center" }}
            >
              <Text mb={0}>Images processing</Text>
            </div>
          )}
        </Td>

        <Td>
          {filesUnderProcess.filter((item) => item === documentId).length >
          0 ? null : imagesUnderProcess.filter((item) => item === documentId)
              .length == 0 ? (
            rowLoading ? (
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
            )
          ) : null}
        </Td>
      </Tr>
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

  async function fetchImagePropmpt() {
    const db = getFirestore(app, "aiiq-engine");
    if (routes)
      routes.map(async (eachRoute) => {
        if (pathname.toLowerCase().includes(eachRoute?.name.toLowerCase())) {
          const snapshot = await getDoc(
            doc(db, "prompt", `${eachRoute.name}-image-prompt`)
          );
          if (snapshot.exists()) {
            setImagePrompt(snapshot.data().prompt);
            setOldImagePrompt(snapshot.data().prompt);
          }
        }
      });
  }

  async function handleSaveNewImagePrompt() {
    const db = getFirestore(app, "aiiq-engine");
    if (routes)
      routes.map(async (eachRoute) => {
        if (pathname.toLowerCase().includes(eachRoute?.name.toLowerCase())) {
          await setDoc(doc(db, "prompt", `${eachRoute.name}-image-prompt`), {
            prompt: imagePrompt,
          })
            .then(() => {
              setOldImagePrompt(imagePrompt);
              setImagePromptLoading(false);
            })
            .catch((e) => {
              setImagePromptLoading(false);
              console.log(e.code);
              console.log(e.message);
            });
        }
      });
  }

  async function handleSaveImagePrompt() {
    const db = getFirestore(app, "aiiq-engine");
    if (routes)
      routes.map(async (eachRoute) => {
        if (pathname.toLowerCase().includes(eachRoute?.name.toLowerCase())) {
          await updateDoc(doc(db, "prompt", `${eachRoute.name}-image-prompt`), {
            prompt: imagePrompt,
          })
            .then(() => {
              setOldImagePrompt(imagePrompt);
              setImagePromptLoading(false);
            })
            .catch((e) => {
              setImagePromptLoading(false);
              console.log(e.code);
              console.log(e.message);
            });
        }
      });
  }

  async function handleAllImagesProcess() {
    const formData = new FormData();
    formData.append("filename", selectedDocument);
    formData.append("prompt", imagePrompt);
    axios
      .post(`${backendUrl}/process-descriptions`, formData, {
        withCredentials: true,
      })
      .then((response) => {
        setImageProcessingAllLoading(false);
        checkStatus()
        handleCloseImageProcessing();
        addToast({ message: `Processing started`, type: "success" });
      })
      .catch((e) => {
        setImageProcessingAllLoading(false);
        addToast({
          message: `/process-description: ${e?.response?.data?.message}`,
          type: "error",
        });
      });
  }

  const RenderImageForProcessing = useCallback(
    ({ img }) => {
      return (
        <Image
          ml={5}
          width={"300px"}
          height={"300px"}
          objectFit={"contain"}
          src={`data:image/jpeg;base64,${img}`}
        />
      );
    },
    [currentProcessingIndex]
  );

  async function handleUpdateDescription(item, condition) {
    const formData = new FormData();
    formData.append("filename", selectedDocument);
    formData.append("index", item.index);
    formData.append("description", item.description);

    await axios
      .post(`${backendUrl}/update_description`, formData, {
        withCredentials: true,
      })
      .then((response) => {
        setImageProcessingUpdateLoading(false);
        if (condition) {
          setLocalDescription((prevState) => {
            const newState = [...prevState];
            newState[currentProcessingIndex].description = item.description;
            return newState;
          });
        }
        setOldExtractedImages((prevState) => {
          const newState = { ...prevState };
          newState.descriptions[item.index] =
            extractedImages.descriptions[item.index];
          return newState;
        });

        addToast({
          message: `Description updated successfully`,
          type: "success",
        });
      })
      .catch((e) => {
        setImageProcessingUpdateLoading(false);
        addToast({
          message: `/update_description: ${e?.response?.data?.message}`,
          type: "error",
        });
      });
  }

  async function handleGetDescription(item) {
    const formData = new FormData();
    formData.append("filename", selectedDocument);
    formData.append("index", item.index);
    formData.append("prompt", imagePrompt);

    await axios
      .post(`${backendUrl}/get-description`, formData, {
        withCredentials: true,
      })
      .then((response) => {
        setImageProcessingGetLoading(false);
        if (response.data.description) {
          setSelectedImages((prevState) => {
            const newState = [...prevState];
            newState[currentProcessingIndex].description =
              response.data.description;
            return newState;
          });
        }
      })
      .catch((e) => {
        console.log(e);
        console.log(e.response);
        setImageProcessingGetLoading(false);
        addToast({
          message: `/get-description: ${e?.response?.data?.message}`,
          type: "error",
        });
      });
  }

  function handleCloseImageProcessing() {
    setCurrentProcessingIndex(0);
    onCloseImageProcessing();
    setImageProcessingGetLoading(false);
    setImageProcessingUpdateLoading(false);
    setSelectedDocument(null);
    setExtractedImages({
      filename: "",
      images: [],
      descriptions: [],
    });
    setOldExtractedImages({
      filename: "",
      images: [],
      descriptions: [],
    });
    setLocalDescription([]);
    setProcessView(false);
    setSelectedImages([]);
  }

  function handleSelectionOption(val) {
    if (val == "selectAll") {
      const temp = extractedImages.images.map((eachImage, ind) => {
        return {
          image: eachImage,
          index: ind,
          description: extractedImages[ind]?.descriptions,
        };
      });
      const temp1 = extractedImages.images.map((eachImage, ind) => {
        return {
          index: ind,
          description: extractedImages[ind]?.descriptions,
        };
      });
      setLocalDescription([...temp1]);
      setSelectedImages([...temp]);
    } else if (val == "deselectAll") {
      setLocalDescription([]);
      setSelectedImages([]);
    } else if (val == "inverse") {
      const updatedSelectedImages = extractedImages.images
        .map((image, index) => {
          const isSelected = selectedImages.some(
            (selected) => selected.index === index
          );
          if (!isSelected) {
            return {
              image: image,
              index: index,
              description: extractedImages?.descriptions[index],
            };
          }
          return null;
        })
        .filter(Boolean);

      setSelectedImages(updatedSelectedImages);
      setLocalDescription(
        updatedSelectedImages.map(({ description, index }) => ({
          index,
          description,
        }))
      );
    }
  }

  function handleCheckboxChange(e, index, item) {
    if (e.target.checked) {
      setLocalDescription((prevState) => {
        const newState = [...prevState];
        newState.push({
          index: index,
          description: extractedImages?.descriptions[index],
        });
        return newState;
      });
      setSelectedImages((prevState) => {
        const newState = [...prevState];
        newState.push({
          image: item,
          index: index,
          description: extractedImages?.descriptions[index],
        });
        return newState;
      });
    } else {
      setLocalDescription((prevState) => {
        const filterState = prevState.filter((itm) => itm.index !== index);
        return [...filterState];
      });
      setSelectedImages((prevState) => {
        const filterState = prevState.filter((itm) => itm.index !== index);
        return [...filterState];
      });
    }
  }

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
                  <Img
                    src="/upload.jpg"
                    width={"300px"}
                    height={"300px"}
                    alt="browse image"
                  />
                  {loading ? null : !status ? null : <RenderButton />}
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
              uploadedFiles.length > 0 && (
                <TableContainer>
                  <Table variant="simple" colorScheme="gray" size={"sm"}>
                    <Thead bg={"gray.700"} height={"40px"}>
                      <Tr>
                        <Th color={"white"}>File</Th>
                        <Th color={"white"}>Process Images</Th>
                        <Th color={"white"}>Delete</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {uploadedFiles.map(
                        (file, index) =>
                          file !== "better_answers.txt" &&
                          !file.includes(".json") && (
                            <RenderEachTableRow
                              key={index}
                              documentId={file}
                              index={index}
                            />
                          )
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              )
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

      <AlertDialog
        isOpen={isOpenImageProcessing}
        leastDestructiveRef={cancelRef}
        onClose={onCloseImageProcessing}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent
            width={"800px"}
            maxW={"800px"}
            maxH={"98vh"}
            overflowY={"auto"}
          >
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Process Images
            </AlertDialogHeader>
            {getImagesLoading ? (
              <Center w={"100%"} height={"500px"}>
                <Spinner size={"sm"} />
              </Center>
            ) : !processView ? (
              extractedImages?.images.length == 0 ? (
                <AlertDialogBody overflowY={"auto"}>
                  <Center w={"100%"} height={"500px"}>
                    <Text>No images found</Text>
                  </Center>
                </AlertDialogBody>
              ) : (
                <AlertDialogBody overflowY={"auto"}>
                  <HStack alignItems={"center"}>
                    <Text mb={0}>Filename: </Text>
                    <Text mb={0}>{extractedImages?.filename}</Text>
                  </HStack>
                  <HStack
                    justify={"space-between"}
                    width={"100%"}
                    align={"center"}
                    mt={2}
                  >
                    <HStack alignItems={"center"}>
                      <Text mb={0}>Model</Text>
                      <Select
                        w={"200px"}
                        maxW={"200px"}
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                      >
                        <option value={"openai"}>Open AI</option>
                        <option value={"gemini"}>Gemini</option>
                      </Select>
                    </HStack>
                    <HStack alignItems={"center"}>
                      <Text mb={0}>Option</Text>
                      <Select
                        w={"200px"}
                        maxW={"200px"}
                        value={selectionOption}
                        onChange={(e) => {
                          handleSelectionOption(e.target.value);
                          setSelectionOption(e.target.value);
                        }}
                      >
                        <option value={""}>Select one</option>
                        <option value={"selectAll"}>Select All</option>
                        <option value={"deselectAll"}>Deselect All</option>
                        <option value={"inverse"}>Inverse</option>
                      </Select>
                    </HStack>
                  </HStack>
                  {extractedImages?.images?.length > 0 && (
                    <VStack align={"flex-start"} width={"100%"} mt={2}>
                      {extractedImages?.images.map((item, index) => (
                        <HStack
                          key={index}
                          align={"flex-start"}
                          gap={5}
                          width={"100%"}
                          justify={"space-between"}
                        >
                          <Checkbox
                            isChecked={
                              selectedImages.length > 0
                                ? selectedImages.some(
                                    (eachImage) => eachImage.index === index
                                  )
                                : false
                            }
                            onChange={(e) =>
                              handleCheckboxChange(e, index, item)
                            }
                          />
                          <Image
                            ml={5}
                            height={"200px"}
                            width={"200px"}
                            objectFit={"contain"}
                            src={`data:image/jpeg;base64,${item}`}
                          />
                          <VStack align={"flex-start"}>
                            <Textarea
                              isDisabled={imageProcessingUpdateLoading}
                              width={"450px"}
                              height={"140px"}
                              resize={"none"}
                              borderColor={"#cccccc"}
                              value={extractedImages?.descriptions[index]}
                              onChange={(e) => {
                                setExtractedImages((prevState) => {
                                  const newState = { ...prevState };
                                  newState.descriptions[index] = e.target.value;
                                  return newState;
                                });
                              }}
                            />
                            {extractedImages.descriptions[index] !==
                              oldExtractedImages.descriptions[index] && (
                              <Button
                                size={"sm"}
                                colorScheme={"red"}
                                isLoading={
                                  imageProcessingUpdateLoading === index
                                }
                                mt={1}
                                onClick={() => {
                                  setImageProcessingUpdateLoading(index);
                                  handleUpdateDescription(
                                    {
                                      index: index,
                                      description:
                                        extractedImages.descriptions[index],
                                    },
                                    false
                                  );
                                }}
                              >
                                Save Description
                              </Button>
                            )}
                          </VStack>
                        </HStack>
                      ))}
                    </VStack>
                  )}
                </AlertDialogBody>
              )
            ) : (
              <AlertDialogBody overflowY={"auto"}>
                <VStack align={"flex-start"} gap={5}>
                  {selectedImages[currentProcessingIndex]?.image && (
                    <RenderImageForProcessing
                      img={selectedImages[currentProcessingIndex].image}
                    />
                  )}

                  <VStack gap={0} align={"flex-start"} w={"100%"}>
                    <Text mb={0}>Description</Text>
                    {imageProcessingGetLoading ? (
                      <Skeleton width={"100%"} height={"50px"} />
                    ) : (
                      <Textarea
                        isDisabled={imageProcessingUpdateLoading}
                        w={"100%"}
                        resize={"none"}
                        borderColor={"#cccccc"}
                        value={
                          selectedImages[currentProcessingIndex].description
                        }
                        onChange={(e) => {
                          setSelectedImages((prevState) => {
                            let newState = [...prevState];
                            newState[currentProcessingIndex].description =
                              e.target.value;
                            return newState;
                          });
                        }}
                      />
                    )}
                    {selectedImages[currentProcessingIndex].description !==
                      localDescription[currentProcessingIndex].description && (
                      <Button
                        colorScheme={"red"}
                        isLoading={imageProcessingUpdateLoading}
                        mt={3}
                        onClick={() => {
                          setImageProcessingUpdateLoading(true);
                          handleUpdateDescription(
                            selectedImages[currentProcessingIndex],
                            true
                          );
                        }}
                      >
                        Save Description
                      </Button>
                    )}
                  </VStack>
                  <VStack gap={0} align={"flex-start"} w={"100%"}>
                    <Text mb={0}>Prompt</Text>
                    <Textarea
                      isDisabled={
                        imagePromptLoading ||
                        imageProcessingGetLoading ||
                        imageProcessingUpdateLoading
                      }
                      w={"100%"}
                      borderColor={"#cccccc"}
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                    />
                    {imagePrompt !== oldImagePrompt && (
                      <Button
                        isLoading={imagePromptLoading}
                        onClick={() => {
                          setImagePromptLoading(true);
                          if (oldImagePrompt) {
                            handleSaveImagePrompt();
                          } else {
                            handleSaveNewImagePrompt();
                          }
                        }}
                        mt={2}
                      >
                        Save Prompt
                      </Button>
                    )}
                  </VStack>
                  <Button
                    isLoading={imageProcessingGetLoading}
                    onClick={() => {
                      setImageProcessingGetLoading(true);
                      handleGetDescription(
                        selectedImages[currentProcessingIndex]
                      );
                    }}
                  >
                    Get Description
                  </Button>
                </VStack>
              </AlertDialogBody>
            )}

            <AlertDialogFooter>
              <Button
                ml={3}
                onClick={() => {
                  handleCloseImageProcessing();
                }}
              >
                Cancel
              </Button>
              {!processView ? (
                <Button
                  isDisabled={
                    imageProcessingUpdateLoading || selectedImages.length === 0
                  }
                  ml={3}
                  onClick={() => {
                    setImageProcessingUpdateLoading(false);
                    setProcessView(true);
                  }}
                >
                  Next
                </Button>
              ) : (
                <>
                  {currentProcessingIndex == selectedImages.length - 1 ? (
                    <>
                      <Button
                        isDisabled={
                          imageProcessingGetLoading ||
                          imageProcessingUpdateLoading ||
                          imageProcessingAllLoading ||
                          currentProcessingIndex == 0
                        }
                        ml={3}
                        onClick={() => {
                          if (currentProcessingIndex > 0) {
                            setCurrentProcessingIndex(
                              currentProcessingIndex - 1
                            );
                          }
                        }}
                      >
                        Previous
                      </Button>
                      <Button
                        isDisabled={
                          imageProcessingGetLoading ||
                          imageProcessingUpdateLoading ||
                          imageProcessingAllLoading
                        }
                        ml={3}
                        onClick={() => {
                          checkStatus()
                          handleCloseImageProcessing();
                        }}
                      >
                        Finish
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        isDisabled={
                          imageProcessingGetLoading ||
                          imageProcessingUpdateLoading ||
                          imageProcessingAllLoading ||
                          currentProcessingIndex == 0
                        }
                        ml={3}
                        onClick={() => {
                          if (currentProcessingIndex > 0) {
                            setCurrentProcessingIndex(
                              currentProcessingIndex - 1
                            );
                          }
                        }}
                      >
                        Previous
                      </Button>
                      <Button
                        isDisabled={
                          imageProcessingGetLoading ||
                          imageProcessingUpdateLoading ||
                          imageProcessingAllLoading
                        }
                        ml={3}
                        onClick={() => {
                          if (currentProcessingIndex < selectedImages.length) {
                            setCurrentProcessingIndex(
                              currentProcessingIndex + 1
                            );
                          }
                        }}
                      >
                        Next
                      </Button>
                    </>
                  )}

                  <Button
                    isLoading={imageProcessingAllLoading}
                    isDisabled={
                      imageProcessingGetLoading || imageProcessingUpdateLoading
                    }
                    ml={3}
                    onClick={() => {
                      setImageProcessingAllLoading(true);
                      handleAllImagesProcess();
                    }}
                  >
                    Apply to all
                  </Button>
                </>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}
