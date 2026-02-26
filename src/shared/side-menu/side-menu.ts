import { Component, OnInit, OnDestroy } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { SHARED_IMPORTS } from '../../app/shared-imports';
import { Branch, BranchService } from '../../services/branch.service';

@Component({
  selector: 'app-side-menu',
  standalone: true,
  imports: [...SHARED_IMPORTS],
  templateUrl: './side-menu.html',
  styleUrls: ['./side-menu.scss']
})
export class SideMenuComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      routerLink: '/dashboard'
    },
    {
      label: 'Employee',
      icon: 'pi pi-users',
      routerLink: '/employee'
    },
    {
      label: 'Salary/Expenses',
      icon: 'pi pi-dollar',
      routerLink: '/salary'
    },
    {
      label: 'Custom Rate',
      icon: 'pi pi-percentage',
      routerLink: '/custom-rate'
    },
    {
      label: 'Daily Work Management',
      icon: 'pi pi-briefcase',
      routerLink: '/daily-work-management'
    }
  ];

  branches: Branch[] = [];
  selectedBranch!: Branch;

  constructor(private branchService: BranchService) {}

  ngOnInit(): void {
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
