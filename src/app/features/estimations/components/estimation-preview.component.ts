import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { selectEstimationById } from '../store/estimation.selectors';
import { PaisePipe, Estimation } from '../../../shared';

@Component({
  selector: 'app-estimation-preview',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, DatePipe, PaisePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './estimation-preview.component.html',
  styleUrl: './estimation-preview.component.scss',
})
export class EstimationPreviewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private store = inject(Store);

  estimation = signal<Estimation | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.store.select(selectEstimationById(id)).subscribe((est) => {
        if (est) {
          this.estimation.set(est);
        }
      });
    }
  }

  print(): void {
    window.print();
  }

  goBack(): void {
    this.router.navigate(['/estimations']);
  }
}
