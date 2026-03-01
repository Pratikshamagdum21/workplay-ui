import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SideMenuComponent } from '../shared/side-menu/side-menu';
import { SHARED_IMPORTS } from './shared-imports';
import { PrimeNG } from 'primeng/config';

@Component({
  selector: 'app-root',
  imports: [[...SHARED_IMPORTS], RouterOutlet, SideMenuComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('WorkPay');
  sideMenuOpen = false;

  constructor(private primeng: PrimeNG) {}

  ngOnInit(): void {
    this.primeng.ripple.set(true);
  }

  toggleSideMenu(): void {
    this.sideMenuOpen = !this.sideMenuOpen;
  }

  closeSideMenu(): void {
    this.sideMenuOpen = false;
  }
}
