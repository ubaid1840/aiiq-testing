"use client";
import PanelLayout from "@/Layout/CustomLayoutDev";
import { app } from "@/config/firebase";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Select,
  Skeleton,
  Spinner,
  Switch,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
} from "@chakra-ui/react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { useContext, useEffect, useRef, useState } from "react";
import { CustomToast } from "@/Components/myToast";
import { ModalHeader } from "react-bootstrap";
import { MdDeleteForever } from "react-icons/md";
import { UserContext } from "@/store/context/UserContext";
import { usePathname } from "next/navigation";
import { EditIcon } from "@chakra-ui/icons";

export default function Page({ backendUrl, routes }) {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = CustomToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: deleteOpen,
    onOpen: deleteOnOpen,
    onClose: deleteOnClose,
  } = useDisclosure();
  const cancelRef = useRef();
  const [newUser, setNewUser] = useState({
    name: "",
    value: "",
  });
  const [selectedRoute, setSelectedRoute] = useState();
  const pathname = usePathname();
  const [currentRoute, setCurrentRoute] = useState();
  const {
    isOpen: isOpenEdit,
    onOpen: onOpenEdit,
    onClose: onCloseEdit,
  } = useDisclosure();

  useEffect(() => {
    if (routes) {
      routes.map((eachRoute) => {
        if (pathname.toLowerCase().includes(eachRoute?.name.toLowerCase())) {
          setCurrentRoute(eachRoute.name);
        }
      });
    }
  }, [routes]);

  useEffect(() => {
    if (currentRoute) {
      fetchData();
    }
  }, [currentRoute]);

  async function fetchData() {
    try {
      const db = getFirestore(app, "aiiq-engine");
      let list = [];
      await getDocs(collection(db, "routes")).then((snapshot) => {
        snapshot.forEach((docs) => {
          list.push({ ...docs.data(), id: docs.id });
        });
        if (list.length > 0) {
          setTableData(list);
        }
      });
    } catch (error) {
      addToast({ message: `Error fetching user data`, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddNewRoute = async () => {
    try {
      const db = getFirestore(app, "aiiq-engine");
      await getDocs(
        query(
          collection(db, "routes"),
          where("name", "==", newUser.name.toLowerCase())
        )
      ).then(async (snapshot) => {
        let list = [];
        snapshot.forEach(async (docs) => {
          list.push(docs.data());
        });
        if (list.length == 0) {
          await addDoc(collection(db, "routes"), newUser).then((docRef) => {
            setTableData((prev) => [...prev, { ...newUser, id: docRef.id }]);
            setNewUser({ name: "", value: "" });
            addToast({ message: `New route added`, type: "success" });
          });
        } else {
          addToast({ message: `Route already exists`, type: "error" });
        }
      });
    } catch (error) {
      addToast({ message: `Error saving new route`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const RenderEachTableRow = ({ user, index }) => {
    return (
      <Tr key={index} bg={index % 2 === 0 ? "gray.50" : "white"}>
        <Td>{index + 1}</Td>
        <Td>{user.name}</Td>
        <Td>{user.value}</Td>
        <Td>{user?.version}</Td>
        <Td>
          <HStack gap={2}>
            <EditIcon
              onClick={() => {
                setSelectedRoute({
                  name: user.name,
                  value: user.value,
                  version: user?.version ? user.version : "",
                  id : user.id
                });
                onOpenEdit();
              }}
              boxSize={4}
              _hover={{ cursor: "pointer", opacity: 0.5 }}
            />
            <Icon
              as={MdDeleteForever}
              boxSize={6}
              color={"red"}
              onClick={() => {
                setSelectedRoute(user);
                deleteOnOpen();
              }}
              _hover={{ cursor: "pointer", opacity: 0.5 }}
            />
          </HStack>
        </Td>
      </Tr>
    );
  };

  async function handleDeleteUser() {
    const db = getFirestore(app, "aiiq-engine");
    try {
      await deleteDoc(doc(db, "routes", selectedRoute.id)).then(() => {
        let newList = [
          ...tableData.filter((item) => item.id != selectedRoute.id),
        ];
        setTableData([...newList]);
        addToast({
          message: `${selectedRoute.name} deleted`,
          type: "success",
        });
      });
    } catch (error) {
      console.log(error);
      addToast({
        message: `Error! Unable to remove route: ${selectedRoute.name}`,
        type: "error",
      });
    } finally {
      setLoading(false);
      setSelectedRoute();
    }
  }

  async function handleEditRoute(item) {
   
    const db = getFirestore(app, "aiiq-engine");
    await updateDoc(doc(db, "routes", item.id), {
      name: item.name,
      value: item.value,
      version : item.version
    }).then(() => {
      fetchData();
    }).catch((e)=>{
      console.log(e.message)
      console.log(e.code)
      fetchData()
    })
  }

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
          Routes
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
        <Box width={"100%"} maxW="1200px">
          {loading ? (
            <TableContainer>
              <Table variant="simple" colorScheme="gray" size={"sm"}>
                <Thead bg="gray.700" height={"40px"}>
                  <Tr>
                    <Th color="white">Sr.</Th>
                    <Th color="white">Name</Th>
                    <Th color="white">Route</Th>
                    <Th color="white">Version</Th>
                    <Th color="white">Action</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {Array(5)
                    .fill()
                    .map((_, index) => (
                      <Tr key={index}>
                        {Array(5)
                          .fill()
                          .map((_, index1) => (
                            <Td key={index1}>
                              <Skeleton
                                key={index}
                                height="40px"
                                width="100%"
                              />
                            </Td>
                          ))}
                      </Tr>
                    ))}
                </Tbody>
              </Table>
            </TableContainer>
          ) : (
            <div>
              <div
                style={{
                  width: "100%",
                  justifyContent: "flex-end",
                  display: "flex",
                  marginBottom: "20px",
                }}
              >
                <Button onClick={onOpen}>Add Route</Button>
              </div>

              <TableContainer>
                <Table variant="simple" colorScheme="gray" size={"sm"}>
                  <Thead bg="gray.700" height={"40px"}>
                    <Tr>
                      <Th color="white">Sr.</Th>
                      <Th color="white">Name</Th>
                      <Th color="white">Route</Th>
                      <Th color="white">Version</Th>
                      <Th color="white">Action</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {tableData?.map((user, index) => (
                      <RenderEachTableRow
                        key={index}
                        user={user}
                        index={index}
                      />
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </div>
          )}
        </Box>
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader style={{ padding: "20px", fontWeight: "bold" }}>
              Add New Route
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl id="name" isRequired>
                <FormLabel>Route name</FormLabel>
                <Input
                  borderColor={"#cccccc"}
                  name="name"
                  value={newUser.name}
                  onChange={handleNewUserChange}
                  placeholder="Enter route name"
                />
              </FormControl>
              <FormControl id="value" isRequired mt={5}>
                <FormLabel>Route Url</FormLabel>
                <Input
                  borderColor={"#cccccc"}
                  name="value"
                  value={newUser?.value}
                  onChange={handleNewUserChange}
                  placeholder="Enter route url"
                />
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button
                colorScheme="blue"
                mr={3}
                onClick={() => {
                  setLoading(true);
                  onClose();
                  handleAddNewRoute();
                }}
              >
                Add Route
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <AlertDialog
          isOpen={deleteOpen}
          leastDestructiveRef={cancelRef}
          onClose={deleteOnClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete Route
              </AlertDialogHeader>

              <AlertDialogBody>Are you sure?</AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={deleteOnClose}>
                  Cancel
                </Button>
                <Button
                  colorScheme="red"
                  onClick={() => {
                    setLoading(true);
                    deleteOnClose();
                    handleDeleteUser();
                  }}
                  ml={3}
                >
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>

        <Modal isOpen={isOpenEdit} onClose={onCloseEdit}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader style={{ padding: "20px", fontWeight: "bold" }}>
              Edit Route
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl id="name" isRequired>
                <FormLabel>Route name</FormLabel>
                <Input
                  borderColor={"#cccccc"}
                  name="name"
                  value={selectedRoute?.name}
                  onChange={(e) => {
                    setSelectedRoute((prevState) => {
                      const newState = { ...prevState };
                      newState.name = e.target.value;
                      return newState;
                    });
                  }}
                  placeholder="Enter route name"
                />
              </FormControl>
              <FormControl id="value" isRequired mt={5}>
                <FormLabel>Route Url</FormLabel>
                <Input
                  borderColor={"#cccccc"}
                  name="value"
                  value={selectedRoute?.value}
                  onChange={(e) => {
                    setSelectedRoute((prevState) => {
                      const newState = { ...prevState };
                      newState.value = e.target.value;
                      return newState;
                    });
                  }}
                  placeholder="Enter route url"
                />
              </FormControl>
              <FormControl id="version" isRequired mt={5}>
                <FormLabel>Version</FormLabel>
                <Input
                  borderColor={"#cccccc"}
                  name="value"
                  value={selectedRoute?.version}
                  onChange={(e) => {
                    setSelectedRoute((prevState) => {
                      const newState = { ...prevState };
                      newState.version = e.target.value;
                      return newState;
                    });
                  }}
                  placeholder="Enter route version"
                />
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button
                colorScheme="blue"
                mr={3}
                onClick={() => {
                  setLoading(true);
                  onCloseEdit();
                  handleEditRoute(selectedRoute);
                }}
              >
                Save
              </Button>
              <Button variant="ghost" onClick={onCloseEdit}>
                Cancel
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Flex>
    </div>
  );
}
