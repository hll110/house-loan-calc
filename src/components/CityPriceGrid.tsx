import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { CityPrice } from "@/lib/loan";

interface CityPriceGridProps {
  cities: CityPrice[];
}

export default function CityPriceGrid({ cities }: CityPriceGridProps) {
  const tierLabels: Record<number, string> = {
    1: "一线城市",
    2: "二线城市",
    3: "三线城市",
  };

  const tierColors: Record<number, string> = {
    1: "bg-red-50 text-red-700 border-red-200",
    2: "bg-orange-50 text-orange-700 border-orange-200",
    3: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {cities.map((city) => (
        <Card key={city.cityName} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-lg">{city.cityName}</h3>
                <p className="text-xs text-muted-foreground">{city.province}</p>
              </div>
              <Badge variant="outline" className={tierColors[city.tier]}>
                {tierLabels[city.tier]}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-lg p-2.5">
                <div className="text-xs text-muted-foreground mb-0.5">新房均价</div>
                <div className="font-bold text-slate-900">{city.newPrice.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">元/㎡</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-2.5">
                <div className="text-xs text-muted-foreground mb-0.5">二手均价</div>
                <div className="font-bold text-slate-900">{city.oldPrice.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">元/㎡</div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1 text-sm">
                <span className="text-muted-foreground">环比</span>
                {city.change >= 0 ? (
                  <span className="text-red-600 flex items-center gap-0.5 font-medium">
                    <TrendingUp className="h-3.5 w-3.5" />
                    +{city.change.toFixed(2)}%
                  </span>
                ) : (
                  <span className="text-green-600 flex items-center gap-0.5 font-medium">
                    <TrendingDown className="h-3.5 w-3.5" />
                    {city.change.toFixed(2)}%
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                百城房价样本
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
