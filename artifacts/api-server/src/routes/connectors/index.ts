import { Router, type IRouter } from "express";
import cm360Router from "./cm360.js";
import veevaRouter from "./veeva.js";

const router: IRouter = Router();

router.use(cm360Router);
router.use(veevaRouter);

export default router;
