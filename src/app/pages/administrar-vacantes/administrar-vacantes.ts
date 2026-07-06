import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SidebarComponent } from '../../components/sidebar/sidebar';
import { ModalAltaVacanteComponent } from './modal-alta-vacante/modal-alta-vacante';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-administrar-vacantes',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    SidebarComponent
  ],
  templateUrl: './administrar-vacantes.html',
  styleUrls: ['./administrar-vacantes.css']
})
export class AdministrarVacantesComponent implements OnInit {
  listaPendientes: any[] = [];
  sidebarColapsado = false;
  usuarioActual: any = null;
  esAdmin = false;

  // Ordenamiento
  columnaOrden: string = 'id';
  direccionOrden: 'asc' | 'desc' = 'asc';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarUsuarioActual();
    this.obtenerPendientes();
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
        // Todos los roles pueden administrar vacantes dentro de su alcance
        this.esAdmin = true;
      },
      error: () => { this.authService.logout(); this.router.navigate(['/login']); }
    });
  }

  toggleSidebar(): void {
    this.sidebarColapsado = !this.sidebarColapsado;
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  obtenerPendientes(): void {
    const headers = this.obtenerCabeceras();
    this.http.get<any>('http://localhost:8000/api/vacante/', { headers }).subscribe({
      next: (response) => {
        this.listaPendientes = response?.results ?? response;

        //Temporalmente desc para que ordenarPor('id') lo cambie a asc
        this.direccionOrden = 'desc'; 
        this.ordenarPor('id');

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error obteniendo vacantes:', err);
      }
    });
  }

  // ------------------------------------------------------------------
  // Ordenamiento por columna
  // ------------------------------------------------------------------
  ordenarPor(columna: string): void {
    if (this.columnaOrden === columna) {
      this.direccionOrden = this.direccionOrden === 'asc' ? 'desc' : 'asc';
    } else {
      this.columnaOrden = columna;
      this.direccionOrden = 'asc';
    }

    this.listaPendientes.sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (columna) {
        case 'id':
          valA = a.id;
          valB = b.id;
          break;
        case 'titulo':
          valA = (a.titulo || '').toLowerCase();
          valB = (b.titulo || '').toLowerCase();
          break;
        case 'unidad':
          valA = (a.unidad_nombre || '').toLowerCase();
          valB = (b.unidad_nombre || '').toLowerCase();
          break;
        case 'sucursal':
          valA = (a.sucursal_nombre || '').toLowerCase();
          valB = (b.sucursal_nombre || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (valA < valB) return this.direccionOrden === 'asc' ? -1 : 1;
      if (valA > valB) return this.direccionOrden === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // ------------------------------------------------------------------
  // Acciones del listbox
  // ------------------------------------------------------------------
  ejecutarAccion(vacante: any, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const accion = select.value;
    select.value = ''; // Reset select

    switch (accion) {
      case 'editar':
        // TODO: implementar edición de vacante
        break;
      case 'deshabilitar':
        this.deshabilitarVacante(vacante);
        break;
      case 'activar':
        this.activarVacante(vacante);
        break;
    }
  }

  copiarDescripcion(vacante: any): void {
    const texto = vacante?.descripcion_vacante ?? '';
    this.copiarTexto(texto, `Descripción de "${vacante?.titulo ?? 'vacante'}"`);
  }

  copiarPrompt(vacante: any): void {
    const texto = vacante?.prompt_calificador_ia ?? vacante?.prompt_vacante ?? '';
    this.copiarTexto(texto, `Prompt de "${vacante?.titulo ?? 'vacante'}"`);
  }

  deshabilitarVacante(vacante: any): void {
    if (!this.esAdmin) return;

    const dialogRef = this.dialog.open(ConfirmarDeshabilitarDialogComponent, {
      width: '380px',
      data: { titulo: vacante.titulo }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) return;
      const headers = this.obtenerCabeceras();
      this.http.patch<any>(
        `http://localhost:8000/api/vacante/${vacante.id}/`,
        { activa: false },
        { headers }
      ).subscribe({
        next: () => {
          vacante.activa = false;
          this.cdr.detectChanges();
          this.dialog.open(CopiaConfirmacionDialogComponent, {
            width: '380px',
            data: { etiqueta: `Vacante "${vacante.titulo}" deshabilitada correctamente` }
          });
        },
        error: (err) => console.error('Error deshabilitando vacante:', err)
      });
    });
  }

  activarVacante(vacante: any): void {
    if (!this.esAdmin) return;
    const headers = this.obtenerCabeceras();
    this.http.patch<any>(
      `http://localhost:8000/api/vacante/${vacante.id}/`,
      { activa: true },
      { headers }
    ).subscribe({
      next: () => {
        vacante.activa = true;
        this.cdr.detectChanges();
        this.dialog.open(CopiaConfirmacionDialogComponent, {
          width: '380px',
          data: { etiqueta: `Vacante "${vacante.titulo}" activada correctamente` }
        });
      },
      error: (err) => console.error('Error activando vacante:', err)
    });
  }

  // ------------------------------------------------------------------
  // Alta de Vacante
  // ------------------------------------------------------------------
  altaVacante(): void {
    const dialogRef = this.dialog.open(ModalAltaVacanteComponent, {
      width: '690px',
      maxWidth: '90vw',
      disableClose: true,
      backdropClass: 'custom-backdrop-dark'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.obtenerPendientes();
      }
    });
  }

  private copiarTexto(texto: string, etiqueta: string): void {
    navigator.clipboard.writeText(texto).then(() => {
      this.dialog.open(CopiaConfirmacionDialogComponent, {
        width: '380px',
        autoFocus: false,
        data: { etiqueta }
      });
    }).catch(err => {
      console.error('No se pudo copiar:', err);
    });
  }
}

// ─── Diálogo de confirmación para copiar ─────────────────────────────────────
@Component({
  selector: 'app-copia-confirmacion-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      <div class="confirm-icon success"><mat-icon>check_circle</mat-icon></div>
      <p class="confirm-msg">{{ data.etiqueta }}</p>
      <button class="confirm-btn" mat-dialog-close>Aceptar</button>
    </div>
  `,
  styles: [`
    .confirm-dialog { padding:24px; text-align:center; }
    .confirm-icon { width:48px; height:48px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; }
    .confirm-icon.success { background:#e8f5e9; }
    .confirm-icon.success mat-icon { color:#2e7d32; font-size:24px; width:24px; height:24px; }
    .confirm-msg { margin:0 0 20px; font-size:14px; color:#1f1f1f; line-height:1.5; }
    .confirm-btn { width:100%; height:40px; background:#141414; color:#ffc700; border:none; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; }
    .confirm-btn:hover { background:#2a2a2a; }
  `]
})
export class CopiaConfirmacionDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { etiqueta: string }) {}
}

// ─── Diálogo de confirmación para deshabilitar ───────────────────────────────
@Component({
  selector: 'app-confirmar-deshabilitar-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      <div class="confirm-icon warning"><mat-icon>warning</mat-icon></div>
      <h3 class="confirm-title">¿Deshabilitar vacante?</h3>
      <p class="confirm-msg">La vacante <strong>"{{ data.titulo }}"</strong> pasará a estatus inactiva. Los candidatos no se eliminarán.</p>
      <div class="confirm-actions">
        <button class="btn-cancel" mat-dialog-close>Cancelar</button>
        <button class="btn-danger" [mat-dialog-close]="true">Deshabilitar</button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog { padding:24px; text-align:center; }
    .confirm-icon { width:48px; height:48px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; }
    .confirm-icon.warning { background:#fff8e1; }
    .confirm-icon.warning mat-icon { color:#f9a825; font-size:24px; width:24px; height:24px; }
    .confirm-title { margin:0 0 8px; font-size:16px; font-weight:700; color:#1f1f1f; }
    .confirm-msg { margin:0 0 20px; font-size:13px; color:#595959; line-height:1.5; }
    .confirm-actions { display:flex; gap:10px; }
    .btn-cancel { flex:1; height:40px; background:transparent; border:1px solid #e0e0e0; border-radius:8px; font-size:14px; font-weight:500; color:#595959; cursor:pointer; }
    .btn-cancel:hover { background:#f5f5f5; }
    .btn-danger { flex:1; height:40px; background:#e53935; color:#ffffff; border:none; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; }
    .btn-danger:hover { background:#c62828; }
  `]
})
export class ConfirmarDeshabilitarDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { titulo: string }) {}
}
