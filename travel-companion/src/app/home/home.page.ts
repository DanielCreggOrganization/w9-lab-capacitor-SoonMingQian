// home.page.ts
import { Component, OnDestroy } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonChip, IonLabel } from '@ionic/angular/standalone';
import { CameraService } from '../services/camera.service';
import { LocationService, LocationData, DistanceResult } from '../services/location.service';
import { DeviceInfoService } from '../services/device-info.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

interface DeviceInfo {
  model: string;
  platform: string;
  osVersion: string;
  browser: {
    name: string;
    version: string;
    features: {
      webgl: boolean;
      webrtc: boolean;
      geolocation: boolean;
      touchscreen: boolean;
      notifications: boolean;
      bluetooth: boolean;
      camera: boolean;
    };
    apis: string[];
  };
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonChip,
    IonLabel
  ],
})
export class HomePage implements OnDestroy {
  capturedImage?: string;
  location?: LocationData;
  deviceInfo?: DeviceInfo;
  
  // New properties
  locationHistory: LocationData[] = [];
  currentLocationSub?: Subscription;
  distanceFromStart?: DistanceResult;
  accuracyCircle?: Array<[number, number]>;

  constructor(
    private cameraService: CameraService,
    private locationService: LocationService,
    private deviceInfoService: DeviceInfoService
  ) {}

  async takePicture() {
    try {
      this.capturedImage = await this.cameraService.takePicture();
      console.log('Picture taken:', this.capturedImage);
    } catch (error) {
      console.error('Camera error:', error);
    }
  }

  async getLocation() {
    try {
      this.location = await this.locationService.getCurrentPosition();
      this.accuracyCircle = this.locationService.getAccuracyCircle(this.location);
      console.log('Location:', this.location);
    } catch (error) {
      console.error('Location error:', error);
    }
  }

  async getDeviceInfo() {
    try {
      this.deviceInfo = await this.deviceInfoService.getDeviceInfo();
      console.log('Device info:', this.deviceInfo);
    } catch (error) {
      console.error('Device info error:', error);
    }
  }

  async startTrackingLocation() {
    try {
      const locationObservable = await this.locationService.startWatchingPosition({
        enableHighAccuracy: true,
        timeout: 5000
      });

      this.currentLocationSub = locationObservable.subscribe(location => {
        this.location = location;
        this.locationHistory.push(location);
        this.accuracyCircle = this.locationService.getAccuracyCircle(location);
        
        // Calculate distance if we have a starting point
        if (this.locationHistory.length > 1) {
          this.distanceFromStart = this.locationService.calculateDistance(
            this.locationHistory[0],
            location
          );
        }
      });
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  }

  stopTrackingLocation() {
    this.locationService.stopWatchingPosition();
    this.currentLocationSub?.unsubscribe();
  }

  ngOnDestroy() {
    this.stopTrackingLocation();
  }
}