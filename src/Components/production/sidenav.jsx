"use client";

import React, { useContext, useEffect, useState } from "react";
import {
  IconButton,
  Box,
  CloseButton,
  Flex,
  Icon,
  useColorModeValue,
  Drawer,
  DrawerContent,
  Text,
  useDisclosure,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  FormControl,
  FormLabel,
  Select,
  ModalCloseButton,
  Spinner,
} from "@chakra-ui/react";
import { FiMenu } from "react-icons/fi";
import { RiLogoutBoxLine } from "react-icons/ri";
import { IoDocumentsOutline, IoSearchOutline } from "react-icons/io5";
import { LuPanelLeft, LuPanelRight, LuSettings } from "react-icons/lu";
import { ImHistory } from "react-icons/im";
import { redirect, usePathname, useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { googleLogout } from "@react-oauth/google";
import { FaUserCog } from "react-icons/fa";
import { signOut } from "firebase/auth";
import { auth } from "@/config/firebase";
import { RoleContext } from "@/store/context/RoleContext";
import SearchQuery from "../searchQuery";
import { RxHamburgerMenu } from "react-icons/rx";
import { HiOutlineSwitchHorizontal } from "react-icons/hi";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { DecryptCookie, EncryptCookie } from "@/function/cookiesFunctions";
import Loader from "../../../loading";
import Link from "next/link";
import { EmailContext } from "@/store/context/EmailContext";
import { UserContext } from "@/store/context/UserContext";
import { MdOutlineRoute } from "react-icons/md";
import { TbColorFilter } from "react-icons/tb";

const LinkItemsProd = [
  {
    name: "Documents",
    icon: IoDocumentsOutline,
    path: `files`,
  },
  {
    name: "Configuration",
    icon: LuSettings,
    path: `configuration`,
  },
  {
    name: "Sessions",
    icon: ImHistory,
    path: `sessions`,
  },
  {
    name: "User Management",
    icon: FaUserCog,
    path: `usermanagement`,
  },
  {
    name: "Appearance",
    icon: TbColorFilter,
    path: `appearance`,
  },
  {
    name: "Route Management",
    icon: MdOutlineRoute,
    path: "routemanagement",
  },
];


export default function Sidebar({ children, url, allowedRoutes, onReturn, currentPage }) {
  const pathname = usePathname();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [changeLoading, setChangeLoading] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);
  const {
    isOpen: ModalOpen,
    onOpen: ModalOnOpen,
    onClose: ModalOnClose,
  } = useDisclosure();
  const [proceedLoading, setProceedLoading] = useState(false);
  const [newPath, setNewPath] = useState("Select one");
  const [currentRoute, setCurrentRoute] = useState("");
  const router = useRouter();
  const [LinkItems, setLinkItems] = useState([]);

  async function handleSwitchSide() {

    router.replace(`${newPath}/admin?page=files`);
  }

  useEffect(() => {
    if (allowedRoutes && allowedRoutes.length > 0) {
      allowedRoutes.map((item) => {
        if (pathname.toLowerCase().includes(item.name.toLowerCase())) {
          setCurrentRoute(item.name);
        }
      });
    }
  }, [allowedRoutes]);

  

  return changeLoading ? (
    <Loader />
  ) : (
    <Box
      minH="100vh"
      bg={useColorModeValue("gray.100", "gray.900")}
      pl={{ base: 0, md: 5 }}
    >
      <SidebarContent
      currentPage={currentPage}
      onReturnClick={onReturn}
        onModalOpen={() => ModalOnOpen()}
        onClose={() => onClose}
        display={{ base: "none", md: "flex" }}
        currentRoute={currentRoute}
        LinkItems={LinkItemsProd}
      />
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerContent>
          <SidebarContent
           currentPage={currentPage}
           onReturnClick={onReturn}
            LinkItems={LinkItemsProd}
            display="flex"
            onClose={onClose}
            onModalOpen={() => {
              ModalOnOpen();
            }}
          />
        </DrawerContent>
      </Drawer>
      <MobileNav display={{ base: "flex", md: "none" }} onOpen={onOpen} />
      <Box ml={{ base: 0, md: 60 }} p="4" display={"flex"}>
        {!openSearch && (
          <Box
            _hover={{
              cursor: "pointer",
              backgroundColor: "blue.600",
              zIndex: 999,
            }}
            onClick={() => setOpenSearch(true)}
            style={{
              position: "absolute",
              top: 10,
              right: 20,
              padding: "10px",
              borderRadius: "30px",
              zIndex: 998,
            }}
            bg={"gray.600"}
            color={"white"}
          >
            <RxHamburgerMenu size={25} />
          </Box>
        )}
        {children}
        {openSearch && (
          <Box
            ml={5}
            width={"400px"}
            height={"97vh"}
            overflowY={"auto"}
            borderRadius={10}
            bgColor={"white"}
          >
            {url && (
              <SearchQuery url={url} closeSearch={() => setOpenSearch(false)} />
            )}
          </Box>
        )}
      </Box>
      <Modal isOpen={ModalOpen} onClose={ModalOnClose} size="full">
        <ModalOverlay style={{ zIndex: 999 }} />
        <ModalContent style={{ zIndex: 999 }}>
          <ModalBody margin={0} p={0}>
            <Flex
              minH={"100vh"}
              align={"center"}
              justify={"center"}
              bg={useColorModeValue("gray.900", "gray.800")}
              px={4}
            >
              <ModalCloseButton color={"red"} />
              <Box
                maxW={"lg"}
                w={"full"}
                bg={useColorModeValue("gray.800", "gray.700")}
                boxShadow={"2xl"}
                rounded={"lg"}
                p={8}
              >
                <FormControl>
                  <FormLabel color={"gray.400"}>Select and proceed</FormLabel>
                  <Select
                    value={newPath}
                    color={"gray.400"}
                    borderRadius={"2px"}
                    border={"1px solid"}
                    borderColor={"#484848"}
                    onChange={(e) => setNewPath(e.target.value)}
                    bg={"gray.800"}
                    _placeholder={{ color: "gray.400" }}
                    _focus={{ borderColor: "purple.400" }}
                  >
                    <option
                      style={{ display: "none", color: "black" }}
                      value={`Select one`}
                    >
                      Select one
                    </option>
                    {allowedRoutes && allowedRoutes.length > 0
                      ? allowedRoutes.map((item, index) => (
                          <option
                            key={index}
                            style={{ color: "black" }}
                            value={`/${item.name}`}
                          >
                            {item.name}
                          </option>
                        ))
                      : null}
                  </Select>
                </FormControl>
                <Button
                  isDisabled={
                    pathname.toLowerCase().includes(newPath.toLowerCase()) || newPath == "Select one"
                  }
                  mt={5}
                  borderRadius={"2px"}
                  colorScheme={"purple"}
                  onClick={async () => {
                    ModalOnClose();
                    setProceedLoading(true);
                    handleSwitchSide();
                  }}
                  size="md"
                  w="full"
                >
                  Proceed
                </Button>
              </Box>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
      {proceedLoading ? <Loader /> : null}
    </Box>
  );
}

