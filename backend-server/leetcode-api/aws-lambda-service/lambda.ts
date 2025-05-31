import serverlessExpress from "@vendia/serverless-express";
import app from "./app"; // your Express app

export const handler = serverlessExpress({ app });