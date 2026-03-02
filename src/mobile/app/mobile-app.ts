import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PrimeNG } from 'primeng/config';
import { Toast } from 'primeng/toast';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { Subject, takeUntil } from 'rxjs';
import { BranchService, Branch } from '../../services/branch.service';

@Component({
  selector: 'app-mobile-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Toast, FormsModule, Select],
  templateUrl: './mobile-app.html',
  styleUrl: './mobile-app.scss',
})
export class MobileApp implements OnInit, OnDestroy {
  branches: Branch[] = [];
  selectedBranch: Branch | null = null;
  private destroy$ = new Subject<void>();

  constructor(private primeng: PrimeNG, private branchService: BranchService) {}

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
}
