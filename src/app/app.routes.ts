import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { AdministrarVacantesComponent } from './pages/administrar-vacantes/administrar-vacantes';
import { AlertasKpis } from './pages/alertas-kpis/alertas-kpis';
import { Reportes } from './pages/reportes/reportes';
import { ConfiguracionComponent } from './pages/configuracion/configuracion';
import { SuperuserGuard } from './guards/superuser.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [SuperuserGuard] },
  { path: 'administrar-vacantes', component: AdministrarVacantesComponent, canActivate: [SuperuserGuard] },
  { path: 'alertas-kpis', component: AlertasKpis, canActivate: [SuperuserGuard] },
  { path: 'reportes', component: Reportes, canActivate: [SuperuserGuard] },
  { path: 'configuracion', component: ConfiguracionComponent, canActivate: [SuperuserGuard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
