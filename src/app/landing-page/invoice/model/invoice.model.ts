export interface Invoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;

  customerName: string;
  customerAddress: string;
  customerContact: string;
  customerGstin: string;
  customerState: string;

  qualityName: string;
  width: string;
  fani: string;
  peak: string;
  warp: string;
  weft: string;

  rolls: number;
  meters: number;
  rate: number;

  totalAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  netPayable: number;

  amountInWords: string;

  createdAt?: string;
}

export interface Customer {
  id: number;
  name: string;
  address: string;
  contactNumber: string;
  gstin: string;
  state: string;
}

export interface FabricQuality {
  id: number;
  name: string;
  width: string;
  fani: string;
  peak: string;
  warp: string;
  weft: string;
}

export interface BusinessInfo {
  id: number;
  businessName: string;
  ownerName: string;
  address: string;
  gstin: string;
  state: string;
  phoneNumber: string;
  logoUrl?: string;
}
