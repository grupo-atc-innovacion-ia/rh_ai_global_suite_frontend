import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html', 
  styleUrls: ['./login.css']    
})
export class LoginComponent {
  usernameInput: string = '';
  passwordInput: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {
    if (localStorage.getItem('auth_token')) {
      this.authService.getUsuarioConectado().pipe(
        map((usuario) => Boolean(usuario)),
        catchError(() => of(false))
      ).subscribe((autenticado) => {
        if (autenticado) {
          this.router.navigate(['/dashboard']);
        } else {
          this.authService.logout();
        }
      });
    }
  }

  ejecutarLogin(): void {
    this.errorMessage = '';
    this.authService.login(this.usernameInput, this.passwordInput).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Error en el inicio de sesión:', err);
        this.errorMessage = 'Credenciales incorrectas. Intenta de nuevo.';
      }
    });
  }
}