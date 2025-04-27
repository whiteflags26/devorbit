import { Response } from "express";
import asyncHandler from "../../shared/middleware/async";
import TurfReviewService, {
  ReviewFilterOptions,
  ReviewSummary,
} from "./turf-review.service";
import { AuthenticatedRequest } from "../../types/request";
import { getUserId } from "../../utils/getUserId";
import { AuthRequest } from "../auth/auth.middleware";
import ErrorResponse from "../../utils/errorResponse";

export default class TurfReviewController {
  private readonly turfReviewService: TurfReviewService;

  constructor() {
    this.turfReviewService = new TurfReviewService();
  }

  /**
   * @route   POST /api/v1/turf-review
   * @desc    create a new review
   * @access  Private
   */
  public createTurfReview = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const { turfId, rating, review } = req.body;
      const images = req.files as Express.Multer.File[];

      // Validate required fields
      if (!turfId || !rating) {
        throw new ErrorResponse("Turf ID and rating are required", 400);
      }

      const userId = getUserId(req);

      const newTurfReview = await this.turfReviewService.createReview({
        turfId,
        userId,
        rating,
        review,
        images,
      });

      res.status(201).json({
        success: true,
        data: newTurfReview,
      });
    }
  );

  /**
   * @route   PUT api/v1/turf-review/:reviewId
   * @desc    update a review
   * @access  Private
   */
  public updateReview = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const { rating, review } = req.body;
      const { reviewId } = req.params;
      const userId = req.user?.id;
      const images = req.files as Express.Multer.File[];

      if (!userId) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }

      const updatedReview = await this.turfReviewService.updateReview(
        reviewId,
        userId,
        { rating, review, images }
      );

      res.status(200).json({ success: true, data: updatedReview });
    }
  );

  /**
   * @route   DELETE /api/v1/turf-review/:id
   * @desc    delete a review
   * @access  Private
   */
  public deleteTurfReview = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const userId = getUserId(req);
      const { reviewId } = req.params;

      if (!reviewId) {
        res.status(400).json({
          success: false,
          message: "Review ID is required",
        });
        return;
      }

      await this.turfReviewService.deleteReview(reviewId, userId);

      res.status(200).json({
        success: true,
        message: "Review deleted successfully",
      });
    }
  );

  /**
   * @route   GET /api/v1/turf-review/turf/:turfId
   * @desc    get all the reviews by turf and other filters and their average rating and rating distribution
   * @access  Public
   */
  public getReviewsByTurf = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      const { turfId } = req.params;
      const options = this.extractFilterOptions(req);

      const result = await this.turfReviewService.getReviewsByTurf(
        turfId,
        options
      );

      this.sendReviewResponse(res, result, options);
    }
  );

  /**
   * @route   GET /api/v1/turf-review/review/:id
   * @desc    get review by its id
   * @access  Public
   */
  public getReviewById = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      const { reviewId } = req.params;
      const review = await this.turfReviewService.getReviewById(reviewId);

      if (!review) {
        res.status(404).json({ success: false, message: "Review not found" });
        return;
      }

      res.status(200).json({ success: true, data: review });
    }
  );

  /**
   * @route   GET /api/v1/turf-review/summary/:turfId
   * @desc    get the average rating and rating count for a turf
   * @access  Public
   */
  public getTurfReviewSummary = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const { turfId } = req.params;
      const summary = await this.turfReviewService.getTurfReviewSummary(turfId);

      res.status(200).json({
        success: true,
        data: summary,
      });
    }
  );

  /**
   * @route   GET /api/v1/turf-review/user/:userId
   * @desc    Get all reviews by a specific user with average rating and rating distribution
   * @access  Public
   */
  public getReviewsByUser = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      const { userId } = req.params;
      const options = this.extractFilterOptions(req);

      const result = await this.turfReviewService.getReviewsByUser(
        userId,
        options
      );

      this.sendReviewResponse(res, result, options);
    }
  );

  /**
   * Extract filter options from request query parameters
   * @private
   */
  private extractFilterOptions(req: AuthRequest): ReviewFilterOptions {
    return {
      minRating: req.query.minRating ? Number(req.query.minRating) : undefined,
      maxRating: req.query.maxRating ? Number(req.query.maxRating) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      skip:
        req.query.page && req.query.limit
          ? (parseInt(req.query.page as string) - 1) *
            parseInt(req.query.limit as string)
          : undefined,
      sortBy: (req.query.sortBy as string) || "createdAt",
      sortOrder: req.query.sortOrder === "asc" ? "asc" : "desc",
    };
  }

  /**
   * Format and send response for review queries
   * @private
   */
  private sendReviewResponse(
    res: Response,
    result: ReviewSummary,
    options: ReviewFilterOptions
  ): void {
    // Calculate pagination details only if limit is provided
    const page =
      options.limit && options.skip
        ? Math.floor(options.skip / options.limit) + 1
        : 1;
    const pages = options.limit ? Math.ceil(result.total / options.limit) : 1;

    res.status(200).json({
      success: true,
      data: {
        reviews: result.reviews,
        averageRating: result.averageRating,
        ratingDistribution: result.ratingDistribution,
      },
      meta: {
        total: result.total,
        ...(options.limit && {
          page,
          limit: options.limit,
          pages,
        }),
      },
    });
  }
}
