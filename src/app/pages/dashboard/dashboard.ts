import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

// 🎨 Angular Material y CDK
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Inject } from '@angular/core';

import { SidebarComponent } from '../../components/sidebar/sidebar';
import { PanelDetalleCandidatoComponent } from './panel-detalle-candidato/panel-detalle-candidato';

// =========================================================================
// 📦 MODAL REUTILIZABLE: ALERTA / INFO
// =========================================================================
@Component({
  selector: 'app-alerta-dialog',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatDialogModule],
  template: `
    <div class="modal-alerta">
      <div class="modal-alerta-icon" [ngClass]="data.tipo || 'info'">
        <mat-icon>{{ iconoPorTipo() }}</mat-icon>
      </div>
      <h2 class="modal-alerta-titulo">{{ data.titulo || 'Aviso' }}</h2>
      <p class="modal-alerta-msg">{{ data.mensaje }}</p>
      <button class="modal-alerta-btn" (click)="dialogRef.close()">Aceptar</button>
    </div>
  `,
  styles: [`
    .modal-alerta { padding:28px 24px; text-align:center; }
    .modal-alerta-icon { width:56px; height:56px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; }
    .modal-alerta-icon.info { background:#e8f5e9; }
    .modal-alerta-icon.info mat-icon { color:#2e7d32; font-size:28px; width:28px; height:28px; }
    .modal-alerta-icon.error { background:#ffeaea; }
    .modal-alerta-icon.error mat-icon { color:#e53935; font-size:28px; width:28px; height:28px; }
    .modal-alerta-icon.warning { background:#fff8e1; }
    .modal-alerta-icon.warning mat-icon { color:#f9a825; font-size:28px; width:28px; height:28px; }
    .modal-alerta-titulo { margin:0 0 8px; font-size:17px; font-weight:700; color:#1f1f1f; }
    .modal-alerta-msg { margin:0 0 20px; font-size:14px; color:#595959; line-height:1.5; }
    .modal-alerta-btn { width:100%; height:42px; background:#141414; color:#ffc700; border:none; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; transition:background .2s; }
    .modal-alerta-btn:hover { background:#2a2a2a; }
  `]
})
export class AlertaDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<AlertaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { titulo?: string; mensaje: string; tipo?: 'info' | 'error' | 'warning' }
  ) {}
  iconoPorTipo(): string {
    switch (this.data.tipo) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'check_circle';
    }
  }
}

// =========================================================================
// MODAL: ACTUALIZAR CANDIDATO — Muestra TODOS los checklists de todas las fases
// =========================================================================

/** Configuración de checks por fase  Revisar que se actualice al momento de cambiar el card*/
const CHECKLIST_CONFIG: Record<string, { titulo: string; checks: { clave: string; label: string }[] }> = {
  paso1: {
    titulo: 'Paso 1 · Polígrafo / Ubicación / Sueldo',
    checks: [
      { clave: 'acepta_poligrafo', label: '¿Acepta hacerse el polígrafo?' },
      { clave: 'acepta_ubicacion', label: '¿Acepta la ubicación?' },
      { clave: 'acepta_sueldo', label: '¿Acepta el sueldo ofrecido?' },
    ]
  },
  paso2: {
    titulo: 'Paso 2 · Psicométricos (Pyxoom)',
    checks: [
      { clave: 'contesto_pyxoom', label: '¿Contestó el Pyxoom?' },
      { clave: 'aprobo_pyxoom', label: '¿Aprobó el Pyxoom?' },
    ]
  },
  paso3: {
    titulo: 'Paso 3 · Entrevista',
    checks: [
      { clave: 'entrevista_agendada', label: '¿Entrevista agendada?' },
      { clave: 'aprobo_entrevista', label: '¿Aprobó la entrevista?' },
    ]
  },
  paso4: {
    titulo: 'Paso 4 · Resultado del Polígrafo',
    checks: [
      { clave: 'agendo_poligrafo', label: '¿Se agendó el polígrafo?' },
      { clave: 'aprobo_poligrafo', label: '¿Aprobó el polígrafo?' },
    ]
  },
  paso5: {
    titulo: 'Paso 5 · Hogan para Top 3',
    checks: [
      { clave: 'agendo_hogan', label: '¿Se agendó el Hogan?' },
      { clave: 'aprobo_hogan', label: '¿Aprobó el Hogan?' },
    ]
  }
};

const FASES_ORDEN = ['paso1', 'paso2', 'paso3', 'paso4', 'paso5'];

interface CheckItem { fase: string; clave: string; label: string; valor: boolean; disabled: boolean; }
interface FaseGroup { fase: string; titulo: string; items: CheckItem[]; }

