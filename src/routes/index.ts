import express, { Application } from "express";
import authRouter from "./auth.route";
import businessRouter from "./business.route";
import ordersRouter from "./orders.route";
import staffRouter from "./staff.route";

function routerApi(app: Application) {
  const router = express.Router();
  app.use("/api", router);
  
  // Auth routes
  router.use("/auth", authRouter);
  
  // Business routes (public - no authentication required)
  router.use("/business", businessRouter);
  
  // Orders routes (private - authentication required)
  router.use("/orders", ordersRouter);
  
  // Staff routes (private - staff/admin only)
  router.use("/staff", staffRouter);
}

export default routerApi;
