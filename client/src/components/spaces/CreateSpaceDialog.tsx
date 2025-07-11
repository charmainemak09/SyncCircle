import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

  console.log("Dialog render - open state:", open);

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
    console.log("Form submitted with data:", data);
    console.log("Form errors:", form.formState.errors);
    console.log("Form is valid:", form.formState.isValid);
    createSpaceMutation.mutate(data);
  };

  return (
    <>
      <Button 
        className="flex items-center justify-center space-x-2 w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300"
        size="lg"
        onClick={() => {
          console.log("Create Space button clicked - opening dialog");
          console.log("Setting open to true");
          setOpen(true);
          console.log("After setOpen - open should be true");
        }}
      >
        <Plus className="w-4 h-4" />
        <span>Create Space</span>
      </Button>
      
      <Dialog 
        open={open} 
        onOpenChange={(newOpen) => {
          console.log("Dialog onOpenChange called with:", newOpen);
          // Only allow closing via explicit cancel/submit actions
          if (!newOpen) {
            console.log("Preventing automatic dialog close");
            return;
          }
          setOpen(newOpen);
        }}
      >
        <DialogContent 
          className="sm:max-w-[425px] bg-white shadow-2xl border-0" 
          onPointerDownOutside={(e) => e.preventDefault()} 
          onEscapeKeyDown={(e) => e.preventDefault()}
          aria-describedby="create-space-description"
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Create New Space</DialogTitle>
            <DialogDescription id="create-space-description" className="text-gray-600 text-base">
              Set up a new collaboration space for your team to share updates and stay aligned.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Space Name</label>
              <Input 
                placeholder="e.g., Marketing Team" 
                value={form.watch("name")}
                onChange={(e) => form.setValue("name", e.target.value)}
                className="bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Description (Optional)</label>
              <Textarea 
                placeholder="Describe the purpose of this space..."
                rows={3}
                value={form.watch("description") ?? ""}
                onChange={(e) => form.setValue("description", e.target.value)}
                className="bg-gray-50 border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  const name = form.getValues("name");
                  const description = form.getValues("description");
                  if (name.trim()) {
                    onSubmit({ name: name.trim(), description: description || "" });
                  }
                }}
                disabled={createSpaceMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white"
              >
                {createSpaceMutation.isPending ? "Creating..." : "Create Space"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}