import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources'; 

export class FovusCodingInfrastrcutureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    // Create an IAM user
    const user = new iam.User(this, 'FovusCodingChallengeUser', {
      userName: 'fovus-coding-challenge-user',
    });

    // Create an IAM policy
    const policy = new iam.Policy(this, 'FovusCodingChallengePolicy', {
      policyName: 'FovusCodingChallengeUserPolicy',
      statements: [
        // Grant admin access
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['*'],
          resources: ['*'],
        }),
      ]
    });

    // Attach the policy to the user
    user.attachInlinePolicy(policy);


    // Create a S3 bucket 
    const s3Bucket = new s3.Bucket(this, 'FovusCodingChallengeUsEast1', {
      bucketName: 'fovus-coding-challenge-us-east-1-bucket',
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      cors:[
          {
            allowedOrigins: ['http://localhost:*'],
            allowedMethods: [ s3.HttpMethods.GET, s3.HttpMethods.POST, s3.HttpMethods.PUT, s3.HttpMethods.DELETE ],
            allowedHeaders: ['*'],
            maxAge: 3000
          }
        ]
    });

    // Create a DynamoDB table
    const dynamodbTable = new dynamodb.Table(this, 'FovusCodingChallengeTable', {
      tableName:'fovus-coding-challenge-us-east-1-table',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      stream: dynamodb.StreamViewType.NEW_IMAGE,
    });

    // Create an API Gateway
    const apiGateway = new apigateway.RestApi(this, 'FovusCodingChallengeApi', {
      restApiName: 'Fovus Coding Challenge API',
    });

    // Define a resource '/formData'
    const fromDataResource = apiGateway.root.addResource('formData');

    // Create a Lambda function
    const myLambdaFunction = new lambda.Function(this, 'FovusCodingChallengeLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('put-item-in-dynamodb-lambda'), // Directory containing your Lambda function code
    });

     // Create a Lambda integration
     const lambdaIntegration = new apigateway.LambdaIntegration(myLambdaFunction);

     // Add a POST method to the '/items' resource
    fromDataResource.addMethod('POST', lambdaIntegration);

    fromDataResource.addCorsPreflight({
      allowOrigins: ['http://localhost:*'], // Specify allowed origins
      allowMethods: ['GET', 'POST'], // Specify allowed methods
      allowHeaders: ['Content-Type'], // Specify allowed headers
    });
    
    console.log('API Gateway URL:', apiGateway.url);

    // Create a Lambda function
    const watchLambdaFunction = new lambda.Function(this, 'WatchDyanmoDBEventLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('watch-lambda'),
    });

    console.log('watchLambdaFunction Created:', watchLambdaFunction);

    dynamodbTable.grantStreamRead(watchLambdaFunction);

    // Add DynamoDB Stream event source to Lambda
    watchLambdaFunction.addEventSource(new lambdaEventSources.DynamoEventSource(dynamodbTable, {
      startingPosition: lambda.StartingPosition.TRIM_HORIZON
    }));
    
    // setApiUrlFromCdk(apiGateway.url)

  }
}
