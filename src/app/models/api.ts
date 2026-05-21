export interface ApiSeat {
  seatId: string;
  number?: string;
  price: number;
  isOccupied: boolean;
  vagonId: number;
}

export interface ApiVagon {
  id: number;
  trainId: number;
  trainNumber?: number;
  name?: string;
  seats?: ApiSeat[];
}

export interface ApiTrain {
  id: number;
  number?: number;
  name?: string;
  from?: string;
  to?: string;
  departure?: string;
  arrive?: string;
  date?: string;
  departureId?: number;
  vagons?: ApiVagon[];
}

export interface ApiPerson {
  id?: number;
  ticketId?: string;
  seat?: ApiSeat;
  name?: string;
  surname?: string;
  idNumber?: string;
  status?: string;
  payoutCompleted?: boolean;
}

export interface ApiPersonDto {
  seatId: string;
  name?: string;
  surname?: string;
  idNumber?: string;
  status?: string;
  payoutCompleted?: boolean;
}

export interface ApiDeparture {
  id?: number;
  source?: string;
  destination?: string;
  date?: string;
  trains?: ApiTrain[];
}

export interface ApiTicket {
  id: string;
  phone?: string;
  email?: string;
  date?: string;
  ticketPrice?: number;
  trainID?: number;
  confirmed?: boolean;
  train?: ApiTrain;
  persons?: ApiPerson[];
}

export interface RegisterTicketConfig {
  trainId: number;
  date: string;
  email?: string;
  phoneNumber?: string;
  people?: ApiPersonDto[];
}
