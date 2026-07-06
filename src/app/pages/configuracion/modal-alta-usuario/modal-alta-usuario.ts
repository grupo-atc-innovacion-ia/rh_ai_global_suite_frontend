import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { MatDialogModule, MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

// ─── Sweet Alert Dialog ──────────────────────────────────────────────────────
@Component({
  selector: 'app-alerta-usuario-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule],
  template: `
    <div class="alerta-dialog">
      <div class="alerta-icon" [ngClass]="data.tipo">
        <mat-icon>{{ data.tipo === 'error' ? 'error' : 'check_circle' }}</mat-icon>
      </div>
      <h3 class="alerta-titulo">{{ data.titulo }}</h3>
      <p class="alerta-mensaje">{{ data.mensaje }}</p>
      <button class="alerta-btn" mat-dialog-close>Aceptar</button>
    </div>
  `,
  styles: [`
    .alerta-dialog { padding:28px 24px; text-align:center; }
    .alerta-icon { width:56px; height:56px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; }
    .alerta-icon.error { background:#ffeaea; }
    .alerta-icon.error mat-icon { color:#e53935; font-size:28px; width:28px; height:28px; }
    .alerta-icon.success { background:#e8f5e9; }
    .alerta-icon.success mat-icon { color:#2e7d32; font-size:28px; width:28px; height:28px; }
    .alerta-titulo { margin:0 0 8px; font-size:17px; font-weight:700; color:#1f1f1f; }
    .alerta-mensaje { margin:0 0 20px; font-size:14px; color:#595959; line-height:1.5; }
    .alerta-btn { width:100%; height:42px; background:#141414; color:#ffc700; border:none; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; }
    .alerta-btn:hover { background:#2a2a2a; }
  `]
})
export class AlertaUsuarioDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { titulo: string; mensaje: string; tipo: 'error' | 'success' }) {}
}

// ─── Modal Alta Usuario ──────────────────────────────────────────────────────
@Component({
  selector: 'app-modal-alta-usuario',
  standalone: true,
  imports: [
    CommonModule, FormsModule, HttpClientModule, MatDialogModule,
    MatFormFieldModule, MatSelectModule, MatInputModule,
    MatButtonModule, MatIconModule
  ],
  templateUrl: './modal-alta-usuario.html',
  styleUrls: ['./modal-alta-usuario.css'],
})
export class ModalAltaUsuarioComponent implements OnInit {
  nuevoUsuario = {
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    email: '',
    numero_empleado: null as number | string | null,
    puesto_empresa: '',
    telefono: '',
    rol: 'admin_sucursal' as 'admin_general' | 'admin_unidad' | 'admin_sucursal',
    unidad_negocio: null as number | null,
    sucursal: null as number | null,
  };

  confirmarPassword = '';
  guardando = false;

  // Validaciones de campos
  emailTocado = false;
  emailValido = false;
  confirmTocado = false;
  passwordsCoinciden = false;
  errorUsername = false;
  errorNumeroEmpleado = false;
  errorEmail = false;
  errorPassword = false;

  // Catálogos
  listaUnidades: any[] = [];
  listaSucursales: any[] = [];
  sucursalesFiltradas: any[] = [];

  constructor(
    private dialogRef: MatDialogRef<ModalAltaUsuarioComponent>,
    private http: HttpClient,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const headers = this.obtenerCabeceras();
    this.http.get<any>('http://localhost:8000/api/unidad-negocio/empresas/', { headers }).subscribe({
      next: (resp) => { this.listaUnidades = resp?.results ?? resp; },
      error: (err) => console.error('Error cargando unidades:', err)
    });
    this.http.get<any>('http://localhost:8000/api/unidad-negocio/sucursales/', { headers }).subscribe({
      next: (resp) => { this.listaSucursales = resp?.results ?? resp; },
      error: (err) => console.error('Error cargando sucursales:', err)
    });
  }

  private obtenerCabeceras(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || '';
    return new HttpHeaders().set('Authorization', `Token ${token}`);
  }

  onRolChange(): void {
    if (this.nuevoUsuario.rol === 'admin_general') {
      this.nuevoUsuario.unidad_negocio = null;
      this.nuevoUsuario.sucursal = null;
    } else if (this.nuevoUsuario.rol === 'admin_unidad') {
      this.nuevoUsuario.sucursal = null;
    }
  }

  /** Auto-genera username (primer nombre.primer apellido) */
  generarUsername(): void {
    const nombre = this.nuevoUsuario.first_name.trim().split(/\s+/)[0] || '';
    const apellido = this.nuevoUsuario.last_name.trim().split(/\s+/)[0] || '';
    if (nombre && apellido) {
      this.nuevoUsuario.username = this.quitarAcentos(`${nombre}.${apellido}`).toLowerCase();
    }
  }

