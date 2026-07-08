import React, { createContext, useContext, useState, ReactNode, useRef, useEffect } from 'react';

interface TooltipContextType {
  showTooltip: (content: string, rect: DOMRect) => void;
  hideTooltip: () => void;
}

const TooltipContext = createContext<TooltipContextType | undefined>(undefined);

export const TooltipProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tooltipState, setTooltipState] = useState<{ content: string; rect: DOMRect } | null>(null);
  
  const showTooltip = (content: string, rect: DOMRect) => {
    setTooltipState({ content, rect });
  };
  
  const hideTooltip = () => {
    setTooltipState(null);
  };

  // Ensure tooltips hide on scroll to prevent detached floating text
  useEffect(() => {
    const handleScroll = () => hideTooltip();
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, []);

  return (
    <TooltipContext.Provider value={{ showTooltip, hideTooltip }}>
      {children}
      {tooltipState && (
        <div 
          className="fixed z-[9999] px-3 py-2 text-xs font-medium text-white bg-slate-800 rounded-lg shadow-lg pointer-events-none max-w-[250px] leading-relaxed text-center"
          style={{
            top: tooltipState.rect.top - 10 + 'px',
            left: tooltipState.rect.left + tooltipState.rect.width / 2 + 'px',
            transform: 'translate(-50%, -100%)',
          }}
        >
          {tooltipState.content}
          <div 
            className="absolute left-1/2 -bottom-1 w-2 h-2 bg-slate-800 transform -translate-x-1/2 rotate-45"
          />
        </div>
      )}
    </TooltipContext.Provider>
  );
};

export const useTooltip = () => {
  const context = useContext(TooltipContext);
  if (context === undefined) {
    throw new Error('useTooltip must be used within a TooltipProvider');
  }
  return context;
};

export const TooltipWrapper: React.FC<{ content: string; children: ReactNode; className?: string }> = ({ content, children, className }) => {
  const { showTooltip, hideTooltip } = useTooltip();
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      showTooltip(content, triggerRef.current.getBoundingClientRect());
    }
  };

  return (
    <div 
      ref={triggerRef} 
      className={`inline-flex items-center justify-center cursor-help ${className || ''}`}
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={hideTooltip}
    >
      {children}
    </div>
  );
};
