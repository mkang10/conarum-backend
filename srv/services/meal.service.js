const cds = require("@sap/cds");

exports.createMeal = async (data) => {
  const db = await cds.connect();
  const { Meals } = db.entities;

  // Thêm bản ghi
  const created = await INSERT.into(Meals).entries(data);

  // Lấy lại bản ghi vừa tạo
  const meal = await SELECT.one.from(Meals).where({ ID: created.ID });
  return meal;
};
