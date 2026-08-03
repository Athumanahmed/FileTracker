import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { FileText, User, Paperclip, ListChecks, ChevronLeft, ChevronRight, Send, Loader2 } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import Stepper from "../../components/shared/Stepper";
import FileDetailsStep from "../../components/files/register/FileDetailsStep";
import CitizenStep from "../../components/files/register/CitizenStep";
import AttachmentsStep from "../../components/files/register/AttachmentsStep";
import ReviewStep from "../../components/files/register/ReviewStep";
import FileRegisteredModal from "../../components/files/FileRegisteredModal";
import { useFileCategories } from "../../hooks/useFileCategories";
import { useDepartments } from "../../hooks/useDepartments";
import { useCreateFile } from "../../hooks/useCreateFile";

// Mirrors server/validators/file.validation.js's registerFileValidationRules
// field-for-field, so nothing that passes here gets rejected server-side.
const registerFileSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(500, "Title must be at most 500 characters"),
    description: z.string().trim().max(2000, "Description must be at most 2000 characters").optional().or(z.literal("")),
    categoryId: z.string().trim().min(1, "Category is required"),
    departmentId: z.string().trim().min(1, "Department is required"),
    priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT", "CRITICAL"]),
    confidentiality: z.enum(["PUBLIC", "INTERNAL", "CONFIDENTIAL", "SECRET", "TOP_SECRET"]),
    source: z.enum(["WALK_IN", "POST", "EMAIL", "FAX", "PORTAL", "INTERNAL", "COURIER", "HAND_DELIVERY"]),
    dueDate: z.string().optional().or(z.literal("")),

    linkCitizen: z.boolean(),
    citizenFirstName: z.string().trim().optional().or(z.literal("")),
    citizenMiddleName: z.string().trim().optional().or(z.literal("")),
    citizenLastName: z.string().trim().optional().or(z.literal("")),
    citizenNationalId: z.string().trim().optional().or(z.literal("")),
    citizenPhoneNumber: z.string().trim().optional().or(z.literal("")),
    citizenEmail: z.string().trim().email("Enter a valid email address").optional().or(z.literal("")),
    citizenPhysicalAddress: z.string().trim().optional().or(z.literal("")),
    citizenOrganizationName: z.string().trim().optional().or(z.literal("")),
  })
  .refine((data) => !data.linkCitizen || data.citizenFirstName, {
    message: "First name is required",
    path: ["citizenFirstName"],
  })
  .refine((data) => !data.linkCitizen || data.citizenLastName, {
    message: "Last name is required",
    path: ["citizenLastName"],
  });

const defaultValues = {
  title: "",
  description: "",
  categoryId: "",
  departmentId: "",
  priority: "NORMAL",
  confidentiality: "INTERNAL",
  source: "WALK_IN",
  dueDate: "",
  linkCitizen: false,
  citizenFirstName: "",
  citizenMiddleName: "",
  citizenLastName: "",
  citizenNationalId: "",
  citizenPhoneNumber: "",
  citizenEmail: "",
  citizenPhysicalAddress: "",
  citizenOrganizationName: "",
};

const STEPS = [
  { id: "details", label: "File Details", icon: FileText, fields: ["title", "description", "categoryId", "departmentId", "priority", "confidentiality", "source", "dueDate"] },
  { id: "citizen", label: "Citizen", icon: User, fields: ["citizenFirstName", "citizenLastName", "citizenEmail"] },
  { id: "attachments", label: "Attachments", icon: Paperclip, fields: [] },
  { id: "review", label: "Review & Submit", icon: ListChecks, fields: [] },
];

const buildFormData = (values, files) => {
  const formData = new FormData();
  formData.append("title", values.title.trim());
  if (values.description) formData.append("description", values.description.trim());
  formData.append("categoryId", values.categoryId);
  formData.append("departmentId", values.departmentId);
  formData.append("priority", values.priority);
  formData.append("confidentiality", values.confidentiality);
  formData.append("source", values.source);
  if (values.dueDate) formData.append("dueDate", new Date(values.dueDate).toISOString());

  if (values.linkCitizen) {
    formData.append(
      "citizen",
      JSON.stringify({
        firstName: values.citizenFirstName.trim(),
        middleName: values.citizenMiddleName?.trim() || undefined,
        lastName: values.citizenLastName.trim(),
        nationalId: values.citizenNationalId?.trim() || undefined,
        phoneNumber: values.citizenPhoneNumber?.trim() || undefined,
        email: values.citizenEmail?.trim() || undefined,
        physicalAddress: values.citizenPhysicalAddress?.trim() || undefined,
        organizationName: values.citizenOrganizationName?.trim() || undefined,
      }),
    );
  }

  files.forEach((file) => formData.append("attachments", file));
  return formData;
};

