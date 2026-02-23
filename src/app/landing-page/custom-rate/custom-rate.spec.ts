import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomRate } from './custom-rate';

describe('CustomRate', () => {
  let component: CustomRate;
  let fixture: ComponentFixture<CustomRate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomRate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomRate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
