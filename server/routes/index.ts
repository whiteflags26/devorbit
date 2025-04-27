import { Router } from 'express';
import authRouter from '../modules/auth/auth.route';
import bookingRoutes from '../modules/booking/booking.route';
import organizationRouter from '../modules/organization/organization.route';
import permissionRoutes from '../modules/permission/permission.routes';
import roleRouter from '../modules/role/role.routes';
import userRoleAssignmentRoutes from '../modules/role_assignment/userRoleAssignment.routes';
import timeslotRoutes from '../modules/timeslot/timeslot.route';
import turfReviewRoutes from '../modules/turf-review/turf-review.route';
import turfRoutes from '../modules/turf/turf.route';
import userRouter from '../modules/user/user.routes';
import adminActionsRouter from '../modules/admin_actions/adminActions.routes'
import organizationRequestRouter from '../modules/organization-request/organization-request.route';
import teamSizeRouter from '../modules/team_size/team_size.route';
import sportsRouter from '../modules/sports/sports.route';
import facilityRouter from '../modules/facility/facility.route';
import { healthRouter } from '../modules/health-metrics/health-metrics.routes';
import { metricsRouter, metricsApiRouter } from '../modules/health-metrics/health-metrics.routes';

const router = Router();

router.get('/', (req, res) => {
  res.send('Server is running');
});

router.use('/api/v1/auth', authRouter);
router.use('/api/v1/organizations', organizationRouter);
router.use('/api/v1/turf', turfRoutes);
router.use('/api/v1/turf-review', turfReviewRoutes);
router.use('/api/v1/timeslot', timeslotRoutes);
router.use('/api/v1/booking', bookingRoutes);
router.use('/api/v1/role-assignments', userRoleAssignmentRoutes);
router.use('/api/v1/roles', roleRouter);
router.use('/api/v1/users', userRouter);
router.use('/api/v1/permissions', permissionRoutes);
router.use('/api/v1/admin/logs', adminActionsRouter)
router.use('/api/v1/organization-requests', organizationRequestRouter);
router.use('/api/v1/team-sizes', teamSizeRouter);
router.use('/api/v1/sports', sportsRouter);
router.use('/api/v1/facilities', facilityRouter);

// Health and metrics routes (add these lines)
router.use('/health', healthRouter);
router.use('/metrics', metricsRouter);
router.use('/api/v1/metrics', metricsApiRouter);

export default router;
