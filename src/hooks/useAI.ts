import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';

export function useAI(
  schema: any,
  setQuery: (query: string) => void,
  setVisualizationConfig: (config: any) => void,
  setActiveView: (view: any) => void,
  executeQuery: (query: string) => Promise<boolean>
) {
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);
  const { error } = useToast();

  const generateSql = async (promptOverride?: string) => {
    const promptToUse = promptOverride || aiPrompt;
    if (!promptToUse.trim()) return false;
    
    setGeneratingAi(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptToUse, schemaContext: schema }),
      });
      const data = await res.json();
      
      if (data.success) {
        if (data.sql) {
          setQuery(data.sql);
        }
        
        if (data.visualization) {
          setVisualizationConfig(data.visualization);
        }

        if (data.action) {
          if (data.action === 'VIEW_VISUALIZER') {
            setActiveView('visualizer');
            if (data.sql) {
              await executeQuery(data.sql);
            }
          } else if (data.action === 'VIEW_EER') {
            setActiveView('eer');
            if (data.sql) {
              await executeQuery(data.sql);
            }
          }
        }
      } else {
        error('AI Error: ' + data.message);
        return false;
      }
      return true;
    } catch (err: any) {
      console.error('AI Generation failed', err);
      if (!promptOverride) error('AI Generation failed');
      return false;
    } finally {
      setGeneratingAi(false);
    }
  };

  return { aiPrompt, setAiPrompt, generatingAi, generateSql };
}
