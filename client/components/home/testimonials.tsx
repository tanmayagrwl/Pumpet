"use strict"
"use client"
import React, { useEffect, useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel"
import Image from "next/image"
import EmbaAutoPlay from "embla-carousel-autoplay"
import { customerReviews } from "@/data/testimonials"

function CustomerTestimonials() {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(3)

  useEffect(() => {
    if (!api) {
      return
    }

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1)
    })
  }, [api])

  return (
    <section className="pb-10 lg:pb-0 lg:py-10  w-full flex justify-center">
      <div className="w-full max-w-full flex flex-col lg:flex-row items-center justify-around xl:max-w-[80%] 3xl:max-w-[65%]">
        <div className="w-full px-5">
          <p className="leading-7  2xl:text-xl pb-5">TESTIMONIALS</p>
          <h1 className="text-xl md:text-2xl lg:text-4xl font-semibold tracking-tight mb-10 lg:mb-0 text-black">
            What People Say About Us.
          </h1>
        </div>
        <Carousel
          className="w-full lg:w-[600px] 3xl:w-[800px] "
          setApi={setApi}
          plugins={[
            EmbaAutoPlay({
              delay: 15000,
              stopOnInteraction: false,
              stopOnFocusIn: false,
              stopOnMouseEnter: false,
            }),
          ]}
          opts={{
            loop: true,
          }}
        >
          <CarouselPrevious className="hidden lg:flex" />
          <CarouselContent>
            {customerReviews.map((review) => (
              <CarouselItem
                key={review.id}
                className="basis-full py-3 xl:py-20"
              >
                <Card className="w-[90%]  lg:w-[550px] 3xl:w-[800px] h-[300px] lg:h-[250px] pt-5 flex flex-col justify-between mx-auto shadow-md lg:shadow-xl rounded-3xl">
                  <CardFooter className="flex space-x-4">
                    <div className="rounded-full overflow-hidden w-15 h-15">
                      <Image
                        unoptimized
                        width={60}
                        height={60}
                        src={review.user.image}
                        alt={review.user.name}
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-bold">{review.user.name}</p>
                      <p className="text-xs">{review.user.designation}</p>
                    </div>
                  </CardFooter>

                  <CardContent>
                    <p className="text-[#696969] leading-7">{review.content}</p>
                  </CardContent>
                  <div></div>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselNext className="hidden lg:flex" />
        </Carousel>
      </div>
    </section>
  )
}

export default CustomerTestimonials
