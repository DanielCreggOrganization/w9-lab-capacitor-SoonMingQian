import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  constructor() { }

  async getCurrentPosition(){
    try{
       // In browser, uses navigator.geolocation.getCurrentPosition()
       const coordinates = await Geolocation.getCurrentPosition();
       return coordinates;
    } catch (error){
      console.error('Error getting current position', error);
      throw error;
    }
  }
}
