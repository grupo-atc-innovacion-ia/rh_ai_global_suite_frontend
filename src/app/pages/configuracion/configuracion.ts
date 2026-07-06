import { Component, OnInit,ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../services/auth';
import { SidebarComponent } from '../../components/sidebar/sidebar';
import { ModalAltaUsuarioComponent } from './modal-alta-usuario/modal-alta-usuario';
import { ModalPermisosUsuarioComponent } from './modal-permisos-usuario/modal-permisos-usuario';
import { ModalModificarUsuarioComponent } from './modal-modificar-usuario/modal-modificar-usuario';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HttpClientModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    SidebarComponent,
  ],
  templateUrl: './configuracion.html',
  styleUrls: ['./configuracion.css'],
})
export class ConfiguracionComponent implements OnInit {
  sidebarColapsado = false;
  usuarioActual: any = null;
  seccionActiva: 'usuarios' | 'permisos' = 'usuarios';
  listaUsuarios: any[] = [];
  esAdminGeneral = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarUsuarioActual();
    this.cargarUsuarios();
  }

  private obtenerCabeceras(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || '';
    return new HttpHeaders().set('Authorization', `Token ${token}`);
  }

  cargarUsuarioActual(): void {
    const headers = this.obtenerCabeceras();
    this.http.get<any>('http://localhost:8000/api/auth/me/', { headers }).subscribe({
      next: (usuario) => { 
        this.usuarioActual = usuario;
        this.esAdminGeneral = !!(usuario?.is_superuser) || usuario?.rol_sistema === 'admin_general';
        if (!this.esAdminGeneral) {
          this.seccionActiva = 'permisos';
        }
        this.cdr.detectChanges();
       },
      error: () => { this.authService.logout(); this.router.navigate(['/login']); }
    });
  }

  cargarUsuarios(): void {
    const headers = this.obtenerCabeceras();
    this.http.get<any>('http://localhost:8000/api/usuarios/', { headers }).subscribe({
      next: (resp) => { 
        this.listaUsuarios = resp?.results ?? resp ?? [];
        this.cdr.detectChanges();
    },
      error: (err) => console.error('Error cargando usuarios:', err)
    });
  }

  toggleSidebar(): void {
    this.sidebarColapsado = !this.sidebarColapsado;
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  irASeccion(seccion: 'usuarios' | 'permisos'): void {
    this.seccionActiva = seccion;
  }

  agregarNuevoUsuario(): void {
    const dialogRef = this.dialog.open(ModalAltaUsuarioComponent, {
      width: '680px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.cargarUsuarios();
      }
    });
  }

  ejecutarAccionUsuario(usuario: any, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const accion = select.value;
    select.value = '';

    switch (accion) {
      case 'editar':
      case 'modificar_datos':
        this.abrirModificarUsuario(usuario);
        break;
      case 'modificar_permisos':
        this.abrirPermisosUsuario(usuario);
        break;
      case 'deshabilitar':
        this.deshabilitarUsuario(usuario);
        break;
    }
  }

  abrirModificarUsuario(usuario: any): void {
    const dialogRef = this.dialog.open(ModalModificarUsuarioComponent, {
      width: '600px',
      maxHeight: '90vh',
      disableClose: true,
      data: { usuario }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) this.cargarUsuarios();
    });
  }

  abrirPermisosUsuario(usuario: any): void {
    const dialogRef = this.dialog.open(ModalPermisosUsuarioComponent, {
      width: '560px',
      maxHeight: '90vh',
      disableClose: true,
      data: { usuario }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) this.cargarUsuarios();
    });
  }

  deshabilitarUsuario(usuario: any): void {
    const headers = this.obtenerCabeceras();
    this.http.patch<any>(
      `http://localhost:8000/api/usuarios/${usuario.id}/`,
      { is_active: false },
      { headers }
    ).subscribe({
      next: () => {
        usuario.is_active = false;
      },
      error: (err) => console.error('Error deshabilitando usuario:', err)
    });
  }

  getIniciales(usuario: any): string {
    const nombre = usuario.first_name || '';
    const apellido = usuario.last_name || '';
    return ((nombre[0] || '') + (apellido[0] || '')).toUpperCase() || '?';
  }

  getRolBadge(usuario: any): string {
    // 1. Si es superusuario nativo o tiene el rol general, es el Administrador Máximo
    if (usuario.is_superuser || usuario.perfil?.rol_sistema === 'admin_general') {
      return 'Administrador General';
    }

    // 2. Evaluamos los niveles intermedios y locales del sistema
    const rol = usuario.perfil?.rol_sistema;
    
    if (rol === 'admin_unidad') {
      return 'Administrador de Unidad';
    }
    
    if (rol === 'admin_sucursal') {
      return 'Administrador de Sucursal';
    }

    return usuario.perfil?.puesto_empresa || 'Sin rol';
    }
}
