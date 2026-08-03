import { Controller } from "react-hook-form";
import { User, IdCard, Phone, Mail, MapPin, Building } from "lucide-react";
import BaseInput from "../../shared/BaseInput";

const CitizenStep = ({ control, errors, linkCitizen, onToggle }) => (
  <div className="space-y-5">
    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4">
      <div>
        <p className="text-sm font-semibold text-gray-900">This file relates to a citizen</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Turn this on for applications, complaints or requests filed by a member of the public. A matching record
          (by national ID or phone) is reused automatically -- nothing is duplicated.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={linkCitizen}
        onClick={() => onToggle(!linkCitizen)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          linkCitizen ? "bg-primaryBlue" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform ${
            linkCitizen ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>

    {linkCitizen ? (
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Controller
            name="citizenFirstName"
            control={control}
            render={({ field }) => (
              <BaseInput
                label="First Name"
                name="citizenFirstName"
                required
                value={field.value}
                onChange={(_, value) => field.onChange(value)}
                leftIcon={<User size={16} />}
                error={errors.citizenFirstName?.message}
              />
            )}
          />
          <Controller
            name="citizenMiddleName"
            control={control}
            render={({ field }) => (
              <BaseInput
                label="Middle Name"
                name="citizenMiddleName"
                value={field.value}
                onChange={(_, value) => field.onChange(value)}
                leftIcon={<User size={16} />}
              />
            )}
          />
          <Controller
            name="citizenLastName"
            control={control}
            render={({ field }) => (
              <BaseInput
                label="Last Name"
                name="citizenLastName"
                required
                value={field.value}
                onChange={(_, value) => field.onChange(value)}
                leftIcon={<User size={16} />}
                error={errors.citizenLastName?.message}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Controller
            name="citizenNationalId"
            control={control}
            render={({ field }) => (
              <BaseInput
                label="National ID"
                name="citizenNationalId"
                value={field.value}
                onChange={(_, value) => field.onChange(value)}
                leftIcon={<IdCard size={16} />}
                helperText="Used to match an existing citizen record, if one exists."
              />
            )}
          />
          <Controller
            name="citizenPhoneNumber"
            control={control}
            render={({ field }) => (
              <BaseInput
                type="tel"
                label="Phone Number"
                name="citizenPhoneNumber"
                value={field.value}
                onChange={(_, value) => field.onChange(value)}
                placeholder="e.g. 255712345678"
                leftIcon={<Phone size={16} />}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Controller
            name="citizenEmail"
            control={control}
            render={({ field }) => (
              <BaseInput
                type="email"
                label="Email"
                name="citizenEmail"
                value={field.value}
                onChange={(_, value) => field.onChange(value)}
                leftIcon={<Mail size={16} />}
                error={errors.citizenEmail?.message}
              />
            )}
          />
          <Controller
            name="citizenOrganizationName"
            control={control}
            render={({ field }) => (
              <BaseInput
                label="Organization (if applicable)"
                name="citizenOrganizationName"
                value={field.value}
                onChange={(_, value) => field.onChange(value)}
                placeholder="Acting on behalf of a company/institution"
                leftIcon={<Building size={16} />}
              />
            )}
          />
        </div>

        <Controller
          name="citizenPhysicalAddress"
          control={control}
          render={({ field }) => (
            <BaseInput
              as="textarea"
              rows={2}
              label="Physical Address"
              name="citizenPhysicalAddress"
              value={field.value}
              onChange={(_, value) => field.onChange(value)}
              leftIcon={<MapPin size={16} />}
            />
          )}
        />
      </div>
    ) : (
      <p className="text-sm text-gray-400 text-center py-8">This is an internal file with no citizen attached.</p>
    )}
  </div>
);

export default CitizenStep;
