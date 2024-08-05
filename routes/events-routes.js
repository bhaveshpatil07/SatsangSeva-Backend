import express from "express";
import {
  addEvent,
  getEventById,
  deleteEvent,
  getUpComingEvents,
  getPastEvents
} from "../controllers/event-controller.js";
const eventsRouter = express.Router();
eventsRouter.get("/", getUpComingEvents);
eventsRouter.get("/past", getPastEvents);
eventsRouter.get("/:id", getEventById);
eventsRouter.post("/", addEvent);
eventsRouter.delete("/:id", deleteEvent);

export default eventsRouter;
