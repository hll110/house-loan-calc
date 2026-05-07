import {
  mysqlTable,
  serial,
  varchar,
  decimal,
  timestamp,
  int,
} from "drizzle-orm/mysql-core";

// 城市房价数据表
export const cityPrices = mysqlTable("city_prices", {
  id: serial("id").primaryKey(),
  cityName: varchar("city_name", { length: 50 }).notNull(),
  province: varchar("province", { length: 50 }).notNull(),
  newHousePrice: decimal("new_house_price", { precision: 10, scale: 2 }).notNull(), // 新房均价 元/平方米
  secondHandPrice: decimal("second_hand_price", { precision: 10, scale: 2 }).notNull(), // 二手房均价 元/平方米
  priceMedian: decimal("price_median", { precision: 10, scale: 2 }), // 价格中位数
  monthChange: decimal("month_change", { precision: 5, scale: 2 }), // 环比涨跌%
  yearChange: decimal("year_change", { precision: 5, scale: 2 }), // 同比涨跌%
  tier: int("tier").notNull(), // 城市等级 1=一线 2=二线 3=三线
  dataMonth: varchar("data_month", { length: 10 }).notNull(), // 数据月份 如 2025-04
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CityPrice = typeof cityPrices.$inferSelect;
export type InsertCityPrice = typeof cityPrices.$inferInsert;
