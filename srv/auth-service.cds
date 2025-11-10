using { company.meal as mymodel } from '../db/schema';

@path: '/AUTH_SRV'
service AuthService {

 
  entity Users as projection on mymodel.Users;

  action login(Email: String, Password: String) returns {
    token      : String;
    role       : String;
    name       : String;
    department : String;
  };



  action register(Name: String,
                        Email: String,
                        Password: String,
                        Role: String,
                        Department: String) returns {
    message    : String;
    token      : String;
    role       : String;
    name       : String;
    department : String;
  };
}
