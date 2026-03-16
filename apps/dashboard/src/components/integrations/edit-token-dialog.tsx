"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@notra/ui/components/shared/responsive-dialog";
import { Button } from "@notra/ui/components/ui/button";
import { Field, FieldLabel } from "@notra/ui/components/ui/field";
import { Input } from "@notra/ui/components/ui/input";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { isValidElement, useState } from "react";
import { toast } from "sonner";
import {
  type EditGitHubTokenFormValues,
  editGitHubTokenFormSchema,
} from "@/schemas/integrations";
import type { EditTokenDialogProps } from "@/types/integrations";
import { QUERY_KEYS } from "@/utils/query-keys";

export function EditTokenDialog({
  integration,
  organizationId,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: EditTokenDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  const queryClient = useQueryClient();
  const repository = integration.repositories[0];

  const mutation = useMutation({
    mutationFn: async (values: EditGitHubTokenFormValues) => {
      const response = await fetch(
        `/api/organizations/${organizationId}/integrations/${integration.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: values.token,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update personal access token");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.INTEGRATIONS.base,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.INTEGRATIONS.detail(
          organizationId,
          integration.id
        ),
      });
      toast.success("Personal access token updated");
      form.reset();
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const form = useForm({
    defaultValues: {
      token: "",
    },
    onSubmit: ({ value }) => {
      const validationResult = editGitHubTokenFormSchema.safeParse(value);
      if (!validationResult.success) {
        return;
      }
      mutation.mutate(validationResult.data);
    },
  });

  const triggerElement =
    trigger && isValidElement(trigger) ? (
      <ResponsiveDialogTrigger render={trigger as React.ReactElement} />
    ) : null;

  return (
    <>
      {triggerElement}
      <ResponsiveDialog onOpenChange={setOpen} open={open}>
        <ResponsiveDialogContent className="sm:max-w-[500px]">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle className="text-2xl">
              Update Personal Access Token
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {repository
                ? `Replace the GitHub token used for ${repository.owner}/${repository.repo}.`
                : "Replace the GitHub token used for this integration."}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <div className="space-y-4 py-4">
              <form.Field
                name="token"
                validators={{
                  onChange: editGitHubTokenFormSchema.shape.token,
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel>GitHub Personal Access Token</FieldLabel>
                    <Input
                      autoComplete="off"
                      disabled={mutation.isPending}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="github_pat_..."
                      type="password"
                      value={field.state.value}
                    />
                    {field.state.meta.errors.length > 0 ? (
                      <p className="mt-1 text-destructive text-sm">
                        {typeof field.state.meta.errors[0] === "string"
                          ? field.state.meta.errors[0]
                          : ((
                              field.state.meta.errors[0] as { message?: string }
                            )?.message ?? "Invalid value")}
                      </p>
                    ) : null}
                    <p className="mt-2 text-muted-foreground text-xs">
                      <a
                        className="text-primary hover:underline"
                        href="https://github.com/settings/tokens/new?scopes=repo&description=Notra%20Integration"
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        Generate a token on GitHub
                      </a>{" "}
                      with <code className="text-xs">repo</code> scope.
                    </p>
                  </Field>
                )}
              </form.Field>
            </div>
            <ResponsiveDialogFooter>
              <ResponsiveDialogClose
                disabled={mutation.isPending}
                render={<Button variant="outline" />}
              >
                Cancel
              </ResponsiveDialogClose>
              <form.Subscribe selector={(state) => [state.canSubmit]}>
                {([canSubmit]) => (
                  <Button
                    disabled={!canSubmit || mutation.isPending}
                    onClick={(e) => {
                      e.preventDefault();
                      form.handleSubmit();
                    }}
                    type="button"
                  >
                    {mutation.isPending ? "Saving..." : "Save Token"}
                  </Button>
                )}
              </form.Subscribe>
            </ResponsiveDialogFooter>
          </form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}
