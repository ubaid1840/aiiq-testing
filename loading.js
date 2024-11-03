"use client"
import React from 'react'
// import Lottie from "lottie-react";
import {
  Img,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Spinner,
} from "@chakra-ui/react";

function Loader() {
  return (
    
      <Modal
        isOpen={true}
        size={{ base: "sm", md: "md", lg: "md" }}
        closeOnOverlayClick={false}
        blockScrollOnMount={true}
        
      >
        <ModalOverlay
          bg="#000000B1"
          backdropFilter="blur(10px) hue-rotate(90deg)"
        />
        <ModalContent background="transparent" boxShadow={'none'} alignItems={'center'} height="100%" width="100vw" marginTop="0px" justifyContent="center">
         
          <Spinner color='white' size={{ base: "sm", md: "lg", lg: "lg" }} position='fixed'/>
         
        </ModalContent>
      </Modal>
    
  )
}

export default Loader