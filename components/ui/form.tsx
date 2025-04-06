"use client"

import * as React from "react"
import {
  useForm as useReactHookForm,
  UseFormProps as UseReactHookFormProps,
  FieldValues,
  FormProvider,
  SubmitHandler,
  UseFormReturn,
} from "react-hook-form"
import { cn } from "@/lib/utils"

// Form Root - Agora apenas um wrapper para FormProvider
const Form = <
  TFieldValues extends FieldValues = FieldValues,
  TContext = any,
  TTransformedValues extends FieldValues | undefined = undefined,
>({
  children,
  ...formMethods // Recebe todos os métodos/estado do useForm via spread
}: React.PropsWithChildren<UseFormReturn<TFieldValues, TContext, TTransformedValues>>) => {
  return (
    <FormProvider {...formMethods}>
      {/* Removemos a tag <form> daqui */}
      {children}
    </FormProvider>
  )
}
Form.displayName = "Form"

// Form Field
const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends string = string,
>({
  name,
  children,
  ...props
}: React.PropsWithChildren<{
  name: TName
}>) => {
  return children
}
FormField.displayName = "FormField"

// Form Item
const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("space-y-2", className)} {...props} />
  )
})
FormItem.displayName = "FormItem"

// Form Label
const FormLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

// Form Control
const FormControl = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ ...props }, ref) => {
  return <div ref={ref} {...props} />
})
FormControl.displayName = "FormControl"

// Form Description
const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm text-neutral-500", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

// Form Message
const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm font-medium text-red-500", className)}
      {...props}
    >
      {children}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
} 