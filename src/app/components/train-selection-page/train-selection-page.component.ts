import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BookingService } from '../../services/booking.service';

@Component({
  standalone: true,
  selector: 'train-selection-page',
  imports: [CommonModule],
  templateUrl: './train-selection-page.component.html',
  styleUrls: ['./train-selection-page.component.css'],
})
export class TrainSelectionPageComponent {
  public loading = false;

  constructor(public bookingService: BookingService, private router: Router) {}

  public get routes() {
    return this.bookingService.searchRoutes();
  }

  public bookRoute(route: { departure: any; train: any; route: any }): void {
    this.loading = true;
    this.bookingService.selectRoute(route.departure, route.train).subscribe(() => {
      this.loading = false;
      this.router.navigate(['/passenger']);
    });
  }
}
