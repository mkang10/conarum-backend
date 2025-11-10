using { company.meal as mymodel } from '../db/schema';

@path : '/VENDOR_SRV'
service VendorService {
  entity Vendors as projection on mymodel.Vendors;
}
