import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiTicket } from '../../models/api';
import { BookingService } from '../../services/booking.service';

@Component({
  standalone: true,
  selector: 'ticket-status-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './ticket-status-page.component.html',
  styleUrls: ['./ticket-status-page.component.css'],
})
export class TicketStatusPageComponent {
  public ticketCode = '';
  public ticketFound = false;
  public ticketError = false;
  public currentTicket: ApiTicket | null = null;
  public loading = false;

  constructor(public bookingService: BookingService) {}

  public searchTicket(): void {
    if (!this.ticketCode.trim()) {
      this.ticketError = true;
      return;
    }

    this.ticketError = false;
    this.loading = true;
    this.bookingService.checkTicketStatus(this.ticketCode.trim()).subscribe({
      next: (ticket) => {
        this.currentTicket = ticket;
        this.ticketFound = true;
        this.loading = false;
      },
      error: () => {
        this.ticketFound = false;
        this.ticketError = true;
        this.loading = false;
      },
    });
  }

  public cancel(): void {
    if (!this.currentTicket?.id) {
      return;
    }

    this.loading = true;
    this.bookingService.cancelTicket(this.currentTicket.id).subscribe({
      next: (ticket) => {
        this.currentTicket = ticket;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
