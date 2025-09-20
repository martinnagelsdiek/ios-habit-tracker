import { useState, useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CategoryData {
  categoryName: string;
  categoryColor: string;
  level: number;
  rank: string;
  xp: number;
  last7DayCompletions: number;
}

interface RadarChartProps {
  categories: CategoryData[];
  className?: string;
}

export const RadarChart = memo(function RadarChart({ categories, className }: RadarChartProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  
  // Memoize chart calculations
  const chartData = useMemo(() => {
    if (categories.length < 3) {
      return null;
    }

    const size = 280;
    const center = size / 2;
    const maxRadius = center - 40;
    const angleStep = (2 * Math.PI) / categories.length;

    const getPoint = (level: number, index: number) => {
      const angle = index * angleStep - Math.PI / 2;
      const radius = (level / 100) * maxRadius;
      return {
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle)
      };
    };

    const getGridPoint = (ring: number, index: number) => {
      const angle = index * angleStep - Math.PI / 2;
      const radius = (ring / 5) * maxRadius;
      return {
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle)
      };
    };

    const getLabelPoint = (index: number) => {
      const angle = index * angleStep - Math.PI / 2;
      const radius = maxRadius + 20;
      return {
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle)
      };
    };

    const dataPoints = categories.map((cat, index) => getPoint(cat.level, index));
    const pathData = dataPoints.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ') + ' Z';

    return {
      size,
      center,
      maxRadius,
      angleStep,
      getGridPoint,
      getLabelPoint,
      dataPoints,
      pathData
    };
  }, [categories]);

  if (categories.length < 3) {
    return (
      <Card className={cn("h-full", className)}>
        <CardHeader>
          <CardTitle>Skills Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <p>Radar chart will appear once you have habits in 3+ categories</p>
            <div className="mt-4 space-y-2">
              {categories.map((cat) => (
                <div key={cat.categoryName} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat.categoryColor }}
                  />
                  <span className="text-sm">
                    {cat.categoryName}: Level {cat.level}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {cat.rank}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData) return null;

  const { size, center, getGridPoint, getLabelPoint, dataPoints, pathData } = chartData;

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Skills Overview
          <Badge variant="outline" className="text-xs">
            {categories.length} {categories.length === 1 ? 'Category' : 'Categories'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <svg width={size} height={size} className="mb-4">
            {/* Grid rings */}
            {[1, 2, 3, 4, 5].map((ring) => (
              <g key={ring}>
                <polygon
                  points={categories.map((_, index) => {
                    const point = getGridPoint(ring, index);
                    return `${point.x},${point.y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="opacity-20"
                />
              </g>
            ))}
            
            {/* Axis lines */}
            {categories.map((_, index) => {
              const outerPoint = getGridPoint(5, index);
              return (
                <line
                  key={index}
                  x1={center}
                  y1={center}
                  x2={outerPoint.x}
                  y2={outerPoint.y}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="opacity-20"
                />
              );
            })}
            
            {/* Data area */}
            <path
              d={pathData}
              fill="hsl(var(--primary))"
              fillOpacity="0.2"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
            />
            
            {/* Data points */}
            {dataPoints.map((point, index) => {
              const category = categories[index];
              const isHovered = hoveredCategory === category.categoryName;
              return (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r={isHovered ? 6 : 4}
                  fill={category.categoryColor}
                  stroke="white"
                  strokeWidth="2"
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredCategory(category.categoryName)}
                  onMouseLeave={() => setHoveredCategory(null)}
                />
              );
            })}
            
            {/* Category labels */}
            {categories.map((category, index) => {
              const point = getLabelPoint(index);
              const isHovered = hoveredCategory === category.categoryName;
              return (
                <text
                  key={index}
                  x={point.x}
                  y={point.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={cn(
                    "text-xs font-medium transition-all duration-200",
                    isHovered ? "fill-current font-semibold" : "fill-muted-foreground"
                  )}
                  onMouseEnter={() => setHoveredCategory(category.categoryName)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  {category.categoryName}
                </text>
              );
            })}
            
            {/* Ring labels */}
            {[20, 40, 60, 80, 100].map((level, index) => (
              <text
                key={level}
                x={center + ((index + 1) / 5) * chartData.maxRadius + 5}
                y={center - 5}
                className="text-xs fill-muted-foreground"
                textAnchor="start"
              >
                {level}
              </text>
            ))}
          </svg>
          
          {/* Tooltip */}
          {hoveredCategory && (
            <div className="mt-2 p-3 bg-card border rounded-lg shadow-lg">
              {(() => {
                const category = categories.find(c => c.categoryName === hoveredCategory)!;
                return (
                  <div className="text-center space-y-1">
                    <div className="font-semibold flex items-center gap-2 justify-center">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.categoryColor }}
                      />
                      {category.categoryName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Level {category.level} • {category.rank}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {category.xp.toLocaleString()} XP • {category.last7DayCompletions} completions (7d)
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});