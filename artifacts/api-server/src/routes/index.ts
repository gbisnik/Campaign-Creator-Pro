import { Router, type IRouter } from "express";
import healthRouter from "./health";
import connectorsRouter from "./connectors/index.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(connectorsRouter);

export default router;
