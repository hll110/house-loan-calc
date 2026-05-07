import { createRouter, publicQuery } from "./middleware";
import { z } from "zod";
import {
  calculateEqualInterest,
  calculateEqualPrincipal,
  calculateComboLoan,
  calculatePrepayment,
  compareMethods,
  cityPrices,
  searchCities,
  getCitiesByTier,
  type CityPrice,
} from "../contracts/loan";

export const appRouter = createRouter({
  // 健康检查
  ping: publicQuery.query(() => ({ ok: true, timestamp: Date.now() })),

  // ========== 城市房价相关 ==========
  housingPrice: createRouter({
    list: publicQuery.query((): CityPrice[] => cityPrices),

    byTier: publicQuery
      .input(z.object({ tier: z.number().min(1).max(3) }))
      .query(({ input }): CityPrice[] => getCitiesByTier(input.tier)),

    search: publicQuery
      .input(z.object({ keyword: z.string() }))
      .query(({ input }): CityPrice[] => searchCities(input.keyword)),
  }),

  // ========== 房贷计算相关 ==========
  mortgageCalc: createRouter({
    // 等额本息
    equalInterest: publicQuery
      .input(
        z.object({
          principal: z.number().positive(),
          months: z.number().int().min(1).max(360),
          rate: z.number().positive(),
        })
      )
      .query(({ input }) =>
        calculateEqualInterest(input.principal, input.months, input.rate)
      ),

    // 等额本金
    equalPrincipal: publicQuery
      .input(
        z.object({
          principal: z.number().positive(),
          months: z.number().int().min(1).max(360),
          rate: z.number().positive(),
        })
      )
      .query(({ input }) =>
        calculateEqualPrincipal(input.principal, input.months, input.rate)
      ),

    // 组合贷款
    combo: publicQuery
      .input(
        z.object({
          commercial: z.number().positive(),
          fund: z.number().positive(),
          months: z.number().int().min(1).max(360),
          commercialRate: z.number().positive(),
          fundRate: z.number().positive(),
          method: z.enum(["equalInterest", "equalPrincipal"]),
        })
      )
      .query(({ input }) =>
        calculateComboLoan(
          input.commercial,
          input.fund,
          input.months,
          input.commercialRate,
          input.fundRate,
          input.method
        )
      ),

    // 提前还款
    prepay: publicQuery
      .input(
        z.object({
          principal: z.number().positive(),
          months: z.number().int().min(1).max(360),
          rate: z.number().positive(),
          prepayMonth: z.number().int().min(1),
          prepayAmount: z.number().positive(),
          strategy: z.enum(["reduceTerm", "reducePayment"]),
          method: z.enum(["equalInterest", "equalPrincipal"]),
        })
      )
      .query(({ input }) =>
        calculatePrepayment(
          input.principal,
          input.months,
          input.rate,
          input.prepayMonth,
          input.prepayAmount,
          input.strategy,
          input.method
        )
      ),

    // 还款方式对比 + 最优推荐
    compare: publicQuery
      .input(
        z.object({
          principal: z.number().positive(),
          months: z.number().int().min(1).max(360),
          rate: z.number().positive(),
          isFirstHome: z.boolean().default(false),
          annualIncome: z.number().default(0),
        })
      )
      .query(({ input }) =>
        compareMethods(
          input.principal,
          input.months,
          input.rate,
          input.isFirstHome,
          input.annualIncome
        )
      ),
  }),
});

export type AppRouter = typeof appRouter;
