import Image from "next/image"

export default function HeroShowcase() {
  return (
    <div className="relative mx-auto h-[720px] w-full max-w-[900px]">

      {/* TOP CARD */}
      <div className="absolute left-[18%] top-[0%] z-10 w-[64%] rotate-[-3deg] opacity-90">

        <div className="overflow-hidden rounded-[32px] border border-violet-400/30 bg-[#0b0f1f]/70 shadow-[0_20px_80px_rgba(70,60,255,0.35)] backdrop-blur">

          <Image
            src="/projects/hero-top.jpeg"
            alt=""
            width={1600}
            height={900}
            className="w-full"
          />

        </div>

      </div>

      {/* MAIN CARD */}
      <div className="absolute left-[8%] top-[28%] z-30 w-[84%] rotate-[1deg]">

        <div className="overflow-hidden rounded-[36px] border border-violet-400/35 bg-[#0b0f1f]/80 shadow-[0_30px_120px_rgba(70,60,255,0.45)] backdrop-blur">

          <Image
            src="/projects/hero-main.jpeg"
            alt=""
            width={1600}
            height={900}
            className="w-full"
          />

        </div>

      </div>

      {/* BOTTOM CARD */}
      <div className="absolute left-[12%] top-[58%] z-20 w-[78%] rotate-[-2deg]">

        <div className="overflow-hidden rounded-[32px] border border-violet-400/25 bg-[#0b0f1f]/75 shadow-[0_20px_80px_rgba(70,60,255,0.35)] backdrop-blur">

          <Image
            src="/projects/hero-bottom.jpeg"
            alt=""
            width={1600}
            height={900}
            className="w-full"
          />

        </div>

      </div>

    </div>
  )
}
