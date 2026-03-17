import { TestBed } from '@angular/core/testing';
import { LoaderService } from './loader.service';

describe('LoaderService', () => {
  let service: LoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initially not be loading', () => {
    let loading = true;
    service.isLoading$.subscribe(v => loading = v);
    expect(loading).toBeFalse();
  });

  it('should set loading to true when show() is called', () => {
    service.show();
    let loading = false;
    service.isLoading$.subscribe(v => loading = v);
    expect(loading).toBeTrue();
  });

  it('should set loading to false when hide() is called after show()', () => {
    service.show();
    service.hide();
    let loading = true;
    service.isLoading$.subscribe(v => loading = v);
    expect(loading).toBeFalse();
  });

  it('should support reference counting - stay loading with multiple show() calls', () => {
    service.show();
    service.show();
    service.hide();

    let loading = false;
    service.isLoading$.subscribe(v => loading = v);
    expect(loading).toBeTrue();
  });

  it('should stop loading only after all requests complete', () => {
    service.show();
    service.show();
    service.show();
    service.hide();
    service.hide();
    service.hide();

    let loading = true;
    service.isLoading$.subscribe(v => loading = v);
    expect(loading).toBeFalse();
  });

  it('should not go below zero active requests', () => {
    service.hide();
    service.hide();

    let loading = true;
    service.isLoading$.subscribe(v => loading = v);
    expect(loading).toBeFalse();

    // Should still work correctly after extra hides
    service.show();
    service.isLoading$.subscribe(v => loading = v);
    expect(loading).toBeTrue();

    service.hide();
    service.isLoading$.subscribe(v => loading = v);
    expect(loading).toBeFalse();
  });
});
