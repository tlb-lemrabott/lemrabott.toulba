import serverlessExpress from "@vendia/serverless-express";
import app from "./app";
import type { Handler, APIGatewayProxyEvent, Context, APIGatewayProxyResult } from "aws-lambda";

const handler: Handler<APIGatewayProxyEvent, APIGatewayProxyResult> = serverlessExpress({ app });

export { handler };