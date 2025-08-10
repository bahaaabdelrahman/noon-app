import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

export interface Category {
  _id?: string;
  name: string;
  slug?: string;
  description?: string;
  children?: Category[];
  subcategories?: Category[];
  image?: CategoryImage;
  isActive: boolean;
}

interface ApiResponse {
  success: boolean;
  count: number;
  data: Category[];
  message: string;
}

export interface CategoryImage {
  url: string;
  publicId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private baseUrl = 'http://localhost:3000/api/v1/categories';

  constructor(private http: HttpClient) {}


  getAll(): Observable<Category[]> {
    return this.http.get<Category[]>(this.baseUrl);
  }


    getHierarchy(): Observable<Category[]> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/hierarchy`).pipe(
      tap(response => console.log('Raw API Response:', response)),
      map(response => response.data),
      tap(categories => console.log('Transformed Categories Array:', categories)),
      catchError(error => {
        console.error('Error fetching categories:', error);
        return of([]);
      })
    );
  }


  getTopLevel(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/level/1`);
  }


  getById(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.baseUrl}/${id}`);
  }


  create(category: Category): Observable<Category> {
    return this.http.post<Category>(this.baseUrl, category);
  }

  update(id: string, category: Category): Observable<Category> {
    return this.http.put<Category>(`${this.baseUrl}/${id}`, category);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  uploadImage(id: string, imageFile: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', imageFile);
    return this.http.post(`${this.baseUrl}/${id}/image`, formData);
  }

  deleteImage(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/image`);
  }

  bulkUpdate(categoryIds: string[], updates: Partial<Category>): Observable<any> {
    return this.http.patch(`${this.baseUrl}/bulk-update`, {
      categoryIds,
      updates
    });
  }
}
