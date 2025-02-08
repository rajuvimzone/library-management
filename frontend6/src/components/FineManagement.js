import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Heading,
  Badge,
  Button,
  useToast,
  Card,
  CardBody,
  Stack,
  Text,
  Divider
} from '@chakra-ui/react';
import axios from 'axios';

const FineManagement = () => {
  const [fines, setFines] = useState([]);
  const [totalFine, setTotalFine] = useState(0);
  const toast = useToast();

  const fetchFines = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/fines/unpaid');
      setFines(response.data.transactions);
      setTotalFine(response.data.totalUnpaidFines);
    } catch (error) {
      toast({
        title: 'Error fetching fines',
        description: error.response?.data?.message || 'Something went wrong',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handlePayFine = async (transactionId) => {
    try {
      await axios.post(`http://localhost:5000/api/fines/pay/${transactionId}`);
      toast({
        title: 'Fine paid successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchFines(); // Refresh the list
    } catch (error) {
      toast({
        title: 'Error paying fine',
        description: error.response?.data?.message || 'Something went wrong',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchFines();
  }, []);

  return (
    <Box p={4}>
      <Stack spacing={6}>
        <Heading size="lg">Fine Management</Heading>

        {/* Total Fine Summary Card */}
        <Card variant="outline">
          <CardBody>
            <Stack spacing={3}>
              <Heading size="md">Total Unpaid Fines</Heading>
              <Text fontSize="2xl" color={totalFine > 0 ? 'red.500' : 'green.500'}>
                ₹{totalFine}
              </Text>
            </Stack>
          </CardBody>
        </Card>

        <Divider />

        {/* Fines Table */}
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Book Title</Th>
              <Th>Due Date</Th>
              <Th>Return Date</Th>
              <Th>Fine Amount</Th>
              <Th>Status</Th>
              <Th>Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {fines.map((transaction) => (
              <Tr key={transaction._id}>
                <Td>{transaction.book?.title}</Td>
                <Td>{new Date(transaction.dueDate).toLocaleDateString()}</Td>
                <Td>
                  {transaction.returnDate 
                    ? new Date(transaction.returnDate).toLocaleDateString()
                    : 'Not Returned'}
                </Td>
                <Td color="red.500">₹{transaction.fine.amount}</Td>
                <Td>
                  <Badge
                    colorScheme={transaction.fine.isPaid ? 'green' : 'red'}
                  >
                    {transaction.fine.isPaid ? 'Paid' : 'Unpaid'}
                  </Badge>
                </Td>
                <Td>
                  {!transaction.fine.isPaid && (
                    <Button
                      colorScheme="blue"
                      size="sm"
                      onClick={() => handlePayFine(transaction._id)}
                    >
                      Pay Fine
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>

        {fines.length === 0 && (
          <Box textAlign="center" py={4}>
            <Text>No unpaid fines</Text>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

export default FineManagement;
