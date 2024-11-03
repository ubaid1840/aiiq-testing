"use client";
import PanelLayout from "@/Layout/CustomLayoutDev";
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
  HStack,
  VStack,
  Input,
  Radio,
  Checkbox,
  Switch,
} from "@chakra-ui/react";
import Cookies from "js-cookie";
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
import useCheckSession from "@/function/checkSession";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { app, storage } from "@/config/firebase";
import {
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  setDoc,
} from "firebase/firestore";
import { usePathname } from "next/navigation";

export default function Page({ backendUrl, routes }) {
  const inputRef = useRef(null);
  const inputRefWordCloud = useRef(null);
  const iconInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const { addToast } = CustomToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [logoUrl, setLogoUrl] = useState("/noImage.png");
  const [logoLoading, setLogoLoading] = useState(true);
  const [iconsLoading, setIconsLoading] = useState(false);
  const [iconFetchingLoad, setIconFetchingLoad] = useState(true);
  const [iconFiles, setIconFiles] = useState([]);
  const [iconLink, setIconLink] = useState("");
  const [iconsUrl, setIconsUrl] = useState({ data: [] });
  const [currentRoute, setCurrentRoute] = useState();
  const pathname = usePathname();
  const [imageUrl, setImageUrl] = useState();
  const [imageUrlUploaded, setImageUrlUploaded] = useState();
  const [wordCloudLoading, setWordCloudLoading] = useState(true);
  const [filesWordCloud, setFilesWordCloud] = useState([]);
  const [first, setFirst] = useState(false);
  const [switchLoading, setSwitchLoading] = useState(false);
 
  useEffect(() => {
    if (routes)
      routes.map((eachRoute) => {
        if (pathname.toLowerCase().includes(eachRoute.name.toLowerCase())) {
          setCurrentRoute(eachRoute.name);
        }
      });
  }, [routes]);

  useEffect(() => {
    if (currentRoute) {
      downloadDocumentPicture();
      downloadUploadedDocumentPicture();
      fetchLogo();
      fetchIcons();
    }
  }, [currentRoute]);

  async function fetchLogo() {
    const logoRef = ref(storage, `${currentRoute}/images/logo.png`);
    getDownloadURL(logoRef)
      .then((url) => {
        if (url) {
          setLogoUrl(url);
          setLogoLoading(false);
        }
      })
      .catch((error) => {
        // addToast({ message: `/appearance: ${error.code}`, type: "error" });
        setLogoLoading(false);
      });
  }

  async function fetchIcons() {
    const db = getFirestore(app, "aiiq-engine");
    try {
      const docSnap = await getDoc(
        doc(db, "appearance", `${currentRoute}-icons`)
      );
      if (docSnap.exists()) {
        setIconsUrl(docSnap.data());
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIconFetchingLoad(false);
    }
  }

  async function downloadDocumentPicture() {
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
      console.error("Error fetching:", error);
      setImageUrl("/noImage.png");
    }
  }

  async function downloadUploadedDocumentPicture() {
    const db = getFirestore(app, "aiiq-engine");
    getDoc(doc(db, "settings", `${currentRoute}-wordcloud`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          if (snapshot.data()?.allowed) {
           setFirst(true)
          } else {
            setFirst(false)
          }
        } 
      })
      .catch((e) => {
        console.log(e.code)
      });
    const imageRef = ref(storage, `${currentRoute}/images/wordcloud.png`);
    getDownloadURL(imageRef)
      .then((url) => {
        if (url) {
          setImageUrlUploaded(url);
          setWordCloudLoading(false);
        }
      })
      .catch((error) => {
        setImageUrlUploaded("/noImage.png");
        setWordCloudLoading(false);
      });
  }

  const handleFileChange = (event) => {
    const fileList = Array.from(event.target.files);

    setFiles(fileList);
  };

  const handleFileChangeWordCloud = (event) => {
    const fileList = Array.from(event.target.files);
    setFilesWordCloud(fileList);
  };

  const handleIconFileChange = (event) => {
    const fileList = Array.from(event.target.files);

    setIconFiles(fileList);
  };

  const removeFile = (index) => {
    const updatedFiles = [...files.filter((item, i) => i != index)];
    setFiles(updatedFiles);
  };

  const removeIconFile = (index) => {
    const updatedFiles = [...iconFiles.filter((item, i) => i != index)];
    setIconFiles(updatedFiles);
  };

  const uploadFiles = async () => {
    const name = "logo.png";
    const metadata = {
      contentType: "image/png",
    };
    const storageRef = ref(storage, `${currentRoute}/images/` + name);
    const uploadTask = uploadBytesResumable(storageRef, files[0], metadata);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log("Upload is " + progress + "% done");
        switch (snapshot.state) {
          case "paused":
            console.log("Upload is paused");
            break;
          case "running":
            console.log("Upload is running");
            break;
        }
      },
      (error) => {
        addToast({ message: `/appearance: ${error.code}`, type: "error" });
        setLogoLoading(false);
      },
      () => {
        // Upload completed successfully, now we can get the download URL
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setFiles([]);
          setLogoUrl(downloadURL);
          setLogoLoading(false);
        });
      }
    );
  };

  const uploadFilesWordCloud = async () => {
    const name = "wordcloud.png";
    const metadata = {
      contentType: "image/png",
    };
    const storageRef = ref(storage, `${currentRoute}/images/` + name);
    const uploadTask = uploadBytesResumable(
      storageRef,
      filesWordCloud[0],
      metadata
    );
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log("Upload is " + progress + "% done");
        switch (snapshot.state) {
          case "paused":
            console.log("Upload is paused");
            break;
          case "running":
            console.log("Upload is running");
            break;
        }
      },
      (error) => {
        addToast({ message: `/appearance: ${error.code}`, type: "error" });
        setWordCloudLoading(false);
      },
      () => {
        // Upload completed successfully, now we can get the download URL
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setFilesWordCloud([]);
          setImageUrlUploaded(downloadURL);
          setWordCloudLoading(false);
        });
      }
    );
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

  const RenderSelectedFilesWordCloud = () => {
    return (
      filesWordCloud.length > 0 && (
        <Box overflow="hidden" marginBottom="15px" mt={6}>
          {filesWordCloud.map((file, index) => (
            <RenderSelectedFilesRows key={index} file={file} index={index} />
          ))}
        </Box>
      )
    );
  };

  const RenderSelectedIconFiles = () => {
    return (
      iconFiles.length > 0 && (
        <Box overflow="hidden" marginBottom="15px" mt={6}>
          {iconFiles.map((file, index) => (
            <RenderSelectedIconFilesRows
              key={index}
              file={file}
              index={index}
            />
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

  const RenderSelectedIconFilesRows = ({ file, index }) => {
    return (
      <div>
        <Box key={index} display={"flex"} justifyContent={"space-between"}>
          <Text fontSize={"12px"}>{file.name}</Text>
          <Button size="sm" variant={"ghost"}>
            <MdDeleteForever
              size={20}
              color="red"
              onClick={() => removeIconFile(index)}
            />
          </Button>
        </Box>
      </div>
    );
  };

  const RenderUploadedIcon = ({ icon, onDelete, index }) => {
    const [rowLoading, setRowLoading] = useState(false);
    async function handleDeleteIcon() {
      const updatedFiles = [...iconsUrl.data.filter((item, i) => i != index)];
      await handleUpdateDb([...updatedFiles]);
      setRowLoading(false);
      setIconsUrl({ data: [...updatedFiles] });
    }
    return (
      <HStack gap={10} align={"center"} width={"100%"} justify={"flex-start"}>
        <Img src={icon} width={"100px"} borderRadius={5} />
        {rowLoading ? (
          <Spinner />
        ) : (
          <Text
            color={"red"}
            _hover={{ cursor: "pointer", opacity: 0.7 }}
            onClick={() => {
              setRowLoading(true);
              handleDeleteIcon();
            }}
          >
            Delete
          </Text>
        )}
      </HStack>
    );
  };

  const RenderButton = useCallback(() => {
    return (
      <Button
        mt={5}
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
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(e)}
        ></input>
      </Button>
    );
  }, [files]);

  const RenderButtonWordCloud = useCallback(() => {
    return (
      <Button
        mt={5}
        rounded={"md"}
        onClick={() => {
          if (inputRefWordCloud.current) inputRefWordCloud.current.click();
        }}
        leftIcon={<FaFile />}
      >
        <Text fontSize={"14px"} fontWeight="400" mb={0}>
          Browse
        </Text>
        <input
          style={{ display: "none" }}
          ref={inputRefWordCloud}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChangeWordCloud(e)}
        ></input>
      </Button>
    );
  }, [filesWordCloud]);

  const RenderIconButton = useCallback(() => {
    return (
      <Button
        mt={5}
        rounded={"md"}
        onClick={() => {
          if (iconInputRef.current) iconInputRef.current.click();
        }}
        leftIcon={<FaFile />}
      >
        <Text fontSize={"14px"} fontWeight="400" mb={0}>
          Browse
        </Text>
        <input
          style={{ display: "none" }}
          ref={iconInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleIconFileChange(e)}
        ></input>
      </Button>
    );
  }, [iconFiles]);

  async function handleUploadIcon() {
    let name = "";
    if (iconsUrl.data.length == 0) {
      name = "icon1.png";
    } else if (iconsUrl.data.length == 1) {
      if (iconsUrl.data[0].name === "icon1.png") {
        name = "icon2.png";
      } else {
        name = "icon1.png";
      }
    }
    const metadata = {
      contentType: "image/png",
    };
    const storageRef = ref(storage, `${currentRoute}/images/` + name);
    const uploadTask = uploadBytesResumable(storageRef, iconFiles[0], metadata);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log("Upload is " + progress + "% done");
        switch (snapshot.state) {
          case "paused":
            console.log("Upload is paused");
            break;
          case "running":
            console.log("Upload is running");
            break;
        }
      },
      (error) => {
        addToast({ message: `/appearance: ${error.code}`, type: "error" });
        setLogoLoading(false);
      },
      () => {
        // Upload completed successfully, now we can get the download URL
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          const temp = [...iconsUrl.data];
          temp.push({ name: name, link: iconLink, url: downloadURL });
          setIconsUrl({ data: [...temp] });
          handleUpdateDb(temp);
        });
      }
    );
  }

  async function handleUpdateDb(data) {
    const db = getFirestore(app, "aiiq-engine");
    setDoc(doc(db, "appearance", `${currentRoute}-icons`), { data: data }).then(
      () => {
        onClose();
        setIconLink("");
        setIconFiles([]);
        setIconsLoading(false);
      }
    );
  }

  async function handleUpdateWordCloudSwitch() {
    try {
      const db = getFirestore(app, "aiiq-engine");
      await setDoc(doc(db, "settings", `${currentRoute}-wordcloud`), {
        allowed: !first,
      }).then(() => {
        setFirst(!first);
      });
    } catch (error) {
      addToast({ message: `Failed to switch status`, type: "error" });
    } finally {
      setSwitchLoading(false);
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
                Logo
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
                  {logoLoading ? (
                    <Skeleton height="200px" width={"200px"} />
                  ) : (
                    <Img
                      src={logoUrl}
                      width={logoUrl == "/noImage.png" ? "200px" : "300px"}
                    />
                  )}

                  <RenderButton />
                </Box>
                <Text alignSelf={"center"} fontSize={"10px"} mt={"10px"}>
                  Supported formats: JPG, JPEG, PNG
                </Text>
                <RenderSelectedFiles />

                {files.length > 0 && (
                  <Button
                    isLoading={logoLoading}
                    rounded={"md"}
                    onClick={() => {
                      setLogoLoading(true);
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
                Additional Icons
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
              px={7}
            >
              <Box width="100%" pt={17}>
                <VStack gap={5} align={"flex-start"}>
                  {iconsUrl.data.length != 2 ? (
                    <div
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <Button onClick={onOpen}>Add Icon</Button>
                    </div>
                  ) : (
                    <div style={{ height: "2.5rem" }}></div>
                  )}

                  {iconsUrl.data?.map((eachIcon, index) => (
                    <RenderUploadedIcon
                      index={index}
                      key={index}
                      icon={eachIcon.url}
                      onDelete={() => {}}
                    />
                  ))}
                </VStack>
                {iconFetchingLoad ? (
                  <Stack mt={"30px"}>
                    <Skeleton height="20px" />
                    <Skeleton height="20px" />
                  </Stack>
                ) : iconsUrl.data.length == 0 ? (
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
                    No Icons uploaded
                  </div>
                ) : null}
              </Box>
            </Flex>
          </Box>
        </SimpleGrid>
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
                Word Cloud Auto Generated
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
              dir="column"
            >
              <Box
                p="6"
                alignItems={"center"}
                width={"100%"}
                justifyContent={"center"}
                display={"flex"}
                flexDir={"column"}
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
                Word Cloud Uploaded
              </Text>
              {switchLoading ? (
                <Spinner ml={5} />
              ) : (
                <Switch
                  ml={5}
                  isChecked={first}
                  onChange={(e) => {
                    setSwitchLoading(true);
                    handleUpdateWordCloudSwitch();
                  }}
                />
              )}
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
                  {wordCloudLoading ? (
                    <Skeleton height="200px" width={"200px"} />
                  ) : (
                    <Img
                      src={imageUrlUploaded}
                      width={
                        imageUrlUploaded == "/noImage.png" ? "200px" : "300px"
                      }
                    />
                  )}

                  <RenderButtonWordCloud />
                </Box>
                <Text alignSelf={"center"} fontSize={"10px"} mt={"10px"}>
                  Supported formats: JPG, JPEG, PNG
                </Text>
                <RenderSelectedFilesWordCloud />

                {filesWordCloud.length > 0 && (
                  <Button
                    isLoading={wordCloudLoading}
                    rounded={"md"}
                    onClick={() => {
                      setWordCloudLoading(true);
                      uploadFilesWordCloud();
                    }}
                    leftIcon={<IoMdCloudUpload />}
                  >
                    Upload
                  </Button>
                )}
              </Box>
            </Flex>
          </Box>
        </SimpleGrid>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIconFiles([]);
          setIconLink("");
          onClose();
        }}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader borderBottom="1px" borderBottomColor="#cccccc" mb="5px">
            Upload Icon
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody
            p={5}
            justifyContent={"center"}
            display={"flex"}
            flexDir={"column"}
          >
            <RenderIconButton />
            <RenderSelectedIconFiles />
            {iconFiles.length > 0 && (
              <Input
                placeholder="Enter link to open"
                value={iconLink}
                onChange={(e) => setIconLink(e.target.value)}
              />
            )}
          </ModalBody>
          <ModalFooter display="flex" justifyContent="space-between">
            <Button
              width={"120px"}
              colorScheme="red"
              onClick={() => {
                setIconFiles([]);
                setIconLink("");
                onClose();
              }}
            >
              <Text fontSize="14px" fontWeight="400">
                Close
              </Text>
            </Button>
            <Button
              isLoading={iconsLoading}
              onClick={() => {
                setIconsLoading(true);
                handleUploadIcon();
              }}
              width={"120px"}
              isDisabled={iconFiles.length == 0 || !iconLink.trim()}
            >
              <Text fontSize="14px" fontWeight="400">
                Upload
              </Text>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
    </>
  );
}
