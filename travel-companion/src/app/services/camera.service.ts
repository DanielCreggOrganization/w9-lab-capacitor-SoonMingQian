// src/app/services/camera.service.ts
import { Injectable } from '@angular/core';
// Import Capacitor Camera plugin and its types
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { BehaviorSubject } from 'rxjs';

interface FilterOptions {
  brightness?: number;
  contrast?: number;
  saturation?: number;
}

// Injectable decorator marks this as a service that can be dependency injected
@Injectable({
  providedIn: 'root'  // Service is provided at the root level, creating a singleton instance
})
export class CameraService {
  private db!: IDBDatabase;
  private deviceList$ = new BehaviorSubject<MediaDeviceInfo[]>([]);

  constructor() {
    this.initializeDB();
  }

  private async initializeDB() {
    const request = indexedDB.open('PhotoGalleryDB', 1);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      db.createObjectStore('photos', { keyPath: 'id', autoIncrement: true });
    };
    request.onsuccess = () => {
      this.db = request.result;
    };
  }

  async getCameraDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      this.deviceList$.next(cameras);
      return cameras;
    } catch (error) {
      console.error('Error getting camera devices:', error);
      return [];
    }
  }

  /**
   * Takes a picture using the device's camera
   * @returns Promise<string | undefined> Returns base64 encoded image string or undefined if failed
   */
  async takePicture(deviceId?: string): Promise<string | undefined> {
    try {
      console.log('Attempting to take a picture...');
      const image = await Camera.getPhoto({
        resultType: CameraResultType.Base64,
        quality: 90,
        // Use proper CameraSource enum value
        source: deviceId ? CameraSource.Camera : CameraSource.Prompt
      });
      console.log('Image captured:', image);

      if (!image.base64String) return undefined;

      const dataUrl = `data:image/jpeg;base64,${image.base64String}`;
      await this.saveToGallery(dataUrl);
      return dataUrl;

    } catch (error) {
      console.error('Error taking picture:', error);
      return undefined;
    }
  }

  private async saveToGallery(dataUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['photos'], 'readwrite');
      const store = transaction.objectStore('photos');
      
      const photo = {
        dataUrl,
        timestamp: new Date().getTime()
      };

      const request = store.add(photo);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getGalleryPhotos(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['photos'], 'readonly');
      const store = transaction.objectStore('photos');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result.map(photo => photo.dataUrl));
      };
      request.onerror = () => reject(request.error);
    });
  }
}