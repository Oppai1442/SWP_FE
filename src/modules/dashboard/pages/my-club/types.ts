import type { ClubActivityStatus } from './services/myClubService';

export interface BankInstructionForm {
  bankId: string;
  bankAccountNumber: string;
  bankAccountName: string;
  joinFee: string;
}

export interface ActivityFormState {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  budget: string;
  status: ClubActivityStatus;
}
