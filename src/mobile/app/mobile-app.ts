import { Component, OnInit, OnDestroy, AfterViewInit, NgZone } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { PrimeNG } from 'primeng/config';
import { Toast } from 'primeng/toast';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { Subject, takeUntil } from 'rxjs';
import { BranchService, Branch } from '../../services/branch.service';
import { LoaderComponent } from '../../shared/loader/loader';

@Component({
  selector: 'app-mobile-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Toast, FormsModule, Select, LoaderComponent],
  templateUrl: './mobile-app.html',
  styleUrl: './mobile-app.scss',
})
export class MobileApp implements OnInit, OnDestroy, AfterViewInit {
  branches: Branch[] = [];
  selectedBranch: Branch | null = null;
  activeTab: string = 'daily-work';
  private destroy$ = new Subject<void>();

  constructor(
    private primeng: PrimeNG,
    private branchService: BranchService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.primeng.ripple.set(true);

    this.branchService.getBranches()
      .pipe(takeUntil(this.destroy$))
      .subscribe(branches => {
        this.branches = branches;
      });

    this.branchService.getSelectedBranch()
      .pipe(takeUntil(this.destroy$))
      .subscribe(branch => {
        this.selectedBranch = branch;
      });

    // Set active tab based on current route
    this.updateActiveTab(this.router.url);
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateActiveTab(this.router.url);
    });
  }

  ngAfterViewInit(): void {
    // Prevent virtual keyboard from showing on datepicker and select inputs on Android.
    // These inputs should only open their respective overlay panels, not the keyboard.
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement;
      if (target?.tagName === 'INPUT') {
        const isDatepicker = target.closest('p-datepicker') !== null;
        const isSelect = target.closest('p-select') !== null;
        if (isDatepicker || isSelect) {
          (target as HTMLInputElement).readOnly = true;
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onBranchChange(event: any): void {
    if (event.value) {
      this.branchService.setSelectedBranch(event.value);
    }
  }

  navigateTo(route: string): void {
    this.activeTab = route;
    this.router.navigate(['/' + route]);
  }

  private updateActiveTab(url: string): void {
    if (url.includes('invoices')) {
      this.activeTab = 'invoices';
    } else {
      this.activeTab = 'daily-work';
    }
  }
}
