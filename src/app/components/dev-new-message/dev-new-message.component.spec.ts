import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DevNewMessageComponent } from './dev-new-message.component';

describe('DevNewMessageComponent', () => {
  let component: DevNewMessageComponent;
  let fixture: ComponentFixture<DevNewMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DevNewMessageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DevNewMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
