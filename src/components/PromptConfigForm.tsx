import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  JobContextSchema,
  type JobContextFormValues,
} from "../utils/validation";
import { useAppState } from "../store/useAppState";

/**
 * Props for the PromptConfigForm component
 */
interface PromptConfigFormProps {
  /** Callback when the form is submitted with valid data */
  onSubmit: (data: JobContextFormValues) => void;
  /** Default values to pre-populate the form fields */
  defaultValues?: Partial<JobContextFormValues>;
}

/**
 * Job context configuration form
 */
export default function PromptConfigForm({
  onSubmit,
  defaultValues,
}: PromptConfigFormProps) {
  const { formData } = useAppState();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<JobContextFormValues>({
    resolver: zodResolver(JobContextSchema),
    defaultValues: {
      analysisDepth: "compact",
      domain: "universal",
      experienceLevel: "Mid",
      ...formData,
      ...defaultValues,
    },
  });

  // Watch all form values and update state on change
  const watchedValues = watch();

  useEffect(() => {
    // Only update the store when form values actually change
    // Don't call onSubmit here to avoid infinite loops
    const currentFormData = useAppState.getState().formData;

    // Only update if values have actually changed
    if (JSON.stringify(currentFormData) !== JSON.stringify(watchedValues)) {
      useAppState.getState().setFormData(watchedValues);
    }
  }, [watchedValues]);

  const onFormSubmit = (data: JobContextFormValues) => {
    useAppState.getState().setFormData(data);
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Analysis Depth */}
      <div>
        <label
          htmlFor="analysisDepth"
          className="block text-sm font-medium mb-2"
        >
          Analysis Depth
        </label>
        <select
          id="analysisDepth"
          {...register("analysisDepth")}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="compact">Compact</option>
          <option value="full">Full Analysis</option>
        </select>
        {errors.analysisDepth && (
          <p className="mt-1 text-sm text-destructive">
            {errors.analysisDepth.message}
          </p>
        )}
      </div>

      {/* Domain */}
      <div>
        <label htmlFor="domain" className="block text-sm font-medium mb-2">
          Domain
        </label>
        <select
          id="domain"
          {...register("domain")}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="universal">Universal</option>
          <option value="technical">Technical</option>
          <option value="nonTechnical">Non-Technical</option>
        </select>
        {errors.domain && (
          <p className="mt-1 text-sm text-destructive">
            {errors.domain.message}
          </p>
        )}
      </div>

      {/* Target Role */}
      <div>
        <label htmlFor="targetRole" className="block text-sm font-medium mb-2">
          Target Role <span className="text-destructive">*</span>
        </label>
        <input
          id="targetRole"
          type="text"
          {...register("targetRole")}
          placeholder="e.g., Software Engineer, Product Manager"
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.targetRole && (
          <p className="mt-1 text-sm text-destructive">
            {errors.targetRole.message}
          </p>
        )}
      </div>

      {/* Target Company */}
      <div>
        <label
          htmlFor="targetCompany"
          className="block text-sm font-medium mb-2"
        >
          Target Company <span className="text-destructive">*</span>
        </label>
        <input
          id="targetCompany"
          type="text"
          {...register("targetCompany")}
          placeholder="e.g., Google, Startup, Consulting Firm"
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.targetCompany && (
          <p className="mt-1 text-sm text-destructive">
            {errors.targetCompany.message}
          </p>
        )}
      </div>

      {/* Experience Level */}
      <div>
        <label
          htmlFor="experienceLevel"
          className="block text-sm font-medium mb-2"
        >
          Experience Level
        </label>
        <select
          id="experienceLevel"
          {...register("experienceLevel")}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="Entry">Entry Level</option>
          <option value="Mid">Mid Level</option>
          <option value="Senior">Senior Level</option>
        </select>
        {errors.experienceLevel && (
          <p className="mt-1 text-sm text-destructive">
            {errors.experienceLevel.message}
          </p>
        )}
      </div>

      {/* Geographic Focus (Optional) */}
      <div>
        <label
          htmlFor="geographicFocus"
          className="block text-sm font-medium mb-2"
        >
          Geographic Focus{" "}
          <span className="text-muted-foreground">(optional)</span>
        </label>
        <input
          id="geographicFocus"
          type="text"
          {...register("geographicFocus")}
          placeholder="e.g., San Francisco, Remote, EU"
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.geographicFocus && (
          <p className="mt-1 text-sm text-destructive">
            {errors.geographicFocus.message}
          </p>
        )}
      </div>

      {/* Special Focus (Optional) */}
      <div>
        <label
          htmlFor="specialFocus"
          className="block text-sm font-medium mb-2"
        >
          Special Focus{" "}
          <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="specialFocus"
          {...register("specialFocus")}
          placeholder="Any specific areas to focus on or concerns to address?"
          rows={3}
          className="w-full px-3 py-2 border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.specialFocus && (
          <p className="mt-1 text-sm text-destructive">
            {errors.specialFocus.message}
          </p>
        )}
      </div>
    </form>
  );
}
