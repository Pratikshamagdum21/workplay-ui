import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { loadingInterceptor } from './loading.interceptor';
import { LoaderService } from '../../../shared/loader/loader.service';

describe('loadingInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let loaderService: LoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loadingInterceptor])),
        provideHttpClientTesting(),
        LoaderService
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    loaderService = TestBed.inject(LoaderService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should show loader when request starts', () => {
    let loading = false;
    loaderService.isLoading$.subscribe(v => loading = v);

    httpClient.get('/test').subscribe();
    expect(loading).toBeTrue();

    httpMock.expectOne('/test').flush({});
  });

  it('should hide loader when request completes', () => {
    let loading = false;
    loaderService.isLoading$.subscribe(v => loading = v);

    httpClient.get('/test').subscribe();
    httpMock.expectOne('/test').flush({});

    expect(loading).toBeFalse();
  });

  it('should hide loader when request errors', () => {
    let loading = false;
    loaderService.isLoading$.subscribe(v => loading = v);

    httpClient.get('/test').subscribe({ error: () => {} });
    httpMock.expectOne('/test').error(new ProgressEvent('error'));

    expect(loading).toBeFalse();
  });

  it('should handle concurrent requests with reference counting', () => {
    let loading = false;
    loaderService.isLoading$.subscribe(v => loading = v);

    httpClient.get('/test1').subscribe();
    httpClient.get('/test2').subscribe();

    expect(loading).toBeTrue();

    httpMock.expectOne('/test1').flush({});
    expect(loading).toBeTrue(); // Still loading (test2 pending)

    httpMock.expectOne('/test2').flush({});
    expect(loading).toBeFalse(); // Now done
  });
});
