import express from "express";
import {
  addEvent,
  getAllEvents,
  getEventById
} from "../controllers/event-controller.js";
const eventsRouter = express.Router();
eventsRouter.get("/", getAllEvents);
eventsRouter.get("/:id", getEventById);
eventsRouter.post("/", addEvent);

export default eventsRouter;
