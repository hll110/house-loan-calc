// ==================== 房贷计算核心逻辑 ====================

export interface LoanResult {
  monthlyPayment: number;      // 月供（等额本息）
  monthlyPaymentFirst: number;   // 首月月供（等额本金）
  monthlyPaymentLast: number;    // 末月月供（等额本金）
  totalInterest: number;         // 总利息
  totalPayment: number;          // 还款总额
  totalPrincipal: number;        // 贷款本金
  months: number;                // 还款月数
  monthlyBreakdown: MonthlyData[]; // 逐月明细
}

export interface MonthlyData {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remaining: number;
}

export interface ComparisonResult {
  equalInterest: LoanResult;
  equalPrincipal: LoanResult;
  recommendation: 'equalInterest' | 'equalPrincipal';
  recommendationReason: string;
  interestSaved: number;         // 等额本金节省的利息
  taxBenefit: number;            // 首套房的个税抵扣收益
  netBenefit: number;           // 净收益（利息节省 + 个税抵扣）
}

export interface PrepayResult {
  before: LoanResult;
  after: LoanResult;
  interestSaved: number;
  monthsSaved: number;
  newMonthlyPayment: number;
  strategy: 'reduceTerm' | 'reducePayment';
}

export interface ComboResult {
  commercial: LoanResult;
  fund: LoanResult;
  combined: LoanResult;
  totalInterest: number;
  totalPayment: number;
}

// 等额本息计算（months为月数）
export function calculateEqualInterest(
  principalWan: number,
  months: number,
  ratePercent: number
): LoanResult {
  const principal = principalWan * 10000;
  const monthlyRate = ratePercent / 100 / 12;

  const payment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);

  const breakdown: MonthlyData[] = [];
  let remaining = principal;
  let totalInterest = 0;

  for (let i = 1; i <= months; i++) {
    const interest = remaining * monthlyRate;
    const principalPart = payment - interest;
    remaining -= principalPart;
    totalInterest += interest;

    if (remaining < 0.01) remaining = 0;

    breakdown.push({
      month: i,
      payment: round(payment),
      principal: round(principalPart),
      interest: round(interest),
      remaining: round(remaining),
    });
  }

  return {
    monthlyPayment: round(payment),
    monthlyPaymentFirst: round(payment),
    monthlyPaymentLast: round(payment),
    totalInterest: round(totalInterest),
    totalPayment: round(totalInterest + principal),
    totalPrincipal: principal,
    months,
    monthlyBreakdown: breakdown,
  };
}

// 等额本金计算（months为月数）
export function calculateEqualPrincipal(
  principalWan: number,
  months: number,
  ratePercent: number
): LoanResult {
  const principal = principalWan * 10000;
  const monthlyRate = ratePercent / 100 / 12;
  const monthlyPrincipal = principal / months;

  const breakdown: MonthlyData[] = [];
  let remaining = principal;
  let totalInterest = 0;

  for (let i = 1; i <= months; i++) {
    const interest = remaining * monthlyRate;
    const payment = monthlyPrincipal + interest;
    remaining -= monthlyPrincipal;
    totalInterest += interest;

    if (remaining < 0.01) remaining = 0;

    breakdown.push({
      month: i,
      payment: round(payment),
      principal: round(monthlyPrincipal),
      interest: round(interest),
      remaining: round(remaining),
    });
  }

  return {
    monthlyPayment: round((breakdown[0].payment + breakdown[breakdown.length - 1].payment) / 2),
    monthlyPaymentFirst: round(breakdown[0].payment),
    monthlyPaymentLast: round(breakdown[breakdown.length - 1].payment),
    totalInterest: round(totalInterest),
    totalPayment: round(totalInterest + principal),
    totalPrincipal: principal,
    months,
    monthlyBreakdown: breakdown,
  };
}

