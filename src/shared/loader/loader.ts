import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { LoaderService } from './loader.service';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule],
  template: `
    @if (loaderService.isLoading$ | async) {
      <div class="loader-overlay">
        <p-progressSpinner
          strokeWidth="4"
          animationDuration="0.8s"
        ></p-progressSpinner>
      </div>
    }
  `,
  styles: [`
    .loader-overlay {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.25);
      z-index: 9999;
    }
  `]
})
export class LoaderComponent {
  constructor(public loaderService: LoaderService) {}
}
