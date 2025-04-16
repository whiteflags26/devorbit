import TurfReviewService from '../modules/turf-review/turf-review.service';
import { TurfReview } from '../modules/turf-review/turf-review.model';
import { Turf } from '../modules/turf/turf.model';
import User from '../modules/user/user.model';
import mongoose from 'mongoose';

describe('TurfReviewService', () => {
  let turfReviewService: TurfReviewService;

  beforeAll(() => {
    turfReviewService = new TurfReviewService();
  });

  describe('createReview', () => {
    it('should create a new review', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const turfId = new mongoose.Types.ObjectId().toString();

      // Mock user and turf existence
      jest.spyOn(User, 'exists').mockResolvedValueOnce({ _id: userId });
      jest.spyOn(Turf, 'exists').mockResolvedValueOnce({ _id: turfId });

      const reviewData = {
        turfId,
        userId,
        rating: 5,
        review: 'Great turf!',
        images: ['image1.jpg', 'image2.jpg']
      };

      const saveSpy = jest.spyOn(TurfReview.prototype, 'save').mockResolvedValueOnce({
        _id: new mongoose.Types.ObjectId(),
        turf: turfId,
        user: userId,
        rating: 5,
        review: 'Great turf!',
        images: ['image1.jpg', 'image2.jpg'],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const userUpdateSpy = jest.spyOn(User, 'findByIdAndUpdate').mockResolvedValueOnce({});
      const turfUpdateSpy = jest.spyOn(Turf, 'findByIdAndUpdate').mockResolvedValueOnce({});

      const result = await turfReviewService.createReview(reviewData);

      expect(result).toBeDefined();
      expect(result.rating).toBe(5);
      expect(result.review).toBe('Great turf!');
      expect(saveSpy).toHaveBeenCalled();
      expect(userUpdateSpy).toHaveBeenCalled();
      expect(turfUpdateSpy).toHaveBeenCalled();
    });

    it('should throw error if user does not exist', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const turfId = new mongoose.Types.ObjectId().toString();

      jest.spyOn(User, 'exists').mockResolvedValueOnce(null);

      const reviewData = {
        turfId,
        userId,
        rating: 5,
        review: 'Great turf!',
        images: []
      };

      await expect(turfReviewService.createReview(reviewData)).rejects.toThrow('User not found');
    });

    // Add more test cases for other scenarios
  });

  describe('deleteReview', () => {
    it('should delete a review', async () => {
      const reviewId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();
      const turfId = new mongoose.Types.ObjectId().toString();

      const mockReview = {
        _id: reviewId,
        turf: turfId,
        user: userId,
        deleteOne: jest.fn().mockResolvedValueOnce({})
      };

      jest.spyOn(TurfReview, 'findById').mockResolvedValueOnce(mockReview);
      jest.spyOn(User, 'findByIdAndUpdate').mockResolvedValueOnce({});
      jest.spyOn(Turf, 'findByIdAndUpdate').mockResolvedValueOnce({});

      const result = await turfReviewService.deleteReview(reviewId, userId);

      expect(result).toBe(true);
      expect(mockReview.deleteOne).toHaveBeenCalled();
    });

    it('should throw error if review not found', async () => {
      const reviewId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();

      jest.spyOn(TurfReview, 'findById').mockResolvedValueOnce(null);

      await expect(turfReviewService.deleteReview(reviewId, userId)).rejects.toThrow('Review not found');
    });

    // Add more test cases for other scenarios
  });
});