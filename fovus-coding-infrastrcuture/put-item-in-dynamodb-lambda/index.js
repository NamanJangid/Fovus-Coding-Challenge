const { DynamoDBClient, PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');

exports.handler = async (event) => {
  
  const requestBody = JSON.parse(event.body);
  
  console.log('requestBody inside lambda:', requestBody);

  const client = new DynamoDBClient({
    credentials: {
      accessKeyId: "AKIA6GBMCZQNUE37F77N",
      secretAccessKey: "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",
    },
    region: 'us-east-1',
  });
  // Define the parameters for the PutItemCommand
  const params = {
    TableName: 'fovus-coding-challenge-us-east-1-table', 
    Item: {
      id: { S: requestBody.id },
      textInput: { S: requestBody.textInput },
      filePath: { S: requestBody.filePath },
    },
  };
  // Create a command to put the item into DynamoDB
  try {
    const putCommand = new PutItemCommand(params);
    const data = await client.send(putCommand);
    console.log('after running client.send for putCommand'); 
    console.log("Success:", data);
  } catch (error) {
      console.error("Error:", error);
      throw error; // Rethrow the error to propagate it
  }

  console.log('after sending commands'); 
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Lambda function executed.' })
  };
};