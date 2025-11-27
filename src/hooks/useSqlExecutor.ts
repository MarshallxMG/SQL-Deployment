import { useState, useRef } from 'react';
import { useToast } from '@/components/ui/Toast';

export function useSqlExecutor(
  connectionConfig: any, 
  isConnected: boolean, 
  addToHistory: (query: string, status: 'success' | 'error', duration: number, rows?: any[], msg?: string) => void,
  fetchSchema: (config: any) => void
) {
  const [results, setResults] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [executing, setExecuting] = useState(false);
  const { error } = useToast();

  const executeQuery = async (queryToRun: string) => {
    if (!isConnected) return false;
    setExecuting(true);
    const startTime = Date.now();

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...connectionConfig, query: queryToRun }),
      });
      const data = await res.json();
      const duration = Date.now() - startTime;
      
      if (data.success) {
        setResults(data.rows);
        setFields(data.fields);
        addToHistory(queryToRun, 'success', duration, data.rows);
        fetchSchema(connectionConfig); // Refresh schema
        return true;
      } else {
        error('Error: ' + data.message);
        addToHistory(queryToRun, 'error', duration, [], data.message);
        return false;
      }
    } catch (err) {
      error('Execution failed');
      addToHistory(queryToRun, 'error', Date.now() - startTime);
      return false;
    } finally {
      setExecuting(false);
    }
  };

  return { results, fields, executing, executeQuery, setResults, setFields };
}