@Component({
  selector: 'app-actualizar-candidato-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatDialogModule],
  template: `
    <div class="modal-actualizar">
      <div class="modal-actualizar-header">
        <div class="modal-actualizar-icon"><mat-icon>assignment_turned_in</mat-icon></div>
        <div>
          <h2>Checklist Completo</h2>
          <p>{{ data.candidato.nombre }} — Fase actual: {{ data.faseActual }}</p>
        </div>
      </div>
      <div class="modal-actualizar-divider"></div>

      <div class="modal-actualizar-body two-columns">
        <div class="col-left">
          <div class="fase-group" *ngFor="let grupo of gruposIzquierda">
            <h4 class="fase-titulo">{{ grupo.titulo }}</h4>
            <label class="check-row" *ngFor="let item of grupo.items; let i = index">
              <input type="checkbox" [(ngModel)]="item.valor" (change)="onCheckChange(item)" [disabled]="item.disabled">
              <span>{{ item.label }}</span>
            </label>
          </div>
        </div>
        <div class="col-right">
          <div class="fase-group" *ngFor="let grupo of gruposDerecha">
            <h4 class="fase-titulo">{{ grupo.titulo }}</h4>
            <label class="check-row" *ngFor="let item of grupo.items; let i = index">
              <input type="checkbox" [(ngModel)]="item.valor" (change)="onCheckChange(item)" [disabled]="item.disabled">
              <span>{{ item.label }}</span>
            </label>
          </div>
        </div>
      </div>

      <div class="modal-actualizar-actions">
        <button class="btn-cancel-modal" (click)="dialogRef.close(null)">Cancelar</button>
        <button class="btn-guardar-modal" (click)="guardar()">
          <mat-icon>save</mat-icon> Guardar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .modal-actualizar { padding:0; min-width:720px; }
    .modal-actualizar-header { display:flex; align-items:center; gap:12px; padding:24px 24px 0; }
    .modal-actualizar-icon { width:40px; height:40px; background:#141414; border-radius:10px; display:flex; align-items:center; justify-content:center; }
    .modal-actualizar-icon mat-icon { color:#ffc700; font-size:20px; width:20px; height:20px; }
    .modal-actualizar-header h2 { margin:0; font-size:17px; font-weight:700; color:#1f1f1f; }
    .modal-actualizar-header p { margin:2px 0 0; font-size:12px; color:#8c8c8c; }
    .modal-actualizar-divider { height:1px; background:#f0f0f0; margin:16px 24px 0; }
    .modal-actualizar-body.two-columns { display:flex; gap:28px; padding:20px 24px; overflow:visible; }
    .col-left, .col-right { flex:1; display:flex; flex-direction:column; gap:16px; }
    .fase-group { display:flex; flex-direction:column; gap:8px; }
    .fase-titulo { margin:0; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.4px; color:#8c8c8c; border-bottom:1px solid #f0f0f0; padding-bottom:6px; }
    .check-row { display:flex; align-items:center; gap:10px; cursor:pointer; font-size:14px; color:#1f1f1f; }
    .check-row input[type=checkbox] { width:18px; height:18px; accent-color:#ffc700; cursor:pointer; }
    .check-row input[type=checkbox]:disabled { accent-color:#ccc; cursor:not-allowed; opacity:0.5; }
    .check-row:has(input:disabled) span { color:#aaa; }
    .modal-actualizar-actions { display:flex; justify-content:flex-end; gap:10px; padding:16px 24px 20px; border-top:1px solid #f0f0f0; }
    .btn-cancel-modal { padding:0 20px; height:40px; background:transparent; border:1px solid #e0e0e0; border-radius:8px; font-size:14px; font-weight:500; color:#595959; cursor:pointer; }
    .btn-cancel-modal:hover { background:#f5f5f5; }
    .btn-guardar-modal { display:flex; align-items:center; gap:6px; padding:0 22px; height:40px; background:#141414; border:none; border-radius:8px; font-size:14px; font-weight:600; color:#ffc700; cursor:pointer; }
    .btn-guardar-modal:hover { background:#2a2a2a; }
    .btn-guardar-modal mat-icon { font-size:18px; width:18px; height:18px; }
  `]
})
export class ActualizarCandidatoDialogComponent {
  allItems: CheckItem[] = [];
  gruposIzquierda: FaseGroup[] = [];
  gruposDerecha: FaseGroup[] = [];

  /** Dependencias intrafase: padre desactivado → hijos desactivados */
  private dependencias: Record<string, Record<string, string[]>> = {
    paso2: { contesto_pyxoom: ['aprobo_pyxoom'] },
    paso3: { entrevista_agendada: ['aprobo_entrevista'] },
    paso4: { agendo_poligrafo: ['aprobo_poligrafo'] },
    paso5: { agendo_hogan: ['aprobo_hogan'] },
  };

