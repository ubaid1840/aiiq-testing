import { Box } from "@chakra-ui/react";

export default function NotFound() {
  return (
    <main
      style={{
        width: "100vw",
        height: "100vh",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "black",
        display: "flex",
      }}
    >
      <Box>
        <div style={{ display: "flex", flexDirection: "row", justifyContent:'center', alignItems:'center' }}>
          <div style={{ color: "white", fontWeight:'bold', fontSize:'24px' }}>404</div>
          <div style={{ height: "30px", borderWidth:1, borderColor:'white', marginLeft:'20px', marginRight:'20px' }}></div>
          <div style={{ color: "white" }}>This page could not be found</div>
        </div>
      </Box>
    </main>
  );
}