  private quitarAcentos(texto: string): string {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  onUnidadChange(): void {
    this.nuevoUsuario.sucursal = null;
    if (this.nuevoUsuario.unidad_negocio) {
      this.sucursalesFiltradas = this.listaSucursales.filter(
        (s: any) => s.unidad_negocio === this.nuevoUsuario.unidad_negocio
      );
    } else {
      this.sucursalesFiltradas = [];
    }
  }

  validarEmail(): void {
    this.emailTocado = true;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.emailValido = regex.test(this.nuevoUsuario.email.trim());
  }

  validarConfirmPassword(): void {
    this.confirmTocado = true;
    this.passwordsCoinciden = this.nuevoUsuario.password === this.confirmarPassword;
  }

  formValido(): boolean {
    const base = (
      this.nuevoUsuario.first_name.trim() !== '' &&
      this.nuevoUsuario.last_name.trim() !== '' &&
      this.nuevoUsuario.username.trim() !== '' &&
      this.nuevoUsuario.email.trim() !== '' &&
      this.nuevoUsuario.password.trim() !== '' &&
      this.confirmarPassword.trim() !== '' &&
      this.emailValido &&
      this.passwordsCoinciden
    );
    if (!base) return false;

    if (this.nuevoUsuario.rol === 'admin_unidad') {
      return this.nuevoUsuario.unidad_negocio !== null;
    }
    if (this.nuevoUsuario.rol === 'admin_sucursal') {
      return this.nuevoUsuario.unidad_negocio !== null && this.nuevoUsuario.sucursal !== null;
    }
    return true;
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }

  guardar(): void {
    this.validarEmail();
    this.validarConfirmPassword();
    this.errorUsername = false;
    this.errorNumeroEmpleado = false;
    this.errorEmail = false;
    this.errorPassword = false;

    if (!this.formValido() || this.guardando) return;

    this.guardando = true;
    const headers = this.obtenerCabeceras();

    const payload: any = {
      username: this.nuevoUsuario.username.trim(),
      password: this.nuevoUsuario.password,
      first_name: this.nuevoUsuario.first_name.trim(),
      last_name: this.nuevoUsuario.last_name.trim(),
      email: this.nuevoUsuario.email.trim(),
      is_superuser: this.nuevoUsuario.rol === 'admin_general',
      numero_empleado: this.nuevoUsuario.numero_empleado != null && this.nuevoUsuario.numero_empleado !== ''
        ? String(this.nuevoUsuario.numero_empleado).trim()
        : null,
      puesto_empresa: this.nuevoUsuario.puesto_empresa.trim() || null,
      unidad_negocio: this.nuevoUsuario.unidad_negocio,
      sucursal: this.nuevoUsuario.sucursal,
      rol_sistema: this.nuevoUsuario.rol,
    };

    this.http.post<any>('http://localhost:8000/api/usuarios/', payload, { headers }).subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarAlerta('Usuario creado', 'El usuario fue registrado exitosamente.', 'success');
        this.dialogRef.close({ success: true });
      },
      error: (err) => {
        this.guardando = false;
        const errores = err.error;

        if (errores && typeof errores === 'object') {
          // Prioridad de validación: numero_empleado → username → email → password
          if (errores.numero_empleado) {
            this.errorNumeroEmpleado = true;
            setTimeout(() => this.mostrarAlerta(
              'Error en Número de Empleado',
              Array.isArray(errores.numero_empleado) ? errores.numero_empleado[0] : String(errores.numero_empleado),
              'error'
            ), 100);
          } else if (errores.username) {
            this.errorUsername = true;
            setTimeout(() => this.mostrarAlerta(
              'Error en Nombre de usuario',
              Array.isArray(errores.username) ? errores.username[0] : String(errores.username),
              'error'
            ), 100);
          } else if (errores.email) {
            this.errorEmail = true;
            setTimeout(() => this.mostrarAlerta(
              'Error en Correo Empresarial',
              Array.isArray(errores.email) ? errores.email[0] : String(errores.email),
              'error'
            ), 100);
          } else if (errores.password) {
            this.errorPassword = true;
            setTimeout(() => this.mostrarAlerta(
              'Error en Contraseña',
              Array.isArray(errores.password) ? errores.password[0] : String(errores.password),
              'error'
            ), 100);
          } else {
            const mensajes = (Object.entries(errores) as [string, any][])
              .map(([campo, msgs]) => `${campo}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
              .join(' | ');
            setTimeout(() => this.mostrarAlerta('Error de validación', mensajes, 'error'), 100);
          }
        } else {
          setTimeout(() => this.mostrarAlerta('Error', 'No se pudo crear el usuario.', 'error'), 100);
        }
      }
    });
  }

  private mostrarAlerta(titulo: string, mensaje: string, tipo: 'error' | 'success'): void {
    this.dialog.open(AlertaUsuarioDialogComponent, {
      width: '380px',
      data: { titulo, mensaje, tipo }
    });
  }
}