// 组合贷款计算（months为月数）
export function calculateComboLoan(
  commercialWan: number,
  fundWan: number,
  months: number,
  commercialRate: number,
  fundRate: number,
  method: 'equalInterest' | 'equalPrincipal'
): ComboResult {
  const commercial =
    method === 'equalInterest'
      ? calculateEqualInterest(commercialWan, months, commercialRate)
      : calculateEqualPrincipal(commercialWan, months, commercialRate);

  const fund =
    method === 'equalInterest'
      ? calculateEqualInterest(fundWan, months, fundRate)
      : calculateEqualPrincipal(fundWan, months, fundRate);

  const combinedBreakdown: MonthlyData[] = [];

  for (let i = 0; i < months; i++) {
    combinedBreakdown.push({
      month: i + 1,
      payment: round(commercial.monthlyBreakdown[i].payment + fund.monthlyBreakdown[i].payment),
      principal: round(commercial.monthlyBreakdown[i].principal + fund.monthlyBreakdown[i].principal),
      interest: round(commercial.monthlyBreakdown[i].interest + fund.monthlyBreakdown[i].interest),
      remaining: round(commercial.monthlyBreakdown[i].remaining + fund.monthlyBreakdown[i].remaining),
    });
  }

  const combined: LoanResult = {
    monthlyPayment: round(commercial.monthlyPayment + fund.monthlyPayment),
    monthlyPaymentFirst: round(commercial.monthlyPaymentFirst + fund.monthlyPaymentFirst),
    monthlyPaymentLast: round(commercial.monthlyPaymentLast + fund.monthlyPaymentLast),
    totalInterest: round(commercial.totalInterest + fund.totalInterest),
    totalPayment: round(commercial.totalPayment + fund.totalPayment),
    totalPrincipal: commercial.totalPrincipal + fund.totalPrincipal,
    months,
    monthlyBreakdown: combinedBreakdown,
  };

  return {
    commercial,
    fund,
    combined,
    totalInterest: combined.totalInterest,
    totalPayment: combined.totalPayment,
  };
}

// 提前还款计算（months为月数）
export function calculatePrepayment(
  principalWan: number,
  months: number,
  ratePercent: number,
  prepayMonth: number,
  prepayAmountWan: number,
  strategy: 'reduceTerm' | 'reducePayment',
  method: 'equalInterest' | 'equalPrincipal'
): PrepayResult {
  const before =
    method === 'equalInterest'
      ? calculateEqualInterest(principalWan, months, ratePercent)
      : calculateEqualPrincipal(principalWan, months, ratePercent);

  const prepayAmount = prepayAmountWan * 10000;
  const remainingAtPrepay = before.monthlyBreakdown[prepayMonth - 1].remaining;
  const newPrincipal = remainingAtPrepay - prepayAmount;
  const remainingMonths = months - prepayMonth;

  let after: LoanResult;
  let newMonthlyPayment = 0;
  let monthsSaved = 0;

  if (strategy === 'reducePayment') {
    // 减少月供，期限不变（剩余月数不变）
    after =
      method === 'equalInterest'
        ? calculateEqualInterest(newPrincipal / 10000, remainingMonths, ratePercent)
        : calculateEqualPrincipal(newPrincipal / 10000, remainingMonths, ratePercent);
    newMonthlyPayment = after.monthlyPaymentFirst;

    // 重建完整明细
    const fullBreakdown = [...before.monthlyBreakdown.slice(0, prepayMonth)];
    for (let i = 0; i < after.monthlyBreakdown.length; i++) {
      fullBreakdown.push({
        ...after.monthlyBreakdown[i],
        month: prepayMonth + i + 1,
      });
    }
    after.monthlyBreakdown = fullBreakdown;
    after.months = prepayMonth + after.months;
  } else {
    // 缩短期限，月供尽量保持原水平
    const originalPayment = before.monthlyBreakdown[0].payment;
    const monthlyRate = ratePercent / 100 / 12;

    // 计算新月供接近原月供时的月数
    let monthsNeeded = remainingMonths;
    if (method === 'equalInterest') {
      monthsNeeded = Math.ceil(
        Math.log(originalPayment / (originalPayment - newPrincipal * monthlyRate)) /
          Math.log(1 + monthlyRate)
      );
    }

    after =
      method === 'equalInterest'
        ? calculateEqualInterest(newPrincipal / 10000, monthsNeeded, ratePercent)
        : calculateEqualPrincipal(newPrincipal / 10000, monthsNeeded, ratePercent);

    monthsSaved = remainingMonths - after.months;
    newMonthlyPayment = after.monthlyPaymentFirst;

    const fullBreakdown = [...before.monthlyBreakdown.slice(0, prepayMonth)];
    for (let i = 0; i < after.monthlyBreakdown.length; i++) {
      fullBreakdown.push({
        ...after.monthlyBreakdown[i],
        month: prepayMonth + i + 1,
      });
    }
    after.monthlyBreakdown = fullBreakdown;
    after.months = prepayMonth + after.months;
  }

  const interestSaved = before.totalInterest - after.totalInterest;

  return {
    before,
    after,
    interestSaved: round(interestSaved),
    monthsSaved,
    newMonthlyPayment: round(newMonthlyPayment),
    strategy,
  };
}

