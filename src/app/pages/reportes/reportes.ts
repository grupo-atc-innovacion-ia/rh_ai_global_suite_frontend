import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { SidebarComponent } from '../../components/sidebar/sidebar';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, HttpClientModule, MatIconModule, SidebarComponent],
  templateUrl: './reportes.html',
  styleUrls: ['./reportes.css'],
})
export class Reportes implements OnInit {
  sidebarColapsado = false;
  usuarioActual: any = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarUsuarioActual();
  }

  cargarUsuarioActual(): void {
    const token = localStorage.getItem('auth_token') || '';
    const headers = new HttpHeaders().set('Authorization', `Token ${token}`);
    this.http.get<any>('http://localhost:8000/api/auth/me/', { headers }).subscribe({
      next: (usuario) => { this.usuarioActual = usuario; },
      error: () => { this.authService.logout(); this.router.navigate(['/login']); }
    });
  }

  toggleSidebar(): void { this.sidebarColapsado = !this.sidebarColapsado; }
  cerrarSesion(): void { this.authService.logout(); this.router.navigate(['/login']); }
}
