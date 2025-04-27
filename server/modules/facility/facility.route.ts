import { Router } from "express";
import FacilityController from "./facility.controller";
import { checkPermission, protect } from "../auth/auth.middleware";


const router = Router();
const facilityController = new FacilityController();

router.post("/", checkPermission("manage_tags"), facilityController.createFacility);
router.get("/", facilityController.getAllFacilities);
router.get("/:id", facilityController.getFacilityById);
router.put("/:id", checkPermission("manage_tags"), facilityController.updateFacility);
router.delete("/:id", checkPermission("manage_tags"), facilityController.deleteFacility);

export default router;