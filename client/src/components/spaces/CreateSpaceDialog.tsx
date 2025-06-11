import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSpaceSchema } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { z } from "zod";

const createSpaceSchema = insertSpaceSchema.extend({
  name: z.string().min(1, "Name is required"),
});

type CreateSpaceData = z.infer<typeof createSpaceSchema>;

export function CreateSpaceDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateSpaceData>({
    resolver: zodResolver(createSpaceSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const createSpaceMutation = useMutation({
    mutationFn: (data: CreateSpaceData) => apiRequest("POST", "/api/spaces", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spaces"] });
      toast({
        title: "Space created successfully",
        description: "Your new collaboration space is ready to use.",
      });
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      console.error("Create space error:", error);
      toast({
        title: "Failed to create space",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateSpaceData) => {
    console.log("Submitting space data:", data);
    createSpaceMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Create Space</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Space</DialogTitle>
          <DialogDescription>
            Set up a new collaboration space for your team to share updates and stay aligned.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Space Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Marketing Team" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the purpose of this space..."
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createSpaceMutation.isPending}>
                {createSpaceMutation.isPending ? "Creating..." : "Create Space"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
