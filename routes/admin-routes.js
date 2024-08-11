import express from "express";
import { addAdmin, adminLogin, getAdminById, getAdmins, } from "../controllers/admin-controller.js";
import { approveEventById, getPendingEvents } from "../controllers/event-controller.js";

const adminRouter = express.Router();

// adminRouter.post("/signup", addAdmin);
// adminRouter.post("/login", adminLogin);
// adminRouter.get("/", getAdmins);
// adminRouter.get("/:id", getAdminById);
adminRouter.get("/event/pending", getPendingEvents);
adminRouter.put("/approve/:id", approveEventById);

export default adminRouter;
