import serverlessExpress from "@vendia/serverless-express";
import app from "./app";
import type { Context, Callback, APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const server = serverlessExpress({ app });

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
  callback: Callback<APIGatewayProxyResult>
): Promise<APIGatewayProxyResult> => {
  return server(event, context, callback);
};