// 最优还款方式推荐（months为月数）
export function compareMethods(
  principalWan: number,
  months: number,
  ratePercent: number,
  isFirstHome: boolean,
  annualIncome: number
): ComparisonResult {
  const equalInterest = calculateEqualInterest(principalWan, months, ratePercent);
  const equalPrincipal = calculateEqualPrincipal(principalWan, months, ratePercent);

  const interestSaved = equalInterest.totalInterest - equalPrincipal.totalInterest;

  // 个税抵扣：首套房每月1000元，最长240个月
  let taxBenefit = 0;
  if (isFirstHome) {
    const deductionMonths = Math.min(months, 240);
    const taxRate = getTaxRate(annualIncome);
    taxBenefit = 1000 * deductionMonths * taxRate;
  }

  // 等额本金月供比等额本息高出的部分
  const monthlyDiff = equalPrincipal.monthlyPaymentFirst - equalInterest.monthlyPayment;

  let recommendation: 'equalInterest' | 'equalPrincipal';
  let reason: string;

  if (monthlyDiff > equalInterest.monthlyPayment * 0.15) {
    recommendation = 'equalInterest';
    reason = `等额本金首月月供高出 ${round(monthlyDiff)} 元，还款压力较大，建议选择等额本息。`;
  } else if (interestSaved > 50000) {
    recommendation = 'equalPrincipal';
    reason = `等额本金可节省 ${round(interestSaved)} 元利息，月供压力可控，推荐选择。`;
  } else {
    recommendation = 'equalInterest';
    reason = '两种方式利息差距不大，等额本息月供固定、更易规划。';
  }

  const netBenefit = interestSaved + taxBenefit;

  return {
    equalInterest,
    equalPrincipal,
    recommendation,
    recommendationReason: reason,
    interestSaved: round(interestSaved),
    taxBenefit: round(taxBenefit),
    netBenefit: round(netBenefit),
  };
}

// 根据年收入计算个税税率（简化版）
function getTaxRate(annualIncome: number): number {
  // 扣除6万免征额后的应纳税所得额
  const taxable = Math.max(0, annualIncome - 60000);
  if (taxable <= 0) return 0;
  if (taxable <= 36000) return 0.03;
  if (taxable <= 144000) return 0.10;
  if (taxable <= 300000) return 0.20;
  if (taxable <= 420000) return 0.25;
  if (taxable <= 660000) return 0.30;
  if (taxable <= 960000) return 0.35;
  return 0.45;
}

function round(num: number): number {
  return Math.round(num * 100) / 100;
}

// ==================== 房价数据 ====================

export interface CityPrice {
  cityName: string;
  province: string;
  newPrice: number;    // 新房均价 元/㎡
  oldPrice: number;    // 二手房均价 元/㎡
  change: number;      // 环比涨跌 %
  tier: number;        // 1=一线 2=二线 3=三线
}

