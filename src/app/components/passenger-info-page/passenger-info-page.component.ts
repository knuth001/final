import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BookingService } from '../../services/booking.service';
import { SeatOption } from '../../models/train-route';

@Component({
  standalone: true,
  selector: 'passenger-info-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './passenger-info-page.component.html',
  styleUrls: ['./passenger-info-page.component.css'],
})
export class PassengerInfoPageComponent {
  public seatModalOpen = false;
  public activePassengerIndex = 0;

  constructor(public bookingService: BookingService, private router: Router) {}

  public openSeatModal(index: number): void {
    this.activePassengerIndex = index;
    this.seatModalOpen = true;
  }

  public closeSeatModal(): void {
    this.seatModalOpen = false;
  }

  public chooseSeat(seat: SeatOption): void {
    this.bookingService.assignSeat(this.activePassengerIndex, seat);
    this.seatModalOpen = false;
  }

  public updateCount(value: number): void {
    this.bookingService.updatePassengerCount(value);
  }

  public get canRegister(): boolean {
    return this.bookingService.canRegisterTicket;
  }

  public submit(): void {
    if (!this.canRegister) {
      return;
    }

    this.bookingService.savePassengerInfo(this.bookingService.passengerInfo);
    this.router.navigate(['/payment']);
  }
}
