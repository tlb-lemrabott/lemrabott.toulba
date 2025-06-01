import serverlessExpress from "@vendia/serverless-express";
import app from "./app";

export const handler = serverlessExpress({ app });


// import type { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from "aws-lambda";
// import awsServerlessExpress from "aws-serverless-express";
// import app from "./app";

// const server = awsServerlessExpress.createServer(app);

// export const handler = (
//   event: APIGatewayProxyEvent,
//   context: Context
// ): Promise<APIGatewayProxyResult> => {
//   return awsServerlessExpress.proxy(server, event, context, "PROMISE").promise;
// };