  constructor(
    public dialogRef: MatDialogRef<ActualizarCandidatoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { candidato: any; faseActual: string; checklistExistente: any[] }
  ) {
    const existentes: any[] = data.checklistExistente || [];

    // Construir todos los items de todas las fases
    const grupos: FaseGroup[] = FASES_ORDEN.map(fase => {
      const cfg = CHECKLIST_CONFIG[fase];
      const items: CheckItem[] = cfg.checks.map(chk => {
        const encontrado = existentes.find((e: any) => e.fase === fase && e.clave === chk.clave);
        return {
          fase,
          clave: chk.clave,
          label: chk.label,
          valor: encontrado ? encontrado.valor : false,
          disabled: false
        };
      });
      return { fase, titulo: cfg.titulo, items };
    });

    // Separar en columnas: izquierda (paso1, paso2), derecha (paso3, paso4, paso5)
    this.gruposIzquierda = grupos.filter(g => g.fase === 'paso1' || g.fase === 'paso2');
    this.gruposDerecha = grupos.filter(g => g.fase === 'paso3' || g.fase === 'paso4' || g.fase === 'paso5');

    // Flat list para referencia rápida
    this.allItems = grupos.flatMap(g => g.items);

    this.aplicarBloqueos();
  }

  onCheckChange(item: CheckItem): void {
    // Si se DESMARCó un check, desactivar todos los posteriores (cascada)
    if (!item.valor) {
      const idxFase = FASES_ORDEN.indexOf(item.fase);
      const itemsEnMismaFase = this.allItems.filter(i => i.fase === item.fase);
      const idxEnFase = itemsEnMismaFase.indexOf(item);

      // Desmarcar checks posteriores DENTRO de la misma fase
      for (let i = idxEnFase + 1; i < itemsEnMismaFase.length; i++) {
        itemsEnMismaFase[i].valor = false;
      }

      // Desmarcar TODOS los checks de fases posteriores
      for (let f = idxFase + 1; f < FASES_ORDEN.length; f++) {
        const itemsDeFase = this.allItems.filter(i => i.fase === FASES_ORDEN[f]);
        itemsDeFase.forEach(i => i.valor = false);
      }
    }

    this.aplicarBloqueos();
  }

  private aplicarBloqueos(): void {
    for (let f = 0; f < FASES_ORDEN.length; f++) {
      const fase = FASES_ORDEN[f];
      const itemsDeFase = this.allItems.filter(i => i.fase === fase);

      // ¿Todas las fases anteriores están completas?
      let fasesAnterioresOk = true;
      for (let prev = 0; prev < f; prev++) {
        const itemsPrev = this.allItems.filter(i => i.fase === FASES_ORDEN[prev]);
        if (!itemsPrev.every(i => i.valor)) {
          fasesAnterioresOk = false;
          break;
        }
      }

      // Si las fases anteriores NO están completas, bloquear toda esta fase
      if (!fasesAnterioresOk) {
        itemsDeFase.forEach(i => i.disabled = true);
      } else {
        // Habilitar, pero respetar dependencias intrafase
        itemsDeFase.forEach(i => i.disabled = false);
      }
    }

    // Aplicar dependencias intrafase (ej: paso3 entrevista_agendada → ya_entrevistado)
    for (const [fase, deps] of Object.entries(this.dependencias)) {
      for (const [clavePadre, clavesHijas] of Object.entries(deps)) {
        const padre = this.allItems.find(i => i.fase === fase && i.clave === clavePadre);
        if (!padre) continue;
        for (const claveHija of clavesHijas) {
          const hija = this.allItems.find(i => i.fase === fase && i.clave === claveHija);
          if (!hija) continue;
          if (!padre.valor) {
            hija.valor = false;
            hija.disabled = true;
          }
        }
      }
    }
  }

  guardar(): void {
    // Construir checklist_fase completo para el backend (todas las fases)
    const checklist_fase = this.allItems.map(item => ({
      fase: item.fase,
      clave: item.clave,
      valor: item.valor
    }));

    // Lógica de avance: el candidato solo avanza si TODOS los checks
    // de su fase actual (y las anteriores) están completos.
    // Si desmarcó algo de una fase anterior, retrocede a esa fase.
    const faseActual = this.data.faseActual || 'paso1';
    const idxActual = FASES_ORDEN.indexOf(faseActual);

    let faseDestino = 'paso1';
    for (let f = 0; f < FASES_ORDEN.length; f++) {
      const fase = FASES_ORDEN[f];
      const itemsDeFase = this.allItems.filter(i => i.fase === fase);
      const todosOk = itemsDeFase.every(i => i.valor);

      if (todosOk) {
        // Esta fase está completa, la siguiente es candidata
        const siguiente = f < FASES_ORDEN.length - 1 ? FASES_ORDEN[f + 1] : fase;
        faseDestino = siguiente;
      } else {
        // Esta fase NO está completa → el candidato se queda aquí
        faseDestino = fase;
        break;
      }
    }

    // sub_estado: 'pendiente' si avanzó o se queda progresando, 'rechazado' solo si retrocedió
    const idxDestino = FASES_ORDEN.indexOf(faseDestino);
    let sub_estado: string;
    if (idxDestino < idxActual) {
      sub_estado = 'rechazado';
    } else {
      sub_estado = 'pendiente';
    }

    this.dialogRef.close({ fase_kanban: faseDestino, sub_estado, checklist_fase });
  }
}

