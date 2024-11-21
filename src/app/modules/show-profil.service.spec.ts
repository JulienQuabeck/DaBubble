import { TestBed } from '@angular/core/testing';

import { ShowProfilService } from './show-profil.service';

describe('ShowProfilService', () => {
  let service: ShowProfilService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShowProfilService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
