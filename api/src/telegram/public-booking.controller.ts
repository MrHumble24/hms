import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { PublicBookingService } from './public-booking.service.js';
import {
  CheckAvailabilityDto,
  CreatePublicBookingDto,
} from './dto/public-booking.dto.js';
import { PublicHotelsService } from '../branch/public-hotels.service.js';

/**
 * Public API Controller for Telegram and Website bookings.
 * These endpoints do NOT require authentication.
 */
@Controller('public')
export class PublicBookingController {
  constructor(
    private publicBookingService: PublicBookingService,
    private publicHotelsService: PublicHotelsService,
  ) {}

  /**
   * Find nearby hotels by location
   * GET /public/hotels/nearby?lat=41.2995&lng=69.2401&radiusKm=50
   */
  @Get('hotels/nearby')
  async findNearbyHotels(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radiusKm') radiusKm?: string,
  ) {
    return this.publicHotelsService.findNearby(
      parseFloat(lat),
      parseFloat(lng),
      radiusKm ? parseFloat(radiusKm) : 50,
    );
  }

  /**
   * Get hotel details by ID or slug
   * GET /public/hotels/:idOrSlug
   */
  @Get('hotels/:idOrSlug')
  async getHotelDetails(@Param('idOrSlug') idOrSlug: string) {
    return this.publicHotelsService.getHotelDetails(idOrSlug);
  }

  /**
   * Check room availability for a specific hotel
   * GET /public/availability?branchId=xxx&checkIn=2026-02-01&checkOut=2026-02-03&guests=2
   */
  @Get('availability')
  async checkAvailability(
    @Query('branchId') branchId: string,
    @Query('checkIn') checkIn: string,
    @Query('checkOut') checkOut: string,
    @Query('guests') guests?: string,
  ) {
    return this.publicBookingService.checkAvailability({
      branchId,
      checkIn,
      checkOut,
      guests: guests ? parseInt(guests, 10) : 1,
    });
  }

  /**
   * Create a new booking (from Telegram or website)
   * POST /public/book
   */
  @Post('book')
  async createBooking(@Body() dto: CreatePublicBookingDto) {
    return this.publicBookingService.createPublicBooking(dto);
  }
}