const SidebarContent = ({
  currentRoute,
  onClose,
  onModalOpen,
  LinkItems,
  onReturnClick, 
  currentPage,
  ...rest
}) => {
  const { state: UserState, setUser } = useContext(UserContext);
  const [loading, setLoading] = useState(false);

  const pathname = usePathname();

  async function handleLogout() {
    // document.cookie =
    //   "backend_auth=; expires=2023-01-01; path=/; secure; SameSite=None;";
    try {
      await signOut(auth).then(() => {
        Cookies.remove("aiiq_admin_panel_session");
        setUser({});
      });
    } catch (error) {
      setLoading(false);
    }
  }

  return (
    <Box
      bgGradient="linear(to-bl, gray.700, gray.800)"
      borderRight="1px"
      borderRightColor={useColorModeValue("gray.200", "gray.700")}
      w={{ base: "full", md: 60 }}
      pos="fixed"
      minHeight={{ base: "full", md: "95vh" }}
      mt={{ base: "0px", md: 5 }}
      height="auto"
      mb={5}
      borderRadius={{ base: "0px", md: "10px" }}
      color={"white"}
      boxShadow="md"
      flexDirection={"column"}
      justifyContent={"space-between"}
      {...rest}
    >
      <div>
        <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
          <Text fontSize="2xl" fontFamily="monospace" fontWeight="bold">
            AIIQ Engine
          </Text>
          <CloseButton
            display={{ base: "flex", md: "none" }}
            onClick={onClose}
          />
        </Flex>

        {LinkItems.map((link, index) =>
          (currentRoute &&
            UserState.value.data[`${currentRoute}-role`] === "user" &&
            link.path === "usermanagement") ||
          (UserState.value.data?.role !== "superadmin" &&
            link.path === "routemanagement") ? null : (
            <NavItem
            currentPage={currentPage}
            index={index}
              onClick={onReturnClick}
              key={link.name}
              icon={link.icon}
              path={`${pathname.replace(/\/[^\/]*\/?$/, "")}/${link.path}`}
              page = {link.path}
            >
              {link.name}
            </NavItem>
          )
        )}
      </div>
      <Flex h="20" alignItems="center" justifyContent={"space-between"}>
        {loading ? (
          <Spinner ml={5} color="white" />
        ) : (
          <OverlayTrigger
            delay={{ show: 250, hide: 200 }}
            overlay={(props) => (
              <Tooltip {...props}>
                <div
                  style={{
                    backgroundColor: "black",
                    padding: "5px",
                    fontSize: "12px",
                    margin: "0px",
                  }}
                >
                  Logout
                </div>
              </Tooltip>
            )}
            placement="top"
          >
            <Button
              variant={"ghost"}
              color={"white"}
              _hover={{ bg: "transparent", color: "blue.400" }}
              onClick={() => {
                setLoading(true);
                handleLogout();
              }}
            >
              <RiLogoutBoxLine size={30} />
            </Button>
          </OverlayTrigger>
        )}

        <OverlayTrigger
          delay={{ show: 250, hide: 400 }}
          overlay={(props) => (
            <Tooltip {...props}>
              <div
                style={{
                  backgroundColor: "black",
                  padding: "5px",
                  fontSize: "12px",
                  margin: "0px",
                }}
              >
                Switch Chatbot
              </div>
            </Tooltip>
          )}
          placement="top"
        >
          <Button
            variant={"ghost"}
            color={"white"}
            _hover={{ bg: "transparent", color: "blue.400" }}
            onClick={() => onModalOpen()}
          >
            <HiOutlineSwitchHorizontal size={30} />
          </Button>
        </OverlayTrigger>
      </Flex>
    </Box>
  );
};

