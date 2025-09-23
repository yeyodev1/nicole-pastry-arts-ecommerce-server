import express, { Application } from "express";
import authRouter from "./auth.route";

function routerApi(app: Application) {
  const router = express.Router();
  app.use("/api", router);
  
  // Auth routes
  router.use("/auth", authRouter);
}

export default routerApi;
