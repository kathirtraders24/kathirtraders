import { Routes } from '@angular/router';
import { ReportsComponent } from './reports.component';
import { ReportViewerComponent } from './report-viewer.component';

export const REPORTS_ROUTES: Routes = [
  { path: '', component: ReportsComponent },
  { path: ':type', component: ReportViewerComponent },
];
