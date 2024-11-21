import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfilMemberDialogComponent } from './profil-member-dialog.component';

describe('ProfilMemberDialogComponent', () => {
  let component: ProfilMemberDialogComponent;
  let fixture: ComponentFixture<ProfilMemberDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfilMemberDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProfilMemberDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
