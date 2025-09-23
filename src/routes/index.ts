import express, { Application } from "express";
import authRouter from "./auth.route";
import businessRouter from "./business.route";

function routerApi(app: Application) {
  const router = express.Router();
  app.use("/api", router);
  
  // Auth routes
  router.use("/auth", authRouter);
  
  // Business routes (public - no authentication required)
  router.use("/business", businessRouter);
}

export default routerApi;
