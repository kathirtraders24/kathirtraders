import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { AsyncPipe, DatePipe } from '@angular/common';
import { EstimationActions } from '../store/estimation.actions';
import { selectAllEstimations, selectEstimationsLoading } from '../store/estimation.selectors';
import { PaisePipe, Estimation, ConfirmDialogComponent } from '../../../shared';

@Component({
  selector: 'app-estimation-list',
  standalone: true,
  imports: [
    MatTableModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatProgressBarModule, AsyncPipe, DatePipe, PaisePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './estimation-list.component.html',
  styleUrl: './estimation-list.component.scss',
})
export class EstimationListComponent implements OnInit {
  private store = inject(Store);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  estimations$ = this.store.select(selectAllEstimations);
  loading$ = this.store.select(selectEstimationsLoading);
  displayedColumns = [
    'estimationNumber', 'date', 'customerName', 'grandTotal',
    'validUntil', 'status', 'actions',
  ];

  ngOnInit(): void {
    this.store.dispatch(EstimationActions.loadEstimations());
  }

  createEstimation(): void {
    this.router.navigate(['/estimations', 'new']);
  }

  viewEstimation(est: Estimation): void {
    this.router.navigate(['/estimations', est.id, 'preview']);
  }

  deleteEstimation(est: Estimation): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Estimation',
        message: `Delete estimation "${est.estimationNumber}"?`,
        confirmText: 'Delete',
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.store.dispatch(EstimationActions.deleteEstimation({ id: est.id }));
      }
    });
  }
}
