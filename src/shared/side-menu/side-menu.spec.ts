import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SideMenuComponent } from './side-menu';
import { BranchService, Branch } from '../../services/branch.service';
import { BehaviorSubject, of } from 'rxjs';

describe('SideMenuComponent', () => {
  let component: SideMenuComponent;
  let fixture: ComponentFixture<SideMenuComponent>;
  let branchService: any;

  const mockBranches: Branch[] = [
    { id: 1, name: 'Unit 1', code: 'MB-001' },
    { id: 2, name: 'Unit 2', code: 'NB-002' }
  ];

  const branchesSubject = new BehaviorSubject<Branch[]>(mockBranches);
  const selectedBranchSubject = new BehaviorSubject<Branch>(mockBranches[0]);

  beforeEach(async () => {
    branchService = {
      getBranches: () => branchesSubject.asObservable(),
      getSelectedBranch: () => selectedBranchSubject.asObservable(),
      setSelectedBranch: jasmine.createSpy('setSelectedBranch')
    };

    await TestBed.configureTestingModule({
      imports: [SideMenuComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: BranchService, useValue: branchService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SideMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 5 menu items', () => {
    expect(component.menuItems.length).toBe(5);
  });

  it('should have correct menu item labels', () => {
    const labels = component.menuItems.map(i => i.label);
    expect(labels).toEqual([
      'Dashboard', 'Employee', 'Salary/Expenses', 'Custom Rate', 'Daily Work Management'
    ]);
  });

  it('should have correct router links', () => {
    expect(component.menuItems[0].routerLink).toBe('/dashboard');
    expect(component.menuItems[1].routerLink).toBe('/employee');
    expect(component.menuItems[2].routerLink).toBe('/salary');
    expect(component.menuItems[4].routerLink).toBe('/daily-work-management');
  });

  it('should load branches from service', () => {
    expect(component.branches.length).toBe(2);
    expect(component.branches[0].name).toBe('Unit 1');
  });

  it('should load selected branch', () => {
    expect(component.selectedBranch).toBeTruthy();
    expect(component.selectedBranch.id).toBe(1);
  });

  describe('onBranchChange', () => {
    it('should update selected branch when value is provided', () => {
      const newBranch = mockBranches[1];
      component.onBranchChange({ value: newBranch });
      expect(branchService.setSelectedBranch).toHaveBeenCalledWith(newBranch);
    });

    it('should not update when value is null', () => {
      component.onBranchChange({ value: null });
      expect(branchService.setSelectedBranch).not.toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('should emit menuClose event', () => {
      spyOn(component.menuClose, 'emit');
      component.close();
      expect(component.menuClose.emit).toHaveBeenCalled();
    });
  });

  describe('menuOpen input', () => {
    it('should default to false', () => {
      expect(component.menuOpen).toBeFalse();
    });

    it('should accept true', () => {
      component.menuOpen = true;
      expect(component.menuOpen).toBeTrue();
    });
  });
});
