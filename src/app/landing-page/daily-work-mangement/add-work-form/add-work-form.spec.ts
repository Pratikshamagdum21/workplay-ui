import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddWorkForm } from './add-work-form';

describe('AddWorkForm', () => {
  let component: AddWorkForm;
  let fixture: ComponentFixture<AddWorkForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddWorkForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddWorkForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
