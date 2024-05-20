"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FovusCodingInfrastrcutureStack = void 0;
const cdk = require("aws-cdk-lib");
const iam = require("aws-cdk-lib/aws-iam");
const s3 = require("aws-cdk-lib/aws-s3");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const lambda = require("aws-cdk-lib/aws-lambda");
const lambdaEventSources = require("aws-cdk-lib/aws-lambda-event-sources");
class FovusCodingInfrastrcutureStack extends cdk.Stack {
    constructor(scope, id, props) {
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
            cors: [
                {
                    allowedOrigins: ['http://localhost:*'],
                    allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.POST, s3.HttpMethods.PUT, s3.HttpMethods.DELETE],
                    allowedHeaders: ['*'],
                    maxAge: 3000
                }
            ]
        });
        // Create a DynamoDB table
        const dynamodbTable = new dynamodb.Table(this, 'FovusCodingChallengeTable', {
            tableName: 'fovus-coding-challenge-us-east-1-table',
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
exports.FovusCodingInfrastrcutureStack = FovusCodingInfrastrcutureStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm92dXMtY29kaW5nLWluZnJhc3RyY3V0dXJlLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZm92dXMtY29kaW5nLWluZnJhc3RyY3V0dXJlLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUVuQywyQ0FBMkM7QUFDM0MseUNBQXlDO0FBQ3pDLHFEQUFxRDtBQUNyRCx5REFBeUQ7QUFDekQsaURBQWlEO0FBQ2pELDJFQUEyRTtBQUUzRSxNQUFhLDhCQUErQixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQzNELFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDOUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFHeEIscUJBQXFCO1FBQ3JCLE1BQU0sSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsMEJBQTBCLEVBQUU7WUFDMUQsUUFBUSxFQUFFLDZCQUE2QjtTQUN4QyxDQUFDLENBQUM7UUFFSCx1QkFBdUI7UUFDdkIsTUFBTSxNQUFNLEdBQUcsSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSw0QkFBNEIsRUFBRTtZQUNoRSxVQUFVLEVBQUUsZ0NBQWdDO1lBQzVDLFVBQVUsRUFBRTtnQkFDVixxQkFBcUI7Z0JBQ3JCLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztvQkFDdEIsTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSztvQkFDeEIsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDO29CQUNkLFNBQVMsRUFBRSxDQUFDLEdBQUcsQ0FBQztpQkFDakIsQ0FBQzthQUNIO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsZ0NBQWdDO1FBQ2hDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUdoQyxzQkFBc0I7UUFDdEIsTUFBTSxRQUFRLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxD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QyxDQUFDO1FBRWpFLGFBQWEsQ0FBQyxlQUFlLENBQUMsbUJBQW1CLENBQUMsQ0FBQztRQUVuRCw2Q0FBNkM7UUFDN0MsbUJBQW1CLENBQUMsY0FBYyxDQUFDLElBQUksa0JBQWtCLENBQUMsaUJBQWlCLENBQUMsYUFBYSxFQUFFO1lBQ3pGLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZO1NBQ3ZELENBQUMsQ0FBQyxDQUFDO1FBRUosbUNBQW1DO0lBRXJDLENBQUM7Q0FDRjtBQW5HRCx3RUFtR0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXknO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgbGFtYmRhRXZlbnRTb3VyY2VzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEtZXZlbnQtc291cmNlcyc7IFxuXG5leHBvcnQgY2xhc3MgRm92dXNDb2RpbmdJbmZyYXN0cmN1dHVyZVN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG5cbiAgICAvLyBDcmVhdGUgYW4gSUFNIHVzZXJcbiAgICBjb25zdCB1c2VyID0gbmV3IGlhbS5Vc2VyKHRoaXMsICdGb3Z1c0NvZGluZ0NoYWxsZW5nZVVzZXInLCB7XG4gICAgICB1c2VyTmFtZTogJ2ZvdnVzLWNvZGluZy1jaGFsbGVuZ2UtdXNlcicsXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgYW4gSUFNIHBvbGljeVxuICAgIGNvbnN0IHBvbGljeSA9IG5ldyBpYW0uUG9saWN5KHRoaXMsICdGb3Z1c0NvZGluZ0NoYWxsZW5nZVBvbGljeScsIHtcbiAgICAgIHBvbGljeU5hbWU6ICdGb3Z1c0NvZGluZ0NoYWxsZW5nZVVzZXJQb2xpY3knLFxuICAgICAgc3RhdGVtZW50czogW1xuICAgICAgICAvLyBHcmFudCBhZG1pbiBhY2Nlc3NcbiAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICBhY3Rpb25zOiBbJyonXSxcbiAgICAgICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgICAgICB9KSxcbiAgICAgIF1cbiAgICB9KTtcblxuICAgIC8vIEF0dGFjaCB0aGUgcG9saWN5IHRvIHRoZSB1c2VyXG4gICAgdXNlci5hdHRhY2hJbmxpbmVQb2xpY3kocG9saWN5KTtcblxuXG4gICAgLy8gQ3JlYXRlIGEgUzMgYnVja2V0IFxuICAgIGNvbnN0IHMzQnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCAnRm92dXNDb2RpbmdDaGFsbGVuZ2VVc0Vhc3QxJywge1xuICAgICAgYnVja2V0TmFtZTogJ2ZvdnVzLWNvZGluZy1jaGFsbGVuZ2UtdXMtZWFzdC0xLWJ1Y2tldCcsXG4gICAgICB2ZXJzaW9uZWQ6IHRydWUsXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgICAgY29yczpbXG4gICAgICAgICAge1xuICAgICAgICAgICAgYWxsb3dlZE9yaWdpbnM6IFsnaHR0cDovL2xvY2FsaG9zdDoqJ10sXG4gICAgICAgICAgICBhbGxvd2VkTWV0aG9kczogWyBzMy5IdHRwTWV0aG9kcy5HRVQsIHMzLkh0dHBNZXRob2RzLlBPU1QsIHMzLkh0dHBNZXRob2RzLlBVVCwgczMuSHR0cE1ldGhvZHMuREVMRVRFIF0sXG4gICAgICAgICAgICBhbGxvd2VkSGVhZGVyczogWycqJ10sXG4gICAgICAgICAgICBtYXhBZ2U6IDMwMDBcbiAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBhIER5bmFtb0RCIHRhYmxlXG4gICAgY29uc3QgZHluYW1vZGJUYWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnRm92dXNDb2RpbmdDaGFsbGVuZ2VUYWJsZScsIHtcbiAgICAgIHRhYmxlTmFtZTonZm92dXMtY29kaW5nLWNoYWxsZW5nZS11cy1lYXN0LTEtdGFibGUnLFxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdpZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgIHN0cmVhbTogZHluYW1vZGIuU3RyZWFtVmlld1R5cGUuTkVXX0lNQUdFLFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIGFuIEFQSSBHYXRld2F5XG4gICAgY29uc3QgYXBpR2F0ZXdheSA9IG5ldyBhcGlnYXRld2F5LlJlc3RBcGkodGhpcywgJ0ZvdnVzQ29kaW5nQ2hhbGxlbmdlQXBpJywge1xuICAgICAgcmVzdEFwaU5hbWU6ICdGb3Z1cyBDb2RpbmcgQ2hhbGxlbmdlIEFQSScsXG4gICAgfSk7XG5cbiAgICAvLyBEZWZpbmUgYSByZXNvdXJjZSAnL2Zvcm1EYXRhJ1xuICAgIGNvbnN0IGZyb21EYXRhUmVzb3VyY2UgPSBhcGlHYXRld2F5LnJvb3QuYWRkUmVzb3VyY2UoJ2Zvcm1EYXRhJyk7XG5cbiAgICAvLyBDcmVhdGUgYSBMYW1iZGEgZnVuY3Rpb25cbiAgICBjb25zdCBteUxhbWJkYUZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnRm92dXNDb2RpbmdDaGFsbGVuZ2VMYW1iZGEnLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgncHV0LWl0ZW0taW4tZHluYW1vZGItbGFtYmRhJyksIC8vIERpcmVjdG9yeSBjb250YWluaW5nIHlvdXIgTGFtYmRhIGZ1bmN0aW9uIGNvZGVcbiAgICB9KTtcblxuICAgICAvLyBDcmVhdGUgYSBMYW1iZGEgaW50ZWdyYXRpb25cbiAgICAgY29uc3QgbGFtYmRhSW50ZWdyYXRpb24gPSBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihteUxhbWJkYUZ1bmN0aW9uKTtcblxuICAgICAvLyBBZGQgYSBQT1NUIG1ldGhvZCB0byB0aGUgJy9pdGVtcycgcmVzb3VyY2VcbiAgICBmcm9tRGF0YVJlc291cmNlLmFkZE1ldGhvZCgnUE9TVCcsIGxhbWJkYUludGVncmF0aW9uKTtcblxuICAgIGZyb21EYXRhUmVzb3VyY2UuYWRkQ29yc1ByZWZsaWdodCh7XG4gICAgICBhbGxvd09yaWdpbnM6IFsnaHR0cDovL2xvY2FsaG9zdDoqJ10sIC8vIFNwZWNpZnkgYWxsb3dlZCBvcmlnaW5zXG4gICAgICBhbGxvd01ldGhvZHM6IFsnR0VUJywgJ1BPU1QnXSwgLy8gU3BlY2lmeSBhbGxvd2VkIG1ldGhvZHNcbiAgICAgIGFsbG93SGVhZGVyczogWydDb250ZW50LVR5cGUnXSwgLy8gU3BlY2lmeSBhbGxvd2VkIGhlYWRlcnNcbiAgICB9KTtcbiAgICBcbiAgICBjb25zb2xlLmxvZygnQVBJIEdhdGV3YXkgVVJMOicsIGFwaUdhdGV3YXkudXJsKTtcblxuICAgIC8vIENyZWF0ZSBhIExhbWJkYSBmdW5jdGlvblxuICAgIGNvbnN0IHdhdGNoTGFtYmRhRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdXYXRjaER5YW5tb0RCRXZlbnRMYW1iZGEnLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnd2F0Y2gtbGFtYmRhJyksXG4gICAgfSk7XG5cbiAgICBjb25zb2xlLmxvZygnd2F0Y2hMYW1iZGFGdW5jdGlvbiBDcmVhdGVkOicsIHdhdGNoTGFtYmRhRnVuY3Rpb24pO1xuXG4gICAgZHluYW1vZGJUYWJsZS5ncmFudFN0cmVhbVJlYWQod2F0Y2hMYW1iZGFGdW5jdGlvbik7XG5cbiAgICAvLyBBZGQgRHluYW1vREIgU3RyZWFtIGV2ZW50IHNvdXJjZSB0byBMYW1iZGFcbiAgICB3YXRjaExhbWJkYUZ1bmN0aW9uLmFkZEV2ZW50U291cmNlKG5ldyBsYW1iZGFFdmVudFNvdXJjZXMuRHluYW1vRXZlbnRTb3VyY2UoZHluYW1vZGJUYWJsZSwge1xuICAgICAgc3RhcnRpbmdQb3NpdGlvbjogbGFtYmRhLlN0YXJ0aW5nUG9zaXRpb24uVFJJTV9IT1JJWk9OXG4gICAgfSkpO1xuICAgIFxuICAgIC8vIHNldEFwaVVybEZyb21DZGsoYXBpR2F0ZXdheS51cmwpXG5cbiAgfVxufVxuIl19