import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../services/auth';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Component({
  selector: 'app-modal-alta-vacante',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatFormFieldModule,
    MatSelectModule, MatInputModule, MatButtonModule, MatIconModule
  ],
  templateUrl: './modal-alta-vacante.html',
  styleUrls: ['./modal-alta-vacante.css'],
})
export class ModalAltaVacanteComponent implements OnInit {
  nuevaVacante = {
    titulo: '',
    sucursal: null as number | null,
    bolsa_de_trabajo: 'linkedin',
    perfil_pyxoom: '' as string,
    titulo_exacto_correo: '',
    descripcion_vacante: '',
    prompt_vacante: '',
    no_negociables_requisitos: [] as string[]
  };
  listaSucursales: any[] = [];
  listaPerfilesPyxoom: { id: string; text: string; code: string }[] = [];
  cargandoPerfiles = false;
  tagInput = '';
  guardando = false;

  constructor(
    private dialogRef: MatDialogRef<ModalAltaVacanteComponent>,
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('auth_token') || '';
    const headers = new HttpHeaders().set('Authorization', `Token ${token}`);
    this.http.get<any>('http://localhost:8000/api/unidad-negocio/sucursales/', { headers }).subscribe({
      next: (response) => {
        this.listaSucursales = response?.results ?? response;
        // Si solo hay una sucursal disponible (admin_sucursal), pre-seleccionarla
        if (this.listaSucursales.length === 1) {
          this.nuevaVacante.sucursal = this.listaSucursales[0].id;
        }
      },
      error: (err) => console.error('Error cargando sucursales:', err)
    });

    // Cargar perfiles de Pyxoom
    this.cargarPerfilesPyxoom(headers);
  }

  cargarPerfilesPyxoom(headers?: HttpHeaders): void {
    if (!headers) {
      const token = localStorage.getItem('auth_token') || '';
      headers = new HttpHeaders().set('Authorization', `Token ${token}`);
    }
    this.cargandoPerfiles = true;
    this.http.get<any>('http://localhost:8000/api/integrations/pyxoom/JobPositionList/', { headers }).subscribe({
      next: (response) => {
        this.listaPerfilesPyxoom = response?.resultados ?? [];
        this.cargandoPerfiles = false;
      },
      error: (err) => {
        console.error('Error cargando perfiles Pyxoom:', err);
        this.cargandoPerfiles = false;
      }
    });
  }

  agregarTag(event?: Event): void {
    if (event) event.preventDefault();
    const tag = this.tagInput.trim();
    if (tag && !this.nuevaVacante.no_negociables_requisitos.includes(tag)) {
      this.nuevaVacante.no_negociables_requisitos.push(tag);
    }
    this.tagInput = '';
  }

  quitarTag(index: number): void {
    this.nuevaVacante.no_negociables_requisitos.splice(index, 1);
  }

  formValido(): boolean {
    return this.nuevaVacante.titulo.trim() !== '' && this.nuevaVacante.sucursal !== null;
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }

  guardar(): void {
    if (!this.formValido() || this.guardando) return;

    this.guardando = true;
    const token = localStorage.getItem('auth_token') || '';
    const headers = new HttpHeaders().set('Authorization', `Token ${token}`);

    const payload = {
      titulo: this.nuevaVacante.titulo,
      sucursal: this.nuevaVacante.sucursal,
      bolsa_de_trabajo: String(this.nuevaVacante.bolsa_de_trabajo || 'occ').toLowerCase(),
      perfil_pyxoom: this.nuevaVacante.perfil_pyxoom || '',
      titulo_exacto_correo: this.nuevaVacante.titulo_exacto_correo || '',
      descripcion_vacante: this.nuevaVacante.descripcion_vacante || '',
      prompt_calificador_ia: this.nuevaVacante.prompt_vacante || '',
      no_negociables_vacante: this.nuevaVacante.no_negociables_requisitos || []
    };

    this.http.post('http://localhost:8000/api/vacante/', payload, { headers }).pipe(
      catchError((err) => {
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
        this.guardando = false;
        return throwError(() => err);
      })
    ).subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarPopupExito();
      },
      error: (err) => {
        this.guardando = false;
        console.error('Error al guardar la vacante:', err);
      }
    });
  }

  private mostrarPopupExito(): void {
    this.dialogRef.close({ success: true });
    this.dialog.open(VacanteRegistradaDialogComponent, {
      width: '400px',
      disableClose: true,
      backdropClass: 'custom-backdrop-dark'
    });
  }
}

@Component({
  selector: 'app-vacante-registrada-dialog',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatDialogModule],
  template: `
    <div style="padding:20px;text-align:center;">
      <mat-icon style="font-size:48px;width:48px;height:48px;color:#2e7d32;margin-bottom:16px;">check_circle</mat-icon>
      <h2 style="margin:0 0 8px;font-weight:600;color:#333;">Vacante registrada</h2>
      <p style="margin:0 0 24px;color:#666;font-size:14px;">La vacante fue registrada exitosamente.</p>
      <button mat-raised-button color="primary" style="border-radius:10px;padding:0 32px;" mat-dialog-close>Aceptar</button>
    </div>
  `
})
export class VacanteRegistradaDialogComponent {}
