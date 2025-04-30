import express from "express";
import multer from "multer";

import { checkPermission, protect } from "../auth/auth.middleware";

import {
  createOrganization,
  assignOwner,
  updateOrganization,
  deleteOrganization,
  createOrganizationRole,
  fetchOtherTurfs,
  getOrganization
} from "./organization.controller";
import { getOrganizationRoles } from "../role/role.controller";
import { assignOrganizationRole } from "../role_assignment/userRoleAssignmentController";
import { standardApiLimiter } from "../../utils/rateLimiter";


const router = express.Router();

// Configure Multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }, // 5MB limit, up to 5 files
});

// --- Organization CRUD ---

// Create Organization (Admin only)
router.post(
  "/",
  standardApiLimiter,
  protect,
  
  checkPermission("create_organization"), // Global permission check
  upload.array("images", 5), // Handle images
  createOrganization
);

// Assign Owner to Organization (Admin only)
router.post(
  "/:id/assign-owner",
  standardApiLimiter,
  protect,
  checkPermission("assign_organization_owner"), // Global permission check
  assignOwner
);

// Update Organization Details (Org Owner or role with permission)
router.put(
  "/:id",
  standardApiLimiter,
  protect,
  checkPermission("update_organization"), // Organization-scoped permission check
  upload.array("images", 5), // Handle optional image updates
  updateOrganization
);

// Delete Organization (Org Owner or Admin)
router.delete(
  "/:id",
  standardApiLimiter,
  protect,

  checkPermission("delete_own_organization"), // Check this first (most common case)

  deleteOrganization
);

// Get Organization Details
router.get("/:id", getOrganization);

router.post(
  "/:id/roles", // Use :id for organizationId for consistency
  standardApiLimiter,
  protect,
  checkPermission("manage_organization_roles"), // Organization-scoped
  createOrganizationRole
);

router.get(
  "/:organizationId/roles",
  standardApiLimiter,
  protect,
  checkPermission("view_roles"),
  getOrganizationRoles
);

router.post(
  "/:organizationId/users/:userId/assignments",
  standardApiLimiter,
  protect,
  checkPermission("manage_organization_roles"),
  assignOrganizationRole
);

// Fetch other turfs by organization excluding the given turf
router.get("/:organizationId/other-turfs/:turfId", fetchOtherTurfs);

export default router;
