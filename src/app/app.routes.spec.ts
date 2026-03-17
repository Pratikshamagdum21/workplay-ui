import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { routes } from './app.routes';

describe('App Routes', () => {
  it('should have routes defined', () => {
    expect(routes).toBeTruthy();
    expect(routes.length).toBeGreaterThan(0);
  });

  it('should have a home route', () => {
    const homeRoute = routes.find(r => r.path === 'home');
    expect(homeRoute).toBeTruthy();
  });

  it('should have a dashboard route', () => {
    const route = routes.find(r => r.path === 'dashboard');
    expect(route).toBeTruthy();
  });

  it('should have an employee route', () => {
    const route = routes.find(r => r.path === 'employee');
    expect(route).toBeTruthy();
  });

  it('should have a salary route', () => {
    const route = routes.find(r => r.path === 'salary');
    expect(route).toBeTruthy();
  });

  it('should have a custom-rate route', () => {
    const route = routes.find(r => r.path === 'custom-rate');
    expect(route).toBeTruthy();
  });

  it('should have a daily-work-management route', () => {
    const route = routes.find(r => r.path === 'daily-work-management');
    expect(route).toBeTruthy();
  });

  it('should redirect empty path to home', () => {
    const defaultRoute = routes.find(r => r.path === '');
    expect(defaultRoute).toBeTruthy();
    expect(defaultRoute?.redirectTo).toBe('home');
  });
});
