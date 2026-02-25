import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PrimeNG } from 'primeng/config';
import { Toast } from 'primeng/toast';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mobile-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Toast],
  templateUrl: './mobile-app.html',
  styleUrl: './mobile-app.scss',
})
export class MobileApp implements OnInit {
  constructor(private primeng: PrimeNG) {}

  ngOnInit(): void {
    this.primeng.ripple.set(true);
  }
}
