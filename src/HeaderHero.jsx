import React from "react";

const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1604908176997-431221b47d38?q=80&w=1200&auto=format&fit=crop";

export default function HeaderHero({ imageSrc }) {
  return (
    <header className="px-4 pt-2 pb-4">
      <div className="mx-auto max-w-5xl rounded-2xl bg-sky-50 p-5 md:p-6 shadow-sm ring-1 ring-slate-200">
        <div className="grid items-center gap-4 md:grid-cols-2">
          {/* Left column */}
          <div className="relative">
            {/* Logo shifted upward via translate (doesn't change layout height) */}
            <div className="-translate-y-2 md:-translate-y-3 lg:-translate-y-4 will-change-transform">
              <img
                src={require("./Images/Logo.png")} // or "./Images/Logo-transparent.png"
                alt="What2Cook"
                className="h-20 w-20 md:h-24 md:w-24 lg:h-28 lg:w-28 object-contain"
              />
              {/* Thin green line tight under the logo */}
              <div className="h-px w-full bg-emerald-700/80 mt-[0.5px]" />
            </div>

            {/* Heading + subheading */}
            <h1 className="mt-2 font-display text-slate-900 text-2xl md:text-4xl leading-tight">
              Need a dinner idea?
            </h1>
            <p className="mt-2 text-[13px] md:text-[16px] leading-snug text-slate-600">
              Pick what’s in your fridge, we’ll cook up an easy recipe for you!
            </p>
          </div>

          {/* Right image */}
          <div className="relative ml-auto w-full max-w-[380px] h-[253px] overflow-hidden">
            <img
              src={imageSrc || require("./Images/HeaderPhoto.png") || DEFAULT_HERO_IMAGE}
              alt="Dish"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
