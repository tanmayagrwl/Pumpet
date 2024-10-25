"use client";

import React, { use, useEffect } from "react";
import { BackgroundLines } from "@/components/ui/background-lines";
import { Button } from "../ui/button";
import { authenticate } from "@/lib/actions/user-auth";
import { useRouter } from "next/navigation";
import { getUserProfile } from "@/lib/actions/get-profile";
import Link from "next/link";

export function Landing() {
  const router = useRouter();
  const onSubmit = async () => {
    const authResponse = await authenticate();
    authResponse.data.authUrl && router.push(authResponse.data.authUrl);
    console.log("this is new console", authResponse);
  };

  useEffect(() => {
    const fetchData = async () => {
      const data = await getUserProfile();
      console.log("data from effect hook", data);
    };
    fetchData();
  }, []);

  return (
    <BackgroundLines className="flex items-center justify-center w-full h-screen flex-col px-4">
      <h2 className="bg-clip-text text-transparent text-center bg-gradient-to-b from-neutral-900 to-neutral-700 dark:from-neutral-600 dark:to-white text-2xl md:text-4xl lg:text-7xl font-sans py-2 md:py-10 relative z-20 font-bold tracking-tight">
        Welcome to <br /> Pumpet!
      </h2>
      <p className="max-w-xl mx-auto text-sm md:text-lg text-neutral-700 dark:text-neutral-400 text-center">
        Boost productivity with rewards-driven ticket management and insightful
        team analytics.
      </p>
      <Button
        variant={"outline"}
        className="z-10 mt-5"
        onClick={() => {
          onSubmit();
        }}
      >
        Login with Jira
      </Button>
      <Link href={"/dashboard"} className="z-10 -mt-5">.</Link>
    </BackgroundLines>
  );
}
