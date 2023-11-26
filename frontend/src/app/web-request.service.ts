import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class WebRequestService {

  readonly ROOT_URL;

  constructor(private http: HttpClient) {
    this.ROOT_URL = 'http://localhost:3000';

  }

  // Bellow I have setup a nice way to clean up and handle all the requests as well as setup the Root URL variable, as well as
  // a way for each request to return their observables
  get(uri:string){
    return this.http.get(`${this.ROOT_URL}/${uri}`);
  }

  post(uri:string, payload: object){
    return this.http.post(`${this.ROOT_URL}/${uri}`, payload);
  }

  patch(uri:string, payload: object){
    return this.http.patch(`${this.ROOT_URL}/${uri}`, payload);
  }

  delete(uri:string){
    return this.http.delete(`${this.ROOT_URL}/${uri}`);
  }

  login(email:string, password:string){
    return this.http.post(`${this.ROOT_URL}/users/login`, {
      email,
      password
    }, {
      observe: 'response'
    });
  }

  signup(email:string, password:string){
    return this.http.post(`${this.ROOT_URL}/users`, {
      email,
      password
    }, {
      observe: 'response'
    });
  }

}
