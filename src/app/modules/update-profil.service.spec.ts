import { TestBed } from '@angular/core/testing';

import { UpdateProfilService } from './update-profil.service';

describe('UpdateProfilService', () => {
  let service: UpdateProfilService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UpdateProfilService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
