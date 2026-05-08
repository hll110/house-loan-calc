import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import CityPriceGrid from "@/components/CityPriceGrid";
import {
  Calculator,
  ArrowRightLeft,
  Wallet,
  Home,
  PiggyBank,
  CheckCircle2,
  BarChart3,
  MapPin,
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  RefreshCw,
} from "lucide-react";
import {
  calculateEqualInterest,
  calculateEqualPrincipal,
  calculatePrepayment,
  compareMethods,
  formatMonths,
} from "@/lib/loan";
import type { LoanResult, ComparisonResult, PrepayResult, CityPrice } from "@/lib/loan";
import { trpc } from "@/providers/trpc";

// ========== 房贷计算器 ==========
function LoanCalculator({
  onResult,
}: {
  onResult: (r: LoanResult & { type: string }) => void;
}) {
  const [principal, setPrincipal] = useState(100);
  const [months, setMonths] = useState(360);
  const [rate, setRate] = useState(3.5);
  const [method, setMethod] = useState<"equalInterest" | "equalPrincipal">("equalInterest");

  const handleCalculate = () => {
    if (method === "equalInterest") {
      const data = calculateEqualInterest(principal, months, rate);
      onResult({ ...data, type: "等额本息" });
    } else {
      const data = calculateEqualPrincipal(principal, months, rate);
      onResult({ ...data, type: "等额本金" });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            贷款参数
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>贷款金额</Label>
              <span className="text-sm font-medium">{principal} 万元</span>
            </div>
            <Slider
              value={[principal]}
              onValueChange={(v) => setPrincipal(v[0])}
              min={10}
              max={1000}
              step={5}
            />
            <div className="flex gap-2">
              <Input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground self-center">万元</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>贷款期限</Label>
              <span className="text-sm font-medium">
                {months} 个月（{formatMonths(months)}）
              </span>
            </div>
            <Slider
              value={[months]}
              onValueChange={(v) => setMonths(v[0])}
              min={12}
              max={360}
              step={1}
            />
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="w-24"
                min={1}
                max={360}
              />
              <span className="text-sm text-muted-foreground">个月</span>
              <span className="text-xs text-muted-foreground ml-2">
                约 {formatMonths(months)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>年利率</Label>
              <span className="text-sm font-medium">{rate}%</span>
            </div>
            <Slider
              value={[rate]}
              onValueChange={(v) => setRate(Number(v[0].toFixed(2)))}
              min={2}
              max={6}
              step={0.01}
            />
            <div className="flex gap-1 flex-wrap">
              {[
                { label: "公积金", value: 2.85 },
                { label: "LPR-60bp", value: 2.9 },
                { label: "LPR", value: 3.5 },
                { label: "LPR+60bp", value: 4.1 },
              ].map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setRate(preset.value)}
                >
                  {preset.label} {preset.value}%
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>还款方式</Label>
            <div className="flex gap-2">
              <Button
                variant={method === "equalInterest" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setMethod("equalInterest")}
              >
                等额本息
              </Button>
              <Button
                variant={method === "equalPrincipal" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setMethod("equalPrincipal")}
              >
                等额本金
              </Button>
            </div>
          </div>

          <Button className="w-full" size="lg" onClick={handleCalculate}>
            <Calculator className="h-4 w-4 mr-2" />
            计算月供
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ========== 计算结果展示 ==========
function ResultDisplay({ result, type }: { result: LoanResult; type: string }) {
  const [showAll, setShowAll] = useState(false);
  const visibleMonths = showAll
    ? result.monthlyBreakdown
    : result.monthlyBreakdown.slice(0, 12);

  const formatMoney = (n: number) =>
    n.toLocaleString("zh-CN", { maximumFractionDigits: 2 });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="text-xs text-blue-700">月供（首月）</div>
            <div className="text-xl font-bold text-blue-900">
              {formatMoney(result.monthlyPaymentFirst)}
            </div>
            <div className="text-xs text-blue-600">元/月</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-3">
            <div className="text-xs text-emerald-700">贷款总额</div>
            <div className="text-xl font-bold text-emerald-900">
              {(result.totalPrincipal / 10000).toFixed(0)}
            </div>
            <div className="text-xs text-emerald-600">万元</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-3">
            <div className="text-xs text-amber-700">支付利息</div>
            <div className="text-xl font-bold text-amber-900">
              {(result.totalInterest / 10000).toFixed(2)}
            </div>
            <div className="text-xs text-amber-600">万元</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-3">
            <div className="text-xs text-slate-700">还款总额</div>
            <div className="text-xl font-bold text-slate-900">
              {(result.totalPayment / 10000).toFixed(2)}
            </div>
            <div className="text-xs text-slate-600">万元</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>
              {type} - 还款计划表
            </span>
            <Badge variant="outline">
              {result.months}期（{formatMonths(result.months)}）
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b">
                  <th className="text-left py-2 px-2">期数</th>
                  <th className="text-right py-2 px-2">月供</th>
                  <th className="text-right py-2 px-2">本金</th>
                  <th className="text-right py-2 px-2">利息</th>
                  <th className="text-right py-2 px-2">剩余本金</th>
                </tr>
              </thead>
              <tbody>
                {visibleMonths.map((m) => (
                  <tr
                    key={m.month}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-1.5 px-2">{m.month}</td>
                    <td className="text-right py-1.5 px-2 font-medium">
                      {formatMoney(m.payment)}
                    </td>
                    <td className="text-right py-1.5 px-2 text-emerald-700">
                      {formatMoney(m.principal)}
                    </td>
                    <td className="text-right py-1.5 px-2 text-amber-700">
                      {formatMoney(m.interest)}
                    </td>
                    <td className="text-right py-1.5 px-2 text-slate-500">
                      {formatMoney(m.remaining)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
          {result.months > 12 && (
            <Button
              variant="ghost"
              className="w-full mt-2"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" /> 收起显示前12期
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" /> 查看全部
                  {result.months}期
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ========== 还款对比 + 推荐 ==========
function CompareSection() {
  const [principal, setPrincipal] = useState(100);
  const [months, setMonths] = useState(360);
  const [rate, setRate] = useState(3.5);
  const [isFirstHome, setIsFirstHome] = useState(true);
  const [annualIncome, setAnnualIncome] = useState(150000);
  const [result, setResult] = useState<ComparisonResult | null>(null);

  const handleCompare = () => {
    const data = compareMethods(principal, months, rate, isFirstHome, annualIncome);
    setResult(data);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-violet-600" />
            还款方式对比
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">贷款金额（万元）</Label>
              <Input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
              />
            </div>
            <div>
              <Label className="text-xs">贷款期限（月）</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={months}
                  onChange={(e) => setMonths(Number(e.target.value))}
                  min={1}
                  max={360}
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatMonths(months)}
                </span>
              </div>
            </div>
            <div>
              <Label className="text-xs">年利率（%）</Label>
              <Input
                type="number"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                step={0.01}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={isFirstHome} onCheckedChange={setIsFirstHome} />
              <Label>首套房</Label>
            </div>
            {isFirstHome && (
              <div className="flex items-center gap-2">
                <Label className="text-xs">年收入</Label>
                <Input
                  type="number"
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(Number(e.target.value))}
                  className="w-28 h-8 text-sm"
                />
              </div>
            )}
          </div>

          <Button onClick={handleCompare} className="w-full">
            <BarChart3 className="h-4 w-4 mr-2" />
            对比并推荐最优方案
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card className="border-2 border-emerald-300 bg-emerald-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                最优还款方式推荐
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge
                  className="text-base px-3 py-1"
                  variant={
                    result.recommendation === "equalPrincipal"
                      ? "default"
                      : "secondary"
                  }
                >
                  {result.recommendation === "equalPrincipal"
                    ? "等额本金"
                    : "等额本息"}
                </Badge>
                <span className="text-sm text-emerald-800 font-medium">
                  {result.recommendationReason}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                <div className="bg-white rounded-lg p-2.5 border">
                  <div className="text-xs text-muted-foreground">节省利息</div>
                  <div className="font-bold text-emerald-700">
                    {result.interestSaved.toLocaleString()} 元
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2.5 border">
                  <div className="text-xs text-muted-foreground">
                    个税抵扣收益
                  </div>
                  <div className="font-bold text-blue-700">
                    {result.taxBenefit.toLocaleString()} 元
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2.5 border">
                  <div className="text-xs text-muted-foreground">
                    综合净收益
                  </div>
                  <div className="font-bold text-violet-700">
                    {result.netBenefit.toLocaleString()} 元
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">详细对比</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">对比项目</th>
                      <th className="text-right py-2">等额本息</th>
                      <th className="text-right py-2">等额本金</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">首月月供</td>
                      <td className="text-right font-medium">
                        {result.equalInterest.monthlyPaymentFirst.toLocaleString()} 元
                      </td>
                      <td className="text-right font-medium">
                        {result.equalPrincipal.monthlyPaymentFirst.toLocaleString()} 元
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">末月月供</td>
                      <td className="text-right">
                        {result.equalInterest.monthlyPaymentLast.toLocaleString()} 元
                      </td>
                      <td className="text-right">
                        {result.equalPrincipal.monthlyPaymentLast.toLocaleString()} 元
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">总利息</td>
                      <td className="text-right text-amber-700">
                        {(result.equalInterest.totalInterest / 10000).toFixed(2)} 万
                      </td>
                      <td className="text-right text-emerald-700">
                        {(result.equalPrincipal.totalInterest / 10000).toFixed(2)} 万
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">还款总额</td>
                      <td className="text-right">
                        {(result.equalInterest.totalPayment / 10000).toFixed(2)} 万
                      </td>
                      <td className="text-right">
                        {(result.equalPrincipal.totalPayment / 10000).toFixed(2)} 万
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2">利息占比</td>
                      <td className="text-right">
                        {(
                          (result.equalInterest.totalInterest /
                            result.equalInterest.totalPayment) *
                          100
                        ).toFixed(1)}
                        %
                      </td>
                      <td className="text-right">
                        {(
                          (result.equalPrincipal.totalInterest /
                            result.equalPrincipal.totalPayment) *
                          100
                        ).toFixed(1)}
                        %
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ========== 提前还款 ==========
function PrepaySection() {
  const [principal, setPrincipal] = useState(100);
  const [months, setMonths] = useState(360);
  const [rate, setRate] = useState(3.5);
  const [prepayMonth, setPrepayMonth] = useState(60);
  const [prepayAmount, setPrepayAmount] = useState(20);
  const [strategy, setStrategy] = useState<"reduceTerm" | "reducePayment">(
    "reduceTerm"
  );
  const [method, setMethod] = useState<"equalInterest" | "equalPrincipal">(
    "equalInterest"
  );
  const [result, setResult] = useState<PrepayResult | null>(null);

  const handleCalculate = () => {
    const data = calculatePrepayment(
      principal,
      months,
      rate,
      prepayMonth,
      prepayAmount,
      strategy,
      method
    );
    setResult(data);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5 text-amber-600" />
            提前还款计算器
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">贷款金额（万元）</Label>
              <Input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
              />
            </div>
            <div>
              <Label className="text-xs">贷款期限（月）</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={months}
                  onChange={(e) => setMonths(Number(e.target.value))}
                  min={1}
                  max={360}
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatMonths(months)}
                </span>
              </div>
            </div>
            <div>
              <Label className="text-xs">年利率（%）</Label>
              <Input
                type="number"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                step={0.01}
              />
            </div>
            <div>
              <Label className="text-xs">还款方式</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  variant={method === "equalInterest" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setMethod("equalInterest")}
                >
                  等额本息
                </Button>
                <Button
                  variant={method === "equalPrincipal" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setMethod("equalPrincipal")}
                >
                  等额本金
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">
                提前还款月份（第几个月）
              </Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={prepayMonth}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setPrepayMonth(Math.min(v, months));
                  }}
                  min={1}
                  max={months}
                />
                <span className="text-sm text-muted-foreground self-center whitespace-nowrap">
                  {formatMonths(prepayMonth)}
                </span>
              </div>
            </div>
            <div>
              <Label className="text-xs">提前还款金额（万元）</Label>
              <Input
                type="number"
                value={prepayAmount}
                onChange={(e) => setPrepayAmount(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">提前还款策略</Label>
            <div className="flex gap-2 mt-1">
              <Button
                variant={strategy === "reduceTerm" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setStrategy("reduceTerm")}
              >
                缩短期限
              </Button>
              <Button
                variant={strategy === "reducePayment" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setStrategy("reducePayment")}
              >
                减少月供
              </Button>
            </div>
          </div>

          <Button onClick={handleCalculate} className="w-full">
            <Calculator className="h-4 w-4 mr-2" />
            计算提前还款效果
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card className="border-2 border-amber-300 bg-amber-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-amber-600" />
                提前还款效果
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="bg-white rounded-lg p-2.5 border">
                  <div className="text-xs text-muted-foreground">节省利息</div>
                  <div className="text-lg font-bold text-emerald-700">
                    {result.interestSaved.toLocaleString()} 元
                  </div>
                </div>
                {result.strategy === "reduceTerm" ? (
                  <div className="bg-white rounded-lg p-2.5 border">
                    <div className="text-xs text-muted-foreground">
                      缩短期限
                    </div>
                    <div className="text-lg font-bold text-blue-700">
                      {result.monthsSaved} 个月
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-2.5 border">
                    <div className="text-xs text-muted-foreground">新月供</div>
                    <div className="text-lg font-bold text-blue-700">
                      {result.newMonthlyPayment.toLocaleString()} 元
                    </div>
                  </div>
                )}
                <div className="bg-white rounded-lg p-2.5 border">
                  <div className="text-xs text-muted-foreground">原总利息</div>
                  <div className="text-lg font-bold text-amber-700">
                    {(result.before.totalInterest / 10000).toFixed(2)} 万
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">提前还款前</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">月供</span>
                  <span>
                    {result.before.monthlyPaymentFirst.toLocaleString()} 元
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">总利息</span>
                  <span>
                    {(result.before.totalInterest / 10000).toFixed(2)} 万元
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">还款总额</span>
                  <span>
                    {(result.before.totalPayment / 10000).toFixed(2)} 万元
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-emerald-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-emerald-800">
                  提前还款后
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">月供</span>
                  <span className="font-medium">
                    {result.after.monthlyPaymentFirst.toLocaleString()} 元
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">总利息</span>
                  <span className="font-medium text-emerald-700">
                    {(result.after.totalInterest / 10000).toFixed(2)} 万元
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">还款总额</span>
                  <span className="font-medium">
                    {(result.after.totalPayment / 10000).toFixed(2)} 万元
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== 房价查询 ==========
function PriceSection() {
  const [keyword, setKeyword] = useState("");
  const [tier, setTier] = useState<number | null>(null);

  const allCitiesQuery = trpc.housingPrice.list.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
  const updateInfoQuery = trpc.housingPrice.updateInfo.useQuery(undefined, {
    staleTime: 60 * 1000,
  });

  const allCities: CityPrice[] = allCitiesQuery.data ?? [];

  const cities = useMemo(() => {
    if (keyword.length > 0) {
      const lower = keyword.toLowerCase();
      return allCities.filter(
        (c) =>
          c.cityName.includes(keyword) ||
          c.province.includes(keyword) ||
          c.cityName.toLowerCase().includes(lower) ||
          c.province.toLowerCase().includes(lower)
      );
    }
    if (tier !== null) return allCities.filter((c) => c.tier === tier);
    return allCities;
  }, [keyword, tier, allCities]);

  const formatUpdateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-3 flex items-center gap-3">
          <RefreshCw className={`h-5 w-5 text-blue-600 shrink-0 ${allCitiesQuery.isLoading ? "animate-spin" : ""}`} />
          <div className="text-sm flex-1">
            <div className="text-blue-900 font-medium">
              房价数据每天0点自动更新最新数据
            </div>
            <div className="text-blue-700 flex items-center gap-1.5 mt-0.5">
              <Clock className="h-3.5 w-3.5" />
              {updateInfoQuery.data ? (
                <>数据更新时间：{formatUpdateTime(updateInfoQuery.data.updatedAt)}</>
              ) : (
                <>加载中...</>
              )}
            </div>
          </div>
          {updateInfoQuery.data?.source && updateInfoQuery.data.source !== "built-in" && (
            <Badge variant="outline" className="text-xs bg-white">
              来源：{updateInfoQuery.data.source}
            </Badge>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索城市或省份..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setTier(null);
              }}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={tier === null && !keyword ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setTier(null);
                setKeyword("");
              }}
            >
              全部
            </Button>
            <Button
              variant={tier === 1 ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setTier(1);
                setKeyword("");
              }}
            >
              一线城市
            </Button>
            <Button
              variant={tier === 2 ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setTier(2);
                setKeyword("");
              }}
            >
              二线城市
            </Button>
            <Button
              variant={tier === 3 ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setTier(3);
                setKeyword("");
              }}
            >
              三线城市
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>共 {cities.length} 个城市</span>
        {updateInfoQuery.data && (
          <Badge variant="outline" className="text-xs">
            {updateInfoQuery.data.cityCount} 城市数据
          </Badge>
        )}
      </div>

      {allCitiesQuery.isLoading ? (
        <div className="text-center py-8 text-muted-foreground">加载房价数据中...</div>
      ) : (
        <CityPriceGrid cities={cities} />
      )}
    </div>
  );
}

// ========== 主页面 ==========
export default function HomePage() {
  const [calcResult, setCalcResult] = useState<
    (LoanResult & { type: string }) | null
  >(null);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg">房贷计算器</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                2026年LPR利率 | 个税抵扣 | 提前还款
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 text-xs"
            >
              5年期LPR: 3.5%
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <Tabs defaultValue="calc" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="calc" className="flex items-center gap-1.5">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">房贷计算</span>
            </TabsTrigger>
            <TabsTrigger value="compare" className="flex items-center gap-1.5">
              <ArrowRightLeft className="h-4 w-4" />
              <span className="hidden sm:inline">方式对比</span>
            </TabsTrigger>
            <TabsTrigger value="prepay" className="flex items-center gap-1.5">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">提前还款</span>
            </TabsTrigger>
            <TabsTrigger value="price" className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">房价查询</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calc" className="space-y-4">
            <div className={calcResult ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : ""}>
              <LoanCalculator onResult={setCalcResult} />
              {calcResult && (
                <ResultDisplay result={calcResult} type={calcResult.type} />
              )}
            </div>
          </TabsContent>

          <TabsContent value="compare">
            <CompareSection />
          </TabsContent>

          <TabsContent value="prepay">
            <PrepaySection />
          </TabsContent>

          <TabsContent value="price">
            <PriceSection />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-8">
        <div className="max-w-5xl mx-auto px-4 py-6 text-sm text-muted-foreground space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold text-foreground mb-1">政策说明</h4>
              <p>
                首套房贷利息可享个税专项附加扣除，每月1000元定额扣除，每年12000元，最长240个月。
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">利率参考</h4>
              <p>
                2026年5月20日LPR：1年期3.0%，5年期以上3.5%。公积金利率：5年以上2.85%。
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">数据说明</h4>
              <p>
                房价数据来源：中指研究院2026年4月百城价格指数。计算结果仅供参考，以银行实际审批为准。
              </p>
            </div>
          </div>
          <div className="text-center pt-4 border-t">
            房贷计算器 2026 | 数据更新时间：2026年5月
          </div>
        </div>
      </footer>
    </div>
  );
}
