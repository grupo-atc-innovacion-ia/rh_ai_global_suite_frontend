import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class SuperuserGuard implements CanActivate {
  constructor(private router: Router) {}

  /**
   * Verificación síncrona: solo comprueba que el token existe en localStorage.
   * La validación real del usuario (is_superuser, etc.) la hace el componente
   * en su ngOnInit. Así evitamos la condición de carrera donde el guard hacía
   * un HTTP asíncrono y el componente se montaba antes de que resolviera,
   * causando que ngOnInit se ejecutara sin datos la primera vez.
   */
  canActivate(): boolean | UrlTree {
    const token = localStorage.getItem('auth_token');
    if (token) {
      return true;
    }
    return this.router.createUrlTree(['/login']);
  }
}