const RegisterFile = () => {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [files, setFiles] = useState([]);
  const [registeredFile, setRegisteredFile] = useState(null);

  const { data: categories, isLoading: categoriesLoading } = useFileCategories();
  const { data: departments, isLoading: departmentsLoading } = useDepartments();
  const { mutate: submitFile, isPending } = useCreateFile();

  const {
    control,
    handleSubmit,
    trigger,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerFileSchema),
    defaultValues,
  });

  const linkCitizen = watch("linkCitizen");
  const values = watch();

  const categoryOptions = useMemo(() => (categories ?? []).map((c) => ({ value: c.id, label: c.name })), [categories]);
  const departmentOptions = useMemo(() => (departments ?? []).map((d) => ({ value: d.id, label: d.name })), [departments]);
  const optionsLoading = categoriesLoading || departmentsLoading;

  const categoryLabel = categoryOptions.find((c) => c.value === values.categoryId)?.label;
  const departmentLabel = departmentOptions.find((d) => d.value === values.departmentId)?.label;

  const isLastStep = stepIndex === STEPS.length - 1;

  // Extra safety margin on top of removing native form submission entirely
  // (see the <form> below): the Review step's submit button sits in the
  // exact screen position "Next" occupied a moment ago, so a fast repeat
  // click landing there the instant the step changes must not register.
  const [reviewArmed, setReviewArmed] = useState(false);
  useEffect(() => {
    if (!isLastStep) {
      setReviewArmed(false);
      return;
    }
    const timer = setTimeout(() => setReviewArmed(true), 350);
    return () => clearTimeout(timer);
  }, [isLastStep]);

  const goToStep = (index) => setStepIndex(index);

  const handleNext = async () => {
    const fieldsToValidate = STEPS[stepIndex].fields;
    const valid = fieldsToValidate.length ? await trigger(fieldsToValidate) : true;
    if (!valid) return;
    setStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => setStepIndex((prev) => Math.max(prev - 1, 0));

  const onSubmit = (formValues) => {
    // Belt-and-suspenders alongside handleFormKeyDown -- registration can
    // only actually fire from the Review step, no matter what triggered
    // the form's submit event.
    if (stepIndex !== STEPS.length - 1) return;

    const formData = buildFormData(formValues, files);
    submitFile(formData, {
      onSuccess: (file) => setRegisteredFile(file),
      onError: (error) => toast.error(error?.response?.data?.message || "Unable to register file. Please try again."),
    });
  };

  const resetWizard = () => {
    reset(defaultValues);
    setFiles([]);
    setStepIndex(0);
  };

  return (
    <div className="p-2 xl:p-4">
      <PageHeader
        title="Register File"
        description="Create a new file record and route it into the system."
        breadcrumbs={[{ label: "Dashboard", to: "/registry" }, { label: "Files", to: "/registry/files" }, { label: "Register File" }]}
        backTo="/registry/files"
      />

      <div className="mb-8 overflow-x-auto">
        <Stepper steps={STEPS} currentStepIndex={stepIndex} onStepClick={goToStep} />
      </div>

      {/*
        Deliberately no native form submission anywhere in this wizard --
        onSubmit unconditionally no-ops, and every button (including the
        final one) is type="button" with an explicit onClick. This isn't
        belt-and-suspenders on top of handleFormKeyDown, it replaces that
        approach entirely: there is no code path left (Enter key, a stray
        click landing on a relabeled button, browser implicit submission)
        that can submit this form except the Review step's button calling
        handleSubmit(onSubmit) directly.
      */}
      <form onSubmit={(e) => e.preventDefault()} noValidate className="max-w-3xl">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm min-h-80">
          {stepIndex === 0 && (
            <FileDetailsStep
              control={control}
              errors={errors}
              categoryOptions={categoryOptions}
              departmentOptions={departmentOptions}
              optionsLoading={optionsLoading}
            />
          )}
          {stepIndex === 1 && (
            <CitizenStep
              control={control}
              errors={errors}
              linkCitizen={linkCitizen}
              onToggle={(value) => setValue("linkCitizen", value)}
            />
          )}
          {stepIndex === 2 && <AttachmentsStep files={files} onFilesChange={setFiles} />}
          {stepIndex === 3 && <ReviewStep values={values} categoryLabel={categoryLabel} departmentLabel={departmentLabel} files={files} />}
        </div>

        <div className="flex items-center justify-between mt-5">
          <button
            type="button"
            onClick={handleBack}
            disabled={stepIndex === 0 || isPending}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
            Back
          </button>

          {isLastStep ? (
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isPending || !reviewArmed}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primaryBlue px-6 py-2.5 text-sm font-semibold text-white hover:bg-primaryBlueDark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Register File
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primaryBlue px-6 py-2.5 text-sm font-semibold text-white hover:bg-primaryBlueDark transition-colors"
            >
              Next
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </form>

      <FileRegisteredModal
        file={registeredFile}
        onClose={() => setRegisteredFile(null)}
        onRegisterAnother={() => {
          setRegisteredFile(null);
          resetWizard();
        }}
        onViewFile={() => navigate(`/registry/files/${registeredFile.id}`)}
      />
    </div>
  );
};

export default RegisterFile;
