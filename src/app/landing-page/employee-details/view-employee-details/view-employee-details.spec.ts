import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewEmployeeDetails } from './view-employee-details';

describe('ViewEmployeeDetails', () => {
  let component: ViewEmployeeDetails;
  let fixture: ComponentFixture<ViewEmployeeDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewEmployeeDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewEmployeeDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
