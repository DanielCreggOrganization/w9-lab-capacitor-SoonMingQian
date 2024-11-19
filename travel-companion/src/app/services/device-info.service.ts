import { Injectable } from '@angular/core';
import { Device } from '@capacitor/device';

@Injectable({
  providedIn: 'root'
})
export class DeviceInfoService {

  constructor() { }

  async getDeviceInfo(){
    try{
      // In browser, uses various navigator properties
      const info = await Device.getInfo();
      return info;
    } catch (error) {
      console.error('Error getting device info', error);
      throw error;
    }
  }
}
