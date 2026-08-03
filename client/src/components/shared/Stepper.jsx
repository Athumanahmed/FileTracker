import { Fragment } from "react";
import { Check } from "lucide-react";

/**
 * Horizontal step indicator for multi-step forms. `steps`: [{ id, label }].
 * `currentStepIndex` is 0-based. Completed steps are clickable (jump back)
 * when `onStepClick` is given -- upcoming steps never are, since their
 * fields haven't been validated yet.
 */
const Stepper = ({ steps, currentStepIndex, onStepClick }) => (
  <div className="flex items-start">
    {steps.map((step, index) => {
      const isCompleted = index < currentStepIndex;
      const isCurrent = index === currentStepIndex;
      const isClickable = isCompleted && Boolean(onStepClick);

      return (
        <Fragment key={step.id}>
          <button
            type="button"
            disabled={!isClickable}
            onClick={() => isClickable && onStepClick(index)}
            className={`flex flex-col items-center gap-1.5 shrink-0 ${isClickable ? "cursor-pointer" : "cursor-default"}`}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                isCompleted
                  ? "bg-primaryBlue text-white"
                  : isCurrent
                    ? "bg-primaryBlueLight text-primaryBlue ring-2 ring-primaryBlue"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {isCompleted ? <Check size={16} /> : index + 1}
            </span>
            <span className={`text-xs font-medium whitespace-nowrap ${isCurrent ? "text-primaryBlue" : isCompleted ? "text-gray-700" : "text-gray-400"}`}>
              {step.label}
            </span>
          </button>

          {index < steps.length - 1 && (
            <span className={`flex-1 h-px mt-4.5 mx-2 transition-colors ${isCompleted ? "bg-primaryBlue" : "bg-gray-200"}`} />
          )}
        </Fragment>
      );
    })}
  </div>
);

export default Stepper;
