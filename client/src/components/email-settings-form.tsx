import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { insertEmailSettingsSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type FormData = {
  smtpServer: string;
  smtpPort: number;
  fromEmail: string;
  toEmails: string;
  username?: string;
  password?: string;
  isEnabled: boolean;
};

export default function EmailSettingsForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/email-settings"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(insertEmailSettingsSchema),
    defaultValues: {
      smtpServer: "",
      smtpPort: 587,
      fromEmail: "",
      toEmails: "",
      username: "",
      password: "",
      isEnabled: true,
    },
  });

  // Update form when settings load using useEffect
  React.useEffect(() => {
    if (settings && !form.formState.isDirty) {
      form.reset({
        smtpServer: settings.smtpServer,
        smtpPort: settings.smtpPort,
        fromEmail: settings.fromEmail,
        toEmails: settings.toEmails,
        username: settings.username || "",
        password: settings.password || "",
        isEnabled: settings.isEnabled,
      });
    }
  }, [settings, form]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/email-settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-settings"] });
      toast({
        title: "Success",
        description: "Email settings saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save email settings",
        variant: "destructive",
      });
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/email-settings/test");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test email sent successfully! Check your inbox.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send test email. Check your settings.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    saveSettingsMutation.mutate(data);
  };

  const handleTestEmail = () => {
    testEmailMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="text-slate-600 mr-2 w-5 h-5" />
            Email Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mail className="text-slate-600 mr-2 w-5 h-5" />
          이메일 알림 설정
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="isEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <FormLabel className="text-base">Enable Email Notifications</FormLabel>
                    <p className="text-sm text-slate-500">Send alerts when websites go down or recover</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="smtpServer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SMTP Server</FormLabel>
                    <FormControl>
                      <Input placeholder="smtp.gmail.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="smtpPort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Port</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="587"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="fromEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="alerts@yourcompany.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="toEmails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alert Recipients</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="admin@yourcompany.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SMTP Username (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="your.email@gmail.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SMTP Password (optional)</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="your-app-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline"
                onClick={handleTestEmail}
                disabled={testEmailMutation.isPending || !form.getValues("isEnabled")}
              >
                <Send className="w-4 h-4 mr-2" />
                {testEmailMutation.isPending ? "Sending..." : "Send Test Email"}
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={saveSettingsMutation.isPending}
              >
                {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
