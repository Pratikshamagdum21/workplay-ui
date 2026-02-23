import { Component } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '../../app/shared-imports';
interface Branch {
  id: number;
  name: string;
  code: string;
  location?: string;
}
@Component({
  selector: 'app-side-menu',
  standalone: true,
  imports: [...SHARED_IMPORTS],
  templateUrl: './side-menu.html',
  styleUrls: ['./side-menu.scss']
})

export class SideMenuComponent {
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
  branches: Branch[] = [
    { id: 1, name: 'Main Branch', code: 'MB-001', location: 'New York' },
    { id: 2, name: 'North Branch', code: 'NB-002', location: 'Boston' },
    { id: 3, name: 'South Branch', code: 'SB-003', location: 'Miami' },
    { id: 4, name: 'West Branch', code: 'WB-004', location: 'Los Angeles' },
    { id: 5, name: 'East Branch', code: 'EB-005', location: 'Philadelphia' }
  ];
  selectedBranch: Branch = this.branches[0];
  onBranchChange(event: any) {
    console.log('Branch changed to:', event.value);
    // Add your branch switching logic here
    // For example: reload data, update context, etc.
  }
}
