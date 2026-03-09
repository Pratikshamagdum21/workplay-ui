import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { App } from './app';
import { BranchService } from '../services/branch.service';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';

describe('App', () => {
  let branchServiceMock: any;

  beforeEach(async () => {
    branchServiceMock = {
      getSelectedBranch: () => of({ id: 1, name: 'Unit 1', code: 'MB-001' }),
      getSelectedBranchSnapshot: () => ({ id: 1, name: 'Unit 1', code: 'MB-001' }),
      getBranches: () => of([{ id: 1, name: 'Unit 1', code: 'MB-001' }])
    };

    await TestBed.configureTestingModule({
      imports: [App, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: BranchService, useValue: branchServiceMock },
        MessageService
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have title signal set to Shivai Textile', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect((app as any).title()).toBe('Shivai Textile');
  });

  it('should start with side menu closed', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app.sideMenuOpen).toBeFalse();
  });

  it('should toggle side menu', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.toggleSideMenu();
    expect(app.sideMenuOpen).toBeTrue();
    app.toggleSideMenu();
    expect(app.sideMenuOpen).toBeFalse();
  });

  it('should close side menu', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.sideMenuOpen = true;
    app.closeSideMenu();
    expect(app.sideMenuOpen).toBeFalse();
  });
});
