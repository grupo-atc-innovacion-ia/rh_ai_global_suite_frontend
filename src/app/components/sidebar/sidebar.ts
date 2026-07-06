import { Component, Input, Output, EventEmitter, ViewEncapsulation, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
  encapsulation: ViewEncapsulation.None
})
export class SidebarComponent implements OnChanges {
  @Input() colapsado: boolean = false;
  @Input() usuario: any = null;           // ← Recibe el usuario del componente padre
  @Output() alCambiarToggle = new EventEmitter<void>();
  @Output() alCerrarSesion = new EventEmitter<void>();

  nombreUsuario: string = '';
  rolUsuario: string = '';

  constructor(
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['usuario'] && this.usuario) {
      // 1. Mapear el nombre completo dando prioridad a first_name y last_name
      if (this.usuario.first_name || this.usuario.last_name) {
        this.nombreUsuario = `${this.usuario.first_name} ${this.usuario.last_name}`.trim();
      } else {
        this.nombreUsuario = this.usuario.nombre_completo || this.usuario.username || 'Usuario';
      }

      // 2. 🌟 Evaluar la jerarquía real según el rol_sistema migrado
      const rol = this.usuario.perfil?.rol_sistema;

      if (this.usuario.is_superuser || rol === 'admin_general') {
        this.rolUsuario = 'Administrador General';
      } else if (rol === 'admin_unidad') {
        this.rolUsuario = 'Admin. de Unidad';
      } else if (rol === 'admin_sucursal') {
        this.rolUsuario = 'Admin. de Sucursal';
      } else {
        // Respaldo por si es un puesto libre o un usuario común
        this.rolUsuario = this.usuario.perfil?.puesto_empresa || 'Usuario';
      }

      this.cdr.detectChanges();
    }
  }

  /** Genera iniciales a partir del nombre completo de manera limpia */
  get userInitials(): string {
    if (!this.nombreUsuario || this.nombreUsuario === 'Usuario') return 'U';
    const partes = this.nombreUsuario.trim().split(/\s+/);
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return this.nombreUsuario.substring(0, 2).toUpperCase();
  }

  /** 🎨 Retorna la clase CSS correspondiente al rol del usuario actual */
  getRolClass(): string {
    if (!this.usuario) return '';
    const rol = this.usuario.perfil?.rol_sistema;
    if (this.usuario.is_superuser || rol === 'admin_general') return 'role-general';
    if (rol === 'admin_unidad') return 'role-unidad';
    if (rol === 'admin_sucursal') return 'role-sucursal';
    return 'role-puesto';
  }

  toggleSidebar(): void { this.alCambiarToggle.emit(); }
  cerrarSesion(): void { this.alCerrarSesion.emit(); }
}