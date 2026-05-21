import { Routes } from '@angular/router';
import { SearchPageComponent } from './components/search-page/search-page.component';
import { TrainSelectionPageComponent } from './components/train-selection-page/train-selection-page.component';
import { PassengerInfoPageComponent } from './components/passenger-info-page/passenger-info-page.component';
import { PaymentPageComponent } from './components/payment-page/payment-page.component';
import { TicketStatusPageComponent } from './components/ticket-status-page/ticket-status-page.component';

export const routes: Routes = [
  { path: '', redirectTo: 'search', pathMatch: 'full' },
  { path: 'search', component: SearchPageComponent },
  { path: 'selection', component: TrainSelectionPageComponent },
  { path: 'passenger', component: PassengerInfoPageComponent },
  { path: 'payment', component: PaymentPageComponent },
  { path: 'status', component: TicketStatusPageComponent },
  { path: '**', redirectTo: 'search' },
];