// =========================================================================
// 🏛️ COMPONENTE PRINCIPAL: Dashboard
// =========================================================================

/** Forma que devuelve la API */
interface CandidatoAPI {
  id: number;
  nombre: string;
  vacante_titulo: string;
  ubicacion: string | null;
  salario_esperado: string | null;
  score_ia: number;
  score_human: number;
  email: string;
  telefono: string | null;
  anos_experiencia: string | null;
  fecha_creacion: string;
  fase_kanban: string;
  vacante: number;
  activa: boolean;
  no_negociables_candidato: string[] | Record<string, any>;
  notas: { texto: string; porcentaje: number | null; fecha: string }[];
  checklist_fase: { id: number; fase: string; clave: string; valor: boolean; fecha_actualizacion: string }[];
  pyxoom_person_process_id?: string | null;
}

/** Forma que usa el template del Kanban */
interface Candidato {
  id: number;
  nombre: string;
  puesto: string;
  ubicacion: string;
  sueldo: string;
  scoreAi: number;
  scoreHuman: number;
  iniciales: string;
  email?: string;
  telefono?: string;
  salario_esperado?: string;
  anos_experiencia?: string;
  fecha_creacion?: string;
  no_negociables?: string[];
  notas?: { texto: string; porcentaje: number | null; fecha: string }[];
  vacanteId?: number;
  faseActual?: string;
  checklistFase?: { id: number; fase: string; clave: string; valor: boolean; fecha_actualizacion: string }[];
  pyxoomPersonProcessId?: string;
}

interface Columna { id: string; titulo: string; icono: string; clasePaso: string; candidatos: Candidato[]; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatIconModule, MatFormFieldModule, MatSelectModule,
    MatButtonModule, MatDialogModule, HttpClientModule,
    DragDropModule, SidebarComponent, PanelDetalleCandidatoComponent
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  usuarioActual: any = null;
  sidebarColapsado = false;

  UnidadFiltroId: number | null = null;
  vacanteSeleccionadaId: number | null = null;
  listaUnidades: any[] = [];
  listaVacantes: any[] = [];

  get vacantesFiltradas(): any[] {
    if (this.UnidadFiltroId === null) {
      return this.listaVacantes;
    }
    return this.listaVacantes.filter(v => v.sucursal === this.UnidadFiltroId);
  }

  /** Mapa vacanteId → no_negociables_requisitos para la tabla de comparación */
  vacantesMap: Record<number, string[]> = {};

  // Panel de detalle lateral
  panelAbierto = false;
  candidatoDetalle: Candidato | null = null;

  // Menú 3 puntos
  menuAbiertoCandidatoId: number | null = null;

  // Búsqueda
  busquedaCampo: string = 'nombre';
  busquedaTexto: string = '';
  busquedaActiva: boolean = false;
  private todosLosCandidatos: Candidato[] = [];

  columnasKanban: Columna[] = [
    { id: 'paso1', titulo: 'Polígrafo/Ubicación/Sueldo', icono: 'assignment_ind', clasePaso: 'step-1', candidatos: [] },
    { id: 'paso2', titulo: 'Psicométricos',              icono: 'psychology',     clasePaso: 'step-2', candidatos: [] },
    { id: 'paso3', titulo: 'Entrevista',                 icono: 'forum',          clasePaso: 'step-3', candidatos: [] },
    { id: 'paso4', titulo: 'Top 10 a Polígrafo',         icono: 'emoji_events',   clasePaso: 'step-4', candidatos: [] },
    { id: 'paso5', titulo: 'Hogan para Top 3',           icono: 'track_changes',  clasePaso: 'step-5', candidatos: [] },
  ];

  get listaDeIds(): string[] { return this.columnasKanban.map(c => c.id); }

  constructor(
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarUsuarioActual();
    this.cargarUnidadesDesdeAPI();
    this.cargarVacantesDesdeAPI();
    this.cargarCandidatosDesdeAPI(null);
  }

  private obtenerCabecerasAutorizadas(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || '';
    return new HttpHeaders().set('Authorization', `Token ${token}`);
  }

