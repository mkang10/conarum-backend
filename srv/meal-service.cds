using { company.meal as mymodel } from '../db/schema';

@path : '/MEAL_SRV'
service MealService {
  @restrict: [
    { grant: ['READ'],   to: ['admin', 'vendor', 'e mployee'] },
    { grant: ['CREATE', 'UPDATE', 'DELETE', 'PATCH'], to: ['admin', 'vendor'] }
  ]
  entity Meals as projection on mymodel.Meals;

 @restrict: [
    { grant: ['READ'],   to: ['admin', 'vendor', 'employee'] },
    { grant: ['CREATE', 'UPDATE', 'DELETE', 'PATCH'], to: ['admin', 'vendor'] }
  ]
   entity Menus as projection on mymodel.Menus
    order by Date asc;

   @restrict: [
    { grant: ['READ'],   to: ['admin', 'vendor', 'employee'] },
    { grant: ['CREATE', 'UPDATE', 'DELETE', 'PATCH'], to: ['admin', 'vendor'] }
  ]
  entity MenuMeals as projection on mymodel.MenuMeals;

  @restrict: [
    { grant: ['CREATE'], to: ['admin'] } 
  ]
  action AssignMealToMenu(MenuID: UUID, MealID: UUID) returns MenuMeals;

  @restrict: [
    { grant: ['READ'], to: ['admin','vendor','employee'] }
  ]
  action GetTodayMenu() returns Menus;

action BulkUpdateMenus(updates: many Menus) returns {
  success: Boolean;
  count: Integer;
};

action BulkUpdateMeals(updates: many Meals) returns {
  success: Boolean;
  count: Integer;
};

action createMenuWithMeals(
        Date : Date,
        Status : Integer,
        TotalOrders : Integer,
        meals : array of {
            Meal : Association to Meals
            IsAvailable : Boolean
        }
    ) returns Menus;

}

