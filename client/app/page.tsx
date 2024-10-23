import Brand from "@/components/home/brand";

import Features from "@/components/home/features";
import { Landing } from "@/components/home/landing";
import CustomerTestimonials from "@/components/home/testimonials";
export default function Home() {
  return (
    <>
      <Landing />
      <Features/>
      <CustomerTestimonials />
      <Brand />

    </>
  );
}
