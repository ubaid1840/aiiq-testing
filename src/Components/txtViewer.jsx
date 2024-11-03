'use client'
import { Box, Spinner, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

const TxtViewer = ({ url }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTextContent = async () => {
      try {
        const response = await fetch(url);
        const text = await response.text();
        setContent(text);
      } catch (error) {
        console.error('Error fetching text content:', error);
        setContent('Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    fetchTextContent();
  }, [url]);

  return (
    <Box overflowY="auto" maxH="50vh" p={4} width={'100%'}>
      {loading ? <Spinner /> : <Text whiteSpace="pre-wrap">{content}</Text>}
    </Box>
  );
};

export default TxtViewer;
