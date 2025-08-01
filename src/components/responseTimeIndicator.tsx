import React from 'react';

interface ResponseTimeIndicatorProps {
  llmResponseTime?: number;
  ttsResponseTime?: number;
  isProcessing: boolean;
  className?: string;
}

export const ResponseTimeIndicator: React.FC<ResponseTimeIndicatorProps> = ({
  llmResponseTime,
  ttsResponseTime,
  isProcessing,
  className = ''
}) => {
  const getStatusColor = (time?: number) => {
    if (!time) return 'text-gray-400';
    if (time < 1000) return 'text-green-500';
    if (time < 3000) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusText = (time?: number) => {
    if (!time) return 'N/A';
    if (time < 1000) return 'Fast';
    if (time < 3000) return 'Normal';
    return 'Slow';
  };

  return (
    <div className={`fixed bottom-4 right-4 bg-surface1 bg-opacity-90 backdrop-blur-sm rounded-lg p-4 shadow-lg z-50 ${className}`}>
      <div className="text-sm font-semibold text-text1 mb-2">Response Times</div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text2">LLM API:</span>
          <div className="flex items-center space-x-2">
            {isProcessing && (
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            )}
            <span className={`text-xs font-mono ${getStatusColor(llmResponseTime)}`}>
              {llmResponseTime ? `${llmResponseTime}ms` : 'N/A'}
            </span>
            <span className={`text-xs ${getStatusColor(llmResponseTime)}`}>
              ({getStatusText(llmResponseTime)})
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-text2">TTS API:</span>
          <div className="flex items-center space-x-2">
            {isProcessing && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            )}
            <span className={`text-xs font-mono ${getStatusColor(ttsResponseTime)}`}>
              {ttsResponseTime ? `${ttsResponseTime}ms` : 'N/A'}
            </span>
            <span className={`text-xs ${getStatusColor(ttsResponseTime)}`}>
              ({getStatusText(ttsResponseTime)})
            </span>
          </div>
        </div>
      </div>
      
      {isProcessing && (
        <div className="mt-3 pt-2 border-t border-surface3">
          <div className="text-xs text-text2">Processing...</div>
        </div>
      )}
    </div>
  );
}; 