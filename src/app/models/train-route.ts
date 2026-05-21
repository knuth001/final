export interface SeatOption {
  coach: string;
  seat: string;
  available: boolean;
  seatId: string;
  price: number;
}

export interface TrainRoute {
  id: number;
  trainNumber: string;
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  duration: string;
  price: number;
  seats: SeatOption[];
}
