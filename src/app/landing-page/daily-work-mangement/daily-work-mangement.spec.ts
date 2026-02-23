import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyWorkMangement } from './daily-work-mangement';

describe('DailyWorkMangement', () => {
  let component: DailyWorkMangement;
  let fixture: ComponentFixture<DailyWorkMangement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyWorkMangement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyWorkMangement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
