import React from "react";
import { Button } from "../ui/button";

function Brand() {
  return (
    <div className="flex w-full bg-[#E2EBFD] p-10 items-center justify-around">
      <div>
        <h2 className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
          Are you an opportunistic brand?
        </h2>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          Looking forward to collaborate with us?
        </p>
      </div>
      <Button className="bg-[#FFC530] text-black hover:bg-[#e4ae23]">Let's work together!</Button>
    </div>
  );
}

export default Brand;
