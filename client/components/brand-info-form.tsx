"use client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { Textarea } from "./ui/textarea"
import { toast } from "sonner"
import { z } from "zod"
import { isValidPhoneNumber } from "react-phone-number-input"
import { Loader2 } from "lucide-react"
import { sendEmail } from "@/lib/actions/send-email"
import { BrandInfoTemplate } from "@/templates/brand-info-form"
import { render } from "@react-email/render"
export const BrandInfoSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Enter your full name",
    })
    .max(50, {
      message: "Name is too long",
    }),
  company: z.string().max(50, {
    message: "Company name is too long",
  }),
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  message: z.string().max(500, {
    message: "Message is too long",
  }),
  companyType: z.string().optional(),
})

export type RequestDemoType = z.infer<typeof BrandInfoSchema>

interface BrandInfoProps extends React.ComponentPropsWithoutRef<"div"> {
  onSubmitForm?: () => void;
}

export function BrandInfoForm({   onSubmitForm,  className, ...props }: BrandInfoProps) {
  const form = useForm({
    resolver: zodResolver(BrandInfoSchema),
    defaultValues: {
      name: "",
      companyType: "",
      company: "",
      email: "",
      phone: "",
      message: "",
    },
  })

  const onSubmit = form.handleSubmit(async (data) => {
    const template = await render(BrandInfoTemplate(data))

    const result = await sendEmail({
      template,
      subject: "A brand wants to collaborate.",
    })

    if (!result.success) {
      toast.error("Failed to send request. Please try again.")
      return
    }

    toast.success("Request submitted successfully!")

    form.reset()
    onSubmitForm?.();


  })

  return (
    <div className={className} {...props}>
      <div className="text-center w-full mx-auto max-w-xs">
        <h2 className="text-lg font-semibold">Request Collaboration</h2>
        <p className="text-sm">
          Fill the form below to get in touch.
        </p>
      </div>
      <Form {...form}>
        <form
          onSubmit={onSubmit}
          className="space-y-2 mt-3 w-full max-w-sm mx-auto"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel className="flex">
                    Name<p className="text-red-500">*</p>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )
            }}
          />
          <FormField
            control={form.control}
            name="companyType"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Company Type</FormLabel>
                  <FormControl>
                  <Input placeholder="Technology" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )
            }}
          />
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input placeholder="Company Inc." {...field} />
                  </FormControl>
                  <FormDescription className="ml-1">
                    If you&apos;re an individual, enter Individual
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )
            }}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel className="flex">
                    Email<p className="text-red-500">*</p>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )
            }}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <PhoneInput
                      defaultCountry="US"
                      placeholder="9876543210"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )
            }}
          />
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel className="flex gap-x-1">
                    Message <p className="text-slate-500">(optional)</p>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us a bit about yourself"
                      className="resize-none h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="ml-1 flex justify-between">
                    <span>0 - 250 characters</span>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        field.value.length < 10 || field.value.length > 250
                          ? "text-destructive"
                          : "text-muted-foreground"
                      )}
                    >
                      {field.value.length}
                    </span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )
            }}
          />
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="bg-brand text-brand-foreground hover:bg-brand/90 font-semibold mt-10 w-full"
          >
            {form.formState.isSubmitting && (
              <Loader2 className="animate-spin inline-block mr-2" size={20} />
            )}
            Request Collaboration
          </Button>
        </form>
      </Form>
    </div>
  )
}
