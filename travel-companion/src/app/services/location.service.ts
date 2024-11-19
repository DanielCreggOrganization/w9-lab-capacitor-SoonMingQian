import { Injectable } from '@angular/core';
import { Geolocation, Position, PositionOptions } from '@capacitor/geolocation';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface DistanceResult {
  meters: number;
  kilometers: number;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private watchId: string | null = null;
  private locationSubject = new BehaviorSubject<LocationData | null>(null);
  
  constructor() { }

  /**
   * Get current position once
   */
  async getCurrentPosition(): Promise<LocationData> {
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 5000
      });
      
      return this.formatLocationData(coordinates);
    } catch (error) {
      console.error('Error getting current position', error);
      throw error;
    }
  }

  /**
   * Start watching position updates
   * @param options Optional position watching options
   * @returns Promise resolving to Observable of location updates
   */
  async startWatchingPosition(options?: PositionOptions): Promise<Observable<LocationData>> {
    try {
      // Clear any existing watch
      await this.stopWatchingPosition();

      // Start new watch and wait for it to be set up
      this.watchId = await Geolocation.watchPosition(
        options || {
          enableHighAccuracy: true,
          timeout: 5000
        },
        (position: Position | null, err?: any) => {
          if (err) {
            console.error('Watch position error:', err);
            this.locationSubject.error(err);
            return;
          }
          if (position) {
            this.locationSubject.next(this.formatLocationData(position));
          }
        }
      );

      // Filter out null values and ensure LocationData type
      return this.locationSubject.asObservable().pipe(
        filter((location): location is LocationData => location !== null)
      );
    } catch (error) {
      console.error('Error starting position watch', error);
      this.locationSubject.error(error);
      throw error;
    }
  }

  /**
   * Stop watching position
   */
  async stopWatchingPosition(): Promise<void> {
    if (this.watchId) {
      await Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  calculateDistance(point1: LocationData, point2: LocationData): DistanceResult {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = this.toRadians(point1.latitude);
    const φ2 = this.toRadians(point2.latitude);
    const Δφ = this.toRadians(point2.latitude - point1.latitude);
    const Δλ = this.toRadians(point2.longitude - point1.longitude);

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const meters = R * c;

    return {
      meters: Math.round(meters),
      kilometers: Math.round(meters / 1000 * 100) / 100
    };
  }

  /**
   * Get circle coordinates for accuracy radius
   */
  getAccuracyCircle(center: LocationData, points: number = 32): Array<[number, number]> {
    const radius = center.accuracy;
    const circles: Array<[number, number]> = [];
    
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const lat = center.latitude + (radius / 111320) * Math.cos(angle);
      const lng = center.longitude + (radius / (111320 * Math.cos(this.toRadians(center.latitude)))) * Math.sin(angle);
      circles.push([lat, lng]);
    }

    return circles;
  }

  private formatLocationData(position: Position): LocationData {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy || 0,
      timestamp: position.timestamp
    };
  }

  private toRadians(degrees: number): number {
    return degrees * Math.PI / 180;
  }
}
