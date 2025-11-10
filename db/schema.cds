namespace company.meal;

using {
  cuid,
  managed
} from '@sap/cds/common';

entity Vendors : cuid, managed {
  Name          : String(100);
  Contact       : String(100);
  Phone         : String(20);
  Address       : String(255);
  createdByUser : Association to Users
                    on createdByUser.ID = createdBy;
}

entity Meals : cuid, managed {
  Name          : String(100);
  Description   : String(255);
  Price         : Decimal(10, 2);
  ImageUrl      : String(255);
  VendorName    : String(100); 
  VendorPhone   : String(20);
  VendorAddr    : String(255);
  createdByUser : Association to Users
                    on createdByUser.ID = createdBy;
}

entity Menus : cuid, managed {
  Date        : Date;
  Status      : Integer enum {
    Active = 0;
    Closed = 1;
    Archived = 2;
  } default 0;
  TotalOrders : Integer default 0;

  meals       : Composition of many MenuMeals
                  on meals.Menu = $self;

  createdByUser : Association to Users
                    on createdByUser.ID = createdBy;
}

entity MenuMeals : cuid, managed {
  Menu          : Association to Menus;
  Meal          : Association to Meals;
  Count         : Integer default 0; // 🔹 số người chọn (Count cột trong Excel)
  IsAvailable   : Boolean default true;
  createdByUser : Association to Users
                    on createdByUser.ID = createdBy;
}

entity Users : cuid, managed {
  Name          : String(100);
  Email         : String(100);
  Password      : String(255);
  Role          : Integer enum {
    Employee = 0;
    Admin = 1;
  } default 0; 
  Department    : String(100);
  createdByUser : Association to Users
                    on createdByUser.ID = createdBy;
}

entity Orders : cuid, managed {
  User          : Association to Users;
  Menu          : Association to Menus;
  SelectedMeal  : Association to Meals; // 🔹 nhân viên chỉ chọn 1 món từ menu hôm đó
  Quantity      : Integer default 1;
  Price         : Decimal(10, 2);
  Total         : Decimal(10, 2);
  createdByUser : Association to Users
                    on createdByUser.ID = createdBy;
}
