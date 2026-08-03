import { Controller } from "react-hook-form";
import { FileText, Tag, Building2, Flag, Shield, Send, CalendarClock } from "lucide-react";
import BaseInput from "../../shared/BaseInput";

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
  { value: "CRITICAL", label: "Critical" },
];

const CONFIDENTIALITY_OPTIONS = [
  { value: "PUBLIC", label: "Public" },
  { value: "INTERNAL", label: "Internal" },
  { value: "CONFIDENTIAL", label: "Confidential" },
  { value: "SECRET", label: "Secret" },
  { value: "TOP_SECRET", label: "Top Secret" },
];

const SOURCE_OPTIONS = [
  { value: "WALK_IN", label: "Walk-In" },
  { value: "POST", label: "Post" },
  { value: "EMAIL", label: "Email" },
  { value: "FAX", label: "Fax" },
  { value: "PORTAL", label: "Portal" },
  { value: "INTERNAL", label: "Internal" },
  { value: "COURIER", label: "Courier" },
  { value: "HAND_DELIVERY", label: "Hand Delivery" },
];

const FileDetailsStep = ({ control, errors, categoryOptions, departmentOptions, optionsLoading }) => (
  <div className="space-y-5">
    <Controller
      name="title"
      control={control}
      render={({ field }) => (
        <BaseInput
          label="File Title"
          name="title"
          required
          value={field.value}
          onChange={(_, value) => field.onChange(value)}
          placeholder="e.g. Business Permit Application - Amina Hassan"
          leftIcon={<FileText size={16} />}
          error={errors.title?.message}
          helperText={errors.title ? undefined : `${field.value?.length ?? 0}/500 characters`}
        />
      )}
    />

    <Controller
      name="description"
      control={control}
      render={({ field }) => (
        <BaseInput
          as="textarea"
          rows={3}
          label="Description"
          name="description"
          value={field.value}
          onChange={(_, value) => field.onChange(value)}
          placeholder="Optional -- additional context about this file..."
          error={errors.description?.message}
          helperText={errors.description ? undefined : `${field.value?.length ?? 0}/2000 characters`}
        />
      )}
    />

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <Controller
        name="categoryId"
        control={control}
        render={({ field }) => (
          <BaseInput
            as="select"
            label="Category"
            name="categoryId"
            required
            value={field.value}
            onChange={(_, value) => field.onChange(value)}
            placeholder={optionsLoading ? "Loading..." : "Select a category"}
            options={categoryOptions}
            leftIcon={<Tag size={16} />}
            error={errors.categoryId?.message}
            disabled={optionsLoading}
          />
        )}
      />
      <Controller
        name="departmentId"
        control={control}
        render={({ field }) => (
          <BaseInput
            as="select"
            label="Department"
            name="departmentId"
            required
            value={field.value}
            onChange={(_, value) => field.onChange(value)}
            placeholder={optionsLoading ? "Loading..." : "Select a department"}
            options={departmentOptions}
            leftIcon={<Building2 size={16} />}
            error={errors.departmentId?.message}
            disabled={optionsLoading}
          />
        )}
      />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      <Controller
        name="priority"
        control={control}
        render={({ field }) => (
          <BaseInput
            as="select"
            label="Priority"
            name="priority"
            value={field.value}
            onChange={(_, value) => field.onChange(value)}
            options={PRIORITY_OPTIONS}
            leftIcon={<Flag size={16} />}
          />
        )}
      />
      <Controller
        name="confidentiality"
        control={control}
        render={({ field }) => (
          <BaseInput
            as="select"
            label="Confidentiality"
            name="confidentiality"
            value={field.value}
            onChange={(_, value) => field.onChange(value)}
            options={CONFIDENTIALITY_OPTIONS}
            leftIcon={<Shield size={16} />}
          />
        )}
      />
      <Controller
        name="source"
        control={control}
        render={({ field }) => (
          <BaseInput
            as="select"
            label="Source"
            name="source"
            value={field.value}
            onChange={(_, value) => field.onChange(value)}
            options={SOURCE_OPTIONS}
            leftIcon={<Send size={16} />}
          />
        )}
      />
    </div>

    <Controller
      name="dueDate"
      control={control}
      render={({ field }) => (
        <BaseInput
          type="date"
          label="Due Date"
          name="dueDate"
          value={field.value}
          onChange={(_, value) => field.onChange(value)}
          leftIcon={<CalendarClock size={16} />}
          error={errors.dueDate?.message}
          helperText={errors.dueDate ? undefined : "Optional -- when this file needs to be actioned by."}
        />
      )}
    />
  </div>
);

export default FileDetailsStep;
