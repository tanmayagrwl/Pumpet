"use client"
import React from "react"
import Image from "next/image"

const words = `Oxygen gets you high. In a catastrophic emergency, we're taking giant, panicked breaths. Suddenly you become euphoric, docile. You accept your fate. It's all right here. Emergency water landing, six hundred miles an hour. Blank faces, calm as Hindu cows
`

function Explaination() {
  return (
    <div>
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-center pb-20">
        How do we do it?
      </h1>
      <div className="flex flex-col sm:flex-col lg:flex-row justify-around gap-x-10 items-center mx-20 ">
        <Image
          src={"https://illustrations.popsy.co/amber/keynote-presentation.svg"}
          alt="image"
          width={200}
          height={200}
          className="w-[30%]"
        />
        <p className="leading-7 max-w-lg ">
          Pumpet boosts ticket activity by rewarding employees for timely
          updates and movements. Our system tracks every action, turning
          progress into points that can be redeemed for rewards. At the same
          time, our analytics engine provides detailed insights on team
          efficiency, helping managers spot trends, optimize performance, and
          drive success.
        </p>
      </div>
    </div>
  )
}

export default Explaination
