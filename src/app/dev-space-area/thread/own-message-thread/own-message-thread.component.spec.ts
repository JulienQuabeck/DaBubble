import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnMessageThreadComponent } from './own-message-thread.component';

describe('OwnMessageThreadComponent', () => {
  let component: OwnMessageThreadComponent;
  let fixture: ComponentFixture<OwnMessageThreadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnMessageThreadComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OwnMessageThreadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
