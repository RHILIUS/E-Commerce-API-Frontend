import { Radio } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";

import { cn } from "@/app/lib/utils";

function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive className={cn("grid gap-3", className)} {...props} />
  );
}
function RadioGroupItem({ className, ...props }: Radio.Root.Props) {
  return (
    <Radio.Root
      className={cn(
        "border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 data-checked:border-primary flex size-4 shrink-0 items-center justify-center rounded-full border outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <Radio.Indicator className="bg-primary size-2 rounded-full" />
    </Radio.Root>
  );
}
export { RadioGroup, RadioGroupItem };
