import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface Location {
  latitude: number;
  longitude: number;
}

@Injectable()
export class PublicHotelsService {
  constructor(private prisma: PrismaService) {}

  async findNearby(userLat: number, userLng: number, radiusKm: number = 50) {
    // We search across all branches of all tenants
    const branches = await this.prisma.branch.findMany({
      where: {
        isActive: true,
        tenant: {
          isActive: true,
        },
        latitude: { not: null },
        longitude: { not: null },
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

    const hotelsWithDistance = branches.map((branch) => {
      // These are guaranteed to be non-null because of the 'where' filter above
      const distance = this.calculateDistance(
        userLat,
        userLng,
        branch.latitude!,
        branch.longitude!,
      );

      return {
        ...branch,
        distance,
        // Calculate a "starting from" price if possible
        startingPrice: branch.roomTypes[0]?.basePrice || null,
      };
    });

    // Filter by radius and sort: Promoted first, then by distance
    return hotelsWithDistance
      .filter((h) => h.distance <= radiusKm)
      .sort((a, b) => {
        // Promoted (isFeatured) comes first
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        // Then by distance
        return a.distance - b.distance;
      });
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
}
