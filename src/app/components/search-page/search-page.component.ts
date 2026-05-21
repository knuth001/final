import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../services/booking.service';

@Component({
  standalone: true,
  selector: 'search-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.css'],
})
export class SearchPageComponent {
  public get cities() {
    return this.bookingService.cities;
  }

  constructor(
    private readonly bookingService: BookingService,
    private readonly router: Router
  ) {}

  public get search() {
    return this.bookingService.search;
  }

  public searchTrains(): void {
    if (
      !this.search.origin ||
      !this.search.destination ||
      this.search.origin === this.search.destination ||
      !this.search.date
    ) {
      return;
    }

    this.bookingService.searchDepartures().subscribe(() => {
      this.router.navigate(['/selection']);
    });
  }
}
