
import { Button } from "@/components/ui/button";
import { 
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignTop,
  AlignMiddle,
  AlignBottom,
  DistributeHorizontal,
  DistributeVertical
} from "lucide-react";

interface AlignmentToolsProps {
  onAlign: (alignment: string) => void;
  onDistribute: (direction: 'horizontal' | 'vertical') => void;
  disabled?: boolean;
}

export const AlignmentTools = ({ onAlign, onDistribute, disabled = false }: AlignmentToolsProps) => {
  const alignmentButtons = [
    { icon: AlignLeft, action: 'left', title: 'Align Left' },
    { icon: AlignCenter, action: 'center', title: 'Align Center' },
    { icon: AlignRight, action: 'right', title: 'Align Right' },
    { icon: AlignTop, action: 'top', title: 'Align Top' },
    { icon: AlignMiddle, action: 'middle', title: 'Align Middle' },
    { icon: AlignBottom, action: 'bottom', title: 'Align Bottom' },
  ];

  return (
    <div className="flex flex-wrap gap-1">
      {alignmentButtons.map(({ icon: Icon, action, title }) => (
        <Button
          key={action}
          variant="ghost"
          size="sm"
          className="w-8 h-8 p-0"
          onClick={() => onAlign(action)}
          disabled={disabled}
          title={title}
        >
          <Icon className="w-4 h-4" />
        </Button>
      ))}
      
      <div className="w-px h-6 bg-border mx-1" />
      
      <Button
        variant="ghost"
        size="sm"
        className="w-8 h-8 p-0"
        onClick={() => onDistribute('horizontal')}
        disabled={disabled}
        title="Distribute Horizontally"
      >
        <DistributeHorizontal className="w-4 h-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        className="w-8 h-8 p-0"
        onClick={() => onDistribute('vertical')}
        disabled={disabled}
        title="Distribute Vertically"
      >
        <DistributeVertical className="w-4 h-4" />
      </Button>
    </div>
  );
};
