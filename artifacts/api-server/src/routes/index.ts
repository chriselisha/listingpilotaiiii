import { Router, type IRouter } from "express";
import healthRouter from "./health";
import listingsRouter from "./listings";
import analyzeRouter from "./analyze";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/listings", listingsRouter);
router.use("/listings", analyzeRouter);

export default router;