  cargarUsuarioActual(): void {
    const headers = this.obtenerCabecerasAutorizadas();
    this.http.get<any>('http://localhost:8000/api/auth/me/', { headers }).subscribe({
      next: (usuario) => {
        this.usuarioActual = usuario;
      },
      error: () => this.cerrarSesion()
    });
  }

  cargarUnidadesDesdeAPI(): void {
    const headers = this.obtenerCabecerasAutorizadas();
    this.http.get<any>('http://localhost:8000/api/unidad-negocio/sucursales/', { headers }).subscribe({
      next: (response) => { 
        this.listaUnidades = response?.results ?? response; 
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al conectar con la API de Sucursales:', err)
    });
  }

  cargarVacantesDesdeAPI(): void {
    const headers = this.obtenerCabecerasAutorizadas();
    this.http.get<any>('http://localhost:8000/api/vacante/', { headers }).subscribe({
      next: (response) => {
        this.listaVacantes = response?.results ?? response;
        // Construir mapa de requisitos por vacante
        this.vacantesMap = {};
        this.listaVacantes.forEach((v: any) => {
          this.vacantesMap[v.id] = Array.isArray(v.no_negociables_vacante)
            ? v.no_negociables_vacante : [];
        });
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar vacantes:', err)
    });
  }

  onUnidadFiltroChange(): void {
    // Reset vacante selection
    this.vacanteSeleccionadaId = null;

    // Reload candidatos based on sucursal filter
    if (this.UnidadFiltroId === null) {
      this.cargarCandidatosDesdeAPI(null);
    } else {
      this.cargarCandidatosYFiltrarPorSucursal(this.UnidadFiltroId);
    }
  }

  onVacanteChange(idVacante: number | null): void {
    this.vacanteSeleccionadaId = idVacante;
    this.cargarCandidatosDesdeAPI(idVacante);
  }

  /** GET /api/candidato/ — sin vacante_id devuelve todos; con vacante_id filtra */
  cargarCandidatosDesdeAPI(vacanteId: number | null): void {
    const headers = this.obtenerCabecerasAutorizadas();
    this.columnasKanban.forEach(col => col.candidatos = []);

    const url = vacanteId
      ? `http://localhost:8000/api/candidato/?vacante_id=${vacanteId}`
      : `http://localhost:8000/api/candidato/`;

    this.http.get<any>(url, { headers }).subscribe({
      next: (respuesta) => {
        // Soporta tanto array plano como respuesta paginada { results: [...] }
        const candidatos: CandidatoAPI[] = Array.isArray(respuesta)
          ? respuesta
          : (respuesta?.results ?? []);

        console.log(`Candidatos recibidos (vacante=${vacanteId}):`, candidatos);

        candidatos.forEach(c => {
          const columna = this.columnasKanban.find(col => col.id === c.fase_kanban);
          if (columna) {
            columna.candidatos.push(this.mapearCandidato(c));
          } else {
            console.warn(`Candidato ID ${c.id} tiene fase_kanban='${c.fase_kanban}' que no existe en el kanban.`);
          }
        });

        // Cache para búsqueda local
        this.todosLosCandidatos = this.columnasKanban.flatMap(col => col.candidatos);
        this.cdr.detectChanges(); // 🌟 Crucial: Forzar el renderizado de las cards en las columnas del Kanban
      },
      error: (err) => console.error('Error al cargar candidatos:', err)
    });
  }

  private cargarCandidatosYFiltrarPorSucursal(sucursalId: number): void {
    const headers = this.obtenerCabecerasAutorizadas();
    this.columnasKanban.forEach(col => col.candidatos = []);

    this.http.get<any>('http://localhost:8000/api/candidato/', { headers }).subscribe({
      next: (respuesta) => {
        const candidatos: CandidatoAPI[] = Array.isArray(respuesta)
          ? respuesta
          : (respuesta?.results ?? []);

        // Get vacante IDs that belong to the selected sucursal
        const vacanteIdsEnSucursal = new Set(
          this.listaVacantes
            .filter(v => v.sucursal === sucursalId)
            .map(v => v.id)
        );

        // Filter candidatos to only those belonging to vacantes in selected sucursal
        const filtrados = candidatos.filter(c => vacanteIdsEnSucursal.has(c.vacante));

        filtrados.forEach(c => {
          const columna = this.columnasKanban.find(col => col.id === c.fase_kanban);
          if (columna) {
            columna.candidatos.push(this.mapearCandidato(c));
          }
        });

        this.todosLosCandidatos = this.columnasKanban.flatMap(col => col.candidatos);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar candidatos:', err)
    });
  }

  /** Transforma el objeto de la API al formato que usa el template */
  private mapearCandidato(c: CandidatoAPI): Candidato {
    const partes = c.nombre.trim().split(' ');
    const iniciales = partes.slice(0, 2).map(p => p[0].toUpperCase()).join('');
    // no_negociables puede venir como array o como objeto legacy {}
    const noNeg: string[] = Array.isArray(c.no_negociables_candidato) ? c.no_negociables_candidato : [];
    return {
      id:               c.id,
      nombre:           c.nombre,
      puesto:           c.vacante_titulo ?? 'Sin vacante',
      ubicacion:        c.ubicacion     ?? '—',
      sueldo:           c.salario_esperado ? `$ ${c.salario_esperado}` : '—',
      scoreAi:          c.score_ia,
      scoreHuman:       c.score_human,
      iniciales,
      email:            c.email,
      telefono:         c.telefono         ?? undefined,
      salario_esperado: c.salario_esperado ?? undefined,
      anos_experiencia: c.anos_experiencia ?? undefined,
      fecha_creacion:   c.fecha_creacion,
      no_negociables:   noNeg,
      notas:            Array.isArray(c.notas) ? c.notas : [],
      vacanteId:        c.vacante,
      faseActual:       c.fase_kanban,
      checklistFase:    Array.isArray(c.checklist_fase) ? c.checklist_fase : [],
      pyxoomPersonProcessId: c.pyxoom_person_process_id ?? undefined,
    };
  }

  // ------------------------------------------------------------------
  // Menú 3 puntos
  // ------------------------------------------------------------------
  toggleMenu(event: Event, candidatoId: number): void {
    event.stopPropagation();
    this.menuAbiertoCandidatoId = this.menuAbiertoCandidatoId === candidatoId ? null : candidatoId;
  }

  @HostListener('document:click')
  cerrarMenus(): void {
    this.menuAbiertoCandidatoId = null;
  }

  // ------------------------------------------------------------------
  // Panel lateral "Ver más"
  // ------------------------------------------------------------------
  verMas(event: Event, candidato: Candidato): void {
    event.stopPropagation();
    this.menuAbiertoCandidatoId = null;
    this.candidatoDetalle = candidato;
    this.panelAbierto = true;
  }

  cerrarPanel(): void {
    this.panelAbierto = false;
    this.candidatoDetalle = null;
  }

  // ------------------------------------------------------------------
  // Eliminar candidato
  // ------------------------------------------------------------------
  eliminarCandidato(event: Event, candidatoId: number): void {
    event.stopPropagation();
    this.menuAbiertoCandidatoId = null;

    const dialogRef = this.dialog.open(AlertaDialogComponent, {
      width: '380px',
      data: { titulo: '¿Eliminar candidato?', mensaje: 'Esta acción no se puede deshacer. ¿Confirmas?', tipo: 'warning' }
    });
    dialogRef.afterClosed().subscribe(() => {
      const headers = this.obtenerCabecerasAutorizadas();
      this.http.delete(`http://localhost:8000/api/candidato/${candidatoId}/`, { headers }).subscribe({
        next: () => {
          this.columnasKanban.forEach(col => {
            col.candidatos = col.candidatos.filter(c => c.id !== candidatoId);
          });
          if (this.candidatoDetalle?.id === candidatoId) this.cerrarPanel();
        },
        error: (err) => console.error('Error al eliminar candidato:', err)
      });
    });
  }

  // ------------------------------------------------------------------
  // Compartir
  // ------------------------------------------------------------------
  compartir(event: Event, candidato: Candidato): void {
    event.stopPropagation();
    this.menuAbiertoCandidatoId = null;
    const texto = `Candidato: ${candidato.nombre} | Puesto: ${candidato.puesto} | Ubicación: ${candidato.ubicacion}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(texto).then(() =>
        this.mostrarAlerta('Copiado', 'Datos copiados al portapapeles.', 'info')
      );
    }
  }

  // ------------------------------------------------------------------
  // ------------------------------------------------------------------
  // Filtros por fase (select debajo del header de columna)
  // ------------------------------------------------------------------
  filtrosActivos: Record<string, string> = {}; // { paso1: 'acepta_poligrafo', paso4: 'aprobo_poligrafo' }

  /** Devuelve las opciones de filtro para una fase específica */
  filtrosPorFase(faseId: string): { clave: string; label: string }[] {
    const config: Record<string, { clave: string; label: string }[]> = {
      paso1: [
        { clave: 'no_acepta_poligrafo', label: 'No aprobó polígrafo' },
        { clave: 'no_acepta_ubicacion', label: 'No acepta ubicación' },
        { clave: 'no_acepta_sueldo', label: 'Sueldo muy alto' },
      ],
      paso2: [
        { clave: 'no_aprobo_pyxxom', label: 'No aprobó' },
        { clave: 'no_contesto_pyxxom', label: 'No contestó Pyxxom' },
      ],
      paso3: [
        { clave: 'pendiente_agendar', label: 'Pendiente agendar' },
        { clave: 'no_aprobo_entrevista', label: 'No aprobó entrevista' },
      ],
      paso4: [
        { clave: 'aprobo_poligrafo', label: 'Aprobado polígrafo' },
        { clave: 'pendiente_poligrafo', label: 'Pendiente polígrafo' },
      ],
      paso5: [
        { clave: 'hogan_completo', label: 'Hogan completo' },
        { clave: 'pendiente_hogan', label: 'Pendiente Hogan' },
      ],
    };
    return config[faseId] || [];
  }

  onFiltroColumna(faseId: string, event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    if (valor) {
      this.filtrosActivos[faseId] = valor;
    } else {
      delete this.filtrosActivos[faseId];
    }
  }

  /** Filtra candidatos de una columna en base al checklist_fase */
  candidatosFiltrados(columna: Columna): Candidato[] {
    const filtro = this.filtrosActivos[columna.id];
    if (!filtro) return columna.candidatos;

    return columna.candidatos.filter(c => {
      const checklist = c.checklistFase || [];

      switch (filtro) {
        // Paso 1: rechazados por motivo específico
        case 'no_acepta_poligrafo': {
          const item = checklist.find(x => x.fase === 'paso1' && x.clave === 'acepta_poligrafo');
          return item && !item.valor;
        }
        case 'no_acepta_ubicacion': {
          const item = checklist.find(x => x.fase === 'paso1' && x.clave === 'acepta_ubicacion');
          return item && !item.valor;
        }
        case 'no_acepta_sueldo': {
          const item = checklist.find(x => x.fase === 'paso1' && x.clave === 'acepta_sueldo');
          return item && !item.valor;
        }
        // Paso 2
        case 'no_aprobo_pyxoom': {
          const item = checklist.find(x => x.fase === 'paso2' && x.clave === 'aprobo_pyxoom');
          return item && !item.valor;
        }
        case 'no_contesto_pyxoom': {
          const item = checklist.find(x => x.fase === 'paso2' && x.clave === 'contesto_pyxoom');
          return !item || !item.valor;
        }
        // Paso 3
        case 'pendiente_agendar': {
          const item = checklist.find(x => x.fase === 'paso3' && x.clave === 'entrevista_agendada');
          return !item || !item.valor;
        }
        case 'no_aprobo_entrevista': {
          const item = checklist.find(x => x.fase === 'paso3' && x.clave === 'aprobo_entrevista');
          return item && !item.valor;
        }
        // Paso 4
        case 'aprobo_poligrafo': {
          const item = checklist.find(x => x.fase === 'paso4' && x.clave === 'aprobo_poligrafo');
          return item && item.valor;
        }
        case 'pendiente_poligrafo': {
          const item = checklist.find(x => x.fase === 'paso4' && x.clave === 'aprobo_poligrafo');
          return !item || !item.valor;
        }
        // Paso 5
        case 'hogan_completo': {
          const item = checklist.find(x => x.fase === 'paso5' && x.clave === 'aprobo_hogan');
          return item && item.valor;
        }
        case 'pendiente_hogan': {
          const item = checklist.find(x => x.fase === 'paso5' && x.clave === 'aprobo_hogan');
          return !item || !item.valor;
        }
        default:
          return true;
      }
    });
  }

  // ------------------------------------------------------------------
  // Modal de Alerta reutilizable
  // ------------------------------------------------------------------
  mostrarAlerta(titulo: string, mensaje: string, tipo: 'info' | 'error' | 'warning' = 'info'): void {
    this.dialog.open(AlertaDialogComponent, {
      width: '380px',
      data: { titulo, mensaje, tipo }
    });
  }

  // ------------------------------------------------------------------
  // Actualizar candidato (avanzar de fase)
  // ------------------------------------------------------------------
  abrirActualizar(event: Event, candidato: Candidato): void {
    event.stopPropagation();
    this.menuAbiertoCandidatoId = null;

    const dialogRef = this.dialog.open(ActualizarCandidatoDialogComponent, {
      width: '760px',
      maxWidth: '90vw',
      disableClose: true,
      data: {
        candidato,
        faseActual: candidato.faseActual || 'paso1',
        checklistExistente: candidato.checklistFase || []
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      const headers = this.obtenerCabecerasAutorizadas();
      this.http.patch<any>(
        `http://localhost:8000/api/candidato/${candidato.id}/`,
        {
          fase_kanban: result.fase_kanban,
          sub_estado: result.sub_estado,
          checklist_fase: result.checklist_fase
        },
        { headers }
      ).subscribe({
        next: (resp) => {
          // Actualizar checklist local
          candidato.checklistFase = resp.checklist_fase || [];
          const faseAnterior = candidato.faseActual;
          candidato.faseActual = result.fase_kanban;

          // Mover la card entre columnas si cambió de fase
          if (result.fase_kanban !== faseAnterior) {
            this.columnasKanban.forEach(col => {
              col.candidatos = col.candidatos.filter(c => c.id !== candidato.id);
            });
            const nuevaColumna = this.columnasKanban.find(c => c.id === result.fase_kanban);
            if (nuevaColumna) {
              nuevaColumna.candidatos.push(candidato);
            }
          }
          this.mostrarAlerta('Éxito', 'Estatus del candidato actualizado correctamente.', 'info');
        },
        error: (err) => {
          console.error('Error actualizando candidato:', err);
          this.mostrarAlerta('Error', 'No se pudo actualizar el candidato.', 'error');
        }
      });
    });
  }

