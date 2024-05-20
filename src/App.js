import React, { useState } from 'react';
import AWS from 'aws-sdk';

const axios = require('axios');
const { nanoid } = require('nanoid');

AWS.config.update({ 
  accessKeyId: 'Enter Access Key',
  secretAccessKey: 'Enter Secret Key',
  region: 'us-east-1',
});

// AWS S3 configuration
const s3 = new AWS.S3();

// const docClient = new AWS.DynamoDB.DocumentClient();


const App = () => {
  const [textInput, setTextInput] = useState('');
  const [fileInput, setFileInput] = useState(null);


  const handleTextChange = (event) => {
    setTextInput(event.target.value);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setFileInput(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!fileInput) return;

    const fileName = fileInput.name;
    const fileContent = fileInput;

    const params = {
      Bucket: 'fovus-coding-challenge-us-east-1-bucket',
      Key: fileName,
      Body: fileContent,
    };

    try {
      const s3Data = await s3.upload(params).promise();
      console.log('File uploaded successfully');
      const id = nanoid(10);
      // create post data for AWS LAMBDA to send from API gateway.
      const requestBody = {
        id: id,
        textInput: textInput,
        filePath: s3Data.Location,
      };

      axios.post('https://xwcp27h3ad.execute-api.us-east-1.amazonaws.com/prod/formData', requestBody)  //replace the url with the url printed in console
        .then(response => {
          console.log('Response:', response.data);  // use this and replace above url on line 57
        })
        .catch(error => {
          console.error('Error:', error.response.data);
        });
      console.log('done calling APi Gateway');
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  return (
    <div>
      <h1>Upload File to S3 Bucket</h1>
      <form onSubmit={handleSubmit}>
      <div>
          <label htmlFor="textInput">Text Input:</label>
          <input
            type="text"
            id="textInput"
            value={textInput}
            onChange={handleTextChange}
            required
          />
        </div>
        <div>
          <label htmlFor="fileInput">Input File:</label>

          <input
            type="file"
            id="fileInput"
            accept=".txt, .TXT"
            onChange={handleFileChange}
          />
        </div>
        <button type="submit">Upload</button>
      </form>
    </div>
  );
};

export default App;
