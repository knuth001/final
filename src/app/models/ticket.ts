import { PassengerInfo } from './passenger';
import { PassengerDetail } from './passenger-detail';
import { TrainRoute } from './train-route';

export interface Ticket {
  code: string;
  route: TrainRoute;
  passenger: PassengerInfo;
  passengers: PassengerDetail[];
  date: string;
  purchaseDate: string;
  total: number;
  status: 'active' | 'cancelled';
  confirmed?: boolean;
  apiId?: string;
}