const NavItem = ({ icon, children, path, index, onClick, currentPage, page, ...rest }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const createQueryString = (name, value) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)
 
      return params.toString()
    }
    
  
  return (
  
      <Flex
       onClick={()=>  {
        router.push(pathname + '?' + createQueryString('page', page))
        // onClick(index)
      }}
      style={{ textDecoration: "none", fontSize: "14px", fontWeight: "300" }}
        _focus={{ boxShadow: "none" }}
        align="center"
        p="2"
        my="2"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        _hover={{
          bg: "blue.500",
          color: "white",
        }}
        bg={page === currentPage && "blue.500"}
        {...rest}
      >
        {icon && (
          <Icon
            mr="4"
            fontSize="16"
            _groupHover={{
              color: "white",
            }}
            as={icon}
          />
        )}
        {children}
      </Flex>

  );
};

const MobileNav = ({ onOpen, ...rest }) => {
  return (
    <Flex
      ml={{ base: 0, md: 60 }}
      px={{ base: 4, md: 24 }}
      height="20"
      alignItems="center"
      bg={useColorModeValue("white", "gray.900")}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue("gray.200", "gray.700")}
      justifyContent="flex-start"
      {...rest}
    >
      <IconButton
        variant="outline"
        onClick={onOpen}
        aria-label="open menu"
        icon={<FiMenu />}
      />

      <Text fontSize="2xl" ml="8" fontFamily="monospace" fontWeight="bold">
        AIIQ
      </Text>
    </Flex>
  );
};