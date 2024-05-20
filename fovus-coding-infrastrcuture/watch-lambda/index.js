const { EC2Client, RunInstancesCommand, HttpTokensState, TerminateInstancesCommand } = require('@aws-sdk/client-ec2');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

exports.handler = async (event) => {
  console.log('DynamoDB Stream Event:', JSON.stringify(event, null, 2));

  const record = event.Records[0];
  console.log('record :', record);
  const newItem = unmarshall(record.dynamodb.NewImage);

  console.log('DynamoDB newItem :', newItem); 

  const ec2Client = new EC2Client({ 
    credentials: {
      accessKeyId: "AKIA6GBMCZQNUE37F77N",
      secretAccessKey: "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",
    },
    region: 'us-east-1' 
  });

  console.log('ec2Client created :'); 

  if (record.eventName === 'INSERT' && 'textInput' in newItem ) {
    try {
      
      const keyPairName = 'my_new_key_pair';
      
      console.log('keyPairName created :'); 
  
      const userDataScript = `
      #!/bin/bash
      sudo yum update -y
      sudo yum install python3
      pip3 install boto3
      echo "#!/usr/bin/env python3" > get_item.py
      echo "import boto3" >> get_item.py
      echo "import tempfile" >> get_item.py
      echo "import os" >> get_item.py
      echo "" >> get_item.py
      echo "aws_access_key_id = 'AKIA6GBMCZQNUE37F77N'" >> get_item.py
      echo "aws_secret_access_key = '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'" >> get_item.py
      echo "region_name = 'us-east-1'" >> get_item.py
      echo "" >> get_item.py
      echo "dynamodb = boto3.resource('dynamodb'," >> get_item.py
      echo "                          aws_access_key_id=aws_access_key_id," >> get_item.py
      echo "                          aws_secret_access_key=aws_secret_access_key," >> get_item.py
      echo "                          region_name=region_name)" >> get_item.py
      echo "" >> get_item.py
      echo "s3 = boto3.client('s3'," >> get_item.py
      echo "                          aws_access_key_id=aws_access_key_id," >> get_item.py
      echo "                          aws_secret_access_key=aws_secret_access_key," >> get_item.py
      echo "                          region_name=region_name)" >> get_item.py
      echo "" >> get_item.py
      echo "table = dynamodb.Table('fovus-coding-challenge-us-east-1-table')" >> get_item.py
      echo "bucket_name = 'fovus-coding-challenge-us-east-1-bucket'" >> get_item.py
      echo "bucket_key = ' '" >> get_item.py
      echo "dynamodb_primary_key = '  '" >> get_item.py
      echo "dynamodb_textInput = ' ' " >> get_item.py
      echo "s3_bucket_file_contents = ' '  " >> get_item.py
      echo "" >> get_item.py
      echo "try:" >> get_item.py
      echo "    response = s3.list_objects_v2(Bucket=bucket_name)" >> get_item.py
      echo "    if 'Contents' in response:" >> get_item.py
      echo "        for obj in response['Contents']:" >> get_item.py
      echo "            bucket_key = obj['Key']  " >> get_item.py
      echo "    output_file_path = 'output_file.txt'" >> get_item.py
      echo "    s3.download_file(bucket_name, bucket_key, output_file_path) " >> get_item.py
      echo "    with open(output_file_path, 'r') as file:" >> get_item.py
      echo "        file_contents = file.read()" >> get_item.py
      echo "        s3_bucket_file_contents = file_contents" >> get_item.py
      echo "    response = table.scan()" >> get_item.py
      echo "    items = response['Items']" >> get_item.py
      echo "    if items:" >> get_item.py
      echo "        for item in items:" >> get_item.py
      echo "            dynamodb_textInput = item['textInput']" >> get_item.py
      echo "            dynamodb_primary_key = item['id']" >> get_item.py
      echo "    output_content = s3_bucket_file_contents + ' ' + dynamodb_textInput" >> get_item.py
      echo "    temp_file = tempfile.NamedTemporaryFile(mode='w', delete=False)" >> get_item.py
      echo "    temp_file.write(output_content)" >> get_item.py
      echo "    temp_file.close()" >> get_item.py
      echo "    s3.upload_file(temp_file.name, bucket_name, output_file_path)" >> get_item.py
      echo "    os.unlink(temp_file.name)" >> get_item.py
      echo "    response = s3.get_object(Bucket=bucket_name, Key=output_file_path)" >> get_item.py
      echo "    result = str(bucket_name + '/' + output_file_path)" >> get_item.py
      echo "    output_item = {" >> get_item.py
      echo "        'id': '1'," >> get_item.py
      echo "        'output_file_path': result" >> get_item.py
      echo "    }" >> get_item.py
      echo "    response = table.put_item(Item=output_item)" >> get_item.py
      echo "" >> get_item.py
      echo "except Exception as e:" >> get_item.py
      echo "    print(f'Error: {e}')" >> get_item.py
      chmod +x get_item.py
      sudo python3 get_item.py
    `;


      const userData = Buffer.from(userDataScript).toString('base64');
      const command = new RunInstancesCommand({
        ImageId: 'ami-0cf43e890af9e3351',
        InstanceType: 't2.micro',
        KeyName: keyPairName,
        MinCount: 1,
        MaxCount: 1,
        TagSpecifications: [{
          ResourceType: 'instance',
          Tags: [{ Key: 'Aws-Linux-image', Value: 'MyInstance' }]
        }],
        UserData: userData,
        MetadataOptions: {
          HttpTokens: HttpTokensState.required,
          HttpPutResponseHopLimit: 1,
        },
        SecurityGroupIds:['sg-0ffd0871e525b753c']
      });

      console.log('RunInstancesCommand created :'); 

      const response = await ec2Client.send(command);
      const instanceId = response.Instances[0].InstanceId;
      console.log("Instance created with ID:", instanceId);

      console.log('EC2 instance launched successfully', response);

      // Delay execution by 5 mins
      await new Promise(resolve => setTimeout(resolve, 300000));

      const params = {
        InstanceIds: [instanceId]
      };

      const data = await ec2Client.send(new TerminateInstancesCommand(params));
      console.log("Instance termination successful:", data);
    } catch (error) {
      console.error('Error creating EC2 instance:', error);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Watch Lambda function executed.' })
  };
};