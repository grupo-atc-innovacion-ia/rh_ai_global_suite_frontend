import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-modal-modificar-usuario',
  standalone: true,
  imports: [
    CommonModule, FormsModule, HttpClientModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule
  ],
  templateUrl: './modal-modificar-usuario.html',
  styleUrls: ['./modal-modificar-usuario.css'],
})
export class ModalModificarUsuarioComponent {
  datos = {
    first_name: '',
    last_name: '',
    email: '',
    telefono: '',
    puesto_empresa: '',
    numero_empleado: '',
  };

  nuevaPassword = '';
  confirmarPassword = '';
  cambiarPassword = false;
  guardando = false;
  errorMessage = '';
  passwordsCoinciden = true;
  confirmTocado = false;

  constructor(
    private dialogRef: MatDialogRef<ModalModificarUsuarioComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { usuario: any },
    private http: HttpClient
  ) {
    // Pre-fill with existing data
    const u = data.usuario;
    this.datos.first_name = u.first_name || '';
    this.datos.last_name = u.last_name || '';
    this.datos.email = u.email || '';
    this.datos.telefono = u.perfil?.telefono || '';
    this.datos.puesto_empresa = u.perfil?.puesto_empresa || '';
    this.datos.numero_empleado = u.perfil?.numero_empleado || '';
  }

  private obtenerCabeceras(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || '';
    return new HttpHeaders().set('Authorization', `Token ${token}`);
  }

  validarConfirmPassword(): void {
    this.confirmTocado = true;
    this.passwordsCoinciden = this.nuevaPassword === this.confirmarPassword;
  }

  formValido(): boolean {
    if (this.datos.first_name.trim() === '' || this.datos.last_name.trim() === '') return false;
    if (this.cambiarPassword) {
      if (this.nuevaPassword.trim() === '' || this.confirmarPassword.trim() === '') return false;
      if (this.nuevaPassword !== this.confirmarPassword) return false;
    }
    return true;
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }

  guardar(): void {
    if (!this.formValido() || this.guardando) return;

    this.guardando = true;
    this.errorMessage = '';
    const headers = this.obtenerCabeceras();

    const payload: any = {
      first_name: this.datos.first_name.trim(),
      last_name: this.datos.last_name.trim(),
      email: this.datos.email.trim(),
      perfil: {
        telefono: this.datos.telefono.trim() || null,
        puesto_empresa: this.datos.puesto_empresa.trim() || null,
        numero_empleado: this.datos.numero_empleado.trim() || null,
      },
    };

    if (this.cambiarPassword && this.nuevaPassword.trim()) {
      payload.password = this.nuevaPassword;
    }

    this.http.patch<any>(
      `http://localhost:8000/api/usuarios/${this.data.usuario.id}/`,
      payload,
      { headers }
    ).subscribe({
      next: () => {
        this.guardando = false;
        this.dialogRef.close({ success: true });
      },
      error: (err) => {
        this.guardando = false;
        this.errorMessage = 'Error al modificar el usuario.';
        console.error(err);
      }
    });
  }
}