export const cityPrices: CityPrice[] = [
  // 一线城市
  { cityName: '北京', province: '北京', newPrice: 46160, oldPrice: 56000, change: 0.18, tier: 1 },
  { cityName: '上海', province: '上海', newPrice: 57941, oldPrice: 54520, change: 0.61, tier: 1 },
  { cityName: '广州', province: '广东', newPrice: 24666, oldPrice: 28000, change: -0.31, tier: 1 },
  { cityName: '深圳', province: '广东', newPrice: 52704, oldPrice: 51000, change: 0, tier: 1 },
  // 二线城市（部分）
  { cityName: '杭州', province: '浙江', newPrice: 31003, oldPrice: 29152, change: 0.95, tier: 2 },
  { cityName: '南京', province: '江苏', newPrice: 25697, oldPrice: 29107, change: 0.02, tier: 2 },
  { cityName: '苏州', province: '江苏', newPrice: 18953, oldPrice: 26000, change: -0.17, tier: 2 },
  { cityName: '成都', province: '四川', newPrice: 14087, oldPrice: 19500, change: 0.12, tier: 2 },
  { cityName: '武汉', province: '湖北', newPrice: 13299, oldPrice: 14000, change: -0.15, tier: 2 },
  { cityName: '西安', province: '陕西', newPrice: 12996, oldPrice: 16480, change: 0.15, tier: 2 },
  { cityName: '天津', province: '天津', newPrice: 15262, oldPrice: 16500, change: -0.04, tier: 2 },
  { cityName: '重庆', province: '重庆', newPrice: 11570, oldPrice: 13000, change: -0.36, tier: 2 },
  { cityName: '青岛', province: '山东', newPrice: 13933, oldPrice: 13000, change: -0.06, tier: 2 },
  { cityName: '济南', province: '山东', newPrice: 12143, oldPrice: 14250, change: -0.11, tier: 2 },
  { cityName: '郑州', province: '河南', newPrice: 12390, oldPrice: 13500, change: 0.29, tier: 2 },
  { cityName: '厦门', province: '福建', newPrice: 29234, oldPrice: 31000, change: 0.13, tier: 2 },
  { cityName: '宁波', province: '浙江', newPrice: 20433, oldPrice: 19000, change: 0.03, tier: 2 },
  { cityName: '无锡', province: '江苏', newPrice: 14427, oldPrice: 23000, change: 0.21, tier: 2 },
  { cityName: '东莞', province: '广东', newPrice: 18686, oldPrice: 21000, change: -0.59, tier: 2 },
  { cityName: '佛山', province: '广东', newPrice: 13789, oldPrice: 16500, change: -0.09, tier: 2 },
  { cityName: '长沙', province: '湖南', newPrice: 9683, oldPrice: 11800, change: 0.16, tier: 2 },
  { cityName: '大连', province: '辽宁', newPrice: 13609, oldPrice: 13500, change: -0.11, tier: 2 },
  { cityName: '沈阳', province: '辽宁', newPrice: 9809, oldPrice: 11000, change: -0.07, tier: 2 },
  { cityName: '昆明', province: '云南', newPrice: 11095, oldPrice: 13000, change: 0.28, tier: 2 },
  { cityName: '哈尔滨', province: '黑龙江', newPrice: 9085, oldPrice: 9900, change: 0.1, tier: 2 },
  { cityName: '长春', province: '吉林', newPrice: 8589, oldPrice: 9000, change: -0.12, tier: 2 },
  { cityName: '石家庄', province: '河北', newPrice: 12095, oldPrice: 13000, change: 0.17, tier: 2 },
  { cityName: '太原', province: '山西', newPrice: 10034, oldPrice: 10800, change: -0.02, tier: 2 },
  { cityName: '合肥', province: '安徽', newPrice: 17021, oldPrice: 15214, change: -1.08, tier: 2 },
  { cityName: '福州', province: '福建', newPrice: 17279, oldPrice: 17000, change: -0.29, tier: 2 },
  { cityName: '南昌', province: '江西', newPrice: 12375, oldPrice: 10150, change: -0.06, tier: 2 },
  { cityName: '南宁', province: '广西', newPrice: 10445, oldPrice: 9420, change: -0.59, tier: 2 },
  { cityName: '贵阳', province: '贵州', newPrice: 6922, oldPrice: 8500, change: -0.12, tier: 2 },
  { cityName: '兰州', province: '甘肃', newPrice: 9019, oldPrice: 8450, change: -0.06, tier: 2 },
  { cityName: '海口', province: '海南', newPrice: 15419, oldPrice: 17474, change: -0.12, tier: 2 },
  // 三线城市（部分）
  { cityName: '珠海', province: '广东', newPrice: 21317, oldPrice: 25500, change: -0.18, tier: 3 },
  { cityName: '惠州', province: '广东', newPrice: 10951, oldPrice: 9100, change: -0.21, tier: 3 },
  { cityName: '温州', province: '浙江', newPrice: 18610, oldPrice: 15709, change: 0.09, tier: 3 },
  { cityName: '绍兴', province: '浙江', newPrice: 16296, oldPrice: 19568, change: 0.14, tier: 3 },
  { cityName: '台州', province: '浙江', newPrice: 14122, oldPrice: 15500, change: 0.1, tier: 3 },
  { cityName: '嘉兴', province: '浙江', newPrice: 13708, oldPrice: 17300, change: -0.15, tier: 3 },
  { cityName: '南通', province: '江苏', newPrice: 14601, oldPrice: 16800, change: 0.04, tier: 3 },
  { cityName: '扬州', province: '江苏', newPrice: 13190, oldPrice: 12316, change: -0.17, tier: 3 },
  { cityName: '常州', province: '江苏', newPrice: 12927, oldPrice: 17000, change: -0.06, tier: 3 },
  { cityName: '徐州', province: '江苏', newPrice: 9870, oldPrice: 10800, change: 0.38, tier: 3 },
  { cityName: '镇江', province: '江苏', newPrice: 9371, oldPrice: 9500, change: 0.01, tier: 3 },
  { cityName: '泰州', province: '江苏', newPrice: 8253, oldPrice: 10300, change: -0.06, tier: 3 },
  { cityName: '三亚', province: '海南', newPrice: 24099, oldPrice: 18500, change: 0.03, tier: 3 },
  { cityName: '烟台', province: '山东', newPrice: 9155, oldPrice: 8500, change: -0.13, tier: 3 },
  { cityName: '威海', province: '山东', newPrice: 8843, oldPrice: 8500, change: 0.32, tier: 3 },
  { cityName: '潍坊', province: '山东', newPrice: 6761, oldPrice: 8000, change: -0.04, tier: 3 },
  { cityName: '淄博', province: '山东', newPrice: 7872, oldPrice: 8000, change: 0.29, tier: 3 },
  { cityName: '临沂', province: '山东', newPrice: 9611, oldPrice: 8400, change: -0.11, tier: 3 },
  { cityName: '济宁', province: '山东', newPrice: 7963, oldPrice: 8400, change: 0.04, tier: 3 },
  { cityName: '洛阳', province: '河南', newPrice: 8033, oldPrice: 7800, change: 0.02, tier: 3 },
  { cityName: '襄阳', province: '湖北', newPrice: 9631, oldPrice: 8400, change: -0.11, tier: 3 },
  { cityName: '宜昌', province: '湖北', newPrice: 7409, oldPrice: 7019, change: -0.54, tier: 3 },
  { cityName: '岳阳', province: '湖南', newPrice: 6016, oldPrice: 5900, change: -0.05, tier: 3 },
  { cityName: '常德', province: '湖南', newPrice: 5842, oldPrice: 7000, change: -0.05, tier: 3 },
  { cityName: '株洲', province: '湖南', newPrice: 4783, oldPrice: 4758, change: -0.6, tier: 3 },
  { cityName: '桂林', province: '广西', newPrice: 6448, oldPrice: 6000, change: -0.09, tier: 3 },
  { cityName: '柳州', province: '广西', newPrice: 9126, oldPrice: 8500, change: -0.15, tier: 3 },
  { cityName: '北海', province: '广西', newPrice: 7770, oldPrice: 6500, change: -0.82, tier: 3 },
  { cityName: '湛江', province: '广东', newPrice: 9877, oldPrice: 9400, change: -0.13, tier: 3 },
  { cityName: '中山', province: '广东', newPrice: 10174, oldPrice: 12000, change: 0.1, tier: 3 },
  { cityName: '江门', province: '广东', newPrice: 8282, oldPrice: 9000, change: -0.61, tier: 3 },
  { cityName: '肇庆', province: '广东', newPrice: 6946, oldPrice: 6800, change: -0.09, tier: 3 },
  { cityName: '金华', province: '浙江', newPrice: 13183, oldPrice: 17000, change: 0.37, tier: 3 },
  { cityName: '湖州', province: '浙江', newPrice: 11226, oldPrice: 12800, change: -0.03, tier: 3 },
  { cityName: '赣州', province: '江西', newPrice: 8251, oldPrice: 8300, change: 0, tier: 3 },
  { cityName: '遵义', province: '贵州', newPrice: 5999, oldPrice: 5800, change: -0.09, tier: 3 },
  { cityName: '绵阳', province: '四川', newPrice: 6992, oldPrice: 9250, change: 0.01, tier: 3 },
  { cityName: '大理', province: '云南', newPrice: 7222, oldPrice: 7000, change: -0.15, tier: 3 },
  { cityName: '包头', province: '内蒙古', newPrice: 6419, oldPrice: 7450, change: 0, tier: 3 },
  { cityName: '芜湖', province: '安徽', newPrice: 8436, oldPrice: 10153, change: -0.03, tier: 3 },
  { cityName: '泉州', province: '福建', newPrice: 9122, oldPrice: 10800, change: 0.08, tier: 3 },
  { cityName: '漳州', province: '福建', newPrice: 10865, oldPrice: 11000, change: 0.02, tier: 3 },
  { cityName: '盐城', province: '江苏', newPrice: 8487, oldPrice: 9800, change: -0.31, tier: 3 },
  { cityName: '连云港', province: '江苏', newPrice: 7794, oldPrice: 9000, change: -0.33, tier: 3 },
  { cityName: '淮安', province: '江苏', newPrice: 6338, oldPrice: 9000, change: 0, tier: 3 },
  { cityName: '宿迁', province: '江苏', newPrice: 5681, oldPrice: 9500, change: 0, tier: 3 },
  { cityName: '张家港', province: '江苏', newPrice: 11045, oldPrice: 11500, change: 0, tier: 3 },
  { cityName: '常熟', province: '江苏', newPrice: 15247, oldPrice: 16000, change: -0.2, tier: 3 },
  { cityName: '昆山', province: '江苏', newPrice: 15885, oldPrice: 16246, change: -0.26, tier: 3 },
  { cityName: '江阴', province: '江苏', newPrice: 9285, oldPrice: 8718, change: -1.59, tier: 3 },
  { cityName: '宜兴', province: '江苏', newPrice: 10500, oldPrice: 10000, change: -0.09, tier: 3 },
  { cityName: '义乌', province: '浙江', newPrice: 18000, oldPrice: 17000, change: -0.09, tier: 3 },
  { cityName: '海宁', province: '浙江', newPrice: 14000, oldPrice: 13500, change: -0.09, tier: 3 },
  { cityName: '诸暨', province: '浙江', newPrice: 12000, oldPrice: 11500, change: -0.09, tier: 3 },
  { cityName: '慈溪', province: '浙江', newPrice: 13500, oldPrice: 13000, change: -0.09, tier: 3 },
  { cityName: '拉萨', province: '西藏', newPrice: 8500, oldPrice: 8000, change: 0, tier: 3 },
];

export function getCitiesByTier(tier: number): CityPrice[] {
  return cityPrices.filter((c) => c.tier === tier);
}

export function searchCities(keyword: string): CityPrice[] {
  const lower = keyword.toLowerCase();
  return cityPrices.filter(
    (c) =>
      c.cityName.includes(keyword) ||
      c.province.includes(keyword) ||
      c.cityName.toLowerCase().includes(lower) ||
      c.province.toLowerCase().includes(lower)
  );
}

// 数据更新时间（每天0点自动更新）
export const lastPriceUpdate = '2026-05-07 00:00:00';

// 月数转年月文字
export function formatMonths(totalMonths: number): string {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years === 0) return `${months}个月`;
  if (months === 0) return `${years}年`;
  return `${years}年${months}个月`;
}
