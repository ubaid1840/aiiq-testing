'use client'
import { Box, Spinner, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import mammoth from 'mammoth';

const DocxViewer = ({ url }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocxContent = async () => {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setContent(result.value);
      } catch (error) {
        console.error('Error fetching docx content:', error);
        setContent('Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    fetchDocxContent();
  }, [url]);

  return (
    <Box overflowY="auto" maxH="50vh" p={4} width={'100%'}>
      {loading ? <Box flex={1} display={'flex'} alignItems={'center'} justifyContent={'center'}><Spinner /></Box> : <Box dangerouslySetInnerHTML={{ __html: content }} />}
    </Box>
  );
};

export default DocxViewer;
