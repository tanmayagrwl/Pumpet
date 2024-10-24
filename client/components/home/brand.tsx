"use client"
import React, { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { BrandInfoForm } from "../brand-info-form";

function Brand() {
  const [modalShow, setModalShow] = useState<boolean>(false)
  return (
    <div className="flex w-full bg-[#E2EBFD] p-10 items-center justify-around">
       <Dialog open={modalShow} onOpenChange={setModalShow}>
        <DialogTitle></DialogTitle>
        <DialogContent className="sm:max-w-[425px]">
          <BrandInfoForm onSubmitForm={() => setModalShow(false)} />
        </DialogContent>
      </Dialog>
      <div>
        <h2 className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
          Are you an opportunistic brand?
        </h2>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          Looking forward to collaborate with us?
        </p>
      </div>
      <Button className="bg-[#FFC530] text-black hover:bg-[#e4ae23]" onClick={()=>setModalShow(true)}>Let's work together!</Button>
    </div>
  ); 
}

export default Brand;
