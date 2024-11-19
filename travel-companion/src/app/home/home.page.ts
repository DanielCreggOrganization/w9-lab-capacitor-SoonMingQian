// home.page.ts
import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/angular/standalone';
import { CameraService } from '../services/camera.service';
import { LocationService } from '../services/location.service';
import { DeviceInfoService } from '../services/device-info.service';
import { CommonModule } from '@angular/common';

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
    IonButton
  ],
})
export class HomePage {
  capturedImage?: string;
  location?: any;
  deviceInfo?: any;

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
}