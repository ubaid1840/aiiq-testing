"use client";
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
  VStack,
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
  const [newUser, setNewUser] = useState({});
  const { state: UserState } = useContext(UserContext);
  const [selectedUser, setSelectedUser] = useState();
  const pathname = usePathname();
  const [currentRoute, setCurrentRoute] = useState();

  useEffect(() => {
    if (routes)
      routes.map((eachRoute) => {
        if (pathname.toLowerCase().includes(eachRoute?.name.toLowerCase())) {
          setCurrentRoute(eachRoute.name);
        }
      });
  }, [routes]);

  useEffect(() => {
    if (currentRoute) {
      setNewUser({
        email: "",
        [`${currentRoute}-approved`]: "",
        [`${currentRoute}-role`]: "",
      });
      fetchData();
    }
  }, [currentRoute]);

  async function fetchData() {
    try {
      const db = getFirestore(app, "aiiq-engine");
      let list = [];
      await getDocs(
        query(collection(db, "users"), where("role", "!=", "superadmin"))
      ).then((snapshot) => {
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
    const { name, value, type, checked } = e.target;
    setNewUser((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddUser = async () => {
    try {
      const db = getFirestore(app, "aiiq-engine");

      await getDocs(
        query(collection(db, "users"), where("email", "==", newUser.email))
      ).then(async (snapshot) => {
        let list = [];
        snapshot.forEach(async (docs) => {
          list.push(docs.data());
        });
        if (list.length == 0) {
          await addDoc(collection(db, "users"), newUser).then((docRef) => {
            setTableData((prev) => [...prev, { ...newUser, id: docRef.id }]);
            setNewUser({ email: "", role: "user", approved: false });
            addToast({ message: `User added`, type: "success" });
          });
        } else {
          addToast({ message: `User already exists`, type: "error" });
        }
      });
    } catch (error) {
      addToast({ message: `Error saving new user`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const RenderEachTableRow = ({ user, index }) => {
    const [rowLoading, setRowLoading] = useState(false);

    async function handleUpdateDoc(index, keyName, property) {
      const updatedUsers = [...tableData];

      try {
        const db = getFirestore(app, "aiiq-engine");
        if (keyName.includes("approved") && property == true) {
          await updateDoc(doc(db, "users", updatedUsers[index].id), {
            approved: true,
          });
        }
        await updateDoc(doc(db, "users", updatedUsers[index].id), {
          [keyName]: property,
        }).then(() => {
          updatedUsers[index][keyName] = property;
          setTableData([...updatedUsers]);

          addToast({
            message: `User updated`,
            type: "success",
          });
        });
      } catch (error) {
        addToast({
          message: `Failed to update role for user: ${updatedUsers[index].email}`,
          type: "error",
        });
      } finally {
        setRowLoading(false);
      }
    }

    return (
      <Tr key={index} bg={index % 2 === 0 ? "gray.50" : "white"}>
        <Td>{index + 1}</Td>
        <Td>{user.email}</Td>
        {rowLoading ? (
          <Td>
            <Spinner />
          </Td>
        ) : (
          <>
            <Td>
              <Select
              size={'sm'}
                style={{ borderColor: "#cccccc" }}
                isDisabled={UserState.value.data.email === user.email}
                value={user[`${currentRoute}-role`]}
                onChange={(e) => {
                  setRowLoading(true);
                  handleUpdateDoc(
                    index,
                    `${currentRoute}-role`,
                    e.target.value
                  );
                }}
              >
                <option style={{ display: "none" }} value="none">
                  None
                </option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </Select>
            </Td>
            <Td>
              <Switch
              size={'sm'}
                isDisabled={UserState.value.data.email === user.email}
                isChecked={user[`${currentRoute}-approved`]}
                onChange={() => {
                  setRowLoading(true);
                  handleUpdateDoc(
                    index,
                    `${currentRoute}-approved`,
                    user[`${currentRoute}-approved`]
                      ? !user[`${currentRoute}-approved`]
                      : true
                  );
                }}
              />
            </Td>
            {UserState.value.data?.role == "superadmin" && (
              <Td>
                <Icon
                  as={MdDeleteForever}
                  boxSize={6}
                  color={"red"}
                  onClick={() => {
                    setSelectedUser(user);
                    deleteOnOpen();
                  }}
                  _hover={{ cursor: "pointer", opacity: 0.5 }}
                />
              </Td>
            )}
          </>
        )}
      </Tr>
    );
  };

  async function handleDeleteUser() {
    const db = getFirestore(app, "aiiq-engine");
    try {
      await deleteDoc(doc(db, "users", selectedUser.id)).then(() => {
        let newList = [
          ...tableData.filter((item) => item.id != selectedUser.id),
        ];
        setTableData([...newList]);
        addToast({
          message: `${selectedUser.email} deleted`,
          type: "success",
        });
      });
    } catch (error) {
      console.log(error);
      addToast({
        message: `Error! Unable to remove user: ${selectedUser.email}`,
        type: "error",
      });
    } finally {
      setLoading(false);
      setSelectedUser();
    }
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
          Users
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
                    <Th color="white">Email</Th>
                    <Th color="white">Role</Th>
                    <Th color="white">Approved</Th>
                    {UserState.value.data?.role == "superadmin" && (
                      <Th color="white">Remove</Th>
                    )}
                  </Tr>
                </Thead>
                <Tbody>
                  {Array(5)
                    .fill()
                    .map((_, index1) => (
                      <Tr key={index1}>
                        {Array(4)
                          .fill()
                          .map((_, index) => (
                            <Td key={index}>
                              <Skeleton
                                key={index}
                                height="40px"
                                width="100%"
                              />
                            </Td>
                          ))}
                        {UserState.value.data?.role == "superadmin" && (
                          <Td>
                            <Skeleton height="40px" width="100%" />
                          </Td>
                        )}
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
                {newUser.hasOwnProperty("email") ? (
                  <Button onClick={onOpen}>Add User</Button>
                ) : null}
              </div>

              <TableContainer>
                <Table variant="simple" colorScheme="gray" size={"sm"}>
                  <Thead bg="gray.700" height={"40px"}>
                    <Tr>
                      <Th color="white">Sr.</Th>
                      <Th color="white">Email</Th>
                      <Th color="white">Role</Th>
                      <Th color="white">Approved</Th>
                      {UserState.value.data?.role == "superadmin" && (
                        <Th color="white">Remove</Th>
                      )}
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
              Add New User
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl id="email" isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  borderColor={"#cccccc"}
                  name="email"
                  value={newUser.email}
                  onChange={handleNewUserChange}
                  type="email"
                  placeholder="Enter user email"
                />
              </FormControl>
              <FormControl id={`${currentRoute}-role`} isRequired mt={4}>
                <FormLabel>Role</FormLabel>
                <Select
                  borderColor={"#cccccc"}
                  name={`${currentRoute}-role`}
                  value={newUser.role}
                  onChange={handleNewUserChange}
                >
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </Select>
              </FormControl>
              <FormControl display="flex" alignItems="center" mt={4}>
                <FormLabel htmlFor="approved" mb="0">
                  Approved
                </FormLabel>
                <Switch
                  id={`${currentRoute}-approved`}
                  name={`${currentRoute}-approved`}
                  isChecked={newUser.approved}
                  onChange={handleNewUserChange}
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
                  handleAddUser();
                }}
              >
                Add User
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
                Delete User
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
      </Flex>
    </div>
  );
}
