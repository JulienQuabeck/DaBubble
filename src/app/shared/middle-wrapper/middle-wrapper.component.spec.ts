import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiddleWrapperComponent } from './middle-wrapper.component';

describe('MiddleWrapperComponent', () => {
  let component: MiddleWrapperComponent;
  let fixture: ComponentFixture<MiddleWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiddleWrapperComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MiddleWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
