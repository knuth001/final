import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiDeparture, ApiSeat, ApiTicket, ApiTrain, ApiVagon, RegisterTicketConfig } from '../models/api';
import { PassengerInfo } from '../models/passenger';
import { PassengerDetail } from '../models/passenger-detail';
import { Ticket } from '../models/ticket';
import { TrainRoute, SeatOption } from '../models/train-route';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private readonly apiBase = 'https://railway.stepprojects.ge';

  public readonly cities = ['თბილისი', 'ბათუმი', 'ქუთაისი', 'ბორჯომი', 'რუსთავი'];

  public search = {
    origin: 'თბილისი',
    destination: 'ბათუმი',
    date: this.formatDate(new Date()),
    passengerCount: 1,
  };

  public searchResults: ApiDeparture[] = [];
  public selectedDeparture: ApiDeparture | null = null;
  public selectedTrain: ApiTrain | null = null;
  public selectedRoute: TrainRoute | null = null;
  public availableSeats: SeatOption[] = [];

  public passengerInfo: PassengerInfo = {
    email: '',
    phone: '',
    passengerCount: 1,
  };

  public passengerDetails: PassengerDetail[] = [];
  public lastTicket: Ticket | null = null;

  constructor(private readonly http: HttpClient) {
    this.buildPassengerDetails(this.search.passengerCount);
  }

  public searchDepartures(): Observable<ApiDeparture[]> {
    const params = {
      from: this.search.origin,
      to: this.search.destination,
      date: this.search.date,
    };

    return this.http.get<ApiDeparture[]>(`${this.apiBase}/api/getdeparture`, { params }).pipe(
      map((departures) => {
        this.searchResults = departures || [];
        this.selectedDeparture = null;
        this.selectedTrain = null;
        this.selectedRoute = null;
        this.availableSeats = [];
        return this.searchResults;
      })
    );
  }

  public searchRoutes(): Array<{ departure: ApiDeparture; train: ApiTrain; route: TrainRoute }> {
    if (!this.search.origin || !this.search.destination || this.search.origin === this.search.destination) {
      return [];
    }

    return this.searchResults.flatMap((departure) =>
      (departure.trains || []).map((train) => ({
        departure,
        train,
        route: this.mapToTrainRoute(departure, train),
      }))
    );
  }

  public selectRoute(departure: ApiDeparture, train: ApiTrain): Observable<SeatOption[]> {
    this.selectedDeparture = departure;
    this.selectedTrain = train;
    this.selectedRoute = this.mapToTrainRoute(departure, train);
    this.passengerDetails = [];
    this.buildPassengerDetails(this.search.passengerCount);
    return this.loadSeatOptions(train).pipe(
      map((seatOptions) => {
        this.availableSeats = seatOptions;
        if (this.selectedRoute) {
          this.selectedRoute.seats = seatOptions;
        }
        return seatOptions;
      })
    );
  }

  public updatePassengerCount(value: number): void {
    this.search.passengerCount = value;
    this.buildPassengerDetails(value);
  }

  public savePassengerInfo(info: Partial<PassengerInfo>): void {
    this.passengerInfo = {
      ...this.passengerInfo,
      ...info,
    };
  }

  public assignSeat(index: number, seat: SeatOption): void {
    if (!this.passengerDetails[index]) {
      return;
    }

    const current = this.passengerDetails[index];
    if (current.seatId) {
      this.setSeatAvailability(current.seatId, true);
    }

    current.seatId = seat.seatId;
    current.coach = seat.coach;
    current.seat = seat.seat;
    current.price = seat.price;
    this.setSeatAvailability(seat.seatId, false);
  }

  public get totalAmount(): number {
    return this.passengerDetails.reduce((sum, passenger) => sum + (passenger.price || 0), 0);
  }

  public get canRegisterTicket(): boolean {
    const contactOk = !!this.passengerInfo.email && !!this.passengerInfo.phone;
    const passengersOk =
      this.passengerDetails.length === this.search.passengerCount &&
      this.passengerDetails.every(
        (passenger) =>
          passenger.firstName &&
          passenger.lastName &&
          passenger.personalId &&
          passenger.seatId &&
          passenger.coach &&
          passenger.seat
      );

    return contactOk && passengersOk && !!this.selectedRoute;
  }

  public registerTicket(): Observable<Ticket> {
    if (!this.selectedRoute) {
      throw new Error('No selected train route');
    }

    const payload: RegisterTicketConfig = {
      trainId: this.selectedRoute.id,
      date: this.search.date,
      email: this.passengerInfo.email,
      phoneNumber: this.passengerInfo.phone,
      people: this.passengerDetails.map((passenger) => ({
        seatId: passenger.seatId!,
        name: passenger.firstName,
        surname: passenger.lastName,
        idNumber: passenger.personalId,
        status: 'active',
        payoutCompleted: true,
      })),
    };

    return this.http.post<ApiTicket>(`${this.apiBase}/api/tickets/register`, payload).pipe(
      map((apiTicket) => {
        const ticket: Ticket = {
          code: apiTicket.id,
          apiId: apiTicket.id,
          confirmed: apiTicket.confirmed,
          route: this.selectedRoute!,
          passenger: { ...this.passengerInfo, passengerCount: this.search.passengerCount },
          passengers: this.passengerDetails.map((item) => ({ ...item })),
          date: apiTicket.date || this.search.date,
          purchaseDate: new Date().toLocaleString('ka-GE'),
          total: apiTicket.ticketPrice ?? this.totalAmount,
          status: apiTicket.confirmed ? 'active' : 'cancelled',
        };

        this.lastTicket = ticket;
        return ticket;
      })
    );
  }

  public checkTicketStatus(ticketId: string): Observable<ApiTicket> {
    return this.http.get<ApiTicket>(`${this.apiBase}/api/tickets/checkstatus/${ticketId}`);
  }

  public cancelTicket(ticketId: string): Observable<ApiTicket> {
    return this.http.delete<ApiTicket>(`${this.apiBase}/api/tickets/cancel/${ticketId}`);
  }

  public downloadTicketPdf(ticket: Ticket): void {
    const lines = [
      'Train Ticket',
      '------------------------------',
      `ბილეთის ID: ${ticket.code}`,
      `ელ.ფოსტა: ${ticket.passenger.email}`,
      `ტელეფონი: ${ticket.passenger.phone}`,
      `რეისი: ${ticket.route.trainNumber}`,
      `მარშრუტი: ${ticket.route.origin} → ${ticket.route.destination}`,
      `თარიღი: ${ticket.date}`,
      `გამგზავრება: ${ticket.route.departure}`,
      `მოსვლა: ${ticket.route.arrival}`,
      `ჯამი: ${ticket.total} ლარი`,
    ];

    ticket.passengers.forEach((passenger, index) => {
      lines.push(
        `მგზავრი ${index + 1}: ${passenger.lastName} ${passenger.firstName} / ${passenger.personalId} / ${passenger.coach}-${passenger.seat}`
      );
    });

    const content = lines.map(this.escapeText).join('\n');
    const blob = this.buildMinimalPdf(content);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ticket-${ticket.code}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private mapToTrainRoute(departure: ApiDeparture, train: ApiTrain): TrainRoute {
    return {
      id: train.id,
      trainNumber: `IR ${train.number ?? train.id}`,
      origin: departure.source || train.from || '',
      destination: departure.destination || train.to || '',
      departure: train.departure || '',
      arrival: train.arrive || '',
      duration: '',
      price: 0,
      seats: this.mapSeatOptions(train.vagons || []),
    };
  }

  private loadSeatOptions(train: ApiTrain): Observable<SeatOption[]> {
    const seatOptions = this.mapSeatOptions(train.vagons || []);
    if (seatOptions.length > 0) {
      return of(seatOptions);
    }

    return this.http.get<ApiVagon[]>(`${this.apiBase}/api/vagons`).pipe(
      map((vagons) => this.mapSeatOptions((vagons || []).filter((vagon) => vagon.trainId === train.id)))
    );
  }

  private mapSeatOptions(vagons: ApiVagon[]): SeatOption[] {
    return vagons.flatMap((vagon) =>
      (vagon.seats || []).map((seat) => ({
        coach: vagon.name || `ვაგონი ${vagon.id}`,
        seat: seat.number || seat.seatId,
        available: !seat.isOccupied,
        seatId: seat.seatId,
        price: seat.price,
      }))
    );
  }

  private buildPassengerDetails(count: number): void {
    const sanitized = Math.max(1, Math.min(6, count));
    const existing = this.passengerDetails.slice(0, sanitized);

    for (let i = existing.length; i < sanitized; i += 1) {
      existing.push({
        firstName: '',
        lastName: '',
        personalId: '',
      });
    }

    if (existing.length < this.passengerDetails.length) {
      const removed = this.passengerDetails.slice(existing.length);
      removed.forEach((passenger) => {
        if (passenger.seatId) {
          this.setSeatAvailability(passenger.seatId, true);
        }
      });
    }

    this.passengerDetails = existing;
  }

  private setSeatAvailability(seatId: string, available: boolean): void {
    const seatItem = this.availableSeats.find((seat) => seat.seatId === seatId);
    if (seatItem) {
      seatItem.available = available;
    }

    if (this.selectedRoute) {
      const routeSeat = this.selectedRoute.seats.find((seat) => seat.seatId === seatId);
      if (routeSeat) {
        routeSeat.available = available;
      }
    }
  }

  private generateTicketCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  private formatDate(date: Date): string {
    return date.toISOString().substring(0, 10);
  }

  private escapeText(text: string): string {
    return text.replace(/([\\()])/g, '\\$1');
  }

  private buildMinimalPdf(text: string): Blob {
    const lines = text.split('\n');
    const bodyLines = [
      'BT',
      '/F1 14 Tf',
      '50 760 Td',
      ...lines.flatMap((line, index) => [
        `(${line}) Tj`,
        index < lines.length - 1 ? '0 -20 Td' : '',
      ]),
      'ET',
    ].filter(Boolean);
    const body = bodyLines.join('\n');

    const objects = [
      `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`,
      `2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n`,
      `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n`,
      `4 0 obj\n<< /Length ${body.length} >>\nstream\n${body}\nendstream\nendobj\n`,
      `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`,
    ];

    let offset = 0;
    const offsets = objects.map((obj) => {
      const current = offset;
      offset += new TextEncoder().encode(obj).length;
      return current;
    });

    const xrefLines = ['xref', `0 ${objects.length + 1}`, '0000000000 65535 f '];
    offsets.forEach((objOffset) => {
      xrefLines.push(`${objOffset.toString().padStart(10, '0')} 00000 n `);
    });

    const startXref = offset;
    const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

    const pdf = ['%PDF-1.3\n', ...objects, xrefLines.join('\n') + '\n', trailer].join('');
    return new Blob([pdf], { type: 'application/pdf' });
  }
}
