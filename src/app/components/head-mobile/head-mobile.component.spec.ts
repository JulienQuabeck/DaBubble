import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeadMobileComponent } from './head-mobile.component';

describe('HeadMobileComponent', () => {
  let component: HeadMobileComponent;
  let fixture: ComponentFixture<HeadMobileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeadMobileComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HeadMobileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
