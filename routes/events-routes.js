import express from "express";
import {
  addEvent,
  getAllEvents,
  getEventById,
  deleteEvent
} from "../controllers/event-controller.js";
const eventsRouter = express.Router();
eventsRouter.get("/", getAllEvents);
eventsRouter.get("/:id", getEventById);
eventsRouter.post("/", addEvent);
eventsRouter.delete("/:id", deleteEvent);

export default eventsRouter;
