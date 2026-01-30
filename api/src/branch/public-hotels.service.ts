import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface Location {
  latitude: number;
  longitude: number;
}

@Injectable()
export class PublicHotelsService {
  constructor(private prisma: PrismaService) {}

  async findNearby(
    userLat?: number,
    userLng?: number,
    radiusKm: number = 50,
    search?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    // We search across all branches of all tenants
    const branches = await this.prisma.branch.findMany({
      where: {
        isActive: true,
        tenant: {
          isActive: true,
        },
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { address: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        tenant: true,
        roomTypes: {
          where: {
            rooms: {
              some: {
                deletedAt: null,
              },
            },
          },
          orderBy: {
            basePrice: 'asc',
          },
          take: 1,
        },
      },
    });

    const hasUserLocation = userLat !== undefined && userLng !== undefined;

    const hotelsWithDistance = (branches as any[]).map((branch) => {
      // Treat missing coordinates as "infinitely far" so they sort to the end
      const hasHotelLocation =
        branch.latitude != null && branch.longitude != null;

      let distance = Infinity;
      if (hasUserLocation && hasHotelLocation) {
        distance = this.calculateDistance(
          userLat,
          userLng,
          Number(branch.latitude),
          Number(branch.longitude),
        );
      }

      return {
        ...branch,
        distance,
        hasLocation: hasHotelLocation,
        // Calculate a "starting from" price if possible
        startingPrice: branch.roomTypes?.[0]?.basePrice || null,
      };
    });

    // Filter by radius if location is provided (regardless of search)
    let filtered = hotelsWithDistance;
    if (hasUserLocation) {
      filtered = hotelsWithDistance.filter(
        (h) => h.distance <= radiusKm || !h.hasLocation, // Include hotels without location but at the end
      );
    }

    // Sort: First by distance (closest first), then by featured, then alphabetically
    const sorted = filtered.sort((a, b) => {
      // Primary sort: distance (closest first, Infinity goes to end)
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }

      // Secondary sort: featured hotels get priority
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;

      // Tertiary sort: alphabetical by name
      return a.name.localeCompare(b.name);
    });

    // Pagination
    const total = sorted.length;
    const startIndex = (page - 1) * limit;
    const data = sorted.slice(startIndex, startIndex + limit);

    return {
      data,
      total,
      page,
      limit,
      hasMore: startIndex + limit < total,
    };
  }

  async getTrending(limit: number = 10) {
    const branches = await this.prisma.branch.findMany({
      where: {
        isActive: true,
        isFeatured: true,
        tenant: { isActive: true },
      },
      include: {
        tenant: true,
        roomTypes: {
          orderBy: { basePrice: 'asc' },
          take: 1,
        },
      },
      take: limit,
    });

    return branches.map((branch) => ({
      ...branch,
      startingPrice: branch.roomTypes[0]?.basePrice || null,
    }));
  }

  // Haversine formula
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Get hotel details by ID or slug
   */
  async getHotelDetails(idOrSlug: string) {
    const branch = await this.prisma.branch.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        isActive: true,
        tenant: { isActive: true },
      },
      include: {
        tenant: true,
        roomTypes: {
          orderBy: { basePrice: 'asc' },
          take: 1,
        },
      },
    });

    if (!branch) {
      throw new Error('Hotel not found');
    }

    return {
      ...branch,
      startingPrice: branch.roomTypes[0]?.basePrice || null,
    };
  }
}