  // ------------------------------------------------------------------
  // Alta de Vacante (movido a AdministrarVacantesComponent)
  // ------------------------------------------------------------------

  toggleSidebar(): void { this.sidebarColapsado = !this.sidebarColapsado; }

  drop(event: CdkDragDrop<Candidato[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);

      // Detectar a qué fase se movió
      const faseDestino = event.container.id;
      const faseOrigen = event.previousContainer.id;
      const candidato = event.container.data[event.currentIndex];

      const fasesOrden = ['paso1', 'paso2', 'paso3', 'paso4', 'paso5'];
      const idxDestino = fasesOrden.indexOf(faseDestino);
      const idxOrigen = fasesOrden.indexOf(faseOrigen);

      // Construir checklist completo basado en CHECKLIST_CONFIG
      const checklistCompleto = fasesOrden.flatMap(fase => {
        const cfg = (CHECKLIST_CONFIG as any)[fase];
        return cfg.checks.map((chk: any) => {
          // Buscar valor existente
          const existente = (candidato.checklistFase || []).find(
            (e: any) => e.fase === fase && e.clave === chk.clave
          );
          const idxFase = fasesOrden.indexOf(fase);

          let valor = existente ? existente.valor : false;

          if (idxDestino > idxOrigen) {
            // Avance: marcar como true todos los de fases ANTERIORES al destino
            if (idxFase < idxDestino) {
              valor = true;
            }
          } else if (idxDestino < idxOrigen) {
            // Retroceso: desmarcar todos los de fases >= destino
            if (idxFase >= idxDestino) {
              valor = false;
            }
          }

          return { fase, clave: chk.clave, valor };
        });
      });

      candidato.faseActual = faseDestino;
      const headers = this.obtenerCabecerasAutorizadas();

      this.http.patch<any>(
        `http://localhost:8000/api/candidato/${candidato.id}/`,
        { fase_kanban: faseDestino, sub_estado: 'pendiente', checklist_fase: checklistCompleto },
        { headers }
      ).subscribe({
        next: (resp) => {
          candidato.checklistFase = resp.checklist_fase || [];
        },
        error: (err) => {
          console.error('Error al mover candidato:', err);
          transferArrayItem(event.container.data, event.previousContainer.data, event.currentIndex, event.previousIndex);
          candidato.faseActual = faseOrigen;
          this.mostrarAlerta('Error', 'No se pudo mover el candidato.', 'error');
        }
      });
    }
  }

  // ------------------------------------------------------------------
  // Búsqueda de candidatos
  // ------------------------------------------------------------------
  buscar(): void {
    const texto = this.busquedaTexto.trim().toLowerCase();
    if (!texto) {
      this.limpiarBusqueda();
      return;
    }
    this.busquedaActiva = true;
    // Clear all columns
    this.columnasKanban.forEach(col => col.candidatos = []);
    // Filter from cache and distribute to columns
    const filtrados = this.todosLosCandidatos.filter(c =>
      c.nombre.toLowerCase().includes(texto)
    );
    filtrados.forEach(c => {
      const columna = this.columnasKanban.find(col => col.id === c.faseActual);
      if (columna) columna.candidatos.push(c);
    });
  }

  limpiarBusqueda(): void {
    this.busquedaTexto = '';
    this.busquedaActiva = false;
    // Restore all candidates from cache
    this.columnasKanban.forEach(col => col.candidatos = []);
    this.todosLosCandidatos.forEach(c => {
      const columna = this.columnasKanban.find(col => col.id === c.faseActual);
      if (columna) columna.candidatos.push(c);
    });
  }

  cerrarSesion(): void { this.authService.logout(); this.router.navigate(['/login']); }

  formatearFecha(fecha: string | undefined): string {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  onScoreActualizado(event: { candidatoId: number; nuevoScore: number }): void {
    this.columnasKanban.forEach(col => {
      const card = col.candidatos.find(c => c.id === event.candidatoId);
      if (card) card.scoreHuman = event.nuevoScore;
    });
  }
}
