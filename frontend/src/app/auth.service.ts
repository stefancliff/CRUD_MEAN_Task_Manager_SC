import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { WebRequestService } from './web-request.service';
import { Router } from '@angular/router';
import { shareReplay, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private webService: WebRequestService, private router: Router, private http: HttpClient) { }

  // shareReplay() serves as a way to avoid using the login method multiple times
  login(email: string, password: string){
    return this.webService.login(email, password).pipe(
      shareReplay(),
      tap((res: HttpResponse<any>) => {
        // the auth tokens will be inside the header of the res, so we use local storage to store them
      this.setSession(res.body._id, res.headers.get('x-access-token') as string, res.headers.get('x-refresh-token') as string);
      console.log('LOGGED IN!');
      })
    );
  }


 signup(email: string, password: string){
    return this.webService.signup(email, password).pipe(
      shareReplay(),
      tap((res: HttpResponse<any>) => {
        // the auth tokens will be inside the header of the res, so we use local storage to store them
      this.setSession(res.body._id, res.headers.get('x-access-token') as string, res.headers.get('x-refresh-token') as string);
      console.log('REGISTERED AND LOGGED IN!!');
      })
    );
  }


  logout(){
    this.removeSession();
    console.log('LOGGED OUT!');

    this.router.navigate(['/login']);
  }

  getAccessToken(){
    return localStorage.getItem('x-access-token');
  }

  setAccessToken(accessToken: string){
    localStorage.setItem('x-access-token', accessToken);
  }

  getRefreshToken(){
    return localStorage.getItem('x-refresh-token');
  }

  setRefreshToken(refreshToken: string){
    localStorage.setItem('x-refresh-token', refreshToken);
  }

  getNewAccessToken(){
    return this.http.get(`${this.webService.ROOT_URL}/users/me/access-token`, {
      headers:{
        'x-refresh-token': this.getRefreshToken() as string,
        '_id': this.getUserId() as string
      },
      observe: 'response'
    }).pipe(
      tap((res: HttpResponse<any>) =>{
        this.setAccessToken(res.headers.get('x-access-token') as string);
      })
    )
  }

  getUserId(){
    return localStorage.getItem('user_id');
  }

  private setSession(userId: string, accessToken: string, refreshToken: string){
    localStorage.setItem('user-id', userId);
    localStorage.setItem('x-access-token', accessToken);
    localStorage.setItem('x-refresh-token', refreshToken);
  }

  private removeSession(){
    localStorage.removeItem('user-id');
    localStorage.removeItem('x-access-token');
    localStorage.removeItem('x-refresh-token');
  }
}
