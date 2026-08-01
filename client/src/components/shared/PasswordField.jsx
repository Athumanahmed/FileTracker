import { useState } from "react";
import { Controller } from "react-hook-form";
import { Lock, Eye, EyeOff } from "lucide-react";
import BaseInput from "./BaseInput";

/** Password BaseInput wired to react-hook-form with a self-contained show/hide toggle. */
const PasswordField = ({ name, label, control, error, placeholder, disabled, autoComplete = "new-password" }) => {
  const [visible, setVisible] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <BaseInput
          label={label}
          name={name}
          type={visible ? "text" : "password"}
          value={field.value}
          onChange={(_, value) => field.onChange(value)}
          placeholder={placeholder}
          leftIcon={<Lock size={16} />}
          rightIcon={visible ? <EyeOff size={16} /> : <Eye size={16} />}
          onRightIconClick={() => setVisible((prev) => !prev)}
          error={error}
          autoComplete={autoComplete}
          disabled={disabled}
        />
      )}
    />
  );
};

export default PasswordField;
