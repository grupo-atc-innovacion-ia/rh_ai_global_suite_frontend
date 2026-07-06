import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Mantén tus rutas
  private loginUrl = 'http://localhost:8000/api/auth/login/';
  private userUrl = 'http://localhost:8000/api/auth/me/';

  constructor(private http: HttpClient) { }

  login(username: string, password: string): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };

    const cuerpoPeticion = { 
      username: username, 
      password: password 
    };

    return this.http.post<any>(this.loginUrl, cuerpoPeticion, httpOptions).pipe(
      tap(res => {
        if (res.token) {
          localStorage.setItem('auth_token', res.token);
        }
      })
    );
  }

  getUsuarioConectado(): Observable<any> {
    const token = localStorage.getItem('auth_token');

    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`
    });

    return this.http.get<any>(this.userUrl, { headers });
  }

  esSuperUser(): Observable<boolean> {
    return this.getUsuarioConectado().pipe(
      map((usuario) => Boolean(usuario?.is_superuser))
    );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
  }
}