import { Component, Input, Output, EventEmitter, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';

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
}

@Component({
  selector: 'app-panel-detalle-candidato',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatDialogModule, HttpClientModule
  ],
  templateUrl: './panel-detalle-candidato.html',
  styleUrls: ['./panel-detalle-candidato.css']
})
export class PanelDetalleCandidatoComponent implements OnChanges {
  @Input() candidato: Candidato | null = null;
  @Input() vacantesMap: Record<number, string[]> = {};
  @Input() abierto = false;

  @Output() cerrar = new EventEmitter<void>();
  @Output() scoreActualizado = new EventEmitter<{ candidatoId: number; nuevoScore: number }>();

  tabActiva: 'detalles' | 'documentacion' | 'whatsapp' | 'email' = 'detalles';
  notaTexto = '';
  notaPorcentaje: number | null = null;
  guardandoNota = false;

  // Documentación
  tiposDocumento: { clave: string; label: string }[] = [
    { clave: 'cv', label: 'Currículum Vitae' },
    { clave: 'ine', label: 'INE / Identificación Oficial' },
    { clave: 'acta_nacimiento', label: 'Acta de Nacimiento' },
    { clave: 'comprobante_domicilio', label: 'Comprobante de Domicilio' },
    { clave: 'comprobante_estudios', label: 'Comprobante de Estudios' },
    { clave: 'carta_recomendacion', label: 'Carta de Recomendación' },
    { clave: 'contrato', label: 'Contrato' },
    { clave: 'otro', label: 'Otro' },
  ];
  archivosSeleccionados: Record<string, File | null> = {};
  archivosSubidos: Record<string, { nombre: string; url: string } | null> = {};
  subiendoArchivo: Record<string, boolean> = {};

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['candidato'] && changes['candidato'].currentValue !== changes['candidato'].previousValue) {
      // Reset estado de documentación al cambiar de candidato
      this.archivosSubidos = {};
      this.archivosSeleccionados = {};
      this.subiendoArchivo = {};
      this.tabActiva = 'detalles';

      // Si el panel está abierto y hay candidato, precargar archivos
      if (this.abierto && this.candidato) {
        this.cargarArchivos();
      }
    }
  }

  setTab(tab: 'detalles' | 'documentacion' | 'whatsapp' | 'email'): void {
    this.tabActiva = tab;
    if (tab === 'documentacion') {
      this.cargarArchivos();
    }
  }

  cerrarPanel(): void {
    this.cerrar.emit();
  }

  get iniciales(): string {
    if (!this.candidato?.nombre) return '?';
    return this.candidato.nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  get filasNoNegociables(): { requisito: string; candidato: string; cumple: boolean }[] {
    if (!this.candidato) return [];
    const vacanteId = this.candidato.vacanteId;
    const requisitosVacante: string[] = vacanteId ? (this.vacantesMap[vacanteId] ?? []) : [];
    const requisitosCandidat: string[] = this.candidato.no_negociables ?? [];

    return requisitosVacante.map(req => {
      const match = requisitosCandidat.find(
        r => r.toLowerCase().trim() === req.toLowerCase().trim()
      );
      return {
        requisito: req,
        candidato: match ?? 'N/A',
        cumple: !!match,
      };
    });
  }

  formatearFecha(fecha: string | undefined): string {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  formatearFechaNota(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    const fecha = d.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const hora = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${fecha} ${hora}`;
  }

  agregarNota(): void {
    if (!this.candidato || !this.notaTexto.trim()) return;

    if (this.notaPorcentaje !== null && this.notaPorcentaje !== undefined) {
      if (this.notaPorcentaje < 1 || this.notaPorcentaje > 100) {
        return;
      }
    }

    this.guardandoNota = true;

    const nota = {
      texto: this.notaTexto.trim(),
      porcentaje: (this.notaPorcentaje && this.notaPorcentaje >= 1) ? this.notaPorcentaje : null,
      fecha: '',
    };

    if (!this.candidato.notas) this.candidato.notas = [];
    this.candidato.notas.push(nota);

    // Promediar Score Human
    const notasConScore = this.candidato.notas.filter(n => n.porcentaje !== null && n.porcentaje !== undefined);
    const nuevoScore = notasConScore.length > 0
      ? Math.round(notasConScore.reduce((sum, n) => sum + (n.porcentaje ?? 0), 0) / notasConScore.length)
      : this.candidato.scoreHuman;

    this.candidato.scoreHuman = nuevoScore;

    // Persistir notas + score_human al backend
    const token = localStorage.getItem('auth_token') || '';
    const headers = new HttpHeaders().set('Authorization', `Token ${token}`);
    this.http.patch<any>(
      `http://localhost:8000/api/candidato/${this.candidato.id}/`,
      { notas: this.candidato.notas, score_human: nuevoScore },
      { headers }
    ).subscribe({
      next: (resp) => {
        if (this.candidato && resp.notas) {
          this.candidato.notas = resp.notas;
        }
        // Emit event so the parent kanban card is updated
        this.scoreActualizado.emit({ candidatoId: this.candidato!.id, nuevoScore });
        this.guardandoNota = false;
      },
      error: (err) => {
        console.error('Error guardando notas:', err);
        this.guardandoNota = false;
      }
    });

    this.notaTexto = '';
    this.notaPorcentaje = null;
  }

  // ─── DOCUMENTACIÓN ────────────────────────────────────────────────────

  cargarArchivos(): void {
    if (!this.candidato) return;
    const token = localStorage.getItem('auth_token') || '';
    const headers = new HttpHeaders().set('Authorization', `Token ${token}`);
    this.http.get<any[]>(
      `http://localhost:8000/api/candidato/${this.candidato.id}/archivos/`,
      { headers }
    ).subscribe({
      next: (archivos) => {
        // Reset
        this.archivosSubidos = {};
        for (const archivo of archivos) {
          if (archivo.activo) {
            this.archivosSubidos[archivo.tipo_documento] = {
              nombre: archivo.nombre_archivo,
              url: archivo.blob_url
            };
          }
        }
      },
      error: (err) => console.error('Error cargando archivos:', err)
    });
  }

  onArchivoSeleccionado(event: Event, tipoDoc: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.archivosSeleccionados[tipoDoc] = input.files[0];
      this.subirArchivo(tipoDoc);
    }
  }

  subirArchivo(tipoDoc: string): void {
    const archivo = this.archivosSeleccionados[tipoDoc];
    if (!archivo || !this.candidato) return;

    this.subiendoArchivo[tipoDoc] = true;
    const token = localStorage.getItem('auth_token') || '';
    const headers = new HttpHeaders().set('Authorization', `Token ${token}`);

    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('tipo_documento', tipoDoc);

    this.http.post<any>(
      `http://localhost:8000/api/candidato/${this.candidato.id}/archivos/`,
      formData,
      { headers }
    ).subscribe({
      next: (resp) => {
        this.archivosSubidos[tipoDoc] = {
          nombre: resp.nombre_archivo,
          url: resp.blob_url
        };
        this.archivosSeleccionados[tipoDoc] = null;
        this.subiendoArchivo[tipoDoc] = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error subiendo archivo:', err);
        this.subiendoArchivo[tipoDoc] = false;
        this.cdr.detectChanges();
      }
    });
  }

  eliminarArchivo(tipoDoc: string): void {
    if (!this.candidato) return;
    const token = localStorage.getItem('auth_token') || '';
    const headers = new HttpHeaders().set('Authorization', `Token ${token}`);

    this.http.delete(
      `http://localhost:8000/api/candidato/${this.candidato.id}/archivos/${tipoDoc}/`,
      { headers }
    ).subscribe({
      next: () => {
        this.archivosSubidos[tipoDoc] = null;
        this.archivosSeleccionados[tipoDoc] = null;
      },
      error: (err) => console.error('Error eliminando archivo:', err)
    });
  }
}
