import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';

interface PermisoItem {
  codename: string;
  label: string;
  activo: boolean;
}

interface GrupoPermisos {
  modulo: string;
  icono: string;
  permisos: PermisoItem[];
}

@Component({
  selector: 'app-modal-permisos-usuario',
  standalone: true,
  imports: [
    CommonModule, FormsModule, HttpClientModule, MatDialogModule,
    MatIconModule, MatCheckboxModule
  ],
  templateUrl: './modal-permisos-usuario.html',
  styleUrls: ['./modal-permisos-usuario.css'],
})
export class ModalPermisosUsuarioComponent {
  grupos: GrupoPermisos[] = [];
  guardando = false;
  nombreUsuario = '';

  constructor(
    private dialogRef: MatDialogRef<ModalPermisosUsuarioComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { usuario: any },
    private http: HttpClient
  ) {
    this.nombreUsuario = `${data.usuario.first_name} ${data.usuario.last_name}`.trim() || data.usuario.username;
    this.inicializarGrupos();
  }

  private obtenerCabeceras(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || '';
    return new HttpHeaders().set('Authorization', `Token ${token}`);
  }

  private inicializarGrupos(): void {
    const permisosActuales: string[] = this.data.usuario.user_permissions_codenames || [];

    this.grupos = [
      {
        modulo: 'Vacantes',
        icono: 'work_outline',
        permisos: [
          { codename: 'alta_vacante', label: 'Registrar vacantes', activo: permisosActuales.includes('alta_vacante') },
          { codename: 'modificar_vacante', label: 'Editar vacantes', activo: permisosActuales.includes('modificar_vacante') },
          { codename: 'autorizar_vacante', label: 'Autorizar / cambiar estatus', activo: permisosActuales.includes('autorizar_vacante') },
          { codename: 'baja_vacante', label: 'Deshabilitar vacantes', activo: permisosActuales.includes('baja_vacante') },
        ]
      },
      {
        modulo: 'Candidatos',
        icono: 'people_outline',
        permisos: [
          { codename: 'alta_candidato', label: 'Registrar candidatos', activo: permisosActuales.includes('alta_candidato') },
          { codename: 'modificar_candidato', label: 'Editar candidatos', activo: permisosActuales.includes('modificar_candidato') },
          { codename: 'mover_fase_candidato', label: 'Mover entre fases del Kanban', activo: permisosActuales.includes('mover_fase_candidato') },
          { codename: 'baja_candidato', label: 'Descartar candidatos', activo: permisosActuales.includes('baja_candidato') },
        ]
      },
      {
        modulo: 'Unidades de Negocio',
        icono: 'business',
        permisos: [
          { codename: 'crear_unidad', label: 'Registrar unidades', activo: permisosActuales.includes('crear_unidad') },
          { codename: 'modificar_unidad', label: 'Editar unidades', activo: permisosActuales.includes('modificar_unidad') },
          { codename: 'desactivar_unidad', label: 'Desactivar unidades', activo: permisosActuales.includes('desactivar_unidad') },
        ]
      },
      {
        modulo: 'Sucursales',
        icono: 'store',
        permisos: [
          { codename: 'alta_sucursal', label: 'Registrar sucursales', activo: permisosActuales.includes('alta_sucursal') },
          { codename: 'modificar_sucursal', label: 'Editar sucursales', activo: permisosActuales.includes('modificar_sucursal') },
          { codename: 'baja_sucursal', label: 'Desactivar sucursales', activo: permisosActuales.includes('baja_sucursal') },
        ]
      }
    ];
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }

  guardar(): void {
    this.guardando = true;
    const headers = this.obtenerCabeceras();

    // Collect active permission codenames
    const permisos: string[] = [];
    this.grupos.forEach(g => {
      g.permisos.forEach(p => {
        if (p.activo) permisos.push(p.codename);
      });
    });

    this.http.patch<any>(
      `http://localhost:8000/api/usuarios/${this.data.usuario.id}/`,
      { permissions: permisos },
      { headers }
    ).subscribe({
      next: () => {
        this.guardando = false;
        this.dialogRef.close({ success: true });
      },
      error: (err) => {
        this.guardando = false;
        console.error('Error guardando permisos:', err);
      }
    });
  }
}
