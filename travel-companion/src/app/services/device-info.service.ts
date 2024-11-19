import { Injectable } from '@angular/core';
import { Device } from '@capacitor/device';

interface BrowserCapabilities {
  name: string;
  version: string;
  userAgent: string;
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
}

interface NavigatorWithExperimental extends Navigator {
  bluetooth?: {
    getAvailability(): Promise<boolean>;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DeviceInfoService {
  constructor() { }

  async getDeviceInfo() {
    try {
      const info = await Device.getInfo();
      const browserInfo = await this.getBrowserCapabilities();
      
      return {
        ...info,
        browser: browserInfo
      };
    } catch (error) {
      console.error('Error getting device info', error);
      throw error;
    }
  }

  private async getBrowserCapabilities(): Promise<BrowserCapabilities> {
    const ua = navigator.userAgent;
    const browserName = this.detectBrowserName(ua);
    const browserVersion = this.detectBrowserVersion(ua);

    return {
      name: browserName,
      version: browserVersion,
      userAgent: ua,
      features: await this.detectFeatures(),
      apis: this.getAvailableAPIs()
    };
  }

  private detectBrowserName(ua: string): string {
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    if (ua.includes('Opera')) return 'Opera';
    return 'Unknown';
  }

  private detectBrowserVersion(ua: string): string {
    const matches = ua.match(/(firefox|chrome|safari|edge|opera(?=\/))\/?\s*(\d+)/i);
    return matches ? matches[2] : 'Unknown';
  }

  private async detectFeatures(): Promise<BrowserCapabilities['features']> {
    const nav = navigator as NavigatorWithExperimental;
    
    return {
      webgl: !!window.WebGLRenderingContext,
      webrtc: !!window.RTCPeerConnection,
      geolocation: !!navigator.geolocation,
      touchscreen: 'ontouchstart' in window,
      notifications: 'Notification' in window,
      bluetooth: !!nav.bluetooth,
      camera: !!navigator.mediaDevices?.getUserMedia
    };
  }

  private getAvailableAPIs(): string[] {
    const apis: string[] = [];
    
    // Check for common Web APIs
    const apiChecks = {
      'WebGL': () => !!window.WebGLRenderingContext,
      'WebRTC': () => !!window.RTCPeerConnection,
      'WebSocket': () => !!window.WebSocket,
      'WebWorker': () => !!window.Worker,
      'ServiceWorker': () => 'serviceWorker' in navigator,
      'IndexedDB': () => !!window.indexedDB,
      'LocalStorage': () => !!window.localStorage,
      'Canvas': () => !!document.createElement('canvas').getContext,
      'WebAudio': () => !!window.AudioContext,
      'WebShare': () => !!navigator.share,
      'Geolocation': () => !!navigator.geolocation,
      'Notifications': () => !!window.Notification,
      'Permissions': () => !!navigator.permissions,
      'VibrationAPI': () => !!navigator.vibrate,
      'DeviceOrientation': () => !!window.DeviceOrientationEvent,
      'DeviceMotion': () => !!window.DeviceMotionEvent
    };

    // Check each API and add if available
    for (const [api, check] of Object.entries(apiChecks)) {
      try {
        if (check()) {
          apis.push(api);
        }
      } catch {
        // Skip if checking throws error
      }
    }

    return apis;
  }

  async checkPermission(feature: 'camera' | 'microphone' | 'geolocation' | 'notifications'): Promise<PermissionState> {
    try {
      const result = await navigator.permissions.query({ name: feature as PermissionName });
      return result.state;
    } catch {
      return 'denied';
    }
  }
}
