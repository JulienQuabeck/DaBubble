import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RightWrapperComponent } from './right-wrapper.component';

describe('RightWrapperComponent', () => {
  let component: RightWrapperComponent;
  let fixture: ComponentFixture<RightWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RightWrapperComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RightWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
