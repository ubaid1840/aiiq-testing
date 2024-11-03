// components/PdfViewer.js
import { Box, Button, Spinner, Text } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist/build/pdf";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import {
  FaArrowAltCircleLeft,
  FaArrowAltCircleRight,
  FaMinus,
  FaPlus,
} from "react-icons/fa";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const PdfViewer = ({ url }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const zoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.2, 0.5));
  };

  return (
    <div>
      {url ? (
        <Box overflowY="auto" minH={"50vh"} maxH={'50vh'}>
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<Box minH={'50vh'} flex={1} display={'flex'} alignItems={'center'} justifyContent={'center'}><Spinner /></Box>}
          >
            <Page pageNumber={pageNumber} scale={scale} />
          </Document>
        </Box>
      ) : (
        <Box
          overflowY="auto"
          minH={"50vh"}
          display={"flex"}
          alignItems={"center"}
          justifyContent={"center"}
        >
          <Text>Loading preview</Text>
        </Box>
      )}
      <Box display="flex" justifyContent="space-between" mt={4}>
        <div>
          <Button
            onClick={zoomOut}
            isDisabled={scale <= 0.5 ? true : false}
            variant={"ghost"}
          >
            <FaMinus />
          </Button>
          <Button
            onClick={zoomIn}
            isDisabled={scale >= 3.0 ? true : false}
            variant={"ghost"}
          >
            <FaPlus />
          </Button>
        </div>
        <div>
          <Button
            variant={"ghost"}
            onClick={() => setPageNumber(pageNumber - 1)}
            isDisabled={pageNumber <= 1 ? true : false}
          >
            <FaArrowAltCircleLeft size={25} />
          </Button>
          <Button
            variant={"ghost"}
            onClick={() => setPageNumber(pageNumber + 1)}
            isDisabled={pageNumber >= numPages ? true : false}
          >
            <FaArrowAltCircleRight size={25} />
          </Button>
        </div>
      </Box>
    </div>
  );
};

export default PdfViewer;
