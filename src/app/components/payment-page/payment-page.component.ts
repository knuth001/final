import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BookingService } from '../../services/booking.service';

@Component({
  standalone: true,
  selector: 'payment-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-page.component.html',
  styleUrls: ['./payment-page.component.css'],
})
export class PaymentPageComponent {
  public cardNumber = '';
  public cardName = '';
  public expiration = '';
  public cvc = '';
  public paymentConfirmed = false;
  public processing = false;
  public paymentError = false;

  constructor(public bookingService: BookingService, private router: Router) {}

  public get totalPrice(): number {
    return this.bookingService.totalAmount;
  }

  public pay(): void {
    if (!this.cardNumber || !this.cardName || !this.expiration || !this.cvc || !this.bookingService.selectedRoute) {
      return;
    }

    this.processing = true;
    this.bookingService.registerTicket().subscribe({
      next: () => {
        this.processing = false;
        this.paymentConfirmed = true;
      },
      error: () => {
        this.processing = false;
        this.paymentError = true;
      },
    });
  }

  public downloadPdf(): void {
    if (this.bookingService.lastTicket) {
      this.bookingService.downloadTicketPdf(this.bookingService.lastTicket);
    }
  }

  public goToStatus(): void {
    this.router.navigate(['/status']);
  }
}
