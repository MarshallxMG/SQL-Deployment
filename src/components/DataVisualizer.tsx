import { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Sector 
} from 'recharts';
import { BarChart2, LineChart as LineChartIcon, PieChart as PieChartIcon } from 'lucide-react';

interface DataVisualizerProps {
  data: any[];
  fields: any[];
  schema: any;
  onFetchTableData: (tableName: string) => Promise<{ rows: any[], fields: any[] }>;
  initialConfig?: {
    type?: 'bar' | 'line' | 'pie';
    xKey?: string;
    yKey?: string;
  };
}

export default function DataVisualizer({ data: initialData, fields: initialFields, schema, onFetchTableData, initialConfig }: DataVisualizerProps) {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [xAxisKey, setXAxisKey] = useState<string>('');
  const [yAxisKey, setYAxisKey] = useState<string>(''); // Single Y-axis selection
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(prev => prev === index ? undefined : index);
  };
  
  // Data Source State
  const [selectedTable, setSelectedTable] = useState<string>('Current Query Results');
  const [localData, setLocalData] = useState<any[]>([]);
  const [localFields, setLocalFields] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Determine which data/fields to use
  const data = selectedTable === 'Current Query Results' ? initialData : localData;
  const fields = selectedTable === 'Current Query Results' ? initialFields : localFields;

  // Handle Table Selection
  const handleTableChange = async (tableName: string) => {
    setSelectedTable(tableName);
    if (tableName !== 'Current Query Results') {
      setIsLoading(true);
      const result = await onFetchTableData(tableName);
      setLocalData(result.rows);
      setLocalFields(result.fields);
      setIsLoading(false);
    }
  };

  // Identify numeric and categorical fields
  const { numericFields, categoryFields } = useMemo(() => {
    const numeric: string[] = [];
    const category: string[] = [];

    if (fields && fields.length > 0 && data && data.length > 0) {
      fields.forEach(f => {
        if (!f || !f.name) return;
        const val = data[0][f.name];
        if (typeof val === 'number') {
          numeric.push(f.name);
        } else {
          category.push(f.name);
        }
      });
    }
    return { numericFields: numeric, categoryFields: category };
  }, [fields, data]);

  // Pre-process data to ensure numeric values for the selected Y-axis
  // This avoids passing a function to dataKey which causes Recharts issues
  const processedData = useMemo(() => {
    if (!data || !yAxisKey) return [];
    return data.map(item => ({
      ...item,
      __parsedValue: (() => {
        const val = item[yAxisKey];
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
      })()
    }));
  }, [data, yAxisKey]);

  // Apply initial config from AI
  useEffect(() => {
    if (initialConfig) {
      if (initialConfig.type) setChartType(initialConfig.type);
      if (initialConfig.xKey) setXAxisKey(initialConfig.xKey);
      if (initialConfig.yKey) setYAxisKey(initialConfig.yKey);
    }
  }, [initialConfig]);

  // Auto-select defaults if not set
  useMemo(() => {
    if (!xAxisKey && categoryFields.length > 0) setXAxisKey(categoryFields[0]);
    
    // If current yAxisKey matches xAxisKey or is invalid, reset it
    // We now allow ANY field on Y-axis, as long as it's not the X-axis key
    const validYFields = fields.map(f => f.name).filter(name => name !== xAxisKey);
    
    if ((!yAxisKey || yAxisKey === xAxisKey || !validYFields.includes(yAxisKey)) && validYFields.length > 0) {
       // Prefer numeric fields if available and valid
       const validNumeric = numericFields.filter(f => f !== xAxisKey);
       if (validNumeric.length > 0) {
         setYAxisKey(validNumeric[0]);
       } else {
         setYAxisKey(validYFields[0]);
       }
    }
  }, [categoryFields, numericFields, fields, xAxisKey, yAxisKey]);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500 flex items-center justify-center gap-2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div> Loading data...</div>;
  }


  if (!data || data.length === 0) {
    return (
      <div className="h-full flex flex-col p-4 bg-white dark:bg-gray-900">
         {/* Toolbar even if empty */}
         <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Data Source:</span>
              <select
                value={selectedTable}
                onChange={(e) => handleTableChange(e.target.value)}
                className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Current Query Results">Current Query Results</option>
                {schema && Object.keys(schema).map(table => (
                  <option key={table} value={table}>{table}</option>
                ))}
              </select>
            </div>
         </div>
         <div className="flex-1 flex items-center justify-center text-gray-500">No data to visualize</div>
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="h-full flex flex-col p-4 bg-white dark:bg-gray-900">
      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        
        {/* Data Source Selection */}
        <div className="flex items-center gap-2 border-r border-gray-300 dark:border-gray-600 pr-4 mr-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Data Source:</span>
          <select
            value={selectedTable}
            onChange={(e) => handleTableChange(e.target.value)}
            className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="Current Query Results">Current Query Results</option>
            {schema && Object.keys(schema).map(table => (
              <option key={table} value={table}>{table}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Chart Type:</span>
          <div className="flex bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 p-1">
            <button
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded ${chartType === 'bar' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              title="Bar Chart"
            >
              <BarChart2 size={18} />
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`p-1.5 rounded ${chartType === 'line' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              title="Line Chart"
            >
              <LineChartIcon size={18} />
            </button>
            <button
              onClick={() => setChartType('pie')}
              className={`p-1.5 rounded ${chartType === 'pie' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              title="Pie Chart"
            >
              <PieChartIcon size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{chartType === 'pie' ? 'Label (Slice):' : 'X-Axis:'}</span>
          <select
            value={xAxisKey}
            onChange={(e) => setXAxisKey(e.target.value)}
            className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {fields.map((f, i) => (
              <option key={`${f.name}-${i}`} value={f.name}>{f.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{chartType === 'pie' ? 'Value (Size):' : 'Y-Axis:'}</span>
          <select
            value={yAxisKey}
            onChange={(e) => setYAxisKey(e.target.value)}
            className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {fields.filter(f => f.name !== xAxisKey).map((f, i) => (
              <option key={`${f.name}-${i}`} value={f.name}>{f.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey={xAxisKey} stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F3F4F6' }}
                itemStyle={{ color: '#E5E7EB' }}
              />

              {yAxisKey && (
                <Bar 
                  dataKey="__parsedValue" 
                  fill="#0088FE" 
                  radius={[4, 4, 0, 0]} 
                  name={yAxisKey}
                />
              )}
            </BarChart>
          ) : chartType === 'line' ? (
            <LineChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey={xAxisKey} stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F3F4F6' }}
                itemStyle={{ color: '#E5E7EB' }}
              />

              {yAxisKey && (
                <Line 
                  type="monotone" 
                  dataKey="__parsedValue" 
                  stroke="#0088FE" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name={yAxisKey}
                />
              )}
            </LineChart>
          ) : (
            <PieChart>
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <Pie
                data={processedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={120}
                fill="#8884d8"
                dataKey="__parsedValue"
                nameKey={xAxisKey}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-in-out"
                activeShape={activeIndex !== undefined ? (props: any) => {
                  const RADIAN = Math.PI / 180;
                  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
                
                  return (
                    <g>
                      <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill="#fff" fontWeight="bold" fontSize={14}>
                        {payload[xAxisKey]}
                      </text>
                      <text x={cx} y={cy + 10} dy={8} textAnchor="middle" fill="#fff" fontSize={12}>
                        {value.toLocaleString()}
                      </text>
                      <text x={cx} y={cy + 30} dy={8} textAnchor="middle" fill="#fff" fontSize={11}>
                        ({(percent * 100).toFixed(1)}%)
                      </text>
                      <Sector
                        cx={cx}
                        cy={cy}
                        innerRadius={innerRadius}
                        outerRadius={outerRadius + 25}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        fill={fill}
                        filter="url(#glow)"
                      />
                      <Sector
                        cx={cx}
                        cy={cy}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        innerRadius={outerRadius + 25}
                        outerRadius={outerRadius + 28}
                        fill={fill}
                      />
                    </g>
                  );
                } : undefined}
                onClick={onPieEnter}
                // @ts-ignore
                activeIndex={activeIndex}
              >
                {processedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    stroke={activeIndex === index ? "#fff" : "none"}
                    strokeWidth={activeIndex === index ? 2 : 0}
                    opacity={activeIndex === undefined || activeIndex === index ? 1 : 0.15}
                    style={{ cursor: 'pointer', outline: 'none' }}
                  />
                ))}
              </Pie>
              <Tooltip content={() => null} cursor={false} />

            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
