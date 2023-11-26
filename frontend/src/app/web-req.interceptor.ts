import { HttpErrorResponse, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable, Subject, catchError,  empty,  throwError } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WebReqInterceptor implements HttpInterceptor{

  constructor(private authService:AuthService) { }

  refreshingAccessToken: boolean = false;

  accessTokenRefreshed: Subject<any> = new Subject();

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<any>{
    //  Handle the requests
    request = this.addAuthHeader(request);

    // call the next() and handle its response
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) =>{
        console.log(error);

        if(error.status === 401 && !this.refreshingAccessToken){
        // 401 error so we aren't allowed in
         return this.refreshAccessToken().pipe(switchMap(() => {
            request = this.addAuthHeader(request);
            return next.handle(request);
            }),
            catchError((err: any) => {
              console.log(err);
              this.authService.logout();
              return empty();
            })
            )
        }
        return throwError((error));
      })
    )
  }

  refreshAccessToken(){
    this.refreshingAccessToken = true;
    // we want to call a method in the auth.service that sends a request to refresh the access token
    return this.authService.getNewAccessToken().pipe(
      tap(() => {
        this.refreshingAccessToken = false;
        console.log("Access Token Refreshed");
      })
    )
  }


  addAuthHeader(request: HttpRequest<any>) {
    // get the access token
    const token = this.authService.getAccessToken();

    if (token) {
      // append the access token to the request header
      return request.clone({
        setHeaders: {
          'x-access-token': token
        }
      })
    }
    return request;
  }

}
