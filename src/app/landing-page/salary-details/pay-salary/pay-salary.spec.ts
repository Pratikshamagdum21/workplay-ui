import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaySalary } from './pay-salary';

describe('PaySalary', () => {
  let component: PaySalary;
  let fixture: ComponentFixture<PaySalary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaySalary]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaySalary);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
