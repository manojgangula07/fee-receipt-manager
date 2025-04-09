import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const searchFormSchema = z.object({
  classId: z.string().optional(),
  section: z.string().optional(),
  admissionNumber: z.string().optional(),
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

interface ReceiptFormProps {
  onSearchStudent: (data: { classId?: number; section?: string; admissionNumber?: string; }) => void;
  isSearching: boolean;
}

const ReceiptForm = ({ onSearchStudent, isSearching }: ReceiptFormProps) => {
  const [searchDisabled, setSearchDisabled] = useState(true);

  // Get all classes
  const { data: classes, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['/api/classes'],
  });

  // Form setup
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      classId: "",
      section: "",
      admissionNumber: "",
    },
  });

  // Watch form values to enable/disable search button
  const { classId, section, admissionNumber } = form.watch();

  useEffect(() => {
    // Enable search if at least one field has a value
    setSearchDisabled(!(classId || section || admissionNumber));
  }, [classId, section, admissionNumber]);

  // Handle form submission
  const onSubmit = (data: SearchFormValues) => {
    onSearchStudent({
      classId: data.classId ? parseInt(data.classId) : undefined,
      section: data.section,
      admissionNumber: data.admissionNumber,
    });
  };

  return (
    <div className="p-4 border-b bg-background-light">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="classId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-text-secondary text-sm font-medium">Class</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoadingClasses}
                  >
                    <SelectTrigger className="w-full p-2 border border-background-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingClasses ? (
                        <Skeleton className="h-24 w-full" />
                      ) : (
                        <>
                          <SelectItem value="none">Select Class</SelectItem>
                          {classes?.map((cls: { id: number; name: string }) => (
                            <SelectItem key={cls.id} value={cls.id.toString()}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="section"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-text-secondary text-sm font-medium">Section</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger className="w-full p-2 border border-background-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                      <SelectValue placeholder="Select Section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select Section</SelectItem>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="admissionNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-text-secondary text-sm font-medium">Admission Number</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., ADM2023001"
                    className="w-full p-2 border border-background-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <div className="flex items-end">
            <Button
              type="submit"
              variant="default"
              className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center"
              disabled={searchDisabled || isSearching}
            >
              <span className="material-icons mr-1 text-sm">
                {isSearching ? "hourglass_empty" : "search"}
              </span>
              <span>{isSearching ? "Searching..." : "Search Student"}</span>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ReceiptForm;